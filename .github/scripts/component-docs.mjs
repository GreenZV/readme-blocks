// Repository documentation source. Consumer component Actions never import this module.
import { appearancePath } from '../../scripts/lib/appearance.mjs';
import { mergeSettings } from '../../scripts/lib/config.mjs';

const guides = {
  banner: {
    description: 'An animated terminal heading with a static reduced-motion fallback.',
    fields: [
      ['text', 'Required terminal text.'],
      ['prompt', 'Optional prefix; defaults to `>`.'],
      ['animation', 'Typing delays, character speed, cursor blinking and reset timing, in milliseconds.'],
      ['layout', 'Canvas size, font size, character advance and cursor positioning.'],
      ['output', 'SVG output path; defaults to `assets/banner.svg`.'],
    ],
    example: { animation: { characterMs: 80, blinkCount: 2 } },
    notes: ['Use the global motion settings to disable animation or respect reduced-motion preferences. The SVG uses the shared monospace font chain; no font installation is required on the runner.'],
    colorRole: 'bannerText',
  },
  now: {
    description: 'Current focus, direction, and development stages in a compact terminal panel.',
    fields: [
      ['focus', 'Required description of your current focus.'],
      ['direction', 'Optional supporting sentence.'],
      ['steps', 'Optional ordered list of workflow stages.'],
      ['command / eyebrow', 'Terminal command and small header caption.'],
      ['height / output', 'Panel height and SVG output path.'],
    ],
    example: { direction: 'Taking services from implementation to deployment.', steps: ['build', 'test', 'deploy', 'observe'] },
    notes: ['Place the image below your introduction or in a separate section; the component does not create README headings.'],
    colorRole: 'title',
  },
  contribution: {
    description: 'An ASCII activity calendar with weekday labels, monthly labels, statistics, and a static today highlight.',
    fields: [
      ['username', 'Required GitHub account. The optional Action `username` input overrides this value.'],
      ['symbols', 'Exactly five characters, ordered from no activity to the highest activity.'],
      ['weekdayLabels', 'Exactly seven labels in Sunday-first order.'],
      ['outputs', 'List of SVG outputs; each entry needs `path` and `statsStyle` (`compact` or `large`).'],
      ['animation', 'Reveal duration and delay, in seconds.'],
      ['fetch', 'HTTP `timeoutSeconds` and `userAgent`; normal builds always fetch live data.'],
    ],
    example: { outputs: [{ path: 'assets/contributions.svg', statsStyle: 'large' }], animation: { durationSeconds: 1.8 } },
    notes: [
      'With an existing config, normal mode fetches current public GitHub activity on every build. No activity JSON is saved or required. HTTP, network or parsing errors fail the build before replacing the existing calendar SVG.',
      'All configured outputs reuse one request. Demo mode uses a fixed seeded sample calendar without a network request. There is no `fetch` workflow input or saved-calendar mode.',
      'The activity scale uses the shared `activity` array of five colors. `todayBackground` and `todayText` control the static current-day highlight.',
    ],
    colorRole: 'stat',
  },
  projects: {
    description: 'Individual project cards with descriptions, stack labels, and configurable lifecycle statuses. Links belong in your README.',
    fields: [
      ['items', 'Project list. Use an empty array or `{}` to generate no cards.'],
      ['items[].slug / title', 'Required unique lowercase slug and project title. The slug determines the SVG filename.'],
      ['items[].description / stack', 'Optional description and list of technology labels.'],
      ['items[].status', 'Optional ID from `statuses`; omit it or use `null` to hide the status.'],
      ['items[].showLinkHint', 'Optional `view project ->` footer. It does not create a hyperlink.'],
      ['statuses', 'Status definitions with a `label` and a palette `tone`.'],
      ['layout / outputDirectory', 'Card dimensions, text limits and the output folder.'],
    ],
    example: { statuses: { 'in-development': { label: 'Building' } } },
    notes: [
      'Built-in status IDs are `planned`, `in-development`, `completed`, `maintained`, `on-hold`, `experimental` and `archived`. Statuses are configured manually and are independent of CI/CD.',
      'Available tones are `title`, `body`, `muted`, `success` and `pending`. Override one label to retain its default tone, or add a new status with both fields. The dot uses the tone; the status text stays neutral.',
      'There is no fixed card-count limit. Add each generated card and its repository link to README manually. Remove obsolete SVGs and README entries when removing projects.',
    ],
    colorRole: 'title',
  },
  stack: {
    description: 'Grouped technologies, logos, and notes for your current development stack.',
    fields: [
      ['groups', 'Required non-empty list of technology groups.'],
      ['groups[].label', 'Category name above the technology row.'],
      ['groups[].items', 'Objects with required `label` and optional `icon` (caller-relative SVG path or HTTPS URL).'],
      ['groups[].notes', 'Optional string or array of strings below a group.'],
      ['title', 'Accessible SVG title.'],
      ['iconStyle / groups[].items[].iconStyle', '`original` preserves SVG colors (default); `monochrome` uses the theme logo color. An item can override the component setting.'],
      ['layout / output', 'Row width, icon spacing, dividers, note wrapping and SVG output path.'],
    ],
    example: { layout: { itemGap: 20 } },
    notes: ['Groups and rows are centered. The library bundles no logo files. Omit `icon` for a text-only item; explicit missing or invalid sources fail the build. HTTPS SVGs are downloaded at build time and embedded in the generated image. See [icon configuration](../../docs/configuration.md#icons).'],
    colorRole: 'logo',
  },
  experience: {
    description: 'Additional development stacks with grouped logos, libraries, and notes.',
    fields: [
      ['groups', 'Required non-empty list of additional stacks.'],
      ['groups[].label', 'Stack or experience category name.'],
      ['groups[].items', 'Objects with required `label` and optional `icon` (caller-relative SVG path or HTTPS URL).'],
      ['groups[].notes', 'Optional string or array of strings for libraries, tools or supporting experience.'],
      ['title', 'Accessible SVG title.'],
      ['iconStyle / groups[].items[].iconStyle', '`original` preserves SVG colors (default); `monochrome` uses the theme logo color. An item can override the component setting.'],
      ['layout / output', 'Row spacing, note wrapping and SVG output path.'],
    ],
    example: { layout: { noteMaxChars: 90, itemGap: 24 } },
    notes: ['This component uses the same object-based icon format as stack. See [icon configuration](../../docs/configuration.md#icons). An array of notes preserves intentional line breaks before wrapping. Put the image inside a Markdown/HTML `details` block when you want expandable experience.'],
    colorRole: 'logo',
  },
  toolbox: {
    description: 'Compact rows for development tools, platforms, and everyday software.',
    fields: [
      ['rows', 'Required non-empty array of rows: `["Category", "Description", "Tools", "Optional detail"]`.'],
      ['title', 'Accessible SVG title.'],
      ['command / eyebrow', 'Visible terminal command and small header caption.'],
      ['layout.rowHeight', 'Vertical spacing allocated to each row.'],
      ['layout.toolsX', 'Horizontal start of the right-hand tools column.'],
      ['output', 'SVG output path.'],
    ],
    example: { command: '$ toolbox', eyebrow: 'DAILY TOOLS', layout: { rowHeight: 80 } },
    notes: ['The left column describes a skill or category; the right column lists its tools and optional detail. This is a text component rather than a logo grid.'],
    colorRole: 'title',
  },
  'more-technologies': {
    description: 'Text cards grouping additional technologies, software, and skills.',
    fields: [
      ['groups', 'Required non-empty list of categories.'],
      ['groups[].label', 'Card heading.'],
      ['groups[].items', 'List of plain technology or software names, displayed as text.'],
      ['title', 'Accessible SVG title.'],
      ['layout.columns / gap / textPadding', 'Column count, spacing between cards and inner text padding.'],
      ['output', 'SVG output path.'],
    ],
    example: { layout: { columns: 1, gap: 20 } },
    notes: ['Items wrap within each card. Use stack or experience for logo rows; this component displays plain names. A final row containing one card spans the full component width.'],
    colorRole: 'title',
  },
  contact: {
    description: 'Individual contact badges. Wrap each image in a README link to your actual account.',
    fields: [
      ['groups', 'Contact groups; an empty list or `{}` generates no badges.'],
      ['groups[].label', 'Required group identifier. Visible group headings belong in README.'],
      ['groups[].items[].slug', 'Required unique lowercase SVG filename; independent of the icon source.'],
      ['groups[].items[].label', 'Required visible badge text.'],
      ['groups[].items[].icon', 'Optional caller-relative SVG path or HTTPS URL; omit for a text-only badge.'],
      ['iconStyle / groups[].items[].iconStyle', '`original` preserves SVG colors (default); `monochrome` uses the theme logo color. An item can override the component setting.'],
      ['layout.minWidth / height / iconSize', 'Badge size and icon dimensions.'],
      ['outputDirectory', 'Folder for generated badge SVGs.'],
    ],
    example: { layout: { minWidth: 176 } },
    notes: [
      'The slug controls only the filename. No built-in logo lookup is performed. SVG paths resolve in your repository; HTTPS URLs are downloaded and embedded during the build. See [icon configuration](../../docs/configuration.md#icons).',
      'URLs and email addresses belong in README hyperlinks, not in the badge config. Every badge remains individually clickable and can wrap naturally in a centered HTML paragraph.',
    ],
    colorRole: 'logo',
  },
};

