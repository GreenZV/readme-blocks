![Example terminal banner](assets/banner.svg)

# README components — demo

A complete example using the built-in **monochrome** theme. All names, projects,
skills and activity below are demonstration data, not a developer's actual profile.
Both light and dark appearances are included in each SVG.

## Available themes

<!-- readme-blocks:themes:start -->

| Theme | Light accent | Dark accent | Banner preview |
| --- | --- | --- | --- |
| [monochrome](../../themes/monochrome.json) | `#262626` | `#e5e5e5` | [Preview](../../components/banner/README.md#monochrome) |
| [amber](../../themes/amber.json) | `#a16207` | `#fbbf24` | [Preview](../../components/banner/README.md#amber) |
| [crimson](../../themes/crimson.json) | `#b91c1c` | `#f87171` | [Preview](../../components/banner/README.md#crimson) |
| [emerald](../../themes/emerald.json) | `#047857` | `#34d399` | [Preview](../../components/banner/README.md#emerald) |
| [ocean](../../themes/ocean.json) | `#0369a1` | `#38bdf8` | [Preview](../../components/banner/README.md#ocean) |
| [violet](../../themes/violet.json) | `#6d28d9` | `#a78bfa` | [Preview](../../components/banner/README.md#violet) |

<!-- readme-blocks:themes:end -->

Browse [component pages](../../README.md#components) to compare every built-in
theme, or read about [automatic theme overrides](../../themes/README.md).

Keep the components you need, change their order, and edit this README manually.
You can replace demo data later without changing the standard asset paths.

## Current focus

![Example current focus](assets/now.svg)

## Contribution calendar

![Synthetic contribution calendar with sample activity](assets/contributions.svg)

The calendar is generated offline from a fixed seed. It does not fetch or claim
anyone's GitHub activity.

## Projects

Sample links lead to GitHub. Replace them with your repository URLs.

<table>
  <tr>
    <td><a href="https://github.com/"><img src="assets/projects/demo-java-service.svg" width="430" alt="Java Service — In development"></a></td>
    <td><a href="https://github.com/"><img src="assets/projects/demo-event-worker.svg" width="430" alt="Event Worker — Completed"></a></td>
  </tr>
  <tr>
    <td><a href="https://github.com/"><img src="assets/projects/demo-deployment-kit.svg" width="430" alt="Deployment Kit — On hold"></a></td>
    <td><a href="https://github.com/"><img src="assets/projects/demo-observability-lab.svg" width="430" alt="Observability Lab — Experimental"></a></td>
  </tr>
  <tr>
    <td><a href="https://github.com/"><img src="assets/projects/demo-api-contracts.svg" width="430" alt="API Contracts — Maintained"></a></td>
    <td><a href="https://github.com/"><img src="assets/projects/demo-backend-utilities.svg" width="430" alt="Backend Utilities — Archived"></a></td>
  </tr>
</table>

## Stack

![Example backend stack](assets/stack.svg)

## Experience

![Example Python and C++ experience](assets/experience.svg)

## Toolbox

![Example development tools](assets/toolbox.svg)

## Other technologies

![Example additional tools and technologies](assets/additional-experience.svg)

## Contact

Example platforms only. Wrap the images you want in your own links and remove the rest.

<p align="center">
<img src="assets/contacts/email.svg" height="46" alt="Email">
<img src="assets/contacts/telegram.svg" height="46" alt="Telegram">
<img src="assets/contacts/discord.svg" height="46" alt="Discord">
<img src="assets/contacts/linkedin.svg" height="46" alt="LinkedIn">
<img src="assets/contacts/github.svg" height="46" alt="GitHub">
<img src="assets/contacts/gitlab.svg" height="46" alt="GitLab">
<img src="assets/contacts/leetcode.svg" height="46" alt="LeetCode">
<img src="assets/contacts/codeforces.svg" height="46" alt="Codeforces">
<img src="assets/contacts/stackoverflow.svg" height="46" alt="Stack Overflow">
<img src="assets/contacts/x.svg" height="46" alt="X (Twitter)">
<img src="assets/contacts/facebook.svg" height="46" alt="Facebook">
<img src="assets/contacts/mastodon.svg" height="46" alt="Mastodon">
<img src="assets/contacts/devdotto.svg" height="46" alt="DEV Community">
<img src="assets/contacts/medium.svg" height="46" alt="Medium">
<img src="assets/contacts/website.svg" height="46" alt="Website">
<img src="assets/contacts/codewars.svg" height="46" alt="Codewars">
</p>

## Use this example

Copy this README into your profile repository. Use the component steps from
[workflow.yml](workflow.yml), keeping only the ones you need. The example uses `GreenZV/readme-blocks@main`.

On the first run, each Action creates its minimal config automatically at
`.github/readme/components/<component>.json` when missing. The workflow saves these
templates together with the demo SVGs; existing configs are never overwritten.

To switch to your own data, fill in the generated configs and remove `demo: 'true'`
from those Action steps. If no other inputs remain, remove the `with` block too.
Config paths are discovered automatically and are not workflow inputs. Adjust
README image paths when changing project or contact slugs. Follow the
[main setup and configuration guide](../../README.md#configure-your-data) and each
[component's instructions](../../README.md#components) for details.

### Demo icon sources

Stack, experience and contact configs reference version-pinned HTTPS SVG URLs.
The build downloads icons into memory and embeds them in the generated images;
no standalone logo files are included in the library. These demos require network
access when building, while the completed README images are self-contained.
Email and website demonstrate badges without an icon. Your own configs can use
local SVG paths or HTTPS URLs; see [icon configuration](../../docs/configuration.md#icons).
