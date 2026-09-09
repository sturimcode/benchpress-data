const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('validate CLI passes on the real repo data', () => {
  const run = spawnSync('node', ['scripts/validate.js'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /games checked: [1-9]/);
});

test('validate CLI fails on a broken game file', () => {
  const run = spawnSync(
    'node',
    ['scripts/validate.js', '--game', 'test/fixtures/broken-game.json'],
    { cwd: root, encoding: 'utf8' }
  );
  assert.strictEqual(run.status, 1);
  assert.match(run.stdout, /games checked: 1, reports checked: \d+/);
  assert.match(run.stderr, /FAIL test[\\/]fixtures[\\/]broken-game\.json:/);
});

test('validate CLI errors when --game has no following value', () => {
  const run = spawnSync('node', ['scripts/validate.js', '--game'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.strictEqual(run.status, 1);
  assert.match(run.stderr, /--game requires a file path/);
});
