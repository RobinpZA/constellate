<div align="center">

<img src="assets/icon.svg" alt="" width="72">

# Constellate

An interactive star chart of the Microsoft 365 estate. Each service is a constellation, each feature a star, with plain-language summaries, licence tiers and links straight to Microsoft Learn.

[Features](#features) • [Quick start](#quick-start) • [Project structure](#project-structure) • [Editing the data](#editing-the-data) • [Deployment](#deployment)

</div>

## Why

Microsoft 365 is hard to hold in your head. Customers hear "Entra", "Defender" and "Purview" and have no picture of what sits inside each one, how the parts relate, or what their licence actually unlocks. Constellate gives that picture in one screen, and makes licensing and upgrade conversations visual rather than a spreadsheet exercise.

## Features

- **Two-level map.** Services appear as bright stars in an overview; select one to zoom into its cluster of features.
- **Feature detail.** Each feature has a short summary, a licence tier, licensing caveats, and a Microsoft Learn link. Services also link to their admin centre.
- **Cross-service threads.** Selecting a feature draws lines to related features in other services, such as Conditional Access to Intune compliance and ID Protection.
- **Licence filter.** Pick a plan (Business Basic, Standard or Premium, Office 365 E1 or E3, Microsoft 365 E3, E5 or E7, or frontline F1 or F3) and optionally add the Defender and Purview Suites. Everything outside it dims, to show what an upgrade would unlock.
- **Search.** Matches names, acronyms (MDE, DLP, PIM, SPF) and summaries.
- **Light and dark themes.** Follows the system setting: a printed atlas in light mode, a night sky in dark mode.
- **Responsive and accessible.** Works on mobile with a bottom-sheet panel, supports keyboard navigation (Tab, Enter, Esc) and respects reduced motion.
- **No build step.** Plain HTML, CSS and JavaScript with D3 from a CDN.

> [!IMPORTANT]
> Licence tiers are indicative and simplified for conversation. Always confirm against current Microsoft licensing before quoting.

## Quick start

Open `index.html` directly in a browser, or serve it locally:

```powershell
git clone https://github.com/<your-account>/constellate.git
cd constellate
npm start          # serves on http://localhost:8080
```

`npm start` uses `npx http-server`, so the only requirement is Node.js 18 or later. VS Code's Live Server extension works too.

For first-time repo setup, GitHub Pages and branch protection, see [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

## Project structure

```text
index.html                 Page shell and markup
assets/css/atlas.css       Theme tokens, layout and SVG styling
assets/js/atlas.js         Rendering, zoom, selection, search and filter logic
assets/icon.svg            Favicon and logo
data/services.js           All content: services, features, licences, links
tools/validate-data.mjs    Data checks run locally and in CI
.github/workflows/         Validation, Pages deployment, weekly link check
docs/                      Setup guide, architecture notes, roadmap
```

## Editing the data

Almost every change happens in `data/services.js`. To add a feature, append an object to a service's `components` array:

```js
{
  id: 'ca',                               // unique, lowercase, hyphens allowed
  name: 'Conditional Access',
  lic: 'p1',                              // core | p1 | e5 | e7 | addon
  aka: 'CA policies zero trust',          // extra search terms
  docs: L + 'entra/identity/conditional-access/overview',
  summary: 'One or two plain sentences on what it does.',
  note: 'Optional licensing caveat.',
  related: ['intune-compliance', 'idp']   // component ids in any service
}
```

Then run:

```powershell
npm run validate
```

The validator checks for duplicate IDs, unknown licence tiers, broken `related` references, non-Learn doc URLs, overlong summaries and overlapping clusters. The full schema and writing guide are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Deployment

Pushing to `main` validates the data and publishes the site to GitHub Pages through `.github/workflows/pages.yml`. A scheduled workflow checks every documentation link weekly and opens an issue when Microsoft Learn URLs break.

> [!TIP]
> Because the site is static, you can also email or share `index.html` together with the `assets` and `data` folders, and it opens from the file system with no server.

## Documentation

- [Getting started](docs/GETTING-STARTED.md): repository creation, Pages and branch setup in PowerShell
- [Architecture](docs/ARCHITECTURE.md): how the map is built and the design decisions behind it
- [Roadmap](docs/ROADMAP.md): planned features and ideas
- [Contributing](CONTRIBUTING.md): data schema, writing style and pull request checklist
