(function initReaderCore(globalScope, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (globalScope) globalScope.ReaderCore = core;
})(typeof window !== 'undefined' ? window : globalThis, function readerCoreFactory() {
  'use strict';

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function linesWithOffsets(raw) {
    const texts = String(raw).split('\n');
    let offset = 0;
    return texts.map((text) => {
      const line = { text, start: offset, end: offset + text.length };
      offset += text.length + 1;
      return line;
    });
  }

  function scanInteractiveTokens(raw) {
    const lines = linesWithOffsets(raw);
    const tokens = [];
    const counters = { blank: 0, checkbox: 0, textarea: 0 };
    let fence = null;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const fenceMatch = line.text.match(/^\s*(```+|~~~+)/);
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1][0];
        else if (fence === fenceMatch[1][0]) fence = null;
        continue;
      }
      if (fence) continue;

      const answer = line.text.match(/^(\s*(?:[-*+]\s*)?\*\*\[?Your Answer\]?\*\*(?:\s*\([^)]*\))?\s*:?)\s*(?:\((.*)\))?\s*$/i);
      if (answer) {
        const continuation = [];
        let lastLine = line;
        let cursor = lineIndex + 1;
        while (cursor < lines.length) {
          const continuationMatch = lines[cursor].text.match(/^(?: {4}|\t)(.*)$/);
          if (!continuationMatch) break;
          continuation.push(continuationMatch[1]);
          lastLine = lines[cursor];
          cursor += 1;
        }
        const inlineValue = answer[2] || '';
        const values = inlineValue ? [inlineValue, ...continuation] : continuation;
        tokens.push({
          type: 'textarea',
          index: counters.textarea++,
          start: line.start,
          end: lastLine.end,
          prefix: answer[1].trimEnd().endsWith(':') ? answer[1].trimEnd() : `${answer[1].trimEnd()}:`,
          value: values.join('\n'),
        });
        lineIndex = cursor - 1;
        continue;
      }

      const commentRanges = [];
      for (const match of line.text.matchAll(/<!--.*?-->/g)) {
        commentRanges.push([match.index, match.index + match[0].length]);
      }
      const inComment = (index) => commentRanges.some(([start, end]) => index >= start && index < end);

      for (const match of line.text.matchAll(/\[([ xX])\]/g)) {
        if (inComment(match.index)) continue;
        tokens.push({
          type: 'checkbox',
          index: counters.checkbox++,
          start: line.start + match.index,
          end: line.start + match.index + match[0].length,
          value: match[1].toLowerCase() === 'x',
        });
      }

      for (const match of line.text.matchAll(/_{3,}|__([^_\n]+?)__/g)) {
        if (inComment(match.index)) continue;
        tokens.push({
          type: 'blank',
          index: counters.blank++,
          start: line.start + match.index,
          end: line.start + match.index + match[0].length,
          value: match[1] || '',
        });
      }
    }

    return tokens.sort((a, b) => a.start - b.start);
  }

  function tokenHtml(token) {
    if (token.type === 'blank') {
      return `<input type="text" class="interactive-blank" data-type="blank" data-index="${token.index}" value="${escapeHtml(token.value)}" aria-label="Fill in the blank">`;
    }
    if (token.type === 'checkbox') {
      return `<input type="checkbox" class="interactive-checkbox" data-type="checkbox" data-index="${token.index}"${token.value ? ' checked' : ''} aria-label="Select answer">`;
    }
    return `<div class="answer-block"><label>回答</label><textarea class="interactive-textarea" data-type="textarea" data-index="${token.index}" rows="4">${escapeHtml(token.value)}</textarea></div>`;
  }

  function markdownWithInteractiveHtml(raw) {
    const tokens = scanInteractiveTokens(raw);
    let output = String(raw);
    for (const token of [...tokens].sort((a, b) => b.start - a.start)) {
      output = `${output.slice(0, token.start)}${tokenHtml(token)}${output.slice(token.end)}`;
    }
    return output;
  }

  function replaceMany(raw, replacements) {
    let output = String(raw);
    for (const item of [...replacements].sort((a, b) => b.token.start - a.token.start)) {
      output = `${output.slice(0, item.token.start)}${item.value}${output.slice(item.token.end)}`;
    }
    return output;
  }

  function checkboxQuestionRange(raw, token) {
    const headingRe = /^#{2,6}\s+(MCQ-\d+|TF-\d+)\b.*$/gim;
    let active = null;
    let match;
    while ((match = headingRe.exec(raw)) !== null) {
      if (match.index > token.start) break;
      active = { start: match.index, end: raw.length };
    }
    if (!active) return null;
    const nextHeading = /^#{2,6}\s+/gm;
    nextHeading.lastIndex = active.start + 1;
    const next = nextHeading.exec(raw);
    if (next) active.end = next.index;
    return token.start < active.end ? active : null;
  }

  function updateInteraction(raw, type, index, value) {
    const tokens = scanInteractiveTokens(raw);
    const token = tokens.find((item) => item.type === type && item.index === Number(index));
    if (!token) throw new Error(`Interactive ${type} #${index} no longer exists.`);

    if (type === 'blank') {
      const clean = String(value).replaceAll('\n', ' ').replaceAll('__', '_ _');
      return replaceMany(raw, [{ token, value: clean ? `__${clean}__` : '___' }]);
    }
    if (type === 'textarea') {
      const lines = String(value).replaceAll('\r', '').split('\n');
      const replacement = lines.some((line) => line.length)
        ? `${token.prefix}\n${lines.map((line) => `    ${line}`).join('\n')}`
        : token.prefix;
      return replaceMany(raw, [{ token, value: replacement }]);
    }
    if (type === 'checkbox') {
      const checked = Boolean(value);
      const range = checked ? checkboxQuestionRange(raw, token) : null;
      if (range) {
        return replaceMany(raw, tokens
          .filter((item) => item.type === 'checkbox' && item.start >= range.start && item.start < range.end)
          .map((item) => ({ token: item, value: item.index === token.index ? '[x]' : '[ ]' })));
      }
      return replaceMany(raw, [{ token, value: checked ? '[x]' : '[ ]' }]);
    }
    throw new Error(`Unsupported interaction type: ${type}`);
  }

  function numericSortKey(file) {
    const match = file.name.match(/(?:magazine|unit)(\d+)/i);
    return match ? Number(match[1]) : Date.parse(file.mtime || 0) || 0;
  }

  function sortFiles(files, order = 'desc') {
    const direction = order === 'asc' ? 1 : -1;
    return [...files].sort((a, b) => {
      const byNumber = numericSortKey(a) - numericSortKey(b);
      return direction * (byNumber || a.name.localeCompare(b.name));
    });
  }

  // --- Annotation anchoring (frontend_spec §4.3) -----------------------------
  // Pure half of the algorithm: given one block's text, return every occurrence of
  // every annotation word, flagging the single occurrence the note was written about.
  // The DOM half lives in app.js; keeping this pure is what makes it testable.

  const ANCHOR_TOLERANCE = 3;   // chars of drift absorbed between capture and render

  function annotationRegex(annotations) {
    const patterns = annotations.map((ann) => {
      let pattern = ann.word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (/^[\p{L}\p{N}]/u.test(ann.word)) pattern = `\\b${pattern}`;
      if (/[\p{L}\p{N}]$/u.test(ann.word)) pattern = `${pattern}\\b`;
      return pattern;
    });
    return new RegExp(`(${patterns.join('|')})`, 'giu');
  }

  function annotationMatches(blockText, annotations) {
    const valid = (annotations || []).filter((ann) => ann && ann.word);
    if (!blockText || !valid.length) return [];

    // Longest first, so a short word cannot swallow the phrase containing it.
    const sorted = [...valid].sort((a, b) => b.word.length - a.word.length);
    const regex = annotationRegex(sorted);
    const matches = [];
    let lastEnd = 0;
    let match;

    while ((match = regex.exec(blockText)) !== null) {
      if (match.index < lastEnd) continue;                 // keep matches non-overlapping
      const word = match[0].toLowerCase();

      // Two SEPARATE annotations can share the same word (e.g. "coffee" highlighted
      // with one note in paragraph 1 and a different note in paragraph 5). Picking
      // "the first annotation with this word" would cross-attribute paragraph 5's
      // occurrence to paragraph 1's note — wrong tooltip, wrong click target, and a
      // real risk of overwriting the wrong note on save. Prefer whichever candidate's
      // own context is THIS block; among same-block candidates (the word annotated
      // more than once in one block), prefer whichever offset is closest to this
      // exact match. Only fall back to "any annotation with this word" when no
      // candidate belongs to this block at all (the common case: one real note, and
      // this is just another place the same word happens to occur).
      const candidates = sorted.filter((ann) => ann.word.toLowerCase() === word);
      const sameBlock = candidates.filter(
        (ann) => ann.context && blockText.trim() === String(ann.context).trim(),
      );
      const annotation = sameBlock.length > 1
        ? sameBlock.reduce((best, ann) => {
          const distance = Math.abs(match.index - Number(ann.contextOffset));
          const bestDistance = Math.abs(match.index - Number(best.contextOffset));
          return distance < bestDistance ? ann : best;
        })
        : (sameBlock[0] || candidates[0]);
      if (!annotation) continue;

      const offset = Number(annotation.contextOffset);
      const isPrimary = Boolean(
        annotation.context
        && blockText.trim() === String(annotation.context).trim()
        && Number.isFinite(offset)
        && Math.abs(match.index - offset) < ANCHOR_TOLERANCE,
      );
      matches.push({ start: match.index, end: match.index + match[0].length, annotation, isPrimary });
      lastEnd = match.index + match[0].length;
    }
    return matches;
  }

  return {
    annotationMatches, markdownWithInteractiveHtml, scanInteractiveTokens, sortFiles, updateInteraction,
  };
});
