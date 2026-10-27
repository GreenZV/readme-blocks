import { escapeXml } from './config.mjs';

export function componentStyle(common, { sizes = {}, fontFamily } = {}) {
  const fonts = { ...common.typography.sizes, ...sizes };
  const rules = (theme, dark) => {
    const color = common.themes[theme];
    return `
  .title { fill: ${color.title};${dark ? '' : ` font-size: ${fonts.title}px;`} }
  .body { fill: ${color.body};${dark ? '' : ` font-size: ${fonts.body}px;`} }
  .muted { fill: ${color.muted};${dark ? '' : ` font-size: ${fonts.muted}px;`} }
  .tool { fill: ${color.title};${dark ? '' : ` font-size: ${fonts.tool}px;`} }
  .category { fill: ${color.muted};${dark ? '' : ` font-size: ${fonts.category}px;`} }
  .label { fill: ${color.body};${dark ? '' : ` font-size: ${fonts.label}px;`} }
  .notes { fill: ${color.muted};${dark ? '' : ` font-size: ${fonts.notes}px;`} }
  .logo { fill: ${color.logo}; }
  .border, .divider { stroke: ${color.border}; }`;
  };
  return `<style>
  text { font-family: ${escapeXml(fontFamily || common.typography.fontFamily)}; }
${rules('light', false)}
  @media (prefers-color-scheme: dark) {${rules('dark', true)}
  }
</style>`;
}

