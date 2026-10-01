# Contributing

Most contributions are content: correcting a summary, updating a licence tier, fixing a moved link or adding a feature. All of that lives in `data/services.js`.

## Workflow

1. Create a branch: `git switch -c data/update-purview-labels`.
2. Edit `data/services.js`.
3. Run `npm run validate` and fix any errors. Review warnings.
4. Open `index.html` and check the change on the map (zoom in, select the item, check the threads).
5. Open a pull request. CI runs the validator again.

## Data schema

`data/services.js` returns five things.

### `LIC`: licence tiers

| Key | Label | Meaning |
| --- | --- | --- |
| `core` | Core Microsoft 365 | Available across most business and enterprise suites |
| `p1` | Business Premium / E3 | Needs Entra ID P1, Intune, Defender P1 level or similar |
| `e5` | E5 / P2 | Needs E5, E5 Security/Compliance, or P2 plans |
| `e7` | E7 (Frontier Suite) | Needs E7: E5 plus Microsoft 365 Copilot, Agent 365 and the Entra Suite |
| `addon` | Add-on | Sold separately, not included in any suite above |

`core`, `p1`, `e5` and `e7` are cumulative, and `addon` is separate. Tag each component with the lowest enterprise tier that includes it. Plans that don't fit the ladder are handled in `PLANS`, not by changing the tier. Use `note` to explain anything else the tier can't express, such as "Plan 1 in E3, Plan 2 in E5".

### `SUITES`: add-on suites

| Key | Label | Meaning |
| --- | --- | --- |
| `defender` | Defender Suite | Formerly E5 Security. Entra ID P2 and the E5 Defender workloads, as an add-on to E3 or Business Premium. A frontline (FLW) version adds to F1 and F3 |
| `purview` | Purview Suite | Formerly E5 Compliance. E5 Purview features, as an add-on to E3 or Business Premium. A frontline (FLW) version adds to F1 and F3 |

Tag an `e5` component with `suite: 'defender'` or `suite: 'purview'` when that suite unlocks it without E5. The filter then lights it up when a plan with `suites: true` is chosen and that suite is added.

### `PLANS`: the licence filter

Each plan is one option in the filter. A plan includes every component up to its `upTo` tier, plus any component IDs in `with`, minus any in `without`.

| Field | Required | Meaning |
| --- | --- | --- |
| `label` | yes | Option text, e.g. "Business Standard" |
| `upTo` | yes | `core`, `p1`, `e5` or `e7` |
| `with` | no | Component IDs above `upTo` that this plan still includes |
| `without` | no | Component IDs at or below `upTo` that this plan lacks |
| `suites` | no | `true` if the Defender and Purview Suites can be added to it. Or an object such as `{defender:['mde'], purview:['dlp']}` when the plan's suite version (e.g. the frontline FLW suites) also adds components the plan lacks |

Example: Business Standard is `upTo:'core'` with the Microsoft 365 Apps features in `with`, because it has the desktop apps but not Intune or Conditional Access. The validator warns when a `with` or `without` entry has no effect. When a plan's `with` names a component, its panel shows an extra "or <plan>" chip.

### `SERVICES`: constellations

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Also used as the CSS colour token name: `--<id>` in `atlas.css` |
| `name` | string | Full product name, shown in the panel |
| `short` | string | Label under the star and in breadcrumbs |
| `x`, `y` | number | Position in world units (roughly 0–1600 by 0–1100). Keep services 330+ apart |
| `angle` | number | Radians. Rotates where the first component sits, to steer clusters away from neighbours |
| `summary` | string | One or two sentences |
| `docs` | string | Microsoft Learn overview page |
| `portal` | string | Admin centre URL |
| `components` | array | 6–12 features works best visually |

### Components: stars

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique across the whole file. Lowercase, digits, hyphens |
| `name` | yes | As Microsoft names it today |
| `lic` | yes | One of the `LIC` keys |
| `summary` | yes | Under 240 characters |
| `docs` | yes | Microsoft Learn URL, `en-us` locale. Use the `L` prefix constant |
| `note` | no | Licensing caveat, under 160 characters |
| `aka` | no | Space-separated search terms: acronyms, old names |
| `related` | no | Component IDs this works with. One direction is enough; the app makes links two-way |
| `suite` | no | `e5` components only: the `SUITES` key that unlocks it on E3 or Business Premium |

### `LINKS`: dashed lines between services

Pairs of service IDs, for example `['entra', 'intune']`.

## Adding a new service

1. Add the service object to `SERVICES` with an unused position.
2. Add a colour token for it in `assets/css/atlas.css` in all three theme blocks (light `:root`, dark media query, and `[data-theme="dark"]`). Use a darker, saturated tone for light mode and a pale, luminous tone for dark mode.
3. Add any `LINKS` pairs.
4. Run the validator and check the layout. Adjust `x`, `y` and `angle` until labels don't collide.

## Writing style

- Describe what it does for the customer, in plain language. "Lets people reset their own passwords" beats "Provides SSPR capability".
- Sentence case, active voice, no marketing adjectives.
- Name things the way Microsoft currently does, and put old names in `aka` (for example, "Azure AD Connect" under hybrid identity sync).
- Lead with the capability; put licensing nuance in `note`, not `summary`.
- South African / British spelling in UI copy (licence, centre, enrolment).

## Pull request checklist

- [ ] `npm run validate` passes
- [ ] Checked the change visually in light and dark themes
- [ ] Licence changes include a source link in the PR description
