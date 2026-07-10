const test = require('node:test');
const assert = require('node:assert');
const { validateGame } = require('../scripts/validate.js');
const { makeValidGame } = require('./helpers.js');

test('validateGame accepts a valid game file', () => {
  const result = validateGame(makeValidGame());
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.ok, true);
});

test('validateGame rejects a game with no identity block', () => {
  const game = makeValidGame();
  delete game.identity;
  const result = validateGame(game);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join(' '), /identity/);
});

test('validateGame rejects a bad slug', () => {
  const game = makeValidGame();
  game.identity.slug = 'Not A Slug!';
  const result = validateGame(game);
  assert.strictEqual(result.ok, false);
});

test('validateGame rejects unknown top-level keys', () => {
  const game = makeValidGame();
  game.extra = true;
  const result = validateGame(game);
  assert.strictEqual(result.ok, false);
});

test('validateGame rejects an enum setting missing its values', () => {
  const game = makeValidGame();
  delete game.configMap.settings.shadows.values;
  const result = validateGame(game);
  assert.strictEqual(result.ok, false);
});
