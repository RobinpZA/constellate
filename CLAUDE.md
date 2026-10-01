# Notes for AI coding assistants

Context for Claude Code or similar tools working in Constellate, an interactive star chart of Microsoft 365.

- Static site, no build step. Do not introduce a bundler, framework or npm runtime dependencies without being asked.
- Content changes belong in `data/services.js`. Keep the schema in CONTRIBUTING.md in sync if you change it, and update `tools/validate-data.mjs` to match.
- Always run `npm run validate` after editing data.
- New services need a colour token in all three theme blocks of `assets/css/atlas.css`.
- Keep scripts as classic `<script>` tags (not ES modules) so `index.html` still opens from the file system.
- Stars and labels are counter-scaled with `--inv`; new SVG elements inside nodes should go in the `.inner` group, and new lines need `vector-effect: non-scaling-stroke`.
- UI copy uses sentence case and British/South African spelling (licence, centre, enrolment).
- Respect `prefers-reduced-motion` (`RM` in atlas.js) for any new animation.
