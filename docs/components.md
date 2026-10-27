# Component architecture

Each component contains `action.yml`, `generate.mjs`, `defaults.json`,
`minimal.json`, and `demo.json`. Native Actions execute their component entry
point directly, using only Node.js built-ins. Shared utilities live under
`scripts/lib/`, rendering defaults under `config/`, and palettes under `themes/`.
User SVGs live in the caller repository; demo icon URLs live in each component's
`demo.json`. The library bundles no third-party logo source files. The shared
`scripts/lib/icons.mjs` loader supports caller-relative paths, HTTPS downloads,
process-local URL caching and self-contained data-image embedding.

See [adding a component](adding-components.md) for a complete implementation
example, registration points, and verification steps.

An Action never imports another component or a full builder. Its entry point first
creates a missing fixed-path config from that component's `minimal.json`, without
overwriting any existing file. Normal mode returns successfully without rendering
on the initialization run; demo mode creates the template and renders demo data.
Pure context/render helpers remain read-only and never initialize files.

Normal mode reads
`.github/readme/components/<component>.json` from the caller repository and
merges the partial data with the component's defaults. Explicit demo mode merges
the same defaults with packaged demo data instead. Project and contact slugs
determine individual filenames; both modes use the same output scheme.

Theme overrides are discovered at `.github/readme/theme.json` and
`.github/readme/themes/<component>.json`. The built-in theme defaults to
monochrome. Data and theme file paths cannot be passed as workflow inputs.

The renderer returns adaptive SVG assets. The shared writer derives explicit
`.light.svg` and `.dark.svg` variants without another render or network request.
By default, `common.appearance` is `auto`; README `<picture>` sources select those
variants for the active GitHub theme. The writer receives the resolved appearance
and pins all output filenames to the selected palette in `light` or `dark` mode.
See [appearance configuration and the manual writer API](appearance.md). README text, layout, and links remain hand-edited;
component builds never generate or replace a consumer README. The `examples/demo/`
directory contains a complete consumer example, workflow, and generated assets.
Each component's Markdown page demonstrates every built-in theme in both appearances.

## Contribution

Once a data config exists, normal mode downloads current public activity and writes only
SVG assets. No activity JSON is persisted or needed in the repository. Request
and parsing failures preserve the previous SVG and fail the build. Demo mode
generates a deterministic sample calendar without a network request.

Run all selected component Actions in your workflow, then commit the generated
assets and newly created `.github/readme/components/` configs in one final step. The [example workflow](../examples/demo/workflow.yml)
shows this arrangement and the required repository write permission.

## Repository documentation build

`.github/workflows/documentation.yml` runs `.github/scripts/build-docs.mjs` on
every branch push and manual dispatch. This is the library's documentation build; consumer
Actions continue to execute one component at a time. It discovers palettes from
`themes/*.json`, validates them, rebuilds demo assets and per-component previews,
and updates generated theme catalog blocks in the three documentation entry pages.
Rendering and Markdown generation finish in a temporary directory before any
existing generated files are replaced. Invalid palettes, missing component guides,
rendering failures and missing catalog markers leave the previous output intact.
Successful builds remove obsolete theme previews and demo asset slugs. Publishing
is a sequence of filesystem writes, not a transaction across the whole repository.
The workflow commits generated files once at the end.

Component page text comes from `.github/scripts/component-docs.mjs`. Theme names
and accent colors come directly from palette files. Local preview and tests are
not used or published by this workflow.
