import { componentStyle } from '../../scripts/lib/style.mjs';
import { loadShared, context, escapeXml, isMain, runComponent } from '../../scripts/lib/config.mjs';

function wrap(value, width = 48, limit = 3) {
  const lines = [];
  let remaining = value.trim();
  while (remaining && lines.length < limit) {
    if (remaining.length <= width) {
      lines.push(remaining);
      remaining = '';
      break;
    }
    const split = remaining.lastIndexOf(' ', width);
    const end = split > 0 ? split : width;
    lines.push(remaining.slice(0, end));
    remaining = remaining.slice(end).trim();
  }
  if (remaining) {
    lines[lines.length - 1] = lines.at(-1).slice(0, width - 3) + '...';
  }
  return lines;
}

function validateProject(project, slugs) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    throw new Error('Each project must be an object');
  }
  const { slug, title, description = '', stack = [], showLinkHint = false } = project;
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)) {
    throw new Error('Each project needs a unique lowercase slug');
  }
  slugs.add(slug);
  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string'
      || !Array.isArray(stack) || !stack.every(item => typeof item === 'string')
      || typeof showLinkHint !== 'boolean') {
    throw new Error(`Invalid project: ${slug}`);
  }
}

function resolveStatus(statusId, slug, config) {
  let status;
  if (statusId !== undefined && statusId !== null) {
    if (typeof statusId !== 'string' || !Object.hasOwn(config.statuses || {}, statusId)) {
      throw new Error(`Unknown project status: ${slug} (${String(statusId)})`);
    }
    status = config.statuses[statusId];
    if (typeof status?.label !== 'string' || !status.label.trim()
        || !['title', 'body', 'muted', 'success', 'pending'].includes(status.tone)) {
      throw new Error(`Invalid project status definition: ${statusId}`);
    }
  }
  return status;
}

function renderStatus(status, config, common) {
  if (!status) return { statusStyle: '', statusMarkup: '' };

  const { cardWidth } = config.layout;
  const inset = 20;
  const characterWidth = common.typography.sizes.muted * .65;
  const statusChars = Math.max(4, Math.floor((cardWidth - inset * 2 - 115) / characterWidth) - 3);
  const statusLabel = wrap(status.label, statusChars, 1)[0];
  const statusColors = theme => `.project-status{fill:${common.themes[theme].body}}.project-marker{fill:${common.themes[theme][status.tone]}}`;
  const statusStyle = `<style>.project-status{font-size:${common.typography.sizes.muted}px}${statusColors('light')}@media(prefers-color-scheme:dark){${statusColors('dark')}} </style>`;
  const statusMarkup = `<circle cx="${cardWidth - inset - [...statusLabel].length * characterWidth - 10}" cy="24" r="3" class="project-marker"/><text x="${cardWidth - inset}" y="28" text-anchor="end" class="project-status">${escapeXml(statusLabel)}</text>`;
  return { statusStyle, statusMarkup };
}

function renderProjectCard(project, index, panelStyle, config, common) {
  const { cardWidth, cardHeight, descriptionChars, titleChars } = config.layout;
  const { slug, title, description = '', stack = [], showLinkHint = false, status: statusId } = project;
  const inset = 20;
  const status = resolveStatus(statusId, slug, config);
  const assetPath = `${config.outputDirectory}/${slug}.svg`;
  const lines = wrap(description, descriptionChars);
  const shortTitle = title.length > titleChars ? title.slice(0, titleChars - 3) + '...' : title;
  const stackLine = wrap(stack.join(' / '), descriptionChars, 1)[0] || '';
  const { statusStyle, statusMarkup } = renderStatus(status, config, common);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(title)}</title>
<desc id="desc">${escapeXml(description)} Built with: ${escapeXml(stack.join(', '))}.${status ? ` Status: ${escapeXml(status.label)}.` : ''}</desc>${panelStyle}${statusStyle}
<rect x=".5" y=".5" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="${common.layout.radius}" fill="none" class="border"/>
<text x="20" y="28" class="muted">${String(index + 1).padStart(2, '0')} / ${project.demo ? 'DEMO' : 'PROJECT'}</text>
${statusMarkup}
<text x="20" y="58" class="title">&gt; ${escapeXml(shortTitle)}</text>
${lines.map((line, row) => `<text x="20" y="${88 + row * 20}" class="body">${escapeXml(line)}</text>`).join('\n')}
<path d="M${inset} 148H${cardWidth - inset}" class="divider"/>
<text x="20" y="172" class="tool">${escapeXml(stackLine)}</text>
${showLinkHint ? '<text x="20" y="194" class="muted">view project -&gt;</text>' : ''}
</svg>\n`;
  return { path: assetPath, svg };
}

// Card links live in README HTML; the project lifecycle status is part of the SVG.
export function renderProjects(projects, panelStyle, config = context('projects', { demo: true }).config, common = loadShared()) {
  if (!Array.isArray(projects)) throw new Error('Projects config.items must contain an array');

  const slugs = new Set();
  const assets = projects.map((project, index) => {
    validateProject(project, slugs);
    return renderProjectCard(project, index, panelStyle, config, common);
  });
  return { assets };
}

export function render({ config, common }) {
  return renderProjects(config.items, componentStyle(common), config, common);
}

if (isMain(import.meta.url)) await runComponent('projects', render);
