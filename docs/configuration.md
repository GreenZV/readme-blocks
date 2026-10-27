# Minimal component configuration

Each component Action automatically creates `.github/readme/components/<component>.json`
from its packaged `minimal.json` when missing. The workflow commit step saves the
file; you only fill in its content. Existing configs are never overwritten. Normal
mode skips rendering on the run that creates the file; demo mode also renders
sample SVGs immediately. See the [complete workflow](../README.md#getting-started).
Output names, dimensions, spacing, animation, status definitions, and other
rendering settings already have built-in defaults. Workflow steps need no config
paths and no rendering parameters.

For a banner, `.github/readme/components/banner.json` can contain just:

```json
{
  "text": "your-name"
}
```

Then use:

```yaml
- uses: GreenZV/readme-blocks/components/banner@main
```

## Content by component

| Component | Content to fill | Optional content |
| --- | --- | --- |
| [banner](../components/banner/minimal.json) | `text` | `prompt` |
| [now](../components/now/minimal.json) | `focus` | `direction`, `steps` |
| [contribution](../components/contribution/minimal.json) | `username` | Can also come from the Action's `username` input |
| [projects](../components/projects/minimal.json) | `items`: project `slug` and `title` | `description`, `stack`, `status`, `showLinkHint` |
| [stack](../components/stack/minimal.json) | `groups`: group `label` and object `items` with `label` | `title`, group `notes`, item `icon`, `iconStyle` |
| [experience](../components/experience/minimal.json) | `groups`: group `label` and object `items` with `label` | `title`, group `notes`, item `icon`, `iconStyle` |
| [toolbox](../components/toolbox/minimal.json) | `rows`: skill, description, tools | Row detail, `title`, `command`, `eyebrow` |
| [more-technologies](../components/more-technologies/minimal.json) | `groups`: group `label` and technology names in `items` | `title` |
| [contact](../components/contact/minimal.json) | `groups`: group `label`, badge `slug` and `label` | Item `icon`, `iconStyle`; destination links belong in README |

Every component includes a `minimal.json` example with content fields only.
The Action copies it to the fixed path automatically; replace its example values
with yours before the next normal run. Skipping happens only when the file is
created; later runs render its current values, even if the examples were not
edited. Manual creation remains optional.
Projects and contacts may use empty lists (or `{}`) to generate no cards. Other
components report which main content field is missing; normal mode never
substitutes sample text, projects, accounts, or skills.

Toolbox rows use `["Skill", "Description", "Tools", "Optional detail"]`.
Notes, descriptions and lists of technologies are your content; pixel sizes and
output paths are not required content.

## Icons

Stack and experience items are objects. A label is sufficient; an icon is optional:

```json
{
  "groups": [
    {
      "label": "BACKEND",
      "items": [
        { "label": "Java", "icon": ".github/readme/icons/java.svg" },
        { "label": "SQL" }
      ]
    }
  ]
}
```

Keep local SVGs in your own repository, for example under `.github/readme/icons/`.
An `icon` path is relative to the caller repository root, never to the library
or the JSON file. There is no built-in logo ID lookup or packaged-file fallback.
Legacy `["id", "label"]` arrays are no longer supported.

An HTTPS URL can be used instead of a path:

```json
{
  "label": "Java",
  "icon": "https://raw.githubusercontent.com/devicons/devicon/6a37858047b0e8d9c9c0e68f4a071fc410652e89/icons/java/java-plain.svg"
}
```

Remote SVGs are downloaded at build time and embedded as data images. The finished
component is self-contained: it makes no icon requests while someone views README.
No downloaded source files or disk cache are created. Duplicate URLs share one
request within the running process, with at most six concurrent requests and a
20-second timeout per request. Local files need no network access. An explicitly
configured source that fails to load fails the component before asset writes;
omitting `icon` deliberately renders text without reserving icon space.

SVG sources need a valid `viewBox` and must be at most 512 KiB. Use self-contained
SVGs; their own external resources cannot be relied on in an image context.
External logo links inside a finished SVG are unsuitable for README images because
SVG image contexts restrict external resource loading. See [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image#restrictions).

Colors are preserved by default (`iconStyle: "original"`). Set `iconStyle` on the
component config to `"monochrome"` to use the theme's `logo` color, or set it on
one item to override the component setting. Monochrome rendering uses the SVG's
alpha mask without rewriting the source geometry, gradients or internal IDs.
For example, add `"iconStyle": "monochrome"` alongside `groups` to tint all icons.

Contacts use the same `icon` and `iconStyle` fields, with a separate filename slug:

```json
{
  "groups": [
    {
      "label": "CONTACT",
      "items": [
        {
          "slug": "github",
          "label": "GitHub",
          "icon": ".github/readme/icons/github.svg"
        }
      ]
    }
  ]
}
```

The slug controls only `assets/contacts/<slug>.svg`; it does not select a logo.
Wrap the generated badge in your actual account link in README.

Stack, experience and contact demos use HTTPS sources in `demo.json`, so those
demos and their documentation galleries require a network connection. Sources
are pinned to collection versions or commits, not a moving upstream branch.
The demo email and website badges demonstrate the text-only fallback.

The library bundles no third-party logo files. Local storage, URL loading and
embedding all still require respecting the source's license and brand rules.
User-supplied icons are not relicensed under the library's MIT license. Preserve
any required notices with your files and check the relevant brand conditions.
See the [Simple Icons disclaimer](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md)
and [Devicon brand notice](https://github.com/devicons/devicon#about). Generated
demo and gallery SVGs contain embedded logo imagery even though original logo
files are not shipped with the library.

## Customize only what you need

Each `components/<component>/defaults.json` lists the available built-in settings.
Add only the keys you want to change to your own component config:

```json
{
  "text": "your-name",
  "layout": { "fontSize": 64 },
  "animation": { "characterMs": 90 }
}
```

The banner retains its default width, height, positioning, output path, and all
other animation settings. Objects merge recursively; arrays replace the complete
list. For example, overriding `outputs` replaces that list, while overriding one
project status label preserves its default tone.

Resolution is `defaults.json` → your partial config. Explicit demo mode instead
uses `defaults.json` → packaged `demo.json`; demo data never becomes a base for
normal profiles. Full configurations remain supported.

Colors and shared typography/layout/motion overrides use the separate
[fixed theme paths](../themes/README.md). The built-in theme remains monochrome
unless another is selected in the workflow.

## Light and dark display

Appearance is separate from content and named color palettes. The default is
`auto`, generating both appearances for README `<picture>` switching. Set
`"appearance": "light"` or `"appearance": "dark"` in `.github/readme/theme.json`
to pin all components; `.github/readme/themes/<component>.json` overrides one.
Use `"appearance": "auto"` to restore switching. Add this key alongside existing
settings, outside `themes`, and leave component content configs unchanged.
See [appearance configuration and manual integration](appearance.md) for output
behavior and ready-to-copy README markup.
