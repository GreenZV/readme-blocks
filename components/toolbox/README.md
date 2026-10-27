# toolbox

Compact rows for development tools, platforms, and everyday software.

[Getting started](../../README.md#getting-started) · [All components](../../README.md#components) · [Complete demo](../../examples/demo/README.md) · [Theme settings](../../themes/README.md) · [Minimal config](minimal.json) · [All defaults](defaults.json) · [Action inputs](action.yml)

## Use your own data

1. Add this component Action before the workflow commit step and run it once.
2. The Action creates `.github/readme/components/toolbox.json` automatically if missing; normal mode skips rendering on that run. The commit step saves the template.
3. Fill the generated config, add the image to README, and push to render your data.

### Minimal data config

The Action creates this template at `.github/readme/components/toolbox.json`; edit its sample values rather than creating the file yourself. Existing files are never overwritten.

```json
{
  "rows": [
    [
      "DEVELOPMENT",
      "Build and maintain applications.",
      "VS Code / IntelliJ IDEA"
    ]
  ]
}
```

### Action step

```yaml
- uses: GreenZV/readme-blocks/components/toolbox@main
```

No config path input is needed. The Action finds `.github/readme/components/toolbox.json` automatically. See the [main guide](../../README.md#getting-started) for the complete workflow, permissions and the commit step that saves both configs and assets.

### Add it to README

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/toolbox.dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/toolbox.light.svg">
  <img src="assets/toolbox.svg" alt="toolbox">
</picture>
```

Default output: `assets/toolbox.svg`. The build also writes matching `.light.svg` and `.dark.svg` variants. The default appearance is auto; use the picture markup above to follow the selected GitHub theme. A fixed appearance configured below also works with the same markup. Text, image order, links and expandable sections remain hand-edited in README.

## Configuration

Supply your content first. Other settings are optional and inherit [defaults.json](defaults.json). Objects merge recursively; arrays replace the whole list.

| Field | Meaning |
| --- | --- |
| `rows` | Required non-empty array of rows: `["Category", "Description", "Tools", "Optional detail"]`. |
| `title` | Accessible SVG title. |
| `command / eyebrow` | Visible terminal command and small header caption. |
| `layout.rowHeight` | Vertical spacing allocated to each row. |
| `layout.toolsX` | Horizontal start of the right-hand tools column. |
| `output` | SVG output path. |

The left column describes a skill or category; the right column lists its tools and optional detail. This is a text component rather than a logo grid.

### Customization example

Save this in the same `.github/readme/components/toolbox.json` file, replacing the example content with your own:

```json
{
  "rows": [
    [
      "DEVELOPMENT",
      "Build and maintain applications.",
      "VS Code / IntelliJ IDEA"
    ]
  ],
  "command": "$ toolbox",
  "eyebrow": "DAILY TOOLS",
  "layout": {
    "rowHeight": 80
  }
}
```

## Themes

The built-in theme is monochrome when omitted. Select another with the workflow `theme` input:

```yaml
- uses: GreenZV/readme-blocks/components/toolbox@main
  with:
    theme: ocean
```

Global overrides are read from `.github/readme/theme.json`. For this component only, save overrides at `.github/readme/themes/toolbox.json`, for example:

```json
{
  "themes": {
    "light": {
      "title": "#0369a1"
    },
    "dark": {
      "title": "#38bdf8"
    }
  }
}
```

Missing theme files are optional; no theme path is passed to the workflow. Resolution is rendering defaults → selected built-in theme → global overrides → component overrides. Shared appearance, typography, layout and motion are also configurable. See [theme settings](../../themes/README.md).

### Light and dark appearance

Both appearances are enabled by default (`appearance: auto`). To pin this component to dark colors, add this optional setting to `.github/readme/themes/toolbox.json` alongside any existing overrides:

```json
{
  "appearance": "dark"
}
```

Use `light` for light colors or `auto` for automatic switching. The same key in `.github/readme/theme.json` sets the global default. This is independent of the named color palette and is not a workflow input or a content field. In fixed modes all three SVG filenames use the chosen appearance, so the README markup above does not need to change. See [appearance settings and manual integration](../../docs/appearance.md) for single-image alternatives and direct generation.

## Try the demo

```yaml
- uses: GreenZV/readme-blocks/components/toolbox@main
  with:
    demo: 'true'
```

Demo mode renders packaged [demo.json](demo.json) with normal output filenames and creates the minimal data config if missing. Stack, experience and contact demos download their icon URLs during the build. Existing data files stay unchanged and are ignored for demo rendering. The workflow commits templates and SVGs together. Theme selection and overrides still apply. Fill the generated config and remove `demo` to use your own data.

## Theme gallery

Every built-in theme appears below in light and dark mode. Gallery SVGs use explicit backgrounds and disabled animation for comparison; production SVGs remain transparent. The original SVG uses browser color preferences; the explicit variants follow the GitHub theme through the picture markup above.

## monochrome

Workflow input: `theme: monochrome`

### Light

![toolbox — monochrome, light](previews/monochrome/light/toolbox.svg)

### Dark

![toolbox — monochrome, dark](previews/monochrome/dark/toolbox.svg)

## amber

Workflow input: `theme: amber`

### Light

![toolbox — amber, light](previews/amber/light/toolbox.svg)

### Dark

![toolbox — amber, dark](previews/amber/dark/toolbox.svg)

## crimson

Workflow input: `theme: crimson`

### Light

![toolbox — crimson, light](previews/crimson/light/toolbox.svg)

### Dark

![toolbox — crimson, dark](previews/crimson/dark/toolbox.svg)

## emerald

Workflow input: `theme: emerald`

### Light

![toolbox — emerald, light](previews/emerald/light/toolbox.svg)

### Dark

![toolbox — emerald, dark](previews/emerald/dark/toolbox.svg)

## ocean

Workflow input: `theme: ocean`

### Light

![toolbox — ocean, light](previews/ocean/light/toolbox.svg)

### Dark

![toolbox — ocean, dark](previews/ocean/dark/toolbox.svg)

## violet

Workflow input: `theme: violet`

### Light

![toolbox — violet, light](previews/violet/light/toolbox.svg)

### Dark

![toolbox — violet, dark](previews/violet/dark/toolbox.svg)

