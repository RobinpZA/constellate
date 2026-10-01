#!/usr/bin/env node
// Validates data/services.js: IDs, licence tiers, cross-links, doc URLs and summary length.
// Usage: node tools/validate-data.mjs   (or: npm run validate)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const file = fileURLToPath(new URL('../data/services.js', import.meta.url));
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(file, 'utf8'), sandbox, { filename: 'data/services.js' });
const { LIC, SUITES, PLANS, SERVICES, LINKS } = sandbox.window.ATLAS ?? {};

const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

if (!LIC || !SUITES || !PLANS || !SERVICES || !LINKS) { console.error('data/services.js must return { LIC, SUITES, PLANS, SERVICES, LINKS }'); process.exit(1); }

// --urls: print every docs URL, one per line, for the link checker (URLs are built from L + path, so they can't be scraped from source).
if (process.argv.includes('--urls')) {
  const urls = new Set(SERVICES.flatMap(s => [s.docs, ...(s.components ?? []).map(c => c.docs)]).filter(Boolean));
  console.log([...urls].join('\n'));
  process.exit(0);
}

const ids = new Map();
const MAX_SUMMARY = 240;
const DOC_PREFIX = 'https://learn.microsoft.com/';

for (const s of SERVICES) {
  for (const k of ['id', 'name', 'short', 'summary', 'docs', 'portal', 'x', 'y', 'angle', 'components'])
    if (s[k] === undefined) err(`service "${s.id ?? '?'}": missing "${k}"`);
  if (ids.has(s.id)) err(`duplicate id "${s.id}"`); ids.set(s.id, 'svc');
  if (s.docs && !s.docs.startsWith(DOC_PREFIX)) warn(`service "${s.id}": docs is not a Microsoft Learn URL`);
  if (!s.portal?.startsWith('https://')) err(`service "${s.id}": portal must be https`);
  if (!s.components?.length) err(`service "${s.id}": has no components`);
  if (s.components?.length > 12) warn(`service "${s.id}": ${s.components.length} components; clusters get crowded above 12`);

  for (const c of s.components ?? []) {
    const where = `${s.id} > ${c.id ?? '?'}`;
    for (const k of ['id', 'name', 'lic', 'summary', 'docs'])
      if (!c[k]) err(`${where}: missing "${k}"`);
    if (!/^[a-z0-9-]+$/.test(c.id ?? '')) err(`${where}: id must be lowercase letters, digits and hyphens`);
    if (ids.has(c.id)) err(`duplicate id "${c.id}"`); ids.set(c.id, 'cmp');
    if (c.lic && !LIC[c.lic]) err(`${where}: unknown licence tier "${c.lic}" (use ${Object.keys(LIC).join(', ')})`);
    if (c.suite !== undefined) {
      if (!SUITES?.[c.suite]) err(`${where}: unknown suite "${c.suite}" (use ${Object.keys(SUITES ?? {}).join(', ')})`);
      if (c.lic !== 'e5') err(`${where}: suite only applies to e5 components (this one is "${c.lic}")`);
    }
    if (c.docs && !c.docs.startsWith(DOC_PREFIX)) warn(`${where}: docs is not a Microsoft Learn URL`);
    if (c.docs?.includes('/en-us/') === false) warn(`${where}: docs URL has no /en-us/ locale`);
    if ((c.summary ?? '').length > MAX_SUMMARY) warn(`${where}: summary is ${c.summary.length} chars (aim for under ${MAX_SUMMARY})`);
    if (c.note && c.note.length > 160) warn(`${where}: note is long (${c.note.length} chars)`);
  }
}

for (const s of SERVICES) for (const c of s.components ?? []) for (const r of c.related ?? []) {
  if (r === c.id) err(`${c.id}: relates to itself`);
  else if (!ids.has(r)) err(`${c.id}: related id "${r}" does not exist`);
  else if (ids.get(r) !== 'cmp') err(`${c.id}: related id "${r}" is a service; relate to components only`);
}

// Plans: a valid tier, and with/without lists that name real components and aren't redundant.
const cmpById = new Map(SERVICES.flatMap(s => (s.components ?? []).map(c => [c.id, c])));
for (const [k, p] of Object.entries(PLANS)) {
  if (['all', 'addon'].includes(k)) err(`PLANS: "${k}" is reserved for the filter`);
  if (!p.label) err(`PLANS.${k}: missing "label"`);
  if (!LIC[p.upTo] || p.upTo === 'addon') { err(`PLANS.${k}: upTo must be core, p1, e5 or e7 (got "${p.upTo}")`); continue; }
  const rank = LIC[p.upTo].rank;
  for (const id of p.with ?? []) {
    const c = cmpById.get(id);
    if (!c) err(`PLANS.${k}.with: "${id}" is not a component id`);
    else if (c.lic !== 'addon' && LIC[c.lic].rank <= rank) warn(`PLANS.${k}.with: "${id}" is already included by upTo "${p.upTo}"`);
  }
  for (const id of p.without ?? []) {
    const c = cmpById.get(id);
    if (!c) err(`PLANS.${k}.without: "${id}" is not a component id`);
    else if (c.lic === 'addon' || LIC[c.lic].rank > rank) warn(`PLANS.${k}.without: "${id}" isn't included by upTo "${p.upTo}" anyway`);
  }
  if (p.suites !== undefined && p.suites !== true) {
    if (typeof p.suites !== 'object') err(`PLANS.${k}.suites: use true or { suiteKey: [component ids] }`);
    else for (const [s, ids] of Object.entries(p.suites)) {
      if (!SUITES[s]) err(`PLANS.${k}.suites: unknown suite "${s}"`);
      for (const id of ids) {
        const c = cmpById.get(id);
        if (!c) err(`PLANS.${k}.suites.${s}: "${id}" is not a component id`);
        else if (p.with?.includes(id) || (c.lic !== 'addon' && LIC[c.lic].rank <= rank) || c.suite === s)
          warn(`PLANS.${k}.suites.${s}: "${id}" is already included without the suite`);
      }
    }
  }
}

for (const [a, b] of LINKS) {
  if (ids.get(a) !== 'svc' || ids.get(b) !== 'svc') err(`LINKS: [${a}, ${b}] must reference two service ids`);
}

// Services placed too close together will have overlapping clusters.
for (let i = 0; i < SERVICES.length; i++) for (let j = i + 1; j < SERVICES.length; j++) {
  const a = SERVICES[i], b = SERVICES[j], d = Math.hypot(a.x - b.x, a.y - b.y);
  if (d < 330) warn(`services "${a.id}" and "${b.id}" are ${Math.round(d)} units apart; clusters may overlap (aim for 330+)`);
}

const count = SERVICES.reduce((n, s) => n + (s.components?.length ?? 0), 0);
warnings.forEach(w => console.warn(`warn   ${w}`));
errors.forEach(e => console.error(`error  ${e}`));
console.log(`\n${SERVICES.length} services, ${count} components, ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
