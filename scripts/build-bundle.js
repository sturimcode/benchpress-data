const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { validateRepo } = require('./validate.js');

function buildBundle(rootDir) {
  const { errors } = validateRepo(rootDir, null);
  if (errors.length > 0) {
    throw new Error(`refusing to bundle invalid data:\n${errors.join('\n')}`);
  }

  const tiers = JSON.parse(readFileSync(path.join(rootDir, 'tiers.json'), 'utf8'));
  const games = {};
  const files = readdirSync(path.join(rootDir, 'games'))
    .filter((f) => f.endsWith('.json'))
    .sort();
  for (const f of files) {
    const game = JSON.parse(readFileSync(path.join(rootDir, 'games', f), 'utf8'));
    games[game.identity.slug] = game;
  }

  return { schemaVersion: '1.0.0', tiers, games };
}

if (require.main === module) {
  const root = path.join(__dirname, '..');
  const bundle = buildBundle(root);
  mkdirSync(path.join(root, 'dist'), { recursive: true });
  const out = path.join(root, 'dist', 'bundle.json');
  writeFileSync(out, JSON.stringify(bundle, null, 2));
  console.log(`wrote ${out} with ${Object.keys(bundle.games).length} game(s)`);
}

module.exports = { buildBundle };
