// Wrap at word boundaries without splitting long technology or library names.
export function wrapWords(text, width) {
  const lines = [];
  let line = '';

  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = '';
    }
    line += (line ? ' ' : '') + word;
  }

  if (line) lines.push(line);
  return lines;
}
