const test = require('node:test');
const assert = require('node:assert');
const { validateReport } = require('../scripts/validate.js');

function makeValidReport() {
  return {
    schemaVersion: '1.0.0',
    submittedAt: '2026-07-10',
    game: { slug: 'example-game', gameVersion: '2.3' },
    hardware: {
      gpu: 'RTX 3070',
      cpu: 'Ryzen 5 5600X',
      ramGb: 32,
      resolution: '2560x1440',
      driverVersion: '576.02'
    },
    settings: { shadows: 'Medium' },
    results: { avgFps: 67.4, onePercentLowFps: 51.2 },
    methodology: { type: 'built-in-benchmark' }
  };
}

test('validateReport accepts a valid built-in benchmark report', () => {
  const result = validateReport(makeValidReport());
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.ok, true);
});

test('free-play methodology requires a duration', () => {
  const report = makeValidReport();
  report.methodology = { type: 'free-play' };
  const result = validateReport(report);
  assert.strictEqual(result.ok, false);
});

test('free-play with duration is valid', () => {
  const report = makeValidReport();
  report.methodology = { type: 'free-play', durationSec: 120 };
  const result = validateReport(report);
  assert.strictEqual(result.ok, true);
});

test('accepts an optional delta block', () => {
  const report = makeValidReport();
  report.delta = { settingId: 'shadows', from: 'High', to: 'Medium', comparedToAvgFps: 63.1 };
  const result = validateReport(report);
  assert.strictEqual(result.ok, true);
});

test('rejects a report with no results', () => {
  const report = makeValidReport();
  delete report.results;
  const result = validateReport(report);
  assert.strictEqual(result.ok, false);
});
