const APPEARANCES = ['auto', 'light', 'dark'];

export function validateAppearance(appearance) {
  if (!APPEARANCES.includes(appearance)) {
    throw new Error('appearance must be auto, light or dark');
  }
  return appearance;
}

export function appearancePath(filename, appearance) {
  if (!['light', 'dark'].includes(appearance)) throw new Error('Appearance must be light or dark');
  if (!/\.svg$/i.test(filename)) throw new Error(`SVG output path must end in .svg: ${filename}`);
  return filename.replace(/\.svg$/i, `.${appearance}.svg`);
}

export function forceAppearance(svg, appearance) {
  if (!['light', 'dark'].includes(appearance)) throw new Error('Appearance must be light or dark');
  return svg.replace(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g,
    `@media ${appearance === 'dark' ? 'all' : 'not all'}`);
}

// Derive appearances from one render. Fixed mode keeps existing picture markup working:
// every filename contains the selected appearance, whichever source the browser chooses.
export function appearanceAssets(assets, appearance = 'auto') {
  validateAppearance(appearance);
  const expanded = assets.flatMap(asset => {
    const svg = appearance === 'auto' ? asset.svg : forceAppearance(asset.svg, appearance);
    return [{ ...asset, svg }, ...['light', 'dark'].map(variant => ({
      ...asset,
      path: appearancePath(asset.path, variant),
      svg: appearance === 'auto' ? forceAppearance(asset.svg, variant) : svg,
    }))];
  });
  const paths = new Set();
  for (const asset of expanded) {
    if (paths.has(asset.path)) throw new Error(`Duplicate SVG output path: ${asset.path}`);
    paths.add(asset.path);
  }
  return expanded;
}
