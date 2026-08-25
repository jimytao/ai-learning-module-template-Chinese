(function bootReader() {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const state = {
    files: { magazines: [], units: [] },
    notes: [],
    activePath: null,
    rawMarkdown: '',
    dirty: false,
    saveTimer: null,
    sortOrder: localStorage.getItem('ltm_sort_order') === 'desc' ? 'desc' : 'asc',
    query: '',
    pendingSelection: null,
    editingNoteId: null,
  };

  const elements = {
    reader: $('#reader'), contentsList: $('#contentsList'), conceptsList: $('#conceptsList'), notesList: $('#notesList'),
    title: $('#documentTitle'), saveStatus: $('#saveStatus'), sortButton: $('#sortButton'), exportButton: $('#exportButton'),
    addNote: $('#addNoteButton'), noteDialog: $('#noteDialog'), noteForm: $('#noteForm'), noteWord: $('#noteWord'),
    noteText: $('#noteText'), deleteNote: $('#deleteNoteButton'), showAllNotes: $('#showAllNotes'), sidebar: $('#sidebar'),
    toast: $('#toast'), search: $('#sidebarSearch'), tocSidebar: $('#tocSidebar'), tocList: $('#tocList'), tocToggle: $('#tocToggle'),
  };

  // --- 界面语言包（frontend_spec §13）------------------------------------
  // 全部面向用户的文案都来自 ui-strings.js，好让 Phase 0 之后可以整体换成
  // 用户的母语。这里的回退值只在语言包缺键时才会露出来。
  const UI = window.UI_STRINGS || {};
  const T = (key) => (typeof UI[key] === 'string' ? UI[key] : key);

  function applyStaticStrings() {
    if (UI.lang) document.documentElement.lang = UI.lang;
    if (UI.pageTitle) document.title = UI.pageTitle;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      const value = UI[el.dataset.i18n];
      if (typeof value === 'string') el.textContent = value;
    }
    // 只有 welcomeBody 这类需要行内 <code> 的键走 HTML 通道，且必须消毒 ——
    // 语言包是本地可信文件，但消毒让「翻译时不小心粘进一段标记」也无法造成伤害。
    for (const el of document.querySelectorAll('[data-i18n-html]')) {
      const value = UI[el.dataset.i18nHtml];
      if (typeof value === 'string') el.innerHTML = window.DOMPurify.sanitize(value);
    }
    const attrs = [['data-i18n-title', 'i18nTitle', 'title'],
                   ['data-i18n-aria', 'i18nAria', 'aria-label'],
                   ['data-i18n-placeholder', 'i18nPlaceholder', 'placeholder']];
    for (const [selector, dataKey, attribute] of attrs) {
      for (const el of document.querySelectorAll(`[${selector}]`)) {
        const value = UI[el.dataset[dataKey]];
        if (typeof value === 'string') el.setAttribute(attribute, value);
      }
    }
  }

  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    maxTextSize: 50000,
    themeVariables: {
      fontSize: '14px',
      fontFamily: 'Outfit, "Noto Sans TC", system-ui, -apple-system, sans-serif'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 25,
      rankSpacing: 35,
      padding: 12
    }
  });
  window.marked.setOptions({ gfm: true, breaks: false });

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : options.headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  function toast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { elements.toast.hidden = true; }, 2600);
  }

  // §6.3 — one control carries both jobs: it reports the save state and, when clicked,
  // forces a save. The icon is what people glance at; the label explains it.
  const SAVE_ICONS = { '': '\u25cb', dirty: '\u25cf', saving: '\u25cc', saved: '\u2713', error: '\u26a0' };

  function setSaveStatus(text, mode = '') {
    const icon = elements.saveStatus.querySelector('.save-icon');
    const label = elements.saveStatus.querySelector('.save-label');
    if (icon) icon.textContent = SAVE_ICONS[mode] || SAVE_ICONS[''];
    if (label) label.textContent = text;
    else elements.saveStatus.textContent = text;
    elements.saveStatus.dataset.state = mode || 'idle';
    elements.saveStatus.className = `save-status ${mode}`.trim();
  }

  // §3.1 — plain case-insensitive substring filter over the active tab's list.
  function matchesQuery(...fields) {
    if (!state.query) return true;
    return fields.some((field) => String(field || '').toLowerCase().includes(state.query));
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  }

  function renderContents() {
    elements.contentsList.replaceChildren();
    elements.sortButton.textContent = state.sortOrder === 'desc' ? T('sortDesc') : T('sortAsc');
    const labels = { magazines: T('groupMagazines'), units: T('groupUnits') };
    let count = 0;
    for (const groupName of ['magazines', 'units']) {
      const section = document.createElement('section');
      section.className = 'content-group';
      const heading = document.createElement('h3');
      heading.textContent = labels[groupName];
      section.append(heading);
      const files = ReaderCore.sortFiles(state.files[groupName], state.sortOrder)
        .filter((file) => matchesQuery(file.title, file.name));
      if (!files.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-list';
        empty.textContent = T('emptyGroup');
        section.append(empty);
      }
      for (const file of files) {
        count += 1;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `content-item${file.path === state.activePath ? ' active' : ''}`;
        const strong = document.createElement('strong');
        strong.textContent = file.title;
        const small = document.createElement('small');
        small.textContent = file.name;
        button.append(strong, small);
        button.addEventListener('click', () => loadFile(file.path));
        section.append(button);
      }
      elements.contentsList.append(section);
    }
    if (!count) elements.contentsList.setAttribute('aria-label', T('contentsEmptyAria'));
  }

  async function refreshFiles({ selectFirst = false } = {}) {
    state.files = await api('/api/files');
    renderContents();
    if (selectFirst && !state.activePath) {
      const all = [...state.files.magazines, ...state.files.units];
      const first = ReaderCore.sortFiles(all, state.sortOrder)[0];
      if (first) await loadFile(first.path);
    }
  }

  async function refreshNotes() {
    const payload = await api('/api/notes');
    state.notes = payload.notes || [];
    renderNotes();
  }

  async function saveCurrentNow({ manual = false } = {}) {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
    if (!state.dirty || !state.activePath) {
      // A manual click on a clean document must still answer: silence reads as "did it work?".
      if (manual && state.activePath) {
        setSaveStatus(T('statusSaved'), 'saved');
        toast(T('toastNoChanges'));
      }
      return;
    }
    const path = state.activePath;
    const content = state.rawMarkdown;
    state.dirty = false;
    setSaveStatus(T('statusSaving'), 'saving');
    try {
      await api('/api/save', { method: 'POST', body: JSON.stringify({ path, content }) });
      setSaveStatus(T('statusSaved'), 'saved');
    } catch (error) {
      state.dirty = true;
      setSaveStatus(T('statusSaveFailed'), 'error');
      toast(error.message);
    }
  }

  function scheduleSave() {
    state.dirty = true;
    setSaveStatus(T('statusDirty'), 'dirty');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveCurrentNow, 700);
  }

  async function loadFile(path) {
    if (path === state.activePath) return;
    await saveCurrentNow();
    setSaveStatus(T('statusLoading'), 'saving');
    try {
      const payload = await api(`/api/file?path=${encodeURIComponent(path)}`);
      state.activePath = payload.path;
      state.rawMarkdown = payload.content;
      state.dirty = false;
      elements.exportButton.disabled = false;
      await renderActiveFile();
      renderContents();
      renderNotes();
      setSaveStatus(T('statusLoaded'), 'saved');
      elements.sidebar.classList.remove('open');
      window.scrollTo({ top: 0 });
    } catch (error) {
      setSaveStatus(T('statusLoadFailed'), 'error');
      toast(error.message);
    }
  }

  function assignHeadingIds() {
    const seen = new Map();
    elements.reader.querySelectorAll('h1, h2, h3, h4').forEach((heading, index) => {
      const base = heading.textContent.trim().toLowerCase()
        .normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || `section-${index + 1}`;
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      heading.id = count ? `${base}-${count + 1}` : base;
    });
  }

  function generateConcepts() {
    elements.conceptsList.replaceChildren();
    const headings = [...elements.reader.querySelectorAll('h2, h3, h4')]
      .filter((heading) => matchesQuery(heading.textContent));
    if (!headings.length) {
      elements.conceptsList.className = 'concepts-list empty-list';
      elements.conceptsList.textContent = state.activePath ? T('conceptsNoHeadings') : T('noDocumentOpen');
      return;
    }
    elements.conceptsList.className = 'concepts-list';
    for (const heading of headings) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `concept-item level-${heading.tagName.slice(1)}`;
      button.textContent = heading.textContent;
      const id = heading.id;
      button.addEventListener('click', () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      elements.conceptsList.append(button);
    }
  }

  // §mermaid label centering — mermaid renders each node label as
  // <foreignObject><div style="...">...<span><p>text</p></span></div></foreignObject>.
  // DOMPurify enforces HTML namespace-integration rules BEFORE consulting
  // ADD_TAGS/ADD_ATTR: by default only <annotation-xml> (MathML) is treated as
  // an "HTML integration point", so any <div>/<span>/<p> living inside an SVG
  // <foreignObject> is considered impossible per spec and is stripped
  // entirely — no amount of ADD_TAGS/ADD_ATTR can save it. That silently
  // deleted the label wrapper div (and its centering-relevant inline style),
  // leaving bare text at the foreignObject's default top-left position, which
  // is why the centering CSS in scripts/viz.css never had anything to act on.
  // Passing HTML_INTEGRATION_POINTS: { foreignobject: true } fixes the root
  // cause; ADD_TAGS/ADD_ATTR/style are still needed so the div/span/p elements
  // and their attributes/inline style survive the tag & attribute allowlists.

  async function renderMermaid() {
    const blocks = [...elements.reader.querySelectorAll('pre > code.language-mermaid')];
    for (const [index, code] of blocks.entries()) {
      const pre = code.parentElement;
      const source = code.textContent;
      try {
        const result = await window.mermaid.render(`reader-mermaid-${Date.now()}-${index}`, source);
        const host = document.createElement('div');
        host.className = 'mermaid';
        host.innerHTML = DOMPurify.sanitize(result.svg, {
          USE_PROFILES: { svg: true, svgFilters: true, html: true },
          ADD_TAGS: ['foreignObject', 'style', 'div', 'span', 'p'],
          HTML_INTEGRATION_POINTS: { foreignobject: true },
          ADD_ATTR: [
            'dominant-baseline',
            'text-anchor',
            'alignment-baseline',
            'fill',
            'stroke',
            'stroke-width',
            'font-size',
            'font-family',
            'font-weight',
            'marker-end',
            'marker-start',
            'class',
            'rx', 'ry',
            'x1', 'y1', 'x2', 'y2',
            'xmlns',
            'style'
          ],
          FORBID_ATTR: [],

          FORBID_TAGS: ['script']
        });
        pre.replaceWith(host);
      } catch (error) {
        const details = document.createElement('details');
        details.className = 'mermaid-error';
        const summary = document.createElement('summary');
        summary.textContent = T('vizRenderFailed');
        const sourceBlock = document.createElement('pre');
        sourceBlock.className = 'mermaid-error';
        sourceBlock.textContent = source;
        details.append(summary, sourceBlock);
        pre.replaceWith(details);
      }
    }
  }

  function noteCandidates() {
    return [...elements.reader.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, .viz-caption, .viz-block-body')]
      .filter((element) => !element.closest('pre, code, svg, .mermaid, .answer-block'));
  }

  function textNodes(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('pre, code, svg, input, textarea, button')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  // §4.3 — mark EVERY occurrence of an annotated word, but flag only the one the
  // note was written about. Marking a single occurrence hides the other places the
  // learner needs to see; matching too strictly makes the note vanish silently.
  function markBlock(block, annotations) {
    const nodes = textNodes(block);
    if (!nodes.length) return;

    // Concatenate the block so a phrase split across <em>/<strong> still matches.
    let running = 0;
    const segments = nodes.map((node) => {
      const segment = { node, start: running, end: running + node.data.length, text: node.data };
      running = segment.end;
      return segment;
    });
    const blockText = segments.map((segment) => segment.text).join('');
    const matches = ReaderCore.annotationMatches(blockText, annotations);
    if (!matches.length) return;

    const perSegment = segments.map(() => []);
    for (const match of matches) {
      segments.forEach((segment, index) => {
        if (segment.end <= match.start || segment.start >= match.end) return;
        perSegment[index].push({
          localStart: Math.max(match.start, segment.start) - segment.start,
          localEnd: Math.min(match.end, segment.end) - segment.start,
          annotation: match.annotation,
          isPrimary: match.isPrimary,
        });
      });
    }

    // Reverse order: rebuilding forward invalidates the offsets of later nodes.
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const hits = perSegment[index];
      if (!hits.length) continue;
      const { node, text } = segments[index];
      hits.sort((a, b) => a.localStart - b.localStart);

      const fragment = document.createDocumentFragment();
      let cursor = 0;
      for (const hit of hits) {
        if (hit.localStart > cursor) fragment.append(text.slice(cursor, hit.localStart));
        const mark = document.createElement('mark');
        mark.className = `annotated-word${hit.annotation.isHighlight ? ' custom-highlight' : ''}`;
        mark.dataset.id = hit.annotation.id || '';
        mark.dataset.word = hit.annotation.word;
        mark.dataset.note = hit.annotation.userNoteRaw || hit.annotation.note || '';
        if (hit.isPrimary) mark.dataset.primary = 'true';
        mark.title = hit.annotation.userNoteRaw || hit.annotation.note || T('highlightTooltip');
        mark.textContent = text.slice(hit.localStart, hit.localEnd);
        mark.addEventListener('click', () => openExistingNote(hit.annotation.id));
        fragment.append(mark);
        cursor = hit.localEnd;
      }
      if (cursor < text.length) fragment.append(text.slice(cursor));
      node.parentNode.replaceChild(fragment, node);
    }
  }

  function applyAnnotations() {
    const annotations = state.notes.filter((note) => note.file === state.activePath && note.word);
    if (!annotations.length) return;
    for (const block of noteCandidates()) markBlock(block, annotations);
  }

  function generateTOC() {
    if (!elements.tocList) return;
    elements.tocList.replaceChildren();
    const headings = [...elements.reader.querySelectorAll('h1, h2, h3, h4')];
    if (!headings.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-toc';
      empty.textContent = state.activePath ? T('tocNoHeadings') : T('noDocumentOpen');
      elements.tocList.append(empty);
      return;
    }
    for (const heading of headings) {
      const item = document.createElement('div');
      item.className = `toc-item depth-${heading.tagName.toLowerCase()}`;
      item.textContent = heading.textContent;
      const id = heading.id;
      item.addEventListener('click', () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      elements.tocList.append(item);
    }
  }

  async function renderActiveFile() {
    const safeSource = state.rawMarkdown.replace(/<\/?(?:script|style|textarea)\b[^>]*>/gi, '');
    const interactiveMarkdown = ReaderCore.markdownWithInteractiveHtml(safeSource);
    const html = window.marked.parse(interactiveMarkdown);
    elements.reader.innerHTML = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'foreignObject'],
      FORBID_ATTR: ['style'],
      ADD_ATTR: ['data-type', 'data-index', 'data-viz-id', 'data-orientation', 'open'],
    });
    assignHeadingIds();
    elements.title.textContent = elements.reader.querySelector('h1')?.textContent || state.activePath.split('/').pop();
    await renderMermaid();
    applyAnnotations();
    generateConcepts();
    generateTOC();
  }

  function renderNotes() {
    elements.notesList.replaceChildren();
    const showAll = elements.showAllNotes.checked;
    const notes = state.notes
      .filter((note) => note.type !== 'content_summary' && (showAll || note.file === state.activePath))
      .filter((note) => matchesQuery(note.word, note.userNoteRaw, note.note));
    if (!notes.length) {
      elements.notesList.className = 'notes-list empty-list';
      elements.notesList.textContent = T('notesEmpty');
      return;
    }
    elements.notesList.className = 'notes-list';
    notes.sort((a, b) => {
      if (a.file === b.file) return Number(a.contextOffset || 0) - Number(b.contextOffset || 0);
      return String(a.time || '').localeCompare(String(b.time || ''));
    });
    for (const note of notes) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'note-item';
      const strong = document.createElement('strong'); strong.textContent = note.word || T('noteSummaryFallback');
      const small = document.createElement('small');
      small.textContent = `${note.userNoteRaw || note.note || T('noteHighlightOnly')}${showAll ? ` · ${note.file}` : ''}`;
      button.append(strong, small);
      button.addEventListener('click', async () => {
        if (note.file && note.file !== state.activePath) await loadFile(note.file);
        jumpToNote(note.id);
        openExistingNote(note.id);
      });
      elements.notesList.append(button);
    }
  }

  // §4.4 — prefer the context-matched occurrence, then any occurrence of the same
  // note, then a bare text match for legacy notes with no context. Never scroll to
  // an arbitrary occurrence silently: if nothing matches, say so.
  function jumpToNote(id) {
    const note = state.notes.find((item) => item.id === id);
    const escaped = CSS.escape(id);
    const marks = [...elements.reader.querySelectorAll('mark.annotated-word')];
    const target = elements.reader.querySelector(`mark[data-id="${escaped}"][data-primary="true"]`)
      || elements.reader.querySelector(`mark[data-id="${escaped}"]`)
      || (note && marks.find((mark) => mark.textContent.trim().toLowerCase() === String(note.word).toLowerCase()));

    if (!target) {
      toast(T('toastAnchorStale'));
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('flash');
    requestAnimationFrame(() => target.classList.add('flash'));
  }

  function selectionBlock(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return element?.closest('p, li, h1, h2, h3, h4, blockquote, .viz-caption, .viz-block-body');
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1 || !state.activePath) return null;
    const range = selection.getRangeAt(0);
    const block = selectionBlock(range.commonAncestorContainer);
    if (!block || !elements.reader.contains(block) || block.closest('pre, code, svg, .mermaid, .answer-block')) return null;
    if (selectionBlock(range.startContainer) !== block || selectionBlock(range.endContainer) !== block) return null;

    const context = block.textContent;
    const before = document.createRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    let start = before.toString().length;
    let end = start + range.toString().length;
    while (start < end && /\s/u.test(context[start])) start += 1;
    while (end > start && /\s/u.test(context[end - 1])) end -= 1;
    const wordChar = /[\p{L}\p{N}'’-]/u;
    while (start > 0 && wordChar.test(context[start - 1])) start -= 1;
    while (end < context.length && wordChar.test(context[end])) end += 1;
    const word = context.slice(start, end);
    if (!word || word.includes('\n')) return null;
    return { word, context, contextOffset: start, file: state.activePath, rect: range.getBoundingClientRect() };
  }

  function showSelectionAction() {
    const captured = captureSelection();
    if (!captured) {
      elements.addNote.hidden = true;
      return;
    }
    state.pendingSelection = captured;
    elements.addNote.hidden = false;
    elements.addNote.style.left = `${Math.max(8, Math.min(window.innerWidth - 90, captured.rect.left + captured.rect.width / 2 - 34))}px`;
    elements.addNote.style.top = `${Math.max(8, captured.rect.top - 42)}px`;
  }

  function openNewNote() {
    if (!state.pendingSelection) return;
    state.editingNoteId = null;
    elements.noteWord.textContent = state.pendingSelection.word;
    elements.noteText.value = '';
    elements.deleteNote.hidden = true;
    elements.addNote.hidden = true;
    elements.noteDialog.showModal();
    elements.noteText.focus();
  }

  function openExistingNote(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    state.editingNoteId = id;
    state.pendingSelection = null;
    elements.noteWord.textContent = note.word || T('noteSummaryFallback');
    elements.noteText.value = note.userNoteRaw ?? note.note ?? '';
    elements.deleteNote.hidden = false;
    elements.noteDialog.showModal();
    elements.noteText.focus();
  }

  async function saveNote() {
    let note;
    if (state.editingNoteId) {
      const previous = state.notes.find((item) => item.id === state.editingNoteId);
      // Keep aiReview: Phase 3 wrote it, and editing your own note is not a reason
      // to discard the grading attached to it (§7.2 Smart Merge).
      note = {
        ...previous,
        note: elements.noteText.value,
        userNoteRaw: elements.noteText.value,
        isHighlight: !elements.noteText.value.trim(),
      };
    } else {
      note = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...state.pendingSelection,
        note: elements.noteText.value,
        userNoteRaw: elements.noteText.value,
        isHighlight: !elements.noteText.value.trim(),
        time: new Date().toISOString(),
      };
      delete note.rect;
    }
    const payload = await api('/api/notes', { method: 'POST', body: JSON.stringify({ notes: [note] }) });
    state.notes = payload.notes;
    elements.noteDialog.close();
    await renderActiveFile();
    renderNotes();
    switchTab('notes');
    toast(T('toastNoteSaved'));
  }

  async function deleteCurrentNote() {
    if (!state.editingNoteId) return;
    const payload = await api('/api/notes', { method: 'POST', body: JSON.stringify({ deletedIds: [state.editingNoteId] }) });
    state.notes = payload.notes;
    elements.noteDialog.close();
    await renderActiveFile();
    renderNotes();
    toast(T('toastNoteDeleted'));
  }

  elements.reader.addEventListener('input', (event) => {
    const control = event.target.closest('[data-type][data-index]');
    if (!control || control.dataset.type === 'checkbox') return;
    try {
      state.rawMarkdown = ReaderCore.updateInteraction(state.rawMarkdown, control.dataset.type, control.dataset.index, control.value);
      scheduleSave();
    } catch (error) { toast(error.message); }
  });
  elements.reader.addEventListener('change', async (event) => {
    const control = event.target.closest('[data-type="checkbox"][data-index]');
    if (!control) return;
    try {
      state.rawMarkdown = ReaderCore.updateInteraction(state.rawMarkdown, 'checkbox', control.dataset.index, control.checked);
      scheduleSave();
      await renderActiveFile();
    } catch (error) { toast(error.message); }
  });
  elements.reader.addEventListener('mouseup', () => setTimeout(showSelectionAction, 0));
  elements.reader.addEventListener('keyup', () => setTimeout(showSelectionAction, 0));
  elements.addNote.addEventListener('click', openNewNote);
  elements.noteForm.addEventListener('submit', (event) => { event.preventDefault(); saveNote().catch((error) => toast(error.message)); });
  elements.deleteNote.addEventListener('click', () => deleteCurrentNote().catch((error) => toast(error.message)));
  $('#closeNoteDialog').addEventListener('click', () => elements.noteDialog.close());
  $('#cancelNoteButton').addEventListener('click', () => elements.noteDialog.close());
  elements.showAllNotes.addEventListener('change', () => {
    localStorage.setItem('ltm_notes_show_all', String(elements.showAllNotes.checked));
    renderNotes();
  });
  elements.search.addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderContents();
    renderNotes();
    generateConcepts();
  });
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  elements.sortButton.addEventListener('click', () => {
    state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
    localStorage.setItem('ltm_sort_order', state.sortOrder);
    renderContents();
  });
  $('#refreshButton').addEventListener('click', () => refreshFiles().catch((error) => toast(error.message)));
  $('#sidebarToggle').addEventListener('click', () => {
    const collapsed = elements.sidebar.classList.toggle('collapsed');
    localStorage.setItem('ltm_sidebar_collapsed', String(collapsed));
  });
  $('#themeButton').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ltm_theme', next);
  });
  elements.tocToggle?.addEventListener('click', () => {
    const collapsed = elements.tocSidebar?.classList.toggle('collapsed');
    localStorage.setItem('ltm_toc_collapsed', String(collapsed));
  });
  elements.exportButton.addEventListener('click', () => {
    const blob = new Blob([state.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = state.activePath.split('/').pop();
    link.click();
    URL.revokeObjectURL(link.href);
  });
  // §6.3 — manual save: the indicator itself, plus the shortcut every editor has trained
  // people to press. Both go through the same path as autosave, so there is one writer.
  elements.saveStatus.addEventListener('click', () => {
    saveCurrentNow({ manual: true }).catch((error) => toast(error.message));
  });
  window.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
    event.preventDefault();
    saveCurrentNow({ manual: true }).catch((error) => toast(error.message));
  });
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  // §2.1 — restore every preference before the first render, and make the controls
  // show the restored value. A default is only for someone who has never chosen.
  function restorePreferences() {
    document.documentElement.dataset.theme = localStorage.getItem('ltm_theme') || 'dark';
    elements.showAllNotes.checked = localStorage.getItem('ltm_notes_show_all') === 'true';
    elements.sidebar.classList.toggle('collapsed', localStorage.getItem('ltm_sidebar_collapsed') === 'true');
    if (localStorage.getItem('ltm_toc_collapsed') === 'false') {
      elements.tocSidebar?.classList.remove('collapsed');
    }
    elements.sortButton.textContent = state.sortOrder === 'desc' ? T('sortDesc') : T('sortAsc');
  }
  applyStaticStrings();
  restorePreferences();

  (async () => {
    await refreshNotes();
    await refreshFiles({ selectFirst: true });
  })().catch((error) => {
    setSaveStatus(T('statusInitFailed'), 'error');
    toast(error.message);
  });
})();
