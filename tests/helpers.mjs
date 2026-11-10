// Loads data/services.js and the pure scripts in assets/js/ (all but atlas.js) into one vm context.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));

export function loadAtlas() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const run = rel => vm.runInContext(readFileSync(path.join(root, rel), 'utf8'), sandbox, { filename: rel });
  run('data/services.js');
  const jsDir = path.join(root, 'assets', 'js');
  for (const f of readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'atlas.js').sort()) run(`assets/js/${f}`);
  return sandbox.window.ATLAS;
}

export function byId(ATLAS, id) {
  for (const s of ATLAS.SERVICES) for (const c of s.components ?? []) if (c.id === id) return c;
  throw new Error(`Unknown component id: ${id}`);
}
