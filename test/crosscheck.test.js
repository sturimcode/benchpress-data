const test = require('node:test');
const assert = require('node:assert');
const { crossCheckGame } = require('../scripts/validate.js');
const { makeValidGame } = require('./helpers.js');

const tiers = {
  schemaVersion: '1.0.0',
  gpuTiers: { '3070-class': ['RTX 3070'] },
  cpuTiers: { 'r5-class': ['Ryzen 5 5600X'] }
};

test('crossCheckGame passes a consistent game', () => {
  const result = crossCheckGame(makeValidGame(), tiers);
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.ok, true);
});

test('rejects a setting pointing at an unknown fileId', () => {
  const game = makeValidGame();
  game.configMap.settings.shadows.fileId = 'nope';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /unknown fileId/);
});

test('rejects an impact entry for an undeclared setting', () => {
  const game = makeValidGame();
  game.impactTable[0].settingId = 'bloom';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /undeclared setting/);
});

test('rejects an impact entry with a value outside the declared enum', () => {
  const game = makeValidGame();
  game.impactTable[0].to = 'Potato';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /not in declared values/);
});

test('rejects a recommendation using an undeclared setting', () => {
  const game = makeValidGame();
  game.recommendations[0].settings.bloom = 'Off';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /undeclared setting/);
});

test('rejects a recommendation with an illegal enum value', () => {
  const game = makeValidGame();
  game.recommendations[0].settings.shadows = 'Extreme';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /not in declared values/);
});

test('rejects an unknown GPU tier in baselines or recommendations', () => {
  const game = makeValidGame();
  game.baselines[0].tier = '9999-class';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /unknown tier/);
});

test('rejects a bool setting given a non-boolean value', () => {
  const game = makeValidGame();
  game.configMap.settings.vsync = { fileId: 'main', key: '/graphics/Vsync', type: 'bool' };
  game.recommendations[0].settings.vsync = 'banana';
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /must be a boolean/);
});

test('rejects an int setting given a non-integer value', () => {
  const game = makeValidGame();
  game.configMap.settings.fpsCap = { fileId: 'main', key: '/graphics/FpsCap', type: 'int' };
  game.recommendations[0].settings.fpsCap = 2.5;
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /must be an integer/);
});

test('accepts valid typed bool, int, and float values', () => {
  const game = makeValidGame();
  game.configMap.settings.vsync = { fileId: 'main', key: '/graphics/Vsync', type: 'bool' };
  game.configMap.settings.fpsCap = { fileId: 'main', key: '/graphics/FpsCap', type: 'int' };
  game.configMap.settings.renderScale = { fileId: 'main', key: '/graphics/Scale', type: 'float' };
  game.recommendations[0].settings.vsync = true;
  game.recommendations[0].settings.fpsCap = 60;
  game.recommendations[0].settings.renderScale = 0.75;
  const result = crossCheckGame(game, tiers);
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.ok, true);
});

test('rejects duplicate recommendation ids', () => {
  const game = makeValidGame();
  game.recommendations.push(JSON.parse(JSON.stringify(game.recommendations[0])));
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /duplicate recommendation id/);
});

test('rejects duplicate configMap file ids', () => {
  const game = makeValidGame();
  game.configMap.files.push(JSON.parse(JSON.stringify(game.configMap.files[0])));
  const result = crossCheckGame(game, tiers);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /duplicate configMap file id/);
});
