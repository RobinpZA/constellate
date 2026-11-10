import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAtlas } from './helpers.mjs';

const ATLAS = loadAtlas();
const DEF = { id: null, plan: 'all', suites: [] };
const plain = (o) => JSON.parse(JSON.stringify(o)); // vm-realm objects fail strict deepEqual on prototypes
const parse = (h) => plain(ATLAS.parseHash(h));

test('empty hash is the default state', () => {
  assert.deepEqual(parse(''), DEF);
  assert.deepEqual(parse('#'), DEF);
});
test('component and service ids', () => {
  assert.equal(parse('#ca').id, 'ca');
  assert.equal(parse('#entra').id, 'entra');
});
test('plan and suites', () => {
  assert.deepEqual(parse('#ca?plan=e3&suites=defender+purview'),
    { id: 'ca', plan: 'e3', suites: ['defender', 'purview'] });
});
test('plan without an id', () => {
  assert.deepEqual(parse('#?plan=addon'), { id: null, plan: 'addon', suites: [] });
});
test('unknown values fall back', () => {
  assert.deepEqual(parse('#nope?plan=zz&suites=x'), DEF);
});
test('suites dropped on plans that cannot take them', () => {
  assert.deepEqual(parse('#ca?plan=bb&suites=defender').suites, []);
});
test('malformed escapes do not throw', () => {
  assert.deepEqual(parse('#%E0%A4%A'), DEF);
});
test('suites keep data order', () => {
  assert.deepEqual(parse('#?plan=e3&suites=purview+defender').suites, ['defender', 'purview']);
});
test('format defaults to empty', () => {
  assert.equal(ATLAS.formatHash({ id: null, plan: 'all', suites: [] }), '');
});
test('format round trip', () => {
  const s = { id: 'mdi', plan: 'f1', suites: ['defender'] };
  assert.equal(ATLAS.formatHash(s), '#mdi?plan=f1&suites=defender');
  assert.deepEqual(parse(ATLAS.formatHash(s)), s);
});
test('format drops stale suites and default plan', () => {
  assert.equal(ATLAS.formatHash({ id: 'ca', plan: 'bb', suites: ['defender'] }), '#ca?plan=bb');
  assert.equal(ATLAS.formatHash({ id: 'ca', plan: 'all', suites: [] }), '#ca');
});
