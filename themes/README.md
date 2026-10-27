# Built-in themes

<!-- readme-blocks:themes:start -->

| Theme | Light accent | Dark accent | Banner preview |
| --- | --- | --- | --- |
| [monochrome](monochrome.json) | `#262626` | `#e5e5e5` | [Preview](../components/banner/README.md#monochrome) |
| [amber](amber.json) | `#a16207` | `#fbbf24` | [Preview](../components/banner/README.md#amber) |
| [crimson](crimson.json) | `#b91c1c` | `#f87171` | [Preview](../components/banner/README.md#crimson) |
| [emerald](emerald.json) | `#047857` | `#34d399` | [Preview](../components/banner/README.md#emerald) |
| [ocean](ocean.json) | `#0369a1` | `#38bdf8` | [Preview](../components/banner/README.md#ocean) |
| [violet](violet.json) | `#6d28d9` | `#a78bfa` | [Preview](../components/banner/README.md#violet) |

<!-- readme-blocks:themes:end -->

Every theme includes light and dark palettes. Each component's [documentation
page](../README.md#components) shows all themes in both appearances. Production
SVGs remain transparent and switch with `prefers-color-scheme`.

## Choose a theme

Omit `theme` in the workflow for `monochrome`. To select another built-in palette:

```yaml
- uses: GreenZV/readme-blocks/components/banner@main
  with:
    demo: 'true'
    theme: ocean
```

A data config or override file cannot select a built-in theme. Theme selection
belongs to the workflow's `theme` input.

## Automatic overrides

No theme file path is accepted by the workflow. Every component checks
these optional paths relative to the caller repository, in this order:

1. `.github/readme/theme.json`: global palette and rendering overrides.
2. `.github/readme/themes/<component>.json`: overrides for that component only.

For example, `.github/readme/themes/banner.json` affects only the banner.
Missing files are skipped. A malformed or invalid existing file fails the build;
it never silently falls back. Files in other locations are not read. The former
`common` workflow input and `shared` fields in data configs are unsupported.

The resolution order is rendering defaults → selected built-in theme (otherwise
monochrome) → global fixed-path overrides → component fixed-path overrides.
Explicit overrides can recolor the monochrome base without changing its name.
Objects merge recursively; arrays, including activity scales, replace the whole
array. Overrides may adjust typography, layout and motion, as well as colors.

Example `.github/readme/theme.json`:

```json
{
  "typography": { "sizes": { "body": 14 } },
  "themes": {
    "light": { "title": "#0369a1", "logo": "#0369a1" },
    "dark": { "title": "#38bdf8", "logo": "#38bdf8" }
  }
}
```

Example `.github/readme/themes/banner.json`:

```json
{
  "themes": {
    "light": { "bannerText": "#6d28d9" },
    "dark": { "bannerText": "#a78bfa" }
  }
}
```

Both files are discovered without any extra workflow inputs. Keep data such as
names, project descriptions and technologies in the fixed data config at
`.github/readme/components/<component>.json`.

## Add a built-in theme

Create `themes/<name>.json` with a lowercase name containing letters, digits or
hyphens. Copy an existing palette such as [ocean.json](ocean.json) and change the
colors. Keep all light and dark color roles and the five activity levels. No
registration file, accent description or documentation edit is needed.

Push the new JSON file. The repository's [documentation workflow](../.github/workflows/documentation.yml)
automatically discovers every `themes/*.json` file, renders all components in both
appearances, and commits the generated galleries and theme catalogs. It also
refreshes the complete monochrome demo. The default theme stays monochrome.
Catalog accent colors are read from each palette's `title` role.

The catalogs in the main README, this page and the demonstration README are
generated between `readme-blocks:themes` markers. Edit the surrounding instructions
normally. Removing or renaming a theme also removes its old gallery output and
catalog entries on the next workflow run. An invalid palette fails the build
before replacing generated files.

The workflow runs on every push and can be started manually. Its [documentation
builder](../.github/scripts/build-docs.mjs) uses only Node.js built-ins and public
component renderers, with no dependency on local preview tools or tests.
