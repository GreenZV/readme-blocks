import fs from 'node:fs/promises';
import path from 'node:path';

const remoteIcons = new Map();
const MAX_BYTES = 512 * 1024;
const MAX_REQUESTS = 6;
let activeRequests = 0;
const waiting = [];

async function withRequestSlot(request) {
  if (activeRequests >= MAX_REQUESTS) await new Promise(resolve => waiting.push(resolve));
  else activeRequests++;
  try { return await request(); }
  finally {
    const next = waiting.shift();
    if (next) next();
    else activeRequests--;
  }
}

async function downloadIcon(url) {
  return withRequestSlot(async () => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'image/svg+xml', 'User-Agent': 'readme-blocks' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('SVG exceeds 512 KiB');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) throw new Error('SVG exceeds 512 KiB');
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel();
      throw error;
    } finally {
      reader.releaseLock();
    }
    return Buffer.concat(chunks).toString('utf8');
  });
}

function svgImage(source) {
  const opening = source.match(/<svg\b[^>]*>/i)?.[0];
  const viewBox = opening?.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]
    .trim().split(/[\s,]+/).map(Number);
  if (!opening || !/<\/svg\s*>/i.test(source) || viewBox?.length !== 4
      || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    throw new Error('Expected an SVG with a valid viewBox');
  }
  if (!/\bxmlns\s*=/.test(opening)) {
    source = source.replace(opening, opening.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"'));
  }
  return { dataUri: `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}` };
}

// SVGs are loaded at build time. A finished README image never needs a remote request.
export async function loadIcon(source, { root }) {
  if (source === undefined) return null;
  if (typeof source !== 'string' || !source.trim()) throw new Error('icon must be a non-empty SVG path or HTTPS URL');
  try {
    if (/^https:\/\//i.test(source)) {
      const url = new URL(source);
      if (url.username || url.password) throw new Error('Icon URLs must not contain credentials');
      const key = url.href;
      if (!remoteIcons.has(key)) {
        const request = downloadIcon(key).then(svgImage);
        remoteIcons.set(key, request);
        request.catch(() => remoteIcons.delete(key));
      }
      return await remoteIcons.get(key);
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(source)) throw new Error('Remote icons require HTTPS');
    const relative = path.relative(path.resolve(root), path.resolve(root, source));
    if (path.isAbsolute(source) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
      throw new Error('Icon paths must be relative to the caller repository');
    }
    const contents = await fs.readFile(path.resolve(root, source));
    if (contents.byteLength > MAX_BYTES) throw new Error('SVG exceeds 512 KiB');
    return svgImage(contents.toString('utf8'));
  } catch (error) {
    throw new Error(`Cannot load icon ${source}: ${error.message}`, { cause: error });
  }
}

export function validateIconStyle(style) {
  if (!['original', 'monochrome'].includes(style)) throw new Error('iconStyle must be original or monochrome');
}

export function iconMarkup(icon, { id, x, y, size, style = 'original' }) {
  if (!icon) return '';
  validateIconStyle(style);
  const image = `<image width="${size}" height="${size}" href="${icon.dataUri}" preserveAspectRatio="xMidYMid meet"/>`;
  const content = style === 'original' ? image
    : `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${size}" height="${size}" style="mask-type:alpha">${image}</mask></defs><rect width="${size}" height="${size}" class="logo" mask="url(#${id})"/>`;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${content}</svg>`;
}
