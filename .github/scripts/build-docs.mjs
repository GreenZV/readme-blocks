// Repository documentation build. Consumer Actions never import this module.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { ROOT, cliOptions, context, isMain, loadJson, loadShared, writeAssets } from '../../scripts/lib/config.mjs';
import { forceAppearance } from '../../scripts/lib/appearance.mjs';
import { componentPage } from './component-docs.mjs';

const CATALOG_START = '<!-- readme-blocks:themes:start -->';
const CATALOG_END = '<!-- readme-blocks:themes:end -->';

async function loadInputs() {
  const names = (await fs.readdir(path.join(ROOT, 'themes')))
    .filter(filename => filename.endsWith('.json')).map(filename => filename.slice(0, -5))
    .sort((left, right) => left === right ? 0 : left === 'monochrome' ? -1 : right === 'monochrome' ? 1 : left.localeCompare(right));
  if (!names.includes('monochrome')) throw new Error('The built-in monochrome theme is required');
  // Validate every palette before replacing any generated output.
  const themes = names.map(name => ({ name, common: loadShared({}, name) }));
  const entries = await fs.readdir(path.join(ROOT, 'components'), { withFileTypes: true });
  const components = [];
  for (const entry of entries.filter(entry => entry.isDirectory()).sort((left, right) => left.name.localeCompare(right.name))) {
    const directory = path.join(ROOT, 'components', entry.name);
    try { await fs.access(path.join(directory, 'action.yml')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const module = await import(pathToFileURL(path.join(directory, 'generate.mjs')).href);
    components.push({
      name: entry.name,
      render: module.render,
      ctx: context(entry.name, { demo: true, root: path.join(ROOT, 'examples/demo') }),
      minimal: loadJson(path.join(directory, 'minimal.json')),
    });
  }
  return { components, themes };
}

function themeContext(component, theme, animated) {
  const common = structuredClone(theme.common);
  if (!animated) common.motion.enabled = false;
  return { ...component.ctx, common };
}

function appearancePreview(svg, appearance) {
  const background = appearance === 'dark' ? '#0d1117' : '#ffffff';
  return forceAppearance(svg, appearance)
    .replace(/(<svg\b[^>]*>)/, `$1\n<rect width="100%" height="100%" fill="${background}"/>`);
}

async function renderDemo(root, components, themes) {
  const destination = path.join(root, 'examples/demo');
  await fs.rm(path.join(destination, 'assets'), { recursive: true, force: true });
  let count = 0;
  for (const component of components) {
    const ctx = themeContext(component, themes[0], true);
    const { assets } = await component.render(ctx);
    await writeAssets(assets, destination, { appearance: ctx.common.appearance });
    count += assets.length;
  }
  return count;
}

async function renderGallery(root, components, themes) {
  for (const component of components) {
    const { name } = component;
    const directory = path.join(root, 'components', name);
    // This directory is owned by the generator; remove deleted themes and old slugs.
    await fs.rm(path.join(directory, 'previews'), { recursive: true, force: true });
    const sections = [];
    for (const theme of themes) {
      const { assets } = await component.render(themeContext(component, theme, false));
      const examples = name === 'projects' ? assets.slice(0, 2) : name === 'contact' ? assets.slice(0, 3) : assets;
      sections.push(`## ${theme.name}\n\nWorkflow input: \`theme: ${theme.name}\`\n`);
      for (const appearance of ['light', 'dark']) {
        const images = [];
        for (const asset of examples) {
          const relative = `previews/${theme.name}/${appearance}/${path.basename(asset.path)}`;
          const filename = path.join(directory, relative);
          await fs.mkdir(path.dirname(filename), { recursive: true });
          await fs.writeFile(filename, appearancePreview(asset.svg, appearance));
          images.push(`![${name} — ${theme.name}, ${appearance}](${relative})`);
        }
        sections.push(`### ${appearance === 'light' ? 'Light' : 'Dark'}\n\n${images.join('\n\n')}\n`);
      }
    }
    const config = component.ctx.config;
    const output = name === 'projects' ? 'assets/projects/<slug>.svg'
      : name === 'contact' ? 'assets/contacts/<slug>.svg' : config.output || config.outputs[0].path;
    const page = componentPage(name, component.minimal, output, sections.join('\n'));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'README.md'), page);
  }
}

function themeTable(themes, themePrefix, previewPrefix) {
  return [
    '| Theme | Light accent | Dark accent | Banner preview |',
    '| --- | --- | --- | --- |',
    ...themes.map(({ name, common }) =>
      `| [${name}](${themePrefix}${name}.json) | \`${common.themes.light.title}\` | \`${common.themes.dark.title}\` | [Preview](${previewPrefix}#${name}) |`),
  ].join('\n');
}

async function updateCatalogs(root, themes) {
  const documents = [
    ['README.md', 'themes/', 'components/banner/README.md'],
    ['themes/README.md', '', '../components/banner/README.md'],
    ['examples/demo/README.md', '../../themes/', '../../components/banner/README.md'],
  ];
  for (const [relative, themePrefix, previewPrefix] of documents) {
    const source = await fs.readFile(path.join(ROOT, relative), 'utf8');
    const start = source.indexOf(CATALOG_START);
    const end = source.indexOf(CATALOG_END, start + CATALOG_START.length);
    if (start < 0 || end < 0) throw new Error(`Missing generated theme catalog markers in ${relative}`);
    const table = themeTable(themes, themePrefix, previewPrefix);
    const result = source.slice(0, start + CATALOG_START.length) + '\n\n' + table + '\n\n' + source.slice(end);
    const destination = path.join(root, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, result);
  }
}

// Render everything away from published files. Missing guide metadata, bad demos,
// renderer failures and invalid catalog markers must not destroy existing output.
async function publishDirectory(staging, root, relative) {
  const destination = path.join(root, relative);
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(path.join(staging, relative), destination, { recursive: true });
}

async function publishFile(staging, root, relative) {
  const destination = path.join(root, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(staging, relative), destination);
}

async function buildOutput(root, { documentation }) {
  const { components, themes } = await loadInputs();
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'readme-blocks-docs-'));
  try {
    const demoAssets = documentation ? await renderDemo(staging, components, themes) : 0;
    await renderGallery(staging, components, themes);
    if (documentation) await updateCatalogs(staging, themes);

    // Publish only after all renderers and documentation generation have succeeded.
    for (const { name } of components) {
      await publishDirectory(staging, root, `components/${name}/previews`);
      await publishFile(staging, root, `components/${name}/README.md`);
    }
    if (documentation) {
      await publishDirectory(staging, root, 'examples/demo/assets');
      for (const relative of ['README.md', 'themes/README.md', 'examples/demo/README.md']) {
        await publishFile(staging, root, relative);
      }
    }
    return { components: components.length, themes: themes.length, ...(documentation ? { demoAssets } : {}) };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

export async function buildGallery(root = ROOT) {
  return buildOutput(root, { documentation: false });
}

export async function buildDocumentation(root = ROOT) {
  return buildOutput(root, { documentation: true });
}

if (isMain(import.meta.url)) {
  const options = cliOptions();
  if (options.demo || options.theme) throw new Error('Documentation always renders packaged demos and every built-in theme; only --root is supported');
  const result = await buildDocumentation(options.root || ROOT);
  console.log(`Documentation: ${result.components} components × ${result.themes} themes × 2 appearances; ${result.demoAssets} demo assets`);
}
