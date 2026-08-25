#!/usr/bin/env node
/**
 * verify_reader.js —— 自带阅读器的验收脚本（SETUP.md Step 4 / p0_bootstrap Step 3.5）。
 *
 * 检查 protocols/frontend_spec.md 中无需浏览器即可验证的硬契约：锁定命名、主题实现方式、
 * 注释锚定、被排除的功能，以及 notes.json 的内部一致性。零依赖 —— 裸 Node 即可运行。
 *
 *   node scripts/verify_reader.js            # 完整检查本项目
 *   node scripts/verify_reader.js --quiet    # 只显示失败项
 *   node scripts/verify_reader.js <目录>     # 检查其它文件夹里的阅读器
 *
 * 退出码 0 = 通过，1 = 存在 FAIL。警告不会导致失败。
 */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ROOT = args[0] ? path.resolve(args[0]) : path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

const results = [];
const add = (status, section, message, detail) =>
  results.push({ status, section, message, detail });
const pass = (s, m, d) => add('PASS', s, m, d);
const fail = (s, m, d) => add('FAIL', s, m, d);
const warn = (s, m, d) => add('WARN', s, m, d);

const read = (rel) => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
};

/**
 * 扫描前先剥掉注释。解释某条规则的注释不能被误判为该规则的实现 —— 也不能被误判为违规：
 * 否则一个写着「此处刻意不做 /api/git」的文件反而会挂在 no-git 检查上。
 */
function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')          // HTML
    .replace(/\/\*[\s\S]*?\*\//g, ' ')         // /* block */ — also covers CSS
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1'); // // line, but not http:// inside a URL
}

/**
 * localStorage 键常常通过常量或小映射访问（`PREF.theme`、`THEME_KEY`）。收集这些别名，
 * 以便在不强迫阅读器到处内联字符串字面量的前提下，仍能验证存取两端。
 */
function accessorsFor(src, key) {
  const q = `['"\`]${key}['"\`]`;
  const names = [q];
  const objAlias = new RegExp(`(\\w+)\\s*:\\s*${q}`, 'g');
  const constAlias = new RegExp(`(?:const|let|var)\\s+(\\w+)\\s*=\\s*${q}`, 'g');
  for (const re of [objAlias, constAlias]) {
    let m;
    while ((m = re.exec(src)) !== null) names.push(`(?:\\w+\\.)?${m[1]}\\b`);
  }
  return names;
}

/** 断言 `src` 中出现某正则；否则报 FAIL 并给出规格指引。 */
function expect(section, src, pattern, message, hint) {
  if (pattern.test(src)) pass(section, message);
  else fail(section, message, hint);
}

/** 断言某正则**不**出现。 */
function forbid(section, src, pattern, message, hint) {
  if (pattern.test(src)) fail(section, message, hint);
  else pass(section, message);
}

// ---------------------------------------------------------------------------
// Locate the reader
// ---------------------------------------------------------------------------

const SERVER_CANDIDATES = ['server.js', 'scripts/preview_server.js'];
const HTML_CANDIDATES = ['index.html', 'scripts/preview.html', 'reader.html'];

const serverPath = SERVER_CANDIDATES.find((p) => read(p) !== null);
const htmlPath = HTML_CANDIDATES.find((p) => read(p) !== null);

if (!serverPath && !htmlPath) {
  console.log('SKIP —— 未找到阅读器（已查找 %s）。', [...SERVER_CANDIDATES, ...HTML_CANDIDATES].join(', '));
  console.log('');
  console.log('这是全新模板的正常状态。请按 SETUP.md Step 0 装好环境后重新运行。');
  console.log('除非用户明确表示不需要阅读器，且该决定已记录在 profile.md 中。');
  process.exit(0);
}

/**
 * 阅读器可能是单个自包含 HTML，也可能是页面加上配套脚本与样式表。跟随本地
 * <script src> / <link rel=stylesheet>，使拆分式阅读器受到与内联式同等的检查。
 * vendor/ 与 node_modules/ 下的第三方包跳过：它们的内容不属于本项目的契约。
 */
