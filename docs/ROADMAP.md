# Roadmap

Ideas in rough priority order. Move items into GitHub issues as work starts.

## Near term

- [ ] **Deep links.** Put the selected node in the URL hash (`#ca`) so a specific feature can be shared or linked from a proposal.
- [ ] **More constellations.** Decide whether Windows 365 joins Intune or gets its own. Consider Azure as a separate atlas.
- [ ] **Entra Verified ID.** Left out of the October 2026 gap fill because Entra is at the 12-component limit. Needs a swap or a split.
- [ ] **Theme toggle.** A button that sets `data-theme` on `<html>`, remembered in `localStorage`.
- [ ] **Export view.** Download the current view as PNG or SVG for decks and proposals.
- [x] **Licensing review.** All 121 components checked against Microsoft Learn and the service plan CSV on 1 October 2026; date recorded in the data file.
- [x] **Plan-based filter.** Business Basic, Standard and Premium, Office 365 E1, and Microsoft 365 E3, E5 and E7, with add-on suites as a separate control.
- [x] **Frontline and Office 365 E3 plans.** F1, F3 and Office 365 E3 added on 1 October 2026, checked against the service plan CSV and Microsoft Learn.
- [ ] **Plan follow-ups.** Confirm Microsoft 365 F3 gets eDiscovery (Standard): Learn names Office 365 F3 only. Confirm the Purview Suite FLW covers Information Barriers and DSPM for AI (Learn publishes no plan list for either). Check whether the suites can be added to Office 365 E3.
- [ ] **Licensing follow-ups.** Recheck Copilot Pages & Notebooks (whether Copilot Chat users get them without a licence) and Copilot Tuning (no published licensing yet). Repeat the full review each quarter.

## Medium term

- [ ] **Licence comparison mode.** Pick a current plan and a target plan; highlight only what the upgrade adds.
- [ ] **Tenant overlay.** Read licences and feature state from Microsoft Graph (subscribed SKUs, Conditional Access policies, Intune enrolment counts, Secure Score) and colour stars by licensed, configured, or unused. Probably a PowerShell script that exports a JSON snapshot the page can load, so no credentials go near the browser.
- [ ] **Customer view.** A read-only mode with presenter notes hidden and customer branding.

## Maintenance

- [ ] Weekly link check (done: `.github/workflows/link-check.yml`).
- [ ] Quarterly content review against Microsoft 365 roadmap and Message Center renames.
