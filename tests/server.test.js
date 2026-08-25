'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createReaderServer } = require('../server');

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'learning-reader-'));
  await fs.mkdir(path.join(root, 'content', 'magazines'), { recursive: true });
  await fs.mkdir(path.join(root, 'content', 'units'), { recursive: true });
  await fs.writeFile(path.join(root, 'content', 'magazines', 'magazine01_test.md'), '# Magazine One\n\nHello ___\n');
  await fs.writeFile(path.join(root, 'content', 'units', 'unit02_test.md'), '# Unit Two\n');
  await fs.writeFile(path.join(root, 'index.html'), '<!doctype html><title>Reader</title>');
  await fs.writeFile(path.join(root, 'notes.json'), JSON.stringify([
    { id: 'n1', file: 'content/magazines/magazine01_test.md', word: 'Hello', userNoteRaw: 'mine', aiReview: { grade: 'A' } },
    { id: 'summary-1', type: 'content_summary', summary: 'keep me' },
  ]));
  const server = createReaderServer({ root });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { root, server, base };
}

async function request(base, pathname, options) {
  const response = await fetch(`${base}${pathname}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

test('lists only learning content and reads/saves an allowed file', async (t) => {
  const app = await fixture();
  t.after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    await fs.rm(app.root, { recursive: true, force: true });
  });

  const listed = await request(app.base, '/api/files');
  assert.equal(listed.response.status, 200);
  assert.equal(listed.body.magazines[0].title, 'Magazine One');
  assert.equal(listed.body.units[0].path, 'content/units/unit02_test.md');

  const loaded = await request(app.base, '/api/file?path=content%2Fmagazines%2Fmagazine01_test.md');
  assert.match(loaded.body.content, /Hello ___/);

  const saved = await request(app.base, '/api/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'content/magazines/magazine01_test.md', content: '# Changed\n' }),
  });
  assert.equal(saved.response.status, 200);
  assert.equal(await fs.readFile(path.join(app.root, 'content', 'magazines', 'magazine01_test.md'), 'utf8'), '# Changed\n');
});

test('rejects traversal and paths outside the two content folders', async (t) => {
  const app = await fixture();
  t.after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    await fs.rm(app.root, { recursive: true, force: true });
  });
  const traversal = await request(app.base, '/api/file?path=content%2Funits%2F..%2F..%2Fnotes.json');
  assert.equal(traversal.response.status, 400);
  const internal = await request(app.base, '/api/file?path=knowledge%2Fprofile.md');
  assert.equal(internal.response.status, 400);
});

test('Smart Merge preserves AI review and summaries, and supports explicit deletion', async (t) => {
  const app = await fixture();
  t.after(async () => {
    await new Promise((resolve) => app.server.close(resolve));
    await fs.rm(app.root, { recursive: true, force: true });
  });

  const merged = await request(app.base, '/api/notes', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: [{ id: 'n1', userNoteRaw: 'updated', note: 'updated' }] }),
  });
  assert.equal(merged.body.notes.find((note) => note.id === 'n1').aiReview.grade, 'A');
  assert.ok(merged.body.notes.some((note) => note.id === 'summary-1'));

  const deleted = await request(app.base, '/api/notes', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedIds: ['n1'] }),
  });
  assert.ok(!deleted.body.notes.some((note) => note.id === 'n1'));
  assert.ok(deleted.body.notes.some((note) => note.id === 'summary-1'));
});
