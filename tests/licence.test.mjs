import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAtlas, byId } from './helpers.mjs';

const ATLAS = loadAtlas();
const t = (id, plan, suites) => ATLAS.inPlan(byId(ATLAS, id), plan, suites);

test('everything shows all', () => {
  assert.equal(t('sentinel', 'all', []), true);
});
test('add-ons only', () => {
  assert.equal(t('sentinel', 'addon', []), true);
  assert.equal(t('ca', 'addon', []), false);
});
test('Business Basic is core only', () => {
  assert.equal(t('mailboxes', 'bb', []), true);
  assert.equal(t('dlp', 'bb', []), false);
  assert.equal(t('desktop-apps', 'bb', []), false);
});
test('Business Standard adds the apps', () => {
  assert.equal(t('desktop-apps', 'bs', []), true);
});
test('Office 365 E3 has no Entra P1 or MDE', () => {
  assert.equal(t('ca', 'o3', []), false);
  assert.equal(t('mde', 'o3', []), false);
  assert.equal(t('dlp', 'o3', []), true);
  assert.equal(t('mdo', 'o3', []), true);
});
test('E3 suites unlock their own components', () => {
  assert.equal(t('mdi', 'e3', []), false);
  assert.equal(t('mdi', 'e3', ['defender']), true);
  assert.equal(t('irm', 'e3', ['defender']), false);
  assert.equal(t('irm', 'e3', ['purview']), true);
});
test('suites do nothing on plans that cannot take them', () => {
  assert.equal(t('mdi', 'bb', ['defender']), false);
});
test('F1 exclusions and extras', () => {
  assert.equal(t('mailboxes', 'f1', []), false);
  assert.equal(t('ca', 'f1', []), true);
  assert.equal(t('mde', 'f1', []), false);
  assert.equal(t('mde', 'f1', ['defender']), true);
  assert.equal(t('pim', 'f1', ['purview']), false);
});
test('Entra ID P2 on frontline comes only with the Defender suite', () => {
  assert.equal(t('pim', 'f1', ['purview']), false);
  assert.equal(t('pim', 'f1', ['defender']), true);
  assert.equal(t('idp', 'f3', ['purview']), false);
  assert.equal(t('idp', 'f3', ['defender']), true);
});
test('DSPM for AI is not in the frontline suites', () => {
  assert.equal(t('dspmai', 'f1', ['purview']), false);
  assert.equal(t('dspmai', 'f3', ['defender', 'purview']), false);
  assert.equal(t('dspmai', 'e3', ['purview']), true);
});
test('F3 archive needs the Purview Suite', () => {
  assert.equal(t('archiving', 'f3', []), false);
  assert.equal(t('archiving', 'f3', ['purview']), true);
});
test('E5 stops below E7 and add-ons', () => {
  assert.equal(t('mdi', 'e5', []), true);
  assert.equal(t('iga', 'e5', []), false);
  assert.equal(t('sentinel', 'e5', []), false);
});
test('E7 excludes add-ons', () => {
  assert.equal(t('iga', 'e7', []), true);
  assert.equal(t('sentinel', 'e7', []), false);
});
