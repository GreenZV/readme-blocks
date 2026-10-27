import { loadShared, isMain, runComponent, escapeXml } from '../../scripts/lib/config.mjs';
import { componentStyle } from '../../scripts/lib/style.mjs';
import { wrapWords } from '../../scripts/lib/text.mjs';

export function renderAdditional(groups, common = loadShared(), config = {}) {
  const totalWidth = common.layout.width;
  const { columns = 2, gap = 16, textPadding = 20 } = config.layout || {};
  const cardWidth = (totalWidth - (columns - 1) * gap) / columns;
  const textSize = common.typography.sizes.notes;
  const cards = [];
  let y = 0;
  for (let index = 0; index < groups.length; index += columns) {
    const rowGroups = groups.slice(index, index + columns);
    const width = rowGroups.length === 1 ? totalWidth : cardWidth;
    const availableChars = Math.floor((width - textPadding * 2) / (textSize * .64));
    const contents = rowGroups.map(group => wrapWords(group.items.join(' / '), availableChars));
    const height = Math.max(...contents.map(lines => lines.length)) * 20 + 54;
    for (const [column, group] of rowGroups.entries()) {
      const x = column * (cardWidth + gap);
      cards.push(`<g transform="translate(${x} ${y})">
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${common.layout.radius}" fill="none" class="border"/>
<text x="${textPadding}" y="27" class="title">${String(index + column + 1).padStart(2, '0')} / ${escapeXml(group.label)}</text>
${contents[column].map((line, row) => `<text x="${textPadding}" y="${52 + row * 20}" class="body">${escapeXml(line)}</text>`).join('\n')}
</g>`);
    }
    y += height + gap;
  }
  const height = y - gap;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(config.title || 'Additional experience through personal projects and university studies')}</title>
<desc id="desc">${groups.map(group => escapeXml(group.label + ': ' + group.items.join(', '))).join('. ')}.</desc>
${componentStyle(common, { sizes: { title: textSize, body: textSize } })}
${cards.join('\n')}
</svg>\n`;
}

export function render({ config, common }) {
  return {
    assets: [{ path: config.output, svg: renderAdditional(config.groups, common, config) }],
  };
}

if (isMain(import.meta.url)) await runComponent('more-technologies', render);
