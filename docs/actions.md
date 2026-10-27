# Independent component Actions

For the complete setup, start with the [main usage and configuration guide](../README.md).

Each `components/<name>/action.yml` runs only that component. Available names:
`banner`, `now`, `contribution`, `projects`, `stack`, `experience`, `toolbox`,
`more-technologies`, and `contact`.

## Quick demo

```yaml
- uses: actions/checkout@v7
- name: Render example banner
  uses: GreenZV/readme-blocks/components/banner@main
  with:
    demo: 'true'
```

The examples use `GreenZV/readme-blocks@main`. Inside this repository, the same
step can use `uses: ./components/banner`.

No pre-existing data config, token, install step, or font installation is needed
for demo rendering. Stack, experience and contact download their HTTPS icon
sources during the build; their demos require network access. Each Action creates its minimal data config when missing,
then renders its packaged `demo.json`. Existing configs are never overwritten.
Contribution demo ignores the `username` input and renders a fixed seeded
calendar. Normal mode fetches live activity once its config exists. Newly initialized normal
components skip rendering until the next run, so the template can be filled first.

See the [public demonstration README](../examples/demo/README.md) and the
[complete example workflow](../examples/demo/workflow.yml). Keep only the Action
steps and README images you need. Demo mode writes the normal configured asset
names; it does not add a demo suffix or a separate output directory in the caller.
Project/contact filenames still depend on their configured slugs.

## Inputs

| Input | Meaning |
| --- | --- |
| `demo` | `'false'` by default; `'true'` uses packaged example data |
| `theme` | Built-in theme name; always `monochrome` when omitted |
| `username` | Contribution only: real account to fetch in normal mode |

All fixed paths are relative to the caller repository. A missing
`.github/readme/components/<component>.json` is created from the packaged
`minimal.json`. Normal mode skips rendering on that initialization run; fill the
template and run again. Existing invalid files fail normal builds and are never
replaced. Explicit demo mode uses packaged data and ignores existing consumer
data files. A `config` workflow input is not supported.

## Use your own data

Run the component Action once; its minimal config is created automatically at
`.github/readme/components/<name>.json`. Commit it with the workflow save step,
fill in your data, and omit `demo` for normal rendering.
Rendering settings are optional; omitted values come from that component's
`defaults.json`. See [minimal configuration](configuration.md).

```yaml
- name: Render stack
  uses: GreenZV/readme-blocks/components/stack@main
```

Data config paths cannot be customized. Theme overrides are read automatically from `.github/readme/theme.json` and
`.github/readme/themes/<component>.json`. No custom path input is supported.
[Theme resolution](../themes/README.md) describes precedence. Real contribution
config needs only your `username`. The SVG output, symbols,
weekday labels, and animation already have defaults and can be overridden
individually when needed.

```yaml
- name: Refresh real activity
  uses: GreenZV/readme-blocks/components/contribution@main
```

Run all configured components on every branch push, without path filters or changed-file
selection. Contribution can also run separately on a schedule. Commit both
`.github/readme/components/` and generated `assets/` in one final step. Skip absent
directories so the first normal run succeeds before any SVG exists.
The example workflow shows that step and its `contents: write` permission. Use
the same concurrency group for workflows that commit to the same branch; include
`${{ github.ref }}` so different branches have separate groups. Tag pushes are
excluded because these workflows write generated commits back to a branch.
Use a branch when starting a manual run as well.

Source modules use only Node.js built-ins. No Action imports another component,
the local full builder, preview code, or personal configs.
README layout and clickable links always remain hand-edited.

## Write-back and failed runs

The examples commit with the repository's default `GITHUB_TOKEN`, preserved by
checkout. A push made with this token does not trigger another push workflow,
so the generated commit does not create a rendering loop. This is independent
of the commit author's name or email. A custom PAT or GitHub App token changes
that behavior; see [GitHub's workflow-triggering documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).

The repository or organization must allow the workflow's `contents: write`
permission. Branch rules must also permit the generated commit. The examples
write directly to the checked-out branch; they do not create pull requests or
bypass protected-branch rules. No additional secret is needed for public
contribution data or for the default write-back flow.

The normal save step runs only when every preceding component succeeds. If one
component fails, already generated workspace files and new config templates are
not committed by that run. Previously committed assets stay unchanged. Read the
failed Action's error, correct the config or retry a transient network failure,
and rerun the whole workflow. Components themselves do not commit files.

When removing project/contact entries, remove their obsolete SVGs and README
links manually; normal generators do not delete old output files. If another
writer advances the branch after checkout, the final push can be rejected.
Concurrency serializes active runs in the same group; GitHub can replace an older
pending run with a newer one. It coordinates these workflows, but not unrelated human pushes; rerun
the workflow on the latest branch rather than force-pushing. See the
[GitHub workflow reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
for branch/tag filters and concurrency behavior.
