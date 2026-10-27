import { escapeXml, loadShared } from './config.mjs';
import { componentStyle } from './style.mjs';
import { wrapWords } from './text.mjs';
import { loadIcon, iconMarkup, validateIconStyle } from './icons.mjs';

function validateGroups(groups, iconStyle) {
  validateIconStyle(iconStyle);
  if (!Array.isArray(groups)) throw new Error('Technology groups must be an array');
  for (const group of groups) {
    if (typeof group?.label !== 'string' || !group.label.trim() || !Array.isArray(group.items)) {
      throw new Error('Each technology group needs a label and an items array');
    }
    if (group.notes !== undefined && typeof group.notes !== 'string'
        && !(Array.isArray(group.notes) && group.notes.every(note => typeof note === 'string'))) {
      throw new Error(`Invalid notes for technology group: ${group.label}`);
    }
    for (const item of group.items) {
      if (!item || Array.isArray(item) || typeof item !== 'object'
          || typeof item.label !== 'string' || !item.label.trim()) {
        throw new Error('Technology items must be objects with a label and an optional icon path or HTTPS URL');
      }
      if (item.iconStyle !== undefined) validateIconStyle(item.iconStyle);
    }
  }
}

function layoutItemRows(items, maxWidth, iconSize, labelSize, itemGap) {
  const lines = [[]];
  let lineWidth = 0;
  for (const item of items) {
    const iconWidth = item.image ? iconSize + 10 : 0;
    const width = iconWidth + item.label.length * labelSize * .6;
    if (lineWidth && lineWidth + itemGap + width > maxWidth) {
      lines.push([]);
      lineWidth = 0;
    }
    lines.at(-1).push({ ...item, width, iconWidth });
    lineWidth += (lineWidth ? itemGap : 0) + width;
  }
  return lines;
}

function describeGroup(group) {
  const labels = group.items.map(item => item.label).join(', ');
  const notes = group.notes ? '. ' + (Array.isArray(group.notes) ? group.notes.join('; ') : group.notes) : '';
  return escapeXml(group.label + ': ' + labels + notes);
}

export async function renderStack(groups, root, title = 'Technology stack', common = loadShared(), layout = {}, { iconStyle = 'original' } = {}) {
  validateGroups(groups, iconStyle);
  const prepared = await Promise.all(groups.map(async group => ({
    ...group,
    items: await Promise.all(group.items.map(async item => ({ ...item, image: await loadIcon(item.icon, { root }) }))),
  })));
  const { width, iconSize, padding } = common.layout;
  const center = width / 2;
  const { top = 12, maxRowWidth = width - 100, dividerInset = 60,
    itemGap = 28, rowGap = 42, noteMaxChars = 104 } = layout;
  const availableRowWidth = Math.min(maxRowWidth, width - padding * 2);
  const availableNoteChars = Math.min(noteMaxChars, Math.floor((width - padding * 2) / (common.typography.sizes.notes * .6)));
  const rows = [];
  let y = top;
  let iconIndex = 0;
  for (const [index, group] of prepared.entries()) {
    rows.push(`<text x="${center}" y="${y + 12}" text-anchor="middle" class="category">${escapeXml(group.label)}</text>`);
    const lines = layoutItemRows(group.items, availableRowWidth, iconSize, common.typography.sizes.label, itemGap);
    let rowY = y + 28;
    for (const line of lines) {
      const contentWidth = line.reduce((sum, item) => sum + item.width, 0) + Math.max(0, line.length - 1) * itemGap;
      let x = (width - contentWidth) / 2;
      for (const item of line) {
        rows.push(iconMarkup(item.image, { id: `logo-${iconIndex++}`, x, y: rowY, size: iconSize, style: item.iconStyle || iconStyle }));
        rows.push(`<text x="${x + item.iconWidth}" y="${rowY + 19}" class="label">${escapeXml(item.label)}</text>`);
        x += item.width + itemGap;
      }
      rowY += rowGap;
    }
    y = rowY - rowGap + iconSize;
    const notes = Array.isArray(group.notes) ? group.notes : group.notes ? [group.notes] : [];
    if (notes.length) {
      const noteLines = notes.flatMap(note => wrapWords(note, availableNoteChars));
      for (const [row, note] of noteLines.entries()) {
        rows.push(`<text x="${center}" y="${y + 23 + row * 18}" text-anchor="middle" class="notes">${escapeXml(note)}</text>`);
      }
      y += noteLines.length * 18 + 12;
    }
    if (index < prepared.length - 1) rows.push(`<path d="M${dividerInset} ${y + 14}H${width - dividerInset}" class="divider"/>`);
    y += 30;
  }
  const height = y - 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(title)}</title>
<desc id="desc">${groups.map(describeGroup).join('. ')}.</desc>
${componentStyle(common)}
<style>.divider { fill: none; opacity: .6; }</style>
${rows.join('\n')}
</svg>\n`;
}
