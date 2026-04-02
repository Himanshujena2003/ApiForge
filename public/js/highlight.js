'use strict';

// JSON syntax highlighter — pure function, no dependencies
// Called by ui.js when rendering a response

const Highlight = (() => {

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Colorize a parsed JSON value recursively into an HTML string
  function colorize(value, indent = 0) {
    const pad = '  '.repeat(indent);
    const padInner = '  '.repeat(indent + 1);

    if (value === null)             return `<span class="jx">null</span>`;
    if (typeof value === 'boolean') return `<span class="jb">${value}</span>`;
    if (typeof value === 'number')  return `<span class="jn">${value}</span>`;
    if (typeof value === 'string')  return `<span class="js">"${escapeHtml(value)}"</span>`;

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map(v => `${padInner}${colorize(v, indent + 1)}`).join(',\n');
      return `[\n${items}\n${pad}]`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      const items = keys.map(k => {
        const key = `<span class="jk">"${escapeHtml(k)}"</span>`;
        return `${padInner}${key}: ${colorize(value[k], indent + 1)}`;
      }).join(',\n');
      return `{\n${items}\n${pad}}`;
    }

    return escapeHtml(String(value));
  }

  // Main entry: try to parse + colorize, fall back to plain escaped text
  function highlight(rawText) {
    try {
      const parsed = JSON.parse(rawText);
      return colorize(parsed);
    } catch {
      return escapeHtml(rawText);
    }
  }

  return { highlight };
})();