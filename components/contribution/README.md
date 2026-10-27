# contribution

An ASCII activity calendar with weekday labels, monthly labels, statistics, and a static today highlight.

[Getting started](../../README.md#getting-started) · [All components](../../README.md#components) · [Complete demo](../../examples/demo/README.md) · [Theme settings](../../themes/README.md) · [Minimal config](minimal.json) · [All defaults](defaults.json) · [Action inputs](action.yml)

## Use your own data

1. Add this component Action before the workflow commit step and run it once.
2. The Action creates `.github/readme/components/contribution.json` automatically if missing; normal mode skips rendering on that run. The commit step saves the template.
3. Fill the generated config, add the image to README, and push to render your data.

### Minimal data config

The Action creates this template at `.github/readme/components/contribution.json`; edit its sample values rather than creating the file yourself. Existing files are never overwritten.

```json
{
  "username": "octocat"
}
```

### Action step

```yaml
- uses: GreenZV/readme-blocks/components/contribution@main
```

No config path input is needed. The Action finds `.github/readme/components/contribution.json` automatically. See the [main guide](../../README.md#getting-started) for the complete workflow, permissions and the commit step that saves both configs and assets.

### Add it to README

```markdown
![contribution](assets/contributions.svg)
```

Default output: `assets/contributions.svg`. Text, image order, links and expandable sections remain hand-edited in README.

## Configuration

Supply your content first. Other settings are optional and inherit [defaults.json](defaults.json). Objects merge recursively; arrays replace the whole list.

| Field | Meaning |
| --- | --- |
| `username` | Required GitHub account. The optional Action `username` input overrides this value. |
| `symbols` | Exactly five characters, ordered from no activity to the highest activity. |
| `weekdayLabels` | Exactly seven labels in Sunday-first order. |
| `outputs` | List of SVG outputs; each entry needs `path` and `statsStyle` (`compact` or `large`). |
| `animation` | Reveal duration and delay, in seconds. |
| `fetch` | HTTP `timeoutSeconds` and `userAgent`; normal builds always fetch live data. |

With an existing config, normal mode fetches current public GitHub activity on every build. No activity JSON is saved or required. HTTP, network or parsing errors fail the build before replacing the existing calendar SVG.

All configured outputs reuse one request. Demo mode uses a fixed seeded sample calendar without a network request. There is no `fetch` workflow input or saved-calendar mode.

The activity scale uses the shared `activity` array of five colors. `todayBackground` and `todayText` control the static current-day highlight.

### Customization example

Save this in the same `.github/readme/components/contribution.json` file, replacing the example content with your own:

```json
{
  "username": "octocat",
  "outputs": [
    {
      "path": "assets/contributions.svg",
      "statsStyle": "large"
    }
  ],
  "animation": {
    "durationSeconds": 1.8
  }
}
```

## Themes

The built-in theme is monochrome when omitted. Select another with the workflow `theme` input:

```yaml
- uses: GreenZV/readme-blocks/components/contribution@main
  with:
    theme: ocean
```

Global overrides are read from `.github/readme/theme.json`. For this component only, save overrides at `.github/readme/themes/contribution.json`, for example:

```json
{
  "themes": {
    "light": {
      "stat": "#0369a1"
    },
    "dark": {
      "stat": "#38bdf8"
    }
  }
}
```

Missing theme files are optional; no theme path is passed to the workflow. Resolution is rendering defaults → selected built-in theme → global overrides → component overrides. Shared typography, layout and motion are also configurable. See [theme settings](../../themes/README.md).

## Try the demo

```yaml
- uses: GreenZV/readme-blocks/components/contribution@main
  with:
    demo: 'true'
```

Demo mode renders packaged [demo.json](demo.json) with normal output filenames and creates the minimal data config if missing. Stack, experience and contact demos download their icon URLs during the build. Existing data files stay unchanged and are ignored for demo rendering. The workflow commits templates and SVGs together. Theme selection and overrides still apply. Fill the generated config and remove `demo` to use your own data.

## Theme gallery

Every built-in theme appears below in light and dark mode. Gallery SVGs use explicit backgrounds and disabled animation for comparison; production SVGs remain transparent and adapt automatically.

## monochrome

Workflow input: `theme: monochrome`

### Light

![contribution — monochrome, light](previews/monochrome/light/contributions.svg)

### Dark

![contribution — monochrome, dark](previews/monochrome/dark/contributions.svg)

## amber

Workflow input: `theme: amber`

### Light

![contribution — amber, light](previews/amber/light/contributions.svg)

### Dark

![contribution — amber, dark](previews/amber/dark/contributions.svg)

## crimson

Workflow input: `theme: crimson`

### Light

![contribution — crimson, light](previews/crimson/light/contributions.svg)

### Dark

![contribution — crimson, dark](previews/crimson/dark/contributions.svg)

## emerald

Workflow input: `theme: emerald`

### Light

![contribution — emerald, light](previews/emerald/light/contributions.svg)

### Dark

![contribution — emerald, dark](previews/emerald/dark/contributions.svg)

## ocean

Workflow input: `theme: ocean`

### Light

![contribution — ocean, light](previews/ocean/light/contributions.svg)

### Dark

![contribution — ocean, dark](previews/ocean/dark/contributions.svg)

## violet

Workflow input: `theme: violet`

### Light

![contribution — violet, light](previews/violet/light/contributions.svg)

### Dark

![contribution — violet, dark](previews/violet/dark/contributions.svg)

