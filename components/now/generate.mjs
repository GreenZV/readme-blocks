import { isMain, runComponent, escapeXml } from '../../scripts/lib/config.mjs';
import { componentStyle } from '../../scripts/lib/style.mjs';

export function render({ config, common }) {
  const { width, padding, radius } = common.layout;
  const center = width / 2;
  const height = config.height;
  const steps = config.steps.map((step, index) => {
    const separator = index ? '<tspan class="muted"> -&gt; </tspan>' : '';
    return `${separator}<tspan class="tool">${escapeXml(step)}</tspan>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Current focus — ${escapeXml(config.focus)}</title>
<desc id="desc">${escapeXml(config.direction)} Focus areas: ${escapeXml(config.steps.join(', '))}.</desc>${componentStyle(common)}
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" class="border"/>
<text x="${padding}" y="31" class="title">${escapeXml(config.command)}</text>
<text x="${width - padding}" y="31" text-anchor="end" class="muted">${escapeXml(config.eyebrow)}</text>
<path d="M${padding} 46H${width - padding}" class="divider"/>
<text x="${center}" y="81" text-anchor="middle" class="title" font-weight="600">&gt; ${escapeXml(config.focus)}</text>
<text x="${center}" y="105" text-anchor="middle" class="muted">${escapeXml(config.direction)}</text>
<text x="${center}" y="140" text-anchor="middle" class="body">${steps}</text>
</svg>\n`;
  return { assets: [{ path: config.output, svg }] };
}

if (isMain(import.meta.url)) await runComponent('now', render);
