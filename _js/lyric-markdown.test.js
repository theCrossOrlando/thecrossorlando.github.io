import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from './lyric-markdown.js';

test('renders formatting and preserves lyric line breaks', () => {
  assert.equal(renderMarkdown('**Leader:** speak\n*People:* respond'), '<p><strong>Leader:</strong> speak<br>\n<em>People:</em> respond</p>\n');
});

test('escapes raw HTML and rejects unsafe links', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)>\n[click](javascript:alert(1))');
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img|href=/);
});
