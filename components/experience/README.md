# experience

Additional development stacks with grouped logos, libraries, and notes.

[Getting started](../../README.md#getting-started) · [All components](../../README.md#components) · [Complete demo](../../examples/demo/README.md) · [Theme settings](../../themes/README.md) · [Minimal config](minimal.json) · [All defaults](defaults.json) · [Action inputs](action.yml)

## Use your own data

1. Add this component Action before the workflow commit step and run it once.
2. The Action creates `.github/readme/components/experience.json` automatically if missing; normal mode skips rendering on that run. The commit step saves the template.
3. Fill the generated config, add the image to README, and push to render your data.

### Minimal data config

The Action creates this template at `.github/readme/components/experience.json`; edit its sample values rather than creating the file yourself. Existing files are never overwritten.

```json
{
  "groups": [
    {
      "label": "PYTHON",
      "items": [
        {
          "label": "Python"
        }
      ],
      "notes": [
        "Web development and data processing"
      ]
    }
  ]
}
```

### Action step

```yaml
- uses: GreenZV/readme-blocks/components/experience@main
```

No config path input is needed. The Action finds `.github/readme/components/experience.json` automatically. See the [main guide](../../README.md#getting-started) for the complete workflow, permissions and the commit step that saves both configs and assets.

### Add it to README

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/experience.dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/experience.light.svg">
  <img src="assets/experience.svg" alt="experience">
</picture>
```

Default output: `assets/experience.svg`. The build also writes matching `.light.svg` and `.dark.svg` variants. The default appearance is auto; use the picture markup above to follow the selected GitHub theme. A fixed appearance configured below also works with the same markup. Text, image order, links and expandable sections remain hand-edited in README.

## Configuration

Supply your content first. Other settings are optional and inherit [defaults.json](defaults.json). Objects merge recursively; arrays replace the whole list.

| Field | Meaning |
| --- | --- |
| `groups` | Required non-empty list of additional stacks. |
| `groups[].label` | Stack or experience category name. |
| `groups[].items` | Objects with required `label` and optional `icon` (caller-relative SVG path or HTTPS URL). |
| `groups[].notes` | Optional string or array of strings for libraries, tools or supporting experience. |
| `title` | Accessible SVG title. |
| `iconStyle / groups[].items[].iconStyle` | `original` preserves SVG colors (default); `monochrome` uses the theme logo color. An item can override the component setting. |
| `layout / output` | Row spacing, note wrapping and SVG output path. |

This component uses the same object-based icon format as stack. See [icon configuration](../../docs/configuration.md#icons). An array of notes preserves intentional line breaks before wrapping. Put the image inside a Markdown/HTML `details` block when you want expandable experience.

### Customization example

Save this in the same `.github/readme/components/experience.json` file, replacing the example content with your own:

```json
{
  "groups": [
    {
      "label": "PYTHON",
      "items": [
        {
          "label": "Python"
        }
      ],
      "notes": [
        "Web development and data processing"
      ]
    }
  ],
  "layout": {
    "noteMaxChars": 90,
    "itemGap": 24
  }
}
```

## Themes

The built-in theme is monochrome when omitted. Select another with the workflow `theme` input:

```yaml
- uses: GreenZV/readme-blocks/components/experience@main
  with:
    theme: ocean
```

Global overrides are read from `.github/readme/theme.json`. For this component only, save overrides at `.github/readme/themes/experience.json`, for example:

```json
{
  "themes": {
    "light": {
      "logo": "#0369a1"
    },
    "dark": {
      "logo": "#38bdf8"
    }
  }
}
```

Missing theme files are optional; no theme path is passed to the workflow. Resolution is rendering defaults → selected built-in theme → global overrides → component overrides. Shared appearance, typography, layout and motion are also configurable. See [theme settings](../../themes/README.md).

### Light and dark appearance

Both appearances are enabled by default (`appearance: auto`). To pin this component to dark colors, add this optional setting to `.github/readme/themes/experience.json` alongside any existing overrides:

```json
{
  "appearance": "dark"
}
```

Use `light` for light colors or `auto` for automatic switching. The same key in `.github/readme/theme.json` sets the global default. This is independent of the named color palette and is not a workflow input or a content field. In fixed modes all three SVG filenames use the chosen appearance, so the README markup above does not need to change. See [appearance settings and manual integration](../../docs/appearance.md) for single-image alternatives and direct generation.

## Try the demo

```yaml
- uses: GreenZV/readme-blocks/components/experience@main
  with:
    demo: 'true'
```

Demo mode renders packaged [demo.json](demo.json) with normal output filenames and creates the minimal data config if missing. Stack, experience and contact demos download their icon URLs during the build. Existing data files stay unchanged and are ignored for demo rendering. The workflow commits templates and SVGs together. Theme selection and overrides still apply. Fill the generated config and remove `demo` to use your own data.

## Theme gallery

Every built-in theme appears below in light and dark mode. Gallery SVGs use explicit backgrounds and disabled animation for comparison; production SVGs remain transparent. The original SVG uses browser color preferences; the explicit variants follow the GitHub theme through the picture markup above.

## monochrome

Workflow input: `theme: monochrome`

### Light

![experience — monochrome, light](previews/monochrome/light/experience.svg)

### Dark

![experience — monochrome, dark](previews/monochrome/dark/experience.svg)

## amber

Workflow input: `theme: amber`

### Light

![experience — amber, light](previews/amber/light/experience.svg)

### Dark

![experience — amber, dark](previews/amber/dark/experience.svg)

## crimson

Workflow input: `theme: crimson`

### Light

![experience — crimson, light](previews/crimson/light/experience.svg)

### Dark

![experience — crimson, dark](previews/crimson/dark/experience.svg)

## emerald

Workflow input: `theme: emerald`

### Light

![experience — emerald, light](previews/emerald/light/experience.svg)

### Dark

![experience — emerald, dark](previews/emerald/dark/experience.svg)

## ocean

Workflow input: `theme: ocean`

### Light

![experience — ocean, light](previews/ocean/light/experience.svg)

### Dark

![experience — ocean, dark](previews/ocean/dark/experience.svg)

## violet

Workflow input: `theme: violet`

### Light

![experience — violet, light](previews/violet/light/experience.svg)

### Dark

![experience — violet, dark](previews/violet/dark/experience.svg)

