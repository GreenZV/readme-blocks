import fs from 'node:fs/promises';
import { appearanceAssets, validateAppearance } from './appearance.mjs';
import { constants, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export const loadJson = filename => JSON.parse(readFileSync(filename, 'utf8'));
export function validateShared(common) {
  if (common.schemaVersion !== 1) throw new Error('Unsupported shared config schemaVersion');
  validateAppearance(common.appearance);
  for (const [key, value] of Object.entries(common.layout || {})) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Shared layout.${key} must be positive`);
  }
  for (const key of ['width', 'padding', 'radius', 'iconSize']) {
    if (!Number.isFinite(common.layout?.[key])) throw new Error(`Missing shared layout.${key}`);
  }
  const checkColor = (value, name) => {
    if (typeof value !== 'string' || !/^#(?:[\da-f]{6}|[\da-f]{8})$/i.test(value)) throw new Error(`Invalid color: ${name}`);
  };
  const roles = ['bannerPrompt', 'bannerText', 'bannerCursor', 'title', 'body', 'muted', 'logo', 'border', 'stat', 'todayBackground', 'todayText', 'success', 'pending'];
  for (const theme of ['light', 'dark']) {
    for (const role of roles) checkColor(common.themes?.[theme]?.[role], `themes.${theme}.${role}`);
    if (common.themes[theme].activity?.length !== 5) throw new Error(`themes.${theme}.activity needs 5 colors`);
    common.themes[theme].activity.forEach((color, index) => checkColor(color, `${theme}.activity[${index}]`));
  }
  for (const key of ['fontFamily', 'calendarFontFamily']) {
    if (!common.typography?.[key]) throw new Error(`Missing typography.${key}`);
  }
  for (const key of ['title', 'body', 'muted', 'tool', 'category', 'label', 'notes', 'cell']) {
    if (!(common.typography.sizes?.[key] > 0)) throw new Error(`typography.sizes.${key} must be positive`);
  }
  if (typeof common.motion?.enabled !== 'boolean' || typeof common.motion?.respectReducedMotion !== 'boolean') throw new Error('Shared motion options must be booleans');
  return common;
}
// Arrays (including activity scales) replace the base value as a whole.
export function mergeSettings(base, overrides) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const object = value && typeof value === 'object' && !Array.isArray(value);
    result[key] = object ? mergeSettings(base?.[key] || {}, value) : structuredClone(value);
  }
  return result;
}

// Pure settings API; consumer files are discovered only by loadThemeSettings.
export function loadShared(overrides = {}, theme = 'monochrome') {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('Theme overrides must be an object; theme file paths are fixed');
  }
  if (Object.hasOwn(overrides, 'theme')) {
    throw new Error('Select a built-in theme with the workflow theme input or --theme');
  }
  const themeName = theme || 'monochrome';
  if (!/^[a-z][a-z0-9-]*$/.test(themeName)) throw new Error(`Unknown built-in theme: ${themeName}`);
  const themeFile = path.join(ROOT, 'themes', `${themeName}.json`);
  if (!existsSync(themeFile)) throw new Error(`Unknown built-in theme: ${themeName}`);
  const defaults = loadJson(path.join(ROOT, 'config/shared.json'));
  const base = { ...defaults, theme: themeName, themes: loadJson(themeFile) };
  return validateShared({ ...mergeSettings(base, overrides), theme: themeName });
}

export const THEME_CONFIG = '.github/readme/theme.json';
export const componentThemeConfig = name => {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid component name: ${name}`);
  return `.github/readme/themes/${name}.json`;
};

function optionalThemeFile(filename) {
  try {
    const settings = loadJson(filename);
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw new Error(`Theme overrides must be an object: ${filename}`);
    }
    return settings;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export function loadThemeSettings(root = ROOT, component, theme = 'monochrome') {
  const global = optionalThemeFile(path.join(root, THEME_CONFIG));
  const local = component ? optionalThemeFile(path.join(root, componentThemeConfig(component))) : {};
  // Validate files separately so an invalid global file cannot be masked locally.
  const base = loadShared(global, theme);
  if (Object.hasOwn(local, 'theme')) throw new Error('Select a built-in theme with the workflow theme input or --theme');
  return validateShared(mergeSettings(base, local));
}

export function cliOptions(argv = process.argv.slice(2), { preview = false } = {}) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index];
    if (name === '--demo') {
      options.demo = true;
      continue;
    }
    const allowed = ['--root', '--theme', ...(preview ? ['--preview-config'] : [])];
    if (!allowed.includes(name) || !argv[index + 1] || argv[index + 1].startsWith('--')) {
      throw new Error(`Expected --demo, --theme NAME, or --root PATH; got ${name}`);
    }
    const value = argv[++index];
    const key = name === '--preview-config' ? 'previewConfig' : name.slice(2);
    options[key] = name === '--theme' ? value : path.resolve(value);
  }
  return options;
}

