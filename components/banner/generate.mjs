import { isMain, runComponent, escapeXml } from '../../scripts/lib/config.mjs';

function buildTimeline(characterCount, animation) {
  const { initialDelayMs, characterMs, holdAfterTypingMs, blinkCount, blinkMs, resetMs } = animation;
  const lastCharacterTime = initialDelayMs + (characterCount - 1) * characterMs;
  const blinkStart = lastCharacterTime + holdAfterTypingMs;
  const total = blinkStart + blinkCount * 2 * blinkMs + blinkMs + resetMs;
  const frames = [{ time: 0, count: 0 }];

  for (let index = 1; index <= characterCount; index++) {
    frames.push({ time: initialDelayMs + (index - 1) * characterMs, count: index });
  }
  const resetTime = total - resetMs;
  frames.push({ time: resetTime, count: 0 }, { time: total, count: 0 });

  const blink = [{ time: 0, value: 1 }];
  for (let index = 0; index < blinkCount * 2 + 1; index++) {
    blink.push({ time: blinkStart + index * blinkMs, value: index % 2 });
  }
  blink.push({ time: total, value: 0 });

  return { total, frames, blink };
}

function renderLettering(characters, x, layout, fontFamily) {
  const { advance, baseline, fontSize } = layout;
  const positions = characters.map((_, index) => x + index * advance).join(' ');
  return `<text x="${positions}" y="${baseline}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="400" style="font-variant-ligatures:none" xml:space="preserve">${escapeXml(characters.join(''))}</text>`;
}

function bannerPalette(colors) {
  return `.banner-prompt { fill: ${colors.bannerPrompt}; } .banner-text { fill: ${colors.bannerText}; } .banner-cursor { fill: ${colors.bannerCursor}; }`;
}

export function render({ config, common }) {
  const { width, height, advance, cursorY, cursorHeight } = config.layout;
  const characters = [...config.text];
  const promptCharacters = [...config.prompt];
  if (!characters.length) throw new Error('Banner text must not be empty');

  const textWidth = characters.length * advance;
  const prefixWidth = (promptCharacters.length + 1) * advance;
  const left = (width - prefixWidth - textWidth - advance) / 2;
  const start = left + prefixWidth;
  if (left < 0) throw new Error('Banner text does not fit the configured width');

  const { total, frames, blink } = buildTimeline(characters.length, config.animation);
  const keyTimes = frames.map(frame => frame.time / total).join(';');
  const lettering = (chars, x) => renderLettering(chars, x, config.layout, common.typography.fontFamily);
  const animated = common.motion.enabled;
  const animate = animated ? `<animate attributeName="width" dur="${total / 1000}s" repeatCount="indefinite" calcMode="discrete" values="${frames.map(f => f.count * advance).join(';')}" keyTimes="${keyTimes}"/>` : '';
  const cursorAnimations = animated ? `<animate attributeName="x" dur="${total / 1000}s" repeatCount="indefinite" calcMode="discrete" values="${frames.map(f => start + f.count * advance).join(';')}" keyTimes="${keyTimes}"/>
<animate attributeName="opacity" dur="${total / 1000}s" repeatCount="indefinite" calcMode="discrete" values="${blink.map(f => f.value).join(';')}" keyTimes="${blink.map(f => f.time / total).join(';')}"/>` : '';
  const cursor = animation => `<rect x="${start + textWidth}" y="${cursorY}" width="${advance}" height="${cursorHeight}" class="banner-cursor">${animation}</rect>`;
  const reducedMotion = common.motion.respectReducedMotion ? '@media (prefers-reduced-motion: reduce) { .motion { display: none; } .still { display: inline; } }' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${escapeXml(config.text)} — ${escapeXml(common.typography.fontFamily)}</title>
<desc id="description">${escapeXml(config.text)} types in green on a transparent background, followed by a blinking cursor.</desc>
<style>.still { display: none; } ${bannerPalette(common.themes.light)} @media (prefers-color-scheme: dark) { ${bannerPalette(common.themes.dark)} } ${reducedMotion}</style>
<defs><g id="word">${lettering(characters, start)}</g><clipPath id="typing"><rect x="${start}" y="0" width="${textWidth}" height="${height}">${animate}</rect></clipPath></defs>
<g class="banner-prompt">${lettering(promptCharacters, left)}</g>
<g class="motion"><use href="#word" class="banner-text" clip-path="url(#typing)"/>${cursor(cursorAnimations)}</g>
<g class="still"><use href="#word" class="banner-text"/>${cursor('')}</g>
</svg>\n`;
  return { assets: [{ path: config.output, svg }] };
}

if (isMain(import.meta.url)) await runComponent('banner', render);