function picture(image) {
  const source = image.match(/src="([^"]+)"/)[1];
  return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${appearancePath(source, 'dark')}">\n  <source media="(prefers-color-scheme: light)" srcset="${appearancePath(source, 'light')}">\n  ${image}\n</picture>`;
}

export function componentPage(name, minimal, output, gallery) {
  const guide = guides[name];
  if (!guide) {
    throw new Error(`Missing documentation for component "${name}"; add its guide in .github/scripts/component-docs.mjs (see docs/adding-components.md)`);
  }
  const dataPath = `.github/readme/components/${name}.json`;
  const themePath = `.github/readme/themes/${name}.json`;
  let image = name === 'projects'
    ? '<a href="https://github.com/OWNER/REPOSITORY">\n  <img src="assets/projects/my-project.svg" width="430" alt="My project">\n</a>'
    : name === 'contact'
      ? '<a href="https://github.com/YOUR_USERNAME">\n  <img src="assets/contacts/github.svg" height="46" alt="GitHub">\n</a>'
      : `<img src="${output}" alt="${name}">`;
  image = image.replace(/<img\b[^>]*>/g, picture);
  const theme = {
    themes: {
      light: { [guide.colorRole]: '#0369a1' },
      dark: { [guide.colorRole]: '#38bdf8' },
    },
  };
  const json = value => '```json\n' + JSON.stringify(value, null, 2) + '\n```';
  return [
    `# ${name}`,
    guide.description,
    '[Getting started](../../README.md#getting-started) · [All components](../../README.md#components) · [Complete demo](../../examples/demo/README.md) · [Theme settings](../../themes/README.md) · [Minimal config](minimal.json) · [All defaults](defaults.json) · [Action inputs](action.yml)',
    '## Use your own data',
    `1. Add this component Action before the workflow commit step and run it once.\n2. The Action creates \`${dataPath}\` automatically if missing; normal mode skips rendering on that run. The commit step saves the template.\n3. Fill the generated config, add the image to README, and push to render your data.`,
    '### Minimal data config',
    `The Action creates this template at \`${dataPath}\`; edit its sample values rather than creating the file yourself. Existing files are never overwritten.`,
    json(minimal),
    '### Action step',
    '```yaml\n- uses: GreenZV/readme-blocks/components/' + name + '@main\n```',
    `No config path input is needed. The Action finds \`${dataPath}\` automatically. See the [main guide](../../README.md#getting-started) for the complete workflow, permissions and the commit step that saves both configs and assets.`,
    '### Add it to README',
    '```html\n' + image + '\n```',
    `Default output: \`${output}\`. The build also writes matching \`.light.svg\` and \`.dark.svg\` variants. The default appearance is auto; use the picture markup above to follow the selected GitHub theme. A fixed appearance configured below also works with the same markup. Text, image order, links and expandable sections remain hand-edited in README.`,
    '## Configuration',
    'Supply your content first. Other settings are optional and inherit [defaults.json](defaults.json). Objects merge recursively; arrays replace the whole list.',
    '| Field | Meaning |\n| --- | --- |\n' + guide.fields.map(([field, meaning]) => `| \`${field}\` | ${meaning} |`).join('\n'),
    ...guide.notes,
    '### Customization example',
    `Save this in the same \`${dataPath}\` file, replacing the example content with your own:`,
    json(mergeSettings(minimal, guide.example)),
    '## Themes',
    'The built-in theme is monochrome when omitted. Select another with the workflow `theme` input:',
    '```yaml\n- uses: GreenZV/readme-blocks/components/' + name + '@main\n  with:\n    theme: ocean\n```',
    `Global overrides are read from \`.github/readme/theme.json\`. For this component only, save overrides at \`${themePath}\`, for example:`,
    json(theme),
    'Missing theme files are optional; no theme path is passed to the workflow. Resolution is rendering defaults → selected built-in theme → global overrides → component overrides. Shared appearance, typography, layout and motion are also configurable. See [theme settings](../../themes/README.md).',
    '### Light and dark appearance',
    'Both appearances are enabled by default (`appearance: auto`). To pin this component to dark colors, add this optional setting to `' + themePath + '` alongside any existing overrides:',
    json({ appearance: 'dark' }),
    'Use `light` for light colors or `auto` for automatic switching. The same key in `.github/readme/theme.json` sets the global default. This is independent of the named color palette and is not a workflow input or a content field. In fixed modes all three SVG filenames use the chosen appearance, so the README markup above does not need to change. See [appearance settings and manual integration](../../docs/appearance.md) for single-image alternatives and direct generation.',
    '## Try the demo',
    '```yaml\n- uses: GreenZV/readme-blocks/components/' + name + '@main\n  with:\n    demo: \'true\'\n```',
    'Demo mode renders packaged [demo.json](demo.json) with normal output filenames and creates the minimal data config if missing. Stack, experience and contact demos download their icon URLs during the build. Existing data files stay unchanged and are ignored for demo rendering. The workflow commits templates and SVGs together. Theme selection and overrides still apply. Fill the generated config and remove `demo` to use your own data.',
    '## Theme gallery',
    'Every built-in theme appears below in light and dark mode. Gallery SVGs use explicit backgrounds and disabled animation for comparison; production SVGs remain transparent. The original SVG uses browser color preferences; the explicit variants follow the GitHub theme through the picture markup above.' + (name === 'projects' || name === 'contact' ? ' Representative items are shown; the complete demo includes the full set.' : ''),
    gallery,
  ].join('\n\n') + '\n';
}
