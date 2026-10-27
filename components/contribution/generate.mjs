import path from 'node:path';
import { actionOptions, context, escapeXml, initializeComponentConfig, isMain, loadShared, writeAssets } from '../../scripts/lib/config.mjs';

const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const iso = time => new Date(time).toISOString().slice(0, 10);
function dateTime(value) {
  const time = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
  if (!Number.isFinite(time) || iso(time) !== value) throw new Error(`Invalid calendar date: ${value}`);
  return time;
}
function yearRange(asOf) {
  dateTime(asOf);
  const year = Number(asOf.slice(0, 4));
  return { year, start: dateTime(`${asOf.slice(0, 4)}-01-01`), end: dateTime(`${asOf.slice(0, 4)}-12-31`) };
}
function validateUsername(username) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(username)) throw new Error('Invalid GitHub username');
}
function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) => {
    if (key[0] !== '#') return named[key.toLowerCase()];
    const point = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  });
}

// Parse calendar cells and tooltip text without a DOM, browser, or third-party parser.
export function parseDays(html, asOf) {
  const cells = new Map();
  const counts = new Map();
  let tooltip = null;
  let buffer = '';
  const tokens = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<(\/?)([a-z][\w-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>|([^<]+)/gi;
  for (const token of html.matchAll(tokens)) {
    if (token[4] !== undefined) {
      if (tooltip) buffer += decodeEntities(token[4]);
      continue;
    }
    if (!token[2]) continue;
    const tag = token[2].toLowerCase();
    if (token[1]) {
      if (tag === 'tool-tip' && tooltip) {
        const text = buffer.trim();
        const match = text.match(/^([\d,]+) contributions?\b/);
        if (match && /^\d+(?:,\d{3})*$/.test(match[1])) {
          counts.set(tooltip, Number(match[1].replaceAll(',', '')));
        } else if (text.startsWith('No contributions')) {
          counts.set(tooltip, 0);
        }
        tooltip = null;
        buffer = '';
      }
      continue;
    }
    const attrs = Object.fromEntries([...token[3].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .map(([, name, double, single, bare]) => [name.toLowerCase(), decodeEntities(double ?? single ?? bare ?? '')]));
    if (attrs['data-date'] && attrs['data-level'] !== undefined) {
      const level = /^[0-4]$/.test(attrs['data-level']) ? Number(attrs['data-level']) : NaN;
      cells.set(attrs['data-date'], { id: attrs.id, level });
    }
    if (tag === 'tool-tip') {
      tooltip = attrs.for;
      buffer = '';
    }
  }
  const days = [];
  const { start } = yearRange(asOf);
  const until = dateTime(asOf);
  for (let time = start; time <= until; time += DAY) {
    const day = iso(time);
    const cell = cells.get(day);
    if (!cell) throw new Error(`GitHub calendar is missing ${day}; keeping the existing SVG.`);
    const count = counts.get(cell.id);
    if (!Number.isInteger(cell.level) || cell.level < 0 || cell.level > 4 || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`Unreadable contribution data for ${day}; keeping the existing SVG.`);
    }
    days.push([day, cell.level, count]);
  }
  return days;
}

export function randomDays(asOf, seed = 42) {
  if (!Number.isSafeInteger(seed)) throw new Error('Demo seed must be an integer');
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const ranges = [[0, 0], [1, 2], [3, 5], [6, 9], [10, 16]];
  const days = [], { start, end } = yearRange(asOf);
  for (let time = start; time <= end; time += DAY) {
    const weight = random() * 100;
    const level = [26, 44, 66, 84, 100].findIndex(limit => weight < limit);
    const [min, max] = ranges[level];
    days.push([iso(time), level, min + Math.floor(random() * (max - min + 1))]);
  }
  return days;
}

export function contributionStats(days) {
  let total = 0;
  let active = 0;
  let longest = 0;
  let streak = 0;
  let previous;
  const sortedDays = [...days].sort(([left], [right]) => left.localeCompare(right));

  for (const [day, , count] of sortedDays) {
    const time = dateTime(day);
    total += count;
    if (count > 0) {
      active++;
      streak = previous === time - DAY ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
    previous = time;
  }
  return { total, active, longest };
}

function renderCalendarStyle(config, common, layout) {
  const { weeks, scanEnd, xStart } = layout;
  const fonts = common.typography.sizes;
  const { light, dark } = common.themes;
  const animation = common.motion.enabled ? `reveal ${config.animation.durationSeconds}s steps(${weeks}, end) ${config.animation.delaySeconds}s both` : 'none';
  const motionRule = common.motion.respectReducedMotion ? '@media (prefers-reduced-motion: reduce) { .reveal-window { animation: none; } }' : '';
  return `<style>
    text { font-family: ${escapeXml(common.typography.calendarFontFamily)}; }
    .muted { fill: ${light.muted}; font-size: ${fonts.muted}px; }
    .heading { fill: ${light.title}; font-size: ${fonts.title}px; }
    .stat { fill: ${light.stat}; }
    .summary { fill: ${light.muted}; font-size: ${fonts.notes}px; }
    .border, .divider { stroke: ${light.border}; }
    .today { fill: ${light.todayBackground}; }
    .reveal-window { animation: ${animation}; }
    @keyframes reveal { from { width: 0; } to { width: ${(scanEnd - xStart + 14).toFixed(2)}px; } }
    .cell { font-size: ${fonts.cell}px; text-anchor: middle; }
    .l0 { fill: ${light.activity[0]}; } .l1 { fill: ${light.activity[1]}; } .l2 { fill: ${light.activity[2]}; }
    .l3 { fill: ${light.activity[3]}; } .l4 { fill: ${light.activity[4]}; }
    .today-cell { fill: ${light.todayText}; font-weight: 700; }
    @media (prefers-color-scheme: dark) {
      .muted, .summary { fill: ${dark.muted}; }
      .heading { fill: ${dark.title}; } .stat { fill: ${dark.stat}; } .today { fill: ${dark.todayBackground}; }
      .border, .divider { stroke: ${dark.border}; }
      .l0 { fill: ${dark.activity[0]}; } .l1 { fill: ${dark.activity[1]}; } .l2 { fill: ${dark.activity[2]}; }
      .l3 { fill: ${dark.activity[3]}; } .l4 { fill: ${dark.activity[4]}; }
      .today-cell { fill: ${dark.todayText}; }
    }
    ${motionRule}
  </style>`;
}

function renderMonthLabels({ year, start, offset, xStart, step }) {
  const svg = [];
  for (let month = 0; month < 12; month++) {
    const first = Date.UTC(year, month, 1);
    const last = Date.UTC(year, month + 1, 0);
    const firstColumn = Math.floor(((first - start) / DAY + offset) / 7);
    const lastColumn = Math.floor(((last - start) / DAY + offset) / 7);
    // Include the boundary weeks shared with adjacent months when centering labels.
    const x = xStart + (firstColumn + lastColumn) / 2 * step;
    svg.push(`<text x="${x.toFixed(2)}" y="67" class="muted" text-anchor="middle">${MONTHS[month]}</text>`);
  }
  return svg;
}

function renderCalendarCells(days, asOf, symbols, layout) {
  const { start, offset, xStart, yStart, step } = layout;
  const svg = [];
  for (const [day, level, count] of days) {
    const position = (dateTime(day) - start) / DAY + offset;
    const column = Math.floor(position / 7);
    const row = position % 7;
    const x = xStart + column * step;
    const y = yStart + row * 16;
    const title = `${day}: ${count} contribution${count === 1 ? '' : 's'}`;
    if (day === asOf) {
      svg.push(`<rect x="${(x - 6.5).toFixed(2)}" y="${y - 12}" width="13" height="16" rx="3" class="today"><title>Today: ${day}</title></rect>`);
    }
    svg.push(`<text x="${x.toFixed(2)}" y="${y}" class="cell l${level}${day === asOf ? ' today-cell' : ''}"><title>${title}</title>${escapeXml(symbols[level])}</text>`);
  }
  return svg;
}

function renderCalendarSummary(stats, summary, symbols, statsStyle, layout) {
  const { total, active, longest } = stats;
  const { width, padding, footerY } = layout;
  const svg = [];
  if (statsStyle === 'large') {
    svg.push(`<path d="M${(padding + (width - 2 * padding) / 3).toFixed(2)} 218V260 M${(padding + 2 * (width - 2 * padding) / 3).toFixed(2)} 218V260 M${padding} 270H${width - padding}" class="divider"/>`);
  }
  const rounded = number => Math.round(number * 100) / 100;
  const statPosition = number => Number.isInteger(number) ? number.toFixed(1) : String(number);
  const statItems = [
    [rounded(padding + (width - 2 * padding) / 6), 'total', total.toLocaleString('en-US')],
    [width / 2, 'active days', String(active)],
    [rounded(width - padding - (width - 2 * padding) / 6), 'longest streak', `${longest}d`],
  ];
  for (const [x, label, value] of statItems) {
    if (statsStyle === 'compact') {
      svg.push(`<text x="${statPosition(x)}" y="232" text-anchor="middle" class="summary">${label}: <tspan class="stat">${value}</tspan></text>`);
    } else {
      svg.push(`<text x="${statPosition(x)}" y="227" text-anchor="middle" class="muted">${label}</text>`, `<text x="${statPosition(x)}" y="253" text-anchor="middle" class="stat" font-size="20" font-weight="600">${value}</text>`);
    }
  }
  if (statsStyle === 'compact') {
    const separators = [
      rounded(padding + (width - 2 * padding) / 3),
      rounded(padding + 2 * (width - 2 * padding) / 3),
    ];
    for (const x of separators) {
      svg.push(`<text x="${statPosition(x)}" y="232" text-anchor="middle" class="summary">|</text>`);
    }
  }
  svg.push(`<text x="${padding}" y="${footerY}" class="muted">${summary}</text>`, `<text x="${width - 222}" y="${footerY}" class="muted">less</text>`);
  symbols.forEach((symbol, level) => svg.push(`<text x="${width - 168 + level * 19}" y="${footerY}" class="cell l${level}">${escapeXml(symbol)}</text>`));
  svg.push(`<text x="${width - 60}" y="${footerY}" class="muted">more</text>`);
  return svg;
}

export function renderCalendar(username, days, asOf, {
  demo = false,
  statsStyle = 'compact',
  config = context('contribution', { demo: true }).config,
  common = loadShared(),
} = {}) {
  if (!['compact', 'large'].includes(statsStyle)) throw new Error('Unknown statistics style');
  const { width, padding, radius } = common.layout;
  const { year, start, end } = yearRange(asOf);
  const offset = new Date(start).getUTCDay();
  const weeks = Math.ceil(((end - start) / DAY + 1 + offset) / 7);
  const step = Math.min(14.5, (width - 104) / weeks);
  const xStart = 74;
  const yStart = 91;
  const scanEnd = xStart + weeks * step;
  const stats = contributionStats(days);
  const { total, active, longest } = stats;
  const description = demo ? `Randomly generated sample activity for ${year}, not actual GitHub contributions. `
    : `${total} contribution${total === 1 ? '' : 's'} on ${active} active day${active === 1 ? '' : 's'} in ${year}, through ${asOf}. `;
  const summary = demo ? `${days.length} sample days / not GitHub activity` : `updated ${asOf}`;
  const height = statsStyle === 'compact' ? 280 : 310;
  const footerY = height - 18;
  const layout = { width, padding, year, start, offset, weeks, step, xStart, yStart, scanEnd, footerY };
  const symbols = [...config.symbols];
  if (symbols.length !== 5) throw new Error('Contribution symbols must contain five characters');
  if (!Array.isArray(config.weekdayLabels) || config.weekdayLabels.length !== 7) throw new Error('Calendar needs seven weekday labels');
  const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
  viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(username)} — ASCII contribution calendar${demo ? ' (random demo)' : ''}</title>
  <desc id="desc">${description}Longest streak: ${longest} day${longest === 1 ? '' : 's'}. Each character represents one day. The calendar appears from left to right; ${asOf} has a background highlight.</desc>
  ${renderCalendarStyle(config, common, layout)}
  <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" class="border"/>
  <text x="${padding}" y="31" class="heading">$ contributions --year ${year}${demo ? ' --demo' : ''}</text>
  <text x="${width - padding}" y="31" text-anchor="end" class="muted">${demo ? 'SAMPLE DATA' : `@${escapeXml(username)}`}</text>
  <path d="M${padding} 46H${width - padding}" class="divider"/>
  <defs><clipPath id="calendar"><rect class="reveal-window" x="${xStart - 7}" y="77" width="${(scanEnd - xStart + 14).toFixed(2)}" height="117"/></clipPath></defs>`];
  svg.push(...renderMonthLabels(layout));
  config.weekdayLabels.forEach((label, row) => svg.push(`<text x="${padding}" y="${yStart + row * 16}" class="muted">${escapeXml(label)}</text>`));
  svg.push('<g clip-path="url(#calendar)">');
  svg.push(...renderCalendarCells(days, asOf, symbols, layout));
  svg.push('</g>', `<path d="M${padding} 207H${width - padding}" class="divider"/>`);
  svg.push(...renderCalendarSummary(stats, summary, symbols, statsStyle, layout));
  svg.push('</svg>\n');
  return svg.join('\n');
}

// Fetch once per normal render, then reuse the data for every configured output.
// Network access is injected in tests; production never reads a saved calendar.
export async function render(ctx, fetcher = globalThis.fetch, options = {}) {
  const { config, common, demo } = ctx;
  if (config.snapshot !== undefined || config.demoSnapshot !== undefined || config.outputs?.some(output => output.source !== undefined)) {
    throw new Error('Saved calendars are unsupported; remove snapshot settings and output source fields');
  }
  const username = options.username || config.username;
  validateUsername(username);
  const asOf = demo ? config.demoDate : options.date || new Date().toISOString().slice(0, 10);
  dateTime(asOf);
  const outputs = options.output
    ? [{ path: options.output, statsStyle: options.statsStyle || 'compact' }]
    : config.outputs.map(output => ({ ...output, statsStyle: options.statsStyle || output.statsStyle }));
  if (!outputs.length || outputs.some(output => !output.path || !['compact', 'large'].includes(output.statsStyle))) {
    throw new Error('Contribution outputs need a path and a compact or large statistics style');
  }
  const days = demo
    ? randomDays(asOf, config.demoSeed)
    : parseDays(await fetchCalendarHtml(username, asOf, config.fetch, fetcher), asOf);
  const assets = outputs.map(output => ({
    path: output.path,
    svg: renderCalendar(username, days, asOf, { demo, statsStyle: output.statsStyle, config, common }),
  }));
  return { assets };
}

export function contributionOptions(argv = process.argv.slice(2)) {
  const options = {};
  const values = new Map([
    ['--root', 'root'], ['--username', 'username'], ['--date', 'date'],
    ['--output', 'output'], ['--stats-style', 'statsStyle'], ['--theme', 'theme'],
  ]);
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index];
    const next = argv[index + 1];
    if (name === '--demo') options.demo = true;
    else if (values.has(name) && next !== undefined && !next.startsWith('--')) options[values.get(name)] = argv[++index];
    else throw new Error(`Unknown or incomplete contribution option: ${name}`);
  }
  if (options.root) options.root = path.resolve(options.root);
  return options;
}

async function fetchCalendarHtml(username, asOf, config, fetcher) {
  const url = new URL(`https://github.com/users/${username}/contributions`);
  url.searchParams.set('from', `${asOf.slice(0, 4)}-01-01`);
  url.searchParams.set('to', asOf);
  const response = await fetcher(url, {
    headers: { 'User-Agent': config.userAgent, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(config.timeoutSeconds * 1000),
  });
  if (!response.ok) throw new Error(`GitHub calendar request failed: HTTP ${response.status}`);
  return response.text();
}

export async function generate(options = contributionOptions(), fetcher = globalThis.fetch) {
  if (['fetch', 'html', 'random', 'all', 'seed'].some(key => options[key] !== undefined)) {
    throw new Error('Normal contribution builds always fetch GitHub activity; use demo mode for sample data');
  }
  if (options.demo && ['username', 'date', 'output', 'statsStyle'].some(key => options[key] !== undefined)) {
    throw new Error('--demo uses packaged data and output settings');
  }
  const created = await initializeComponentConfig('contribution', options);
  if (created && !options.demo) {
    console.log('contribution: rendering skipped while the new config awaits your content.');
    return { assets: [] };
  }
  const ctx = context('contribution', options);
  const result = await render(ctx, fetcher, options);
  await writeAssets(result.assets, ctx.root, { appearance: ctx.common.appearance });
  console.log(`contribution: ${result.assets.length}${ctx.demo ? ' demo' : ''} assets`);
  return result;
}

if (isMain(import.meta.url)) {
  try {
    if (process.env.INPUT_FETCH?.trim()) throw new Error('The fetch input was removed; normal contribution builds always fetch GitHub activity');
    const options = actionOptions();
    if (options && !options.demo && process.env.INPUT_USERNAME?.trim()) options.username = process.env.INPUT_USERNAME.trim();
    await generate(options || contributionOptions());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
