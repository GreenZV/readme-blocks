# Adding a component

This guide is for maintainers of readme-blocks. To use an existing component in
your profile, follow the [usage guide](../README.md#getting-started).

Each component is an independent Node.js 24 Action. It shares rendering helpers,
themes and the icon loader with the library, but never imports another component,
a full builder, local tooling, or a personal profile. No npm installation or
external rendering service is needed.

## 1. Create the component files

Choose a lowercase hyphenated name, such as `message`, and create:

```text
components/message/
  action.yml
  generate.mjs
  defaults.json
  minimal.json
  demo.json
  README.md                 # generated later; do not edit by hand
  previews/                 # generated for every built-in theme
```

Keep these responsibilities separate:

| File | Responsibility |
| --- | --- |
| `defaults.json` | Rendering settings, normal output names and empty content defaults. No personal data, sample profiles or palette colors. |
| `minimal.json` | The smallest useful content template a consumer fills in. No duplicated rendering defaults. |
| `demo.json` | Deterministic example content. Reuse normal rendering and output names. |
| `generate.mjs` | Validate content and render SVGs; the shared entry-point helper initializes configs and writes assets. |
| `action.yml` | Independent native Action, with `demo` and `theme` inputs. |

For this example, use the following files.

`components/message/defaults.json`:

```json
{
  "output": "assets/message.svg",
  "lineWidth": 58,
  "text": ""
}
```

`components/message/minimal.json`:

```json
{
  "text": "Write a short message about your work"
}
```

`components/message/demo.json`:

```json
{
  "text": "Building useful software, one small improvement at a time."
}
```

`components/message/action.yml`:

```yaml
name: README message
description: Generate a message SVG and initialize its minimal data config
inputs:
  demo:
    description: Render packaged example data using normal asset filenames
    required: false
    default: 'false'
  theme:
    description: Built-in theme name; monochrome when omitted
    required: false
    default: monochrome
runs:
  using: node24
  main: generate.mjs
```

## 2. Implement the renderer

`components/message/generate.mjs`:

```javascript
import { escapeXml, isMain, runComponent } from '../../scripts/lib/config.mjs';
import { componentStyle } from '../../scripts/lib/style.mjs';
import { wrapWords } from '../../scripts/lib/text.mjs';

export function render({ config, common }) {
  if (typeof config.text !== 'string' || !config.text.trim()) {
    throw new Error('message: fill the text field in .github/readme/components/message.json');
  }
  if (!Number.isInteger(config.lineWidth) || config.lineWidth < 1) {
    throw new Error('message: lineWidth must be a positive integer');
  }
  const { width, padding, radius } = common.layout;
  const lines = wrapWords(config.text, config.lineWidth);
  const lineHeight = common.typography.sizes.title * 1.5;
  const height = padding * 2 + lines.length * lineHeight;
  const content = lines.map((line, index) =>
    `<text x="${padding}" y="${padding + (index + 1) * lineHeight}" class="title">${escapeXml(line)}</text>`
  ).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Profile message</title>
<desc id="desc">${escapeXml(config.text)}</desc>
${componentStyle(common)}
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" class="border"/>
${content}
</svg>\n`;
  return { assets: [{ path: config.output, svg }] };
}

