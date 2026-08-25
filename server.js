'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const CONTENT_PATH_RE = /^content\/(magazines|units)\/[^/]+\.md$/i;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  const payload = Buffer.isBuffer(body)
    ? body
    : contentType.startsWith('application/json')
      ? Buffer.from(JSON.stringify(body))
      : Buffer.from(String(body));
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

function jsonError(res, status, message) {
  send(res, status, { error: message });
}

function normalizeRelativePath(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '');
}

function resolveContentPath(root, value) {
  const relative = normalizeRelativePath(value);
  if (!CONTENT_PATH_RE.test(relative)) {
    throw Object.assign(new Error('Only Markdown files under content/magazines or content/units are allowed.'), { status: 400 });
  }
  const absolute = path.resolve(root, ...relative.split('/'));
  const contentRoot = path.resolve(root, 'content') + path.sep;
  if (!absolute.startsWith(contentRoot)) {
    throw Object.assign(new Error('Unsafe content path.'), { status: 400 });
  }
  return { relative, absolute };
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

function normalizeNotes(value) {
  if (Array.isArray(value)) return value.filter((note) => note && typeof note === 'object');
  if (value && Array.isArray(value.notes)) return value.notes.filter((note) => note && typeof note === 'object');
  if (value && typeof value === 'object' && value.id) return [value];
  return [];
}

async function readNotes(root) {
  try {
    return normalizeNotes(JSON.parse(await fs.readFile(path.join(root, 'notes.json'), 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw Object.assign(new Error('notes.json is not valid JSON.'), { status: 500 });
  }
}

function smartMergeNotes(existing, incoming, deletedIds = []) {
  const deleted = new Set(deletedIds.map(String));
  const byId = new Map(existing.filter((note) => note.id && !deleted.has(String(note.id))).map((note) => [String(note.id), note]));

  for (const next of incoming) {
    if (!next.id || deleted.has(String(next.id))) continue;
    const id = String(next.id);
    const previous = byId.get(id);
    const merged = previous ? { ...previous, ...next } : { ...next };
    if (previous?.aiReview && !next.aiReview) merged.aiReview = previous.aiReview;
    if (previous?.userNoteRaw !== undefined && next.userNoteRaw === undefined) {
      merged.userNoteRaw = previous.userNoteRaw;
    }
    byId.set(id, merged);
  }

  return [...byId.values()];
}

async function listContentFiles(root) {
  const groups = { magazines: [], units: [] };
  for (const group of Object.keys(groups)) {
    const directory = path.join(root, 'content', group);
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
      const absolute = path.join(directory, entry.name);
      const [stat, source] = await Promise.all([fs.stat(absolute), fs.readFile(absolute, 'utf8')]);
      const heading = source.match(/^#\s+(.+)$/m)?.[1]?.trim();
      groups[group].push({
        path: `content/${group}/${entry.name}`,
        name: entry.name,
        title: heading || entry.name.replace(/\.md$/i, ''),
        mtime: stat.mtime.toISOString(),
        size: stat.size,
      });
    }
  }
  return groups;
}

function staticTarget(root, pathname) {
  const explicit = new Map([
    ['/', path.join(root, 'index.html')],
    ['/index.html', path.join(root, 'index.html')],
    ['/app.js', path.join(root, 'app.js')],
    ['/ui-strings.js', path.join(root, 'ui-strings.js')],
    ['/reader-core.js', path.join(root, 'reader-core.js')],
    ['/styles.css', path.join(root, 'styles.css')],
    ['/scripts/viz.css', path.join(root, 'scripts', 'viz.css')],
    ['/vendor/marked.js', path.join(root, 'node_modules', 'marked', 'lib', 'marked.umd.js')],
    ['/vendor/purify.js', path.join(root, 'node_modules', 'dompurify', 'dist', 'purify.min.js')],
    ['/vendor/mermaid.js', path.join(root, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')],
  ]);
  if (explicit.has(pathname)) return explicit.get(pathname);
  if (/^\/images\/[A-Za-z0-9._-]+$/.test(pathname)) {
    return path.join(root, ...pathname.slice(1).split('/'));
  }
  return null;
}

function createReaderServer({ root = __dirname } = {}) {
  const workspaceRoot = path.resolve(root);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');

      if (req.method === 'GET' && url.pathname === '/api/health') {
        return send(res, 200, { ok: true });
      }
      if (req.method === 'GET' && url.pathname === '/api/files') {
        return send(res, 200, await listContentFiles(workspaceRoot));
      }
      if (req.method === 'GET' && url.pathname === '/api/file') {
        const target = resolveContentPath(workspaceRoot, url.searchParams.get('path'));
        return send(res, 200, { path: target.relative, content: await fs.readFile(target.absolute, 'utf8') });
      }
      if (req.method === 'POST' && url.pathname === '/api/save') {
        const body = await readJsonBody(req);
        const target = resolveContentPath(workspaceRoot, body.path);
        if (typeof body.content !== 'string') {
          throw Object.assign(new Error('content must be a string.'), { status: 400 });
        }
        await fs.writeFile(target.absolute, body.content, 'utf8');
        return send(res, 200, { ok: true, path: target.relative });
      }
      if (req.method === 'GET' && url.pathname === '/api/notes') {
        return send(res, 200, { notes: await readNotes(workspaceRoot) });
      }
      if (req.method === 'POST' && url.pathname === '/api/notes') {
        const body = await readJsonBody(req);
        const incoming = normalizeNotes(body.notes || body.note || []);
        const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];
        const notes = smartMergeNotes(await readNotes(workspaceRoot), incoming, deletedIds);
        await fs.writeFile(path.join(workspaceRoot, 'notes.json'), `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
        return send(res, 200, { ok: true, notes });
      }

      if (req.method === 'GET') {
        const target = staticTarget(workspaceRoot, url.pathname);
        if (target) {
          const data = await fs.readFile(target);
          let type = MIME_TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
          if (data.subarray(0, 100).includes(Buffer.from('<svg')) || data.subarray(0, 100).includes(Buffer.from('<?xml'))) {
            type = 'image/svg+xml';
          }
          res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; script-src 'self' 'sha256-Ry4tpzsYo/ii4sRbw2e1/rYLpzjplSJFBtwIMpkh8gk='; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
          return send(res, 200, data, type);
        }
      }

      jsonError(res, 404, 'Not found.');
    } catch (error) {
      if (error.code === 'ENOENT') return jsonError(res, 404, 'File not found.');
      if (!error.status || error.status >= 500) console.error(error);
      jsonError(res, error.status || 500, error.status ? error.message : 'Internal server error.');
    }
  });
}

if (require.main === module) {
  const host = process.env.HOST || DEFAULT_HOST;
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const server = createReaderServer();
  server.listen(port, host, () => {
    console.log(`AI Learning Module reader: http://${host}:${port}`);
  });
}

module.exports = {
  createReaderServer,
  listContentFiles,
  normalizeNotes,
  resolveContentPath,
  smartMergeNotes,
};
