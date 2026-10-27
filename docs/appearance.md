# Light and dark appearance

Color palette and display mode are independent. The workflow's `theme` input
selects colors, for example `monochrome` or `ocean`. The optional `appearance`
setting selects which light/dark palette is displayed. Defaults are
`theme: monochrome` and `appearance: auto`, with no settings required.

## Choose a mode through config

Put this optional setting in `.github/readme/theme.json` to affect every component:

```json
{
  "appearance": "auto"
}
```

| Value | Result |
| --- | --- |
| `auto` (default) | Light and dark variants; README's `<picture>` selects the matching one. |
| `light` | Always use light colors, including on a dark page. |
| `dark` | Always use dark colors, including on a light page. |

Change `auto` to `light` or `dark` to pin a mode. If that file already contains
colors or typography, add `appearance` alongside those keys; keep your overrides.
Omit the key entirely to inherit `auto`.

To override only the banner, use `.github/readme/themes/banner.json`:

```json
{
  "appearance": "dark"
}
```

Other components keep the global mode. A component override wins over the global
setting; the global setting wins over the built-in default. These are the same
fixed override paths used for colors, typography, layout and motion. Put
`appearance` at the top level of these override files, outside `themes`, not in
the component's content config. No workflow input or custom config path is needed.
Invalid values fail the build before assets are written. Demo and normal modes
use the same setting.

## Add both appearances to README manually

Actions generate assets; you write the README markup. For automatic switching:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner.dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner.light.svg">
  <img src="assets/banner.svg" alt="Terminal banner">
</picture>
```

GitHub supports this `<picture>` pattern for theme-aware README images; see
[GitHub's guide](https://github.blog/developer-skills/github/how-to-make-your-images-in-markdown-on-github-adjust-for-dark-mode-and-light-mode/).
Keep the two sources and the fallback image together. Use the same pattern for
other components, including each project card or contact badge. Wrap the entire
`<picture>` in `<a href="...">` to make it clickable. The [component pages](../README.md#components)
include ready-to-copy examples with their actual filenames.

Every build writes three files from one render:

- `banner.svg`: adaptive in `auto`; fixed in `light` or `dark` mode.
- `banner.light.svg`: explicit light appearance in `auto`.
- `banner.dark.svg`: explicit dark appearance in `auto`.

When a mode is pinned through config, **all three files use that selected
appearance**. The suffixes remain stable aliases, so existing `<picture>` markup
honors the config without README edits or stale variants. Switch back to `auto`
and rebuild to restore distinct light and dark sources. Rendering, live activity
fetches and icon downloads are not repeated to create the variants.

Appearance changes component colors only. SVG backgrounds remain transparent;
the GitHub page keeps its own theme.

## Use only one appearance manually

You can also choose an explicit file directly in README while leaving the config
at `auto`:

```markdown
![Always light](assets/banner.light.svg)
![Always dark](assets/banner.dark.svg)
```

Use one of those lines for a fixed image. Alternatively, set `appearance: light`
or `appearance: dark` in config and use the standard filename:

```markdown
![Terminal banner](assets/banner.svg)
```

A bare adaptive `banner.svg` in `auto` follows the embedding/browser color-scheme
preference; use `<picture>` for GitHub theme selection. Config alone cannot add
missing picture markup to a hand-edited README. Explicit filenames also obey
any forced mode in config, as described above.

## Generate without Actions

The component entry point resolves the same configs and mode when run directly
with Node.js 24:

```sh
node /path/to/readme-blocks/components/banner/generate.mjs --root /path/to/profile
```

The first normal run creates the minimal data config if missing and skips
rendering; fill it before running again. No package installation is needed.
The command generates assets and does not edit README.

For a programmatic integration, resolve the context, render once, then pass the
resolved mode to the shared writer:

```javascript
import { context, writeAssets } from './readme-blocks/scripts/lib/config.mjs';
import { render } from './readme-blocks/components/banner/generate.mjs';

const ctx = context('banner', { root: '/path/to/profile' });
const { assets } = await render(ctx);
await writeAssets(assets, ctx.root, { appearance: ctx.common.appearance });
```

`render(ctx)` returns adaptive source SVGs. `writeAssets` derives and writes the
three filenames according to the resolved mode. Its default mode is `auto` when
called without options. For in-memory output, use
`appearanceAssets(assets, ctx.common.appearance)` from `scripts/lib/appearance.mjs`;
it returns the same expanded asset list without writing files.