function linkedAssets(pageHtml, pageRel) {
  if (!pageHtml) return [];
  const baseDir = path.dirname(pageRel);
  const refs = [
    ...pageHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi),
    ...pageHtml.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi),
  ].map((m) => m[1]);

  const out = [];
  for (const ref of refs) {
    if (/^(?:https?:)?\/\//.test(ref) || ref.startsWith('data:')) continue;   // 远程
    if (/(^|\/)(?:vendor|node_modules)\//.test(ref)) continue;                // 第三方
    const rel = ref.startsWith('/')
      ? ref.slice(1)
      : path.posix.join(baseDir === '.' ? '' : baseDir.replace(/\\/g, '/'), ref);
    const body = read(rel);
    if (body !== null) out.push({ rel, body: stripComments(body) });
  }
  return out;
}

const server = stripComments(serverPath ? read(serverPath) : '');
const rawHtml = htmlPath ? read(htmlPath) : '';
const assets = linkedAssets(rawHtml, htmlPath || 'index.html');
// `html` 是阅读器的客户端侧：页面本身加上它引入的一切。
const html = stripComments(rawHtml) + '\n' + assets.map((a) => a.body).join('\n');
const all = server + '\n' + html;

if (assets.length) pass('基础', `已扫描外链资源：${assets.map((a) => a.rel).join('、')}`);

if (!serverPath) fail('基础', '存在服务器（server.js 或 scripts/preview_server.js）', 'start.bat 只会查找这两个路径');
else pass('基础', `已找到服务器：${serverPath}`);
if (!htmlPath) fail('基础', '存在阅读器页面（index.html 或 scripts/preview.html）');
else pass('基础', `已找到阅读器页面：${htmlPath}`);

// ---------------------------------------------------------------------------
// §2.5 Theme
// ---------------------------------------------------------------------------

const S = '主题 §2.5';
expect(S, html, /document\.documentElement\.setAttribute\(\s*['"]data-theme['"]/,
  '主题载体为 html[data-theme]',
  '用 documentElement 的 data-theme，不要用 body 类 —— body 类无法在首次绘制前设置');

// 哪一套做基色都行，关键是存在另一套覆盖它。
expect(S, html, /\[data-theme\s*=\s*["'](?:light|dark)["']\]/,
  '存在第二套主题覆盖基础变量',
  '在 :root 定义一套主题，并在 [data-theme="…"] 下覆盖同名自定义属性');

forbid(S, html, /\.light-theme\b/,
  '不存在遗留的 body.light-theme 选择器',
  'frontend_spec §2.5.1 锁定 html[data-theme]；magazine 阅读器的 body 类正是白屏闪烁的成因');

// FOUC guard: the inline theme script must appear before the first stylesheet link.
const headEnd = html.search(/<\/head>/i);
const head = headEnd > -1 ? html.slice(0, headEnd) : html;
const guardAt = head.search(/localStorage\.getItem\(\s*['"]ltm_theme['"]\s*\)/);
const firstCss = head.search(/<link[^>]+rel=["']stylesheet["']/i);
if (guardAt === -1) {
  fail(S, '<head> 中存在 FOUC 守卫', '读取 ltm_theme 的内联脚本必须在首次绘制前执行（§2.5.2）');
} else if (firstCss !== -1 && guardAt > firstCss) {
  fail(S, 'FOUC 守卫位于首个样式表之前', '把内联主题脚本移到所有 <link rel="stylesheet"> 之上');
} else {
  pass(S, 'FOUC 守卫存在且位置正确');
}

if (/hljs|highlight\.js|highlight\.min\.js/i.test(html)) {
  expect(S, html, /hljs-theme-link|highlight-theme-link/,
    'highlight.js 样式表可按 id 替换',
    '给 hljs 的 <link> 加 id 并在切换时改写 href，否则亮色模式下代码块仍是深色');
}

// ---------------------------------------------------------------------------
// §7.3 Locked names
// ---------------------------------------------------------------------------

const N = '命名 §7.3';
for (const key of ['ltm_theme', 'ltm_sort_order', 'ltm_sidebar_collapsed', 'ltm_notes_show_all']) {
  const accessors = accessorsFor(all, key).join('|');
  // 存取两端都必须有：只有 setItem 等于存了不读，只有 getItem 等于永远改不掉。
  const saved = new RegExp(`setItem\\(\\s*(?:${accessors})`).test(all);
  const restored = new RegExp(`getItem\\(\\s*(?:${accessors})`).test(all);
  if (saved && restored) pass(N, `${key} 存取两端都实现了`);
  else if (saved) fail(N, `${key} 在加载时恢复`, `只找到 setItem —— 用户的选择被写入却从不读回，导致每次重开都显示默认值（§2.1）`);
  else if (restored) fail(N, `${key} 在改动时写入`, `只找到 getItem —— 该偏好永远无法被持久修改（§2.1）`);
  else fail(N, `使用了 localStorage 键 ${key}`, '完全缺失（§7.3）');
}

const LEGACY = {
  issue_sort_order: 'ltm_sort_order',
  curriculum_sort_order: 'ltm_sort_order',
  preview_theme: 'ltm_theme',
  toc_collapsed: 'ltm_sidebar_collapsed',
  sidebar_collapsed: 'ltm_sidebar_collapsed',
};
for (const [old, replacement] of Object.entries(LEGACY)) {
  forbid(N, all, new RegExp(`['"\`]${old}['"\`]`), `未使用遗留键 ${old}`, `请改名为 ${replacement}`);
}

for (const route of ['/api/files', '/api/file', '/api/save', '/api/notes']) {
  expect(N, all, new RegExp(route.replace(/\//g, '\\/')), `存在路由 ${route}`);
}

for (const [sel, why] of [
  ['annotated-word', '所有被标记的 span'],
  ['custom-highlight', 'isHighlight === true'],
  ['data-primary', '唯一的语境命中处'],
  ['interactive-blank', '自动保存的填空'],
  ['interactive-textarea', '自动保存的开放题'],
  ['interactive-checkbox', '自动保存的选择题'],
]) {
  expect(N, html, new RegExp(sel), `存在 DOM 名称 "${sel}"（${why}）`);
}

// ---------------------------------------------------------------------------
// §4 Annotation anchoring — the part that silently rots
// ---------------------------------------------------------------------------

const A = '注释 §4';
expect(A, html, /isHighlight/,
  '两种注释形态都存在（isHighlight）',
  '§4.1：下划线 = 带注释，高亮 = 无文字标记');

expect(A, html, /data-primary/,
  '已实现 primary 命中标记',
  '§4.3：标记全部出现，但只给语境命中处打标');

expect(A, html, /contextOffset/, '读写了 contextOffset');

// The <3 tolerance is the fingerprint of a correct primary test.
// 容差可以写成字面量，也可以放在具名常量里，但取值必须是 3。
expect(A, html, /<\s*3\b|TOLERANCE\s*=\s*3\b/i,
  'primary 判定使用了 3 字符的偏移容差',
  '§4.3：abs(matchIndex - contextOffset) < 3 —— 不是 ===0，也不能更宽');

expect(A, html, /\.sort\(\s*\([^)]*\)\s*=>\s*b\.word\.length\s*-\s*a\.word\.length|length\s*-\s*a\.word\.length/,
  '注释模式按长度降序排列',
  '§4.3：否则短词会吞掉包含它的长短语');

// 吸附可以扩展 DOM Range，也可以在 context 字符串的偏移域内完成；
// 只要最终存下的词与偏移一致即可。
expect(A, html, /snapRange|snapSelection|WordBoundar|wordChar/i,
  '选区吸附到单词边界',
  '§4.2：必须在计算 context/offset 之前吸附，否则存下的偏移与存下的词对不上');

// 写成标签名（'PRE'）或 CSS 选择器列表（'pre, code, …'）都可以。
for (const tag of ['PRE', 'CODE', 'TEXTAREA', 'INPUT']) {
  expect(A, html, new RegExp(`\\b${tag}\\b`, 'i'), `排除清单包含 ${tag}`,
    '§4.3：绝不能在代码或表单控件内部包裹注释');
}

expect(A, html, /scrollIntoView/, '跳转会把目标滚动到可视区');

expect(A, html, /viz-block-body/,
  '流程图/方框图里的文字（.viz-block-body）可以被标注',
  '§4.3：它是一个 <div>，而 div 在这里整体上不算块级元素，所以需要单独按类名识别——否则 ' +
  '可视化武器库方框里的文字永远无法被选中或高亮');

// ---------------------------------------------------------------------------
// §7.4 Exclusions
// ---------------------------------------------------------------------------

const X = '排除项 §7.4';
forbid(X, all, /\/api\/git/,
  '不存在 /api/git/* 路由',
  '版本管理不属于阅读器范围；很多模板用户根本没装 Git');
forbid(X, all, /simple-git|child_process[\s\S]{0,80}git\s/,
  '服务器没有调用外部 git 命令');
forbid(X, html, /switchTab\(\s*['"]git['"]\s*\)|id=["']tab-git-btn["']/i,
  '侧边栏没有 Git 标签页');

// ---------------------------------------------------------------------------
// §1 / §6 Isolation and autosave
// ---------------------------------------------------------------------------

const I = '隔离 §1';
if (server) {
  expect(I, server, /content[\/\\]/, '服务器把文档列表限定在 content/ 内');
  forbid(I, server, /['"`](?:\.\.[\/\\])?(?:protocols|knowledge|state)[\/\\]/,
    '服务器不暴露 protocols//knowledge//state 路径',
    '§7.4：阅读器不得读写规则层');
  expect(I, server, /path\.(?:resolve|normalize)/,
    '服务器在访问文件系统前归一化路径',
    '防止 path 查询参数中的 ../ 目录穿越');
}

const V = '自动保存 §6';
expect(V, html, /setTimeout[\s\S]{0,160}(?:save|Save)|debounce|scheduleSave/i,
  '自动保存做了防抖',
  '§6.2：把连续输入合并后再 POST，否则每次按键都会打到服务器');
expect(V, html, /method:\s*['"]POST['"]/, '客户端通过 POST 提交保存');

// ---------------------------------------------------------------------------
// notes.json — data-level invariants (the checks that catch real rot)
// ---------------------------------------------------------------------------

const D = 'notes.json';
const rawNotes = read('notes.json');
if (rawNotes === null) {
  warn(D, '未找到 notes.json —— 跳过', '首次做注释时才会创建');
} else {
  let notes;
  try {
    notes = JSON.parse(rawNotes);
  } catch (e) {
    fail(D, 'notes.json 可解析为 JSON', e.message);
    notes = null;
  }

  if (notes && !Array.isArray(notes)) {
    fail(D, 'notes.json 是数组');
  } else if (notes) {
    pass(D, `notes.json 解析成功（${notes.length} 条）`);

    const ids = new Set();
    let dupes = 0, noFile = 0, noContext = 0, noOffset = 0, badOffset = 0, reviews = 0;

    for (const n of notes) {
      if (!n || typeof n !== 'object') continue;
      if (n.id) {
        if (ids.has(n.id)) dupes++;
        ids.add(n.id);
      }
      if (!n.file && !n.issue) noFile++;
      if (n.aiReview) reviews++;

      if (!n.context) {
        noContext++;
        continue;
      }
      // 锚点必须真的指向它所声称的那个词。
      const word = String(n.word || '');
      if (!word) continue;
      if (n.contextOffset === undefined || n.contextOffset === null) {
        noOffset++;   // 有 context 但没有 offset —— 半锚定，重复词无法解析到具体某处
        continue;
      }
      const off = Number(n.contextOffset);
      if (!Number.isFinite(off)) {
        badOffset++;
        continue;
      }
      const at = n.context.substr(off, word.length).toLowerCase();
      if (at !== word.toLowerCase()) {
        // 允许与渲染端相同的 <3 字符漂移。
        const near = n.context.toLowerCase().indexOf(word.toLowerCase(), Math.max(0, off - 3));
        if (near === -1 || Math.abs(near - off) >= 3) badOffset++;
      }
    }

    dupes ? fail(D, `注释 id 唯一`, `发现 ${dupes} 个重复 id`)
          : pass(D, '注释 id 唯一');
    noFile ? fail(D, '每条注释都指明了所属文档', `有 ${noFile} 条既无 file 也无 issue —— 它们永远无法被隔离或定位`)
           : pass(D, '每条注释都指明了所属文档');
    badOffset ? fail(D, 'contextOffset 落在所存的词上', `有 ${badOffset} 条的偏移没有指向 word —— §4.2 捕获顺序 bug（先算偏移后吸附）`)
              : pass(D, 'contextOffset 落在所存的词上');
    noOffset ? fail(D, '凡有 context 的注释都存了 contextOffset', `有 ${noOffset} 条只有 context 没有 contextOffset —— 半锚定，重复词无法解析到具体某一处（§4.3）`)
             : pass(D, '凡有 context 的注释都存了 contextOffset');

    if (noContext) {
      warn(D, `有 ${noContext} 条老注释没有 context`,
        '可由定位规则 3 兜底；新注释必须始终写入 context');
    }
    if (reviews) pass(D, `存在 ${reviews} 条 aiReview —— Smart Merge 必须保住它们`);
  }
}

// ---------------------------------------------------------------------------
const E = '界面语言包';
// ---------------------------------------------------------------------------

// 语言包是给 AI 翻译的，所以最可能的坏法是「漏了一个键」—— 界面上会直接露出
// 键名。这里把 index.html / app.js 实际引用的键与 ui-strings.js 定义的键对齐。
const packSrc = read('ui-strings.js');
if (packSrc === null) {
  fail(E, 'ui-strings.js 存在', '界面文案的唯一来源（frontend_spec §13）');
} else {
  const defined = new Set(
    [...stripComments(packSrc).matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*)\s*:/gm)].map((m) => m[1]),
  );
  const used = new Set();
  for (const m of rawHtml.matchAll(/data-i18n(?:-html|-title|-aria|-placeholder)?="([^"]+)"/g)) {
    used.add(m[1]);
  }
  const appSrc = read('app.js');
  if (appSrc) for (const m of appSrc.matchAll(/\bT\('([^']+)'\)/g)) used.add(m[1]);
  // lang / pageTitle 是 applyStaticStrings 直接读的，不经过 data-i18n 或 T()。
  used.add('lang');
  used.add('pageTitle');

  if (!defined.size) {
    fail(E, 'ui-strings.js 定义了键', '没解析到任何键 —— 检查 window.UI_STRINGS 的写法');
  } else {
    const missing = [...used].filter((k) => !defined.has(k)).sort();
    if (missing.length) {
      fail(E, '每个被引用的键都在语言包里', `缺失：${missing.join(', ')}`);
    } else {
      pass(E, `语言包覆盖全部 ${used.size} 个被引用的键`);
    }
    const unused = [...defined].filter((k) => !used.has(k)).sort();
    if (unused.length) {
      warn(E, `语言包里有 ${unused.length} 个没被引用的键`,
        `${unused.join(', ')} —— 翻译时是白做功，可能是改名后的残留`);
    }
  }

  // 界面文案不得再回到 index.html / app.js 里硬编码。
  const strayHtml = [...rawHtml.matchAll(/<(button|h1|label)\b[^>]*>([^<>{}]*[^\s<>{}][^<>{}]*)</g)]
    .filter((m) => !/data-i18n/.test(m[0]))
    .filter((m) => !/^[\s\p{P}\p{S}]*$/u.test(m[2]))
    .map((m) => m[2].trim());
  if (strayHtml.length) {
    warn(E, 'index.html 里没有漏掉的硬编码文案',
      `疑似未接语言包：${strayHtml.slice(0, 5).join(' | ')}`);
  } else {
    pass(E, 'index.html 的面向用户文案都走 data-i18n');
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const counts = { PASS: 0, WARN: 0, FAIL: 0 };
for (const r of results) counts[r.status]++;

const ICON = { PASS: '  ok  ', WARN: ' warn ', FAIL: ' FAIL ' };
let section = null;
for (const r of results) {
  if (QUIET && r.status === 'PASS') continue;
  if (r.section !== section) {
    section = r.section;
    console.log(`\n${section}`);
  }
  console.log(`${ICON[r.status]} ${r.message}`);
  if (r.detail && r.status !== 'PASS') console.log(`        → ${r.detail}`);
}

console.log(`\n通过 ${counts.PASS} · 警告 ${counts.WARN} · 失败 ${counts.FAIL}`);
if (counts.FAIL) {
  console.log('\n阅读器未通过验收（SETUP.md Step 4）。请修正上方 FAIL 项（见 protocols/frontend_spec.md）。');
  process.exit(1);
}
console.log('\n阅读器验收通过（SETUP.md Step 4 完成）。');
