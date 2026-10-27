import { context, loadShared, isMain, runComponent, escapeXml } from '../../scripts/lib/config.mjs';
import { loadIcon, iconMarkup, validateIconStyle } from '../../scripts/lib/icons.mjs';

function renderContactCard({ slug, label, iconStyle }, image, common, config) {
  const { minWidth, height, iconSize } = config.layout;
  const charWidth = common.typography.sizes.body * .6;
  const iconWidth = image ? iconSize + 12 : 0;
  const width = Math.max(minWidth, 40 + iconWidth + label.length * charWidth);
  const contentX = (width - (iconWidth + label.length * charWidth)) / 2;
  const icon = iconMarkup(image, { id: 'contact-icon', x: contentX, y: (height - iconSize) / 2, size: iconSize,
    style: iconStyle ?? config.iconStyle ?? 'original' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
<title id="title">${escapeXml(label)}</title>
<style>
  .border { fill: none; stroke: ${common.themes.light.border}; }
  .logo { fill: ${common.themes.light.logo}; }
  .label { fill: ${common.themes.light.body}; font: ${common.typography.sizes.body}px ${escapeXml(common.typography.fontFamily)}; }
  @media (prefers-color-scheme: dark) {
    .border { stroke: ${common.themes.dark.border}; } .logo { fill: ${common.themes.dark.logo}; } .label { fill: ${common.themes.dark.body}; }
  }
</style>
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${common.layout.radius}" class="border"/>
${icon}
<text x="${contentX + iconWidth}" y="${height / 2 + common.typography.sizes.body * .32}" class="label">${escapeXml(label)}</text>
</svg>\n`;
  return { path: `${config.outputDirectory}/${slug}.svg`, svg };
}

// Slugs determine filenames only. Icon paths and URLs are supplied independently.
export async function renderContacts(groups, root, common = loadShared(), config = context('contact', { demo: true }).config) {
  if (!Array.isArray(groups)) throw new Error('Contact config.groups must contain an array');
  validateIconStyle(config.iconStyle ?? 'original');
  const items = [];
  const slugs = new Set();
  for (const group of groups) {
    if (typeof group?.label !== 'string' || !group.label.trim() || !Array.isArray(group.items)) throw new Error('Invalid contact group');
    for (const item of group.items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Each contact must be an object');
      const { slug, label } = item;
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)
          || typeof label !== 'string' || !label.trim()) throw new Error('Each contact needs a unique slug and label');
      if (item.iconStyle !== undefined) validateIconStyle(item.iconStyle);
      slugs.add(slug);
      items.push(item);
    }
  }
  const assets = await Promise.all(items.map(async item =>
    renderContactCard(item, await loadIcon(item.icon, { root }), common, config)));
  return { assets };
}

export async function render({ config, common, root }) {
  return renderContacts(config.groups, root, common, config);
}

if (isMain(import.meta.url)) await runComponent('contact', render);