if (isMain(import.meta.url)) await runComponent('message', render);
```

`render(ctx)` can be synchronous or async. Its context contains merged `config`,
resolved `common`, the caller's `root`, the library's `sourceRoot`, and `demo`.
Return `{ assets: [{ path, svg }] }`, with paths relative to the caller repository.
Build the complete result before writing any assets. Importing the module must
have no rendering, network, config-initialization, or filesystem-write side effects.

`runComponent` handles the Action environment and local CLI, exclusive creation
of the missing config, the initialization-run skip, config/theme resolution, and
asset writes. It reads only the fixed config and theme paths documented in
[configuration](configuration.md) and [themes](../themes/README.md).

Validate all required fields and list item formats. If the component has a single
required text field, also add `message: 'text'` to `requiredText` inside
`validateComponentData` in [config.mjs](../scripts/lib/config.mjs). For a required
list, extend its list map instead. The example also validates inside `render` so
direct integrations get a useful error. More complex constraints belong near the renderer.

Use shared semantic color roles and typography; never embed one theme's accent
colors in the renderer. `componentStyle(common)` supplies light/dark styles.
Custom styles should use `common.themes.light` and `common.themes.dark` under
`prefers-color-scheme: dark`. Keep production backgrounds transparent. Escape
user text with `escapeXml`; use an accessible SVG title/description and a `viewBox`.
If adding animation, honor both `common.motion.enabled` and
`common.motion.respectReducedMotion`. Static rendering must still be complete.

Measure or wrap variable-length content. `wrapWords` wraps at spaces without
splitting long words, so test unbroken identifiers and adjust your renderer if
they are valid content. Use `loadIcon` and `iconMarkup` from `scripts/lib/icons.mjs` for caller-provided
SVGs. Accept item objects with a `label` and optional `icon` path or HTTPS URL,
and respect the component/item `iconStyle` setting. Add demo URLs rather than
bundling brand logo files. See [icons](configuration.md#icons) for loading and
licensing behavior.

## 3. Register documentation and examples

Add a `message` entry to `guides` in
[component-docs.mjs](../.github/scripts/component-docs.mjs):

```javascript
message: {
  description: 'A short themed message panel.',
  fields: [
    ['text', 'Required message text.'],
    ['lineWidth', 'Optional wrapping width in characters.'],
    ['output', 'SVG output path; defaults to `assets/message.svg`.'],
  ],
  example: { lineWidth: 48 },
  notes: ['Place the image in your hand-edited README.'],
  colorRole: 'title',
},
```

This metadata generates usage instructions, config examples, theme overrides
and the theme gallery in the component's README. Do not edit that generated file.
The gallery builder discovers directories containing `action.yml` automatically;
missing guide metadata produces an explicit error.

The current gallery output example comes from `config.output`, or the first
`config.outputs[].path`. Projects and contacts have special multi-asset examples.
If introducing a different output structure, update the output/example handling
in [build-docs.mjs](../.github/scripts/build-docs.mjs) and `componentPage` as needed.

Update these hand-maintained entry points:

- [Main README](../README.md#components): add the component's link, purpose and default output; update any component counts.
- [Configuration reference](configuration.md#content-by-component): list required and optional content fields.
- [Action reference](actions.md): update the list of available components; document any additional input and its validation.
- [Demo workflow](../examples/demo/workflow.yml): add the independent Action before the save step, with `demo: 'true'`.
- [Demo README](../examples/demo/README.md): add the image and any links or expandable layout manually.

The documentation workflow and local demo builder discover component directories;
they need no additional component list. Adding a component does not automatically
enable it in a consumer's workflow or edit their README. A personal profile such
as GreenZV must opt in by adding the Action and README image explicitly.

## 4. Build and verify

Use Node.js 24. From the library repository root, test the example in a separate
caller directory so sample configs never appear in the library itself:

```sh
node components/message/generate.mjs --root /tmp/readme-message-example
```

The first normal run creates
`/tmp/readme-message-example/.github/readme/components/message.json` and skips
rendering. Fill its text and run the same command again. It should write only
`assets/message.svg`, preserving the existing config and any hand-written README.

```sh
node components/message/generate.mjs --demo --theme ocean --root /tmp/readme-message-demo
node .github/scripts/build-docs.mjs
```

The second command rebuilds every component page, theme gallery, demo asset and
theme catalog using only published sources. It validates and renders everything
before replacing existing generated output. Its CLI also supports `--root PATH`
for a separate output directory; sources still come from this library checkout.

Verify first-run initialization, normal rendering, demo rendering, monochrome by
default, all built-in themes, global/component overrides, XML escaping, missing
or malformed content, long text, and light/dark appearance. If animated, also
verify disabled motion and reduced-motion preferences. Check that importing the
module writes nothing and that it imports neither another component nor `local/`.

Local checks may live under ignored `local/tests/`; they are not required or
published by the Action or documentation workflow. Update any applicable local
fixtures when adding new content types, then run `node local/test.mjs` if that
workstation tooling is present. Keep local previews and dependencies under `local/`.

Commit the new source files, updated entry-point docs, generated component README,
theme previews and demo assets together. The documentation workflow also rebuilds
them on push. A separate consumer repository can exercise the Action through
GitHub; local CLI checks do not cover Action download or repository permissions.
