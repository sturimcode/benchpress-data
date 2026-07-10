const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { validateRepo } = require('../scripts/validate.js');

const fixtures = path.join(__dirname, 'fixtures');

test('validateRepo rejects two game files sharing a slug', () => {
  const { errors } = validateRepo(path.join(fixtures, 'dup-slug'), null);
  assert.ok(
    errors.some((e) => /already used by/.test(e)),
    errors.join('\n')
  );
});

test('validateRepo rejects a game file whose name does not match its slug', () => {
  const { errors } = validateRepo(path.join(fixtures, 'slug-mismatch'), null);
  assert.ok(
    errors.some((e) => /filename does not match identity\.slug/.test(e)),
    errors.join('\n')
  );
});

test('validateRepo reports malformed JSON instead of throwing', () => {
  let result;
  assert.doesNotThrow(() => {
    result = validateRepo(path.join(fixtures, 'malformed-json'), null);
  });
  assert.ok(
    result.errors.some((e) => /invalid JSON/.test(e)),
    result.errors.join('\n')
  );
});

test('validateRepo returns the tiers error without throwing on schema-invalid tiers.json', () => {
  let result;
  assert.doesNotThrow(() => {
    result = validateRepo(path.join(fixtures, 'invalid-root'), null);
  });
  assert.ok(
    result.errors.some((e) => /^tiers\.json:/.test(e)),
    result.errors.join('\n')
  );
});
