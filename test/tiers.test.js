const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { validateTiers } = require('../scripts/validate.js');

test('validateTiers accepts the seed tiers.json', () => {
  const tiers = JSON.parse(
    readFileSync(path.join(__dirname, '..', 'tiers.json'), 'utf8')
  );
  const result = validateTiers(tiers);
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.ok, true);
});

test('validateTiers rejects an empty gpuTiers object', () => {
  const result = validateTiers({ schemaVersion: '1.0.0', gpuTiers: {}, cpuTiers: { x: ['a'] } });
  assert.strictEqual(result.ok, false);
});

test('validateTiers rejects a tier with no hardware listed', () => {
  const result = validateTiers({
    schemaVersion: '1.0.0',
    gpuTiers: { '3070-class': [] },
    cpuTiers: { 'r5-class': ['Ryzen 5 5600X'] }
  });
  assert.strictEqual(result.ok, false);
});
