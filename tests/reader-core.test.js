'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ReaderCore = require('../reader-core');

test('scans interactive elements while ignoring fenced examples', () => {
  const markdown = [
    'Sentence: ___ and __saved__.',
    '- [ ] option',
    '* **[Your Answer]**:',
    '    first line',
    '    second line',
    '```markdown',
    '___ - [ ] **[Your Answer]**:',
    '```',
  ].join('\n');
  const tokens = ReaderCore.scanInteractiveTokens(markdown);
  assert.deepEqual(tokens.map((token) => token.type), ['blank', 'blank', 'checkbox', 'textarea']);
  assert.equal(tokens.at(-1).value, 'first line\nsecond line');
});

test('updates blanks and multiline answers without changing their identity', () => {
  let markdown = 'Answer: ___\n\n* **[Your Answer]**:';
  markdown = ReaderCore.updateInteraction(markdown, 'blank', 0, 'alpha');
  assert.match(markdown, /Answer: __alpha__/);
  markdown = ReaderCore.updateInteraction(markdown, 'blank', 0, 'beta');
  assert.match(markdown, /Answer: __beta__/);
  markdown = ReaderCore.updateInteraction(markdown, 'textarea', 0, 'line one\nline two');
  assert.match(markdown, /\* \*\*\[Your Answer\]\*\*:\n    line one\n    line two/);
  assert.equal(ReaderCore.scanInteractiveTokens(markdown).find((token) => token.type === 'textarea').value, 'line one\nline two');
});

test('MCQ and T/F checkboxes behave as single-choice groups', () => {
  const markdown = [
    '#### MCQ-1',
    '- [x] A. first',
    '- [ ] B. second',
    '#### MCQ-2',
    '- [ ] A. another question',
  ].join('\n');
  const updated = ReaderCore.updateInteraction(markdown, 'checkbox', 1, true);
  assert.match(updated, /MCQ-1\n- \[ \] A\. first\n- \[x\] B\. second/);
  assert.match(updated, /MCQ-2\n- \[ \] A\. another question/);
});

test('marks every occurrence of a word but only one is primary', () => {
  const context = 'The note about banknotes explains why a note is not a banknote.';
  const matches = ReaderCore.annotationMatches(context, [
    { id: 'n1', word: 'note', context, contextOffset: 4 },
  ]);
  assert.equal(matches.length, 2, 'both standalone "note" occurrences are marked');
  assert.deepEqual(matches.map((match) => match.isPrimary), [true, false]);
  assert.equal(context.slice(matches[0].start, matches[0].end), 'note');
});

test('longer phrases win over the short words inside them', () => {
  const context = 'They bail up tourists; getting bailed up is common.';
  const matches = ReaderCore.annotationMatches(context, [
    { id: 'short', word: 'up', context, contextOffset: 10 },
    { id: 'long', word: 'bail up', context, contextOffset: 5 },
  ]);
  assert.equal(matches[0].annotation.id, 'long');
  assert.equal(context.slice(matches[0].start, matches[0].end), 'bail up');
});

test('primary tolerates small offset drift but not a different block', () => {
  const context = 'Espresso is the base for a long black.';
  const near = ReaderCore.annotationMatches(context, [
    { id: 'n', word: 'Espresso', context, contextOffset: 2 },
  ]);
  assert.equal(near[0].isPrimary, true, 'within the 3-char tolerance');

  const far = ReaderCore.annotationMatches(context, [
    { id: 'n', word: 'Espresso', context, contextOffset: 9 },
  ]);
  assert.equal(far[0].isPrimary, false, 'beyond the tolerance');

  const otherBlock = ReaderCore.annotationMatches('Espresso again, elsewhere.', [
    { id: 'n', word: 'Espresso', context, contextOffset: 0 },
  ]);
  assert.equal(otherBlock[0].isPrimary, false, 'right word, wrong block');
});

test('annotations without context still match, but never claim primary', () => {
  const matches = ReaderCore.annotationMatches('A legacy note with no context stored.', [
    { id: 'legacy', word: 'legacy' },
  ]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].isPrimary, false);
});

test('regex-special characters in a word do not break matching', () => {
  const context = 'Use the C++ (not C) toolchain.';
  const matches = ReaderCore.annotationMatches(context, [
    { id: 'x', word: 'C++', context, contextOffset: 8 },
  ]);
  assert.equal(matches.length, 1);
  assert.equal(context.slice(matches[0].start, matches[0].end), 'C++');
  assert.equal(matches[0].isPrimary, true);
});

test('two separate annotations sharing a word do not cross-attribute across blocks', () => {
  // Regression: a naive "first annotation with this word" lookup made block B's
  // occurrence inherit block A's note (wrong tooltip, wrong click target, and a real
  // risk of overwriting the wrong note on save).
  const blockA = 'I love coffee in the morning.';
  const blockB = 'Australian coffee culture is intense.';
  const annA = { id: 'ann-A', word: 'coffee', context: blockA, contextOffset: blockA.indexOf('coffee') };
  const annB = { id: 'ann-B', word: 'coffee', context: blockB, contextOffset: blockB.indexOf('coffee') };
  const annotations = [annA, annB];

  const matchesA = ReaderCore.annotationMatches(blockA, annotations);
  const matchesB = ReaderCore.annotationMatches(blockB, annotations);

  assert.equal(matchesA[0].annotation.id, 'ann-A');
  assert.equal(matchesB[0].annotation.id, 'ann-B');
  assert.equal(matchesA[0].isPrimary, true);
  assert.equal(matchesB[0].isPrimary, true);
});

test('the same word annotated twice within one block resolves each occurrence separately', () => {
  const block = 'I love coffee. My coffee is French coffee.';
  const firstOffset = block.indexOf('coffee');
  const secondOffset = block.indexOf('coffee', firstOffset + 1);
  const first = { id: 'first', word: 'coffee', context: block, contextOffset: firstOffset };
  const second = { id: 'second', word: 'coffee', context: block, contextOffset: secondOffset };

  const matches = ReaderCore.annotationMatches(block, [first, second]);

  assert.equal(matches.length, 3);
  assert.equal(matches[0].annotation.id, 'first');
  assert.equal(matches[1].annotation.id, 'second');
  assert.equal(matches[0].isPrimary, true);
  assert.equal(matches[1].isPrimary, true);
  assert.equal(matches[2].isPrimary, false, 'the unclaimed 3rd occurrence is never primary');
});

test('a common word with one real note still marks every echo with that note', () => {
  // The frequent case: one annotation, and the word recurs elsewhere with no note of
  // its own. Every occurrence should still resolve to the single real annotation.
  const block = 'Espresso is strong. Espresso again.';
  const ann = { id: 'only', word: 'Espresso', context: block, contextOffset: 0 };

  const matches = ReaderCore.annotationMatches(block, [ann]);

  assert.equal(matches.length, 2);
  assert.equal(matches[0].annotation.id, 'only');
  assert.equal(matches[1].annotation.id, 'only');
});

test('sorts numbered content in either direction', () => {
  const files = [{ name: 'unit02_b.md' }, { name: 'unit10_c.md' }, { name: 'unit01_a.md' }];
  assert.deepEqual(ReaderCore.sortFiles(files, 'asc').map((file) => file.name), ['unit01_a.md', 'unit02_b.md', 'unit10_c.md']);
  assert.deepEqual(ReaderCore.sortFiles(files, 'desc').map((file) => file.name), ['unit10_c.md', 'unit02_b.md', 'unit01_a.md']);
});
