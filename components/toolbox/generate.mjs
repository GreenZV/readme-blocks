import { isMain, runComponent, escapeXml } from '../../scripts/lib/config.mjs';
import { componentStyle } from '../../scripts/lib/style.mjs';

function renderToolRow(row, index, config, common) {
  const [skill, description = '', tools = '', detail = ''] = row;
  const { width, padding } = common.layout;
  const { rowHeight, toolsX } = config.layout;
  const y = 78 + index * rowHeight;
  const divider = index < config.rows.length - 1
    ? `<path d="M${padding} ${y + 43}H${width - padding}" class="divider" opacity=".5"/>`
    : '';

  return `<text x="${padding}" y="${y}" class="title">${String(index + 1).padStart(2, '0')} / ${escapeXml(skill)}</text>
<text x="${padding}" y="${y + 22}" class="muted">${escapeXml(description)}</text>
<text x="${toolsX}" y="${y}" class="tool">${escapeXml(tools)}</text>
<text x="${toolsX}" y="${y + 22}" class="muted">${escapeXml(detail)}</text>${divider}`;
}

export function render({ config, common }) {
  const { width, padding, radius } = common.layout;
  const height = config.rows.length * config.layout.rowHeight + 62;
  const rows = config.rows.map((row, index) => renderToolRow(row, index, config, common)).join('');
  const description = config.rows.map(([skill, , tools = '', detail = '']) => `${skill}: ${tools}; ${detail}`).join('. ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(config.title)}</title>
<desc id="desc">${escapeXml(description)}.</desc>${componentStyle(common)}
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" class="border"/>
<text x="${padding}" y="31" class="title">${escapeXml(config.command)}</text>
<text x="${width - padding}" y="31" text-anchor="end" class="muted">${escapeXml(config.eyebrow)}</text>
<path d="M${padding} 46H${width - padding}" class="divider"/>${rows}</svg>\n`;
  return { assets: [{ path: config.output, svg }] };
}

if (isMain(import.meta.url)) await runComponent('toolbox', render);