export function componentConfigPath(name) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid component name: ${name}`);
  return `.github/readme/components/${name}.json`;
}

// Entry points initialize only their own data file; existing files are never changed.
// Pure context/render calls remain read-only for previews and in-memory integrations.
export async function initializeComponentConfig(name, { root = process.cwd(), config } = {}) {
  if (config !== undefined) return false;
  const relative = componentConfigPath(name);
  const filename = path.resolve(root, relative);
  try {
    await fs.access(filename);
    return false;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.mkdir(path.dirname(filename), { recursive: true });
  try {
    await fs.copyFile(path.join(ROOT, 'components', name, 'minimal.json'), filename, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code === 'EEXIST') return false;
    throw error;
  }
  console.log(`${name}: created ${relative}; fill in your data before the next normal build.`);
  return true;
}

function loadComponentConfig(name, root, demo) {
  const filename = demo
    ? path.join(ROOT, 'components', name, 'demo.json')
    : path.join(root, componentConfigPath(name));
  try {
    const config = loadJson(filename);
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error(`Component config must be an object: ${filename}`);
    }
    return config;
  } catch (error) {
    if (!demo && error.code === 'ENOENT') {
      throw new Error(`Missing component config: ${componentConfigPath(name)}; run the component Action once to initialize it`);
    }
    throw error;
  }
}

function validateComponentData(name, config) {
  const requiredText = { banner: 'text', now: 'focus', contribution: 'username' }[name];
  if (requiredText && (typeof config[requiredText] !== 'string' || !config[requiredText].trim())) {
    throw new Error(`${name}: fill the ${requiredText} field in ${componentConfigPath(name)}`);
  }
  const list = { projects: 'items', stack: 'groups', experience: 'groups',
    toolbox: 'rows', 'more-technologies': 'groups', contact: 'groups' }[name];
  if (list && (!Array.isArray(config[list]) || (!['projects', 'contact'].includes(name) && !config[list].length))) {
    throw new Error(`${name}: ${list} must be ${['projects', 'contact'].includes(name) ? 'an array' : 'a non-empty array'} in ${componentConfigPath(name)}`);
  }
}

export function context(name, options = {}) {
  if (options.config !== undefined && (!options.config || typeof options.config !== 'object' || Array.isArray(options.config))) {
    throw new Error('Custom component config paths are unsupported; use the fixed component config path');
  }
  if (options.demo && options.config) throw new Error('Choose demo mode or in-memory data, not both');
  const root = options.root || process.cwd();
  // In-memory data supports render integrations; filesystem lookup has one fixed path.
  const data = options.config || loadComponentConfig(name, root, options.demo === true);
  const defaults = loadJson(path.join(ROOT, 'components', name, 'defaults.json'));
  const config = mergeSettings(defaults, data);
  if (name === 'contribution' && !config.username && options.username) config.username = options.username;
  validateComponentData(name, config);
  if (options.common !== undefined) throw new Error('Custom theme paths are unsupported; use the fixed theme config paths');
  if (Object.hasOwn(config, 'shared')) throw new Error('Move shared overrides to the fixed theme config paths');
  const common = loadThemeSettings(root, name, options.theme);
  return { root, sourceRoot: ROOT, demo: options.demo === true, config, common };
}

export function actionOptions(env = process.env) {
  if (!Object.hasOwn(env, 'INPUT_CONFIG') && !Object.hasOwn(env, 'INPUT_DEMO')) return null;
  if (env.INPUT_CONFIG?.trim()) throw new Error('The config input was removed; use .github/readme/components/<component>.json');
  if (env.INPUT_COMMON?.trim()) throw new Error('The common input was removed; use the fixed theme config paths');
  const demoValue = env.INPUT_DEMO || 'false';
  if (!['true', 'false'].includes(demoValue)) throw new Error('Action input demo must be true or false');
  const demo = demoValue === 'true';
  if (!env.GITHUB_WORKSPACE) throw new Error('GITHUB_WORKSPACE is required for an Action');
  const root = path.resolve(env.GITHUB_WORKSPACE);
  return { root, demo, theme: env.INPUT_THEME?.trim() || 'monochrome' };
}

export async function writeAssets(assets, root = ROOT, { appearance = 'auto' } = {}) {
  for (const asset of appearanceAssets(assets, appearance)) {
    const destination = path.resolve(root, asset.path);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, asset.svg);
  }
}

export function isMain(url) {
  return process.argv[1] && fileURLToPath(url) === path.resolve(process.argv[1]);
}

export async function runComponent(name, render) {
  const options = actionOptions() || cliOptions();
  const created = await initializeComponentConfig(name, options);
  if (created && !options.demo) {
    console.log(`${name}: rendering skipped while the new config awaits your content.`);
    return { assets: [] };
  }
  const ctx = context(name, options);
  const result = await render(ctx);
  await writeAssets(result.assets, ctx.root, { appearance: ctx.common.appearance });
  console.log(`${name}: ${result.assets.length} assets`);
}
