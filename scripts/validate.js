const { readFileSync } = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

function loadSchema(name) {
  const file = path.join(__dirname, '..', 'schema', name);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function makeValidator(schemaFile) {
  const compiled = ajv.compile(loadSchema(schemaFile));
  return function validate(obj) {
    const valid = compiled(obj);
    const errors = valid
      ? []
      : compiled.errors.map((e) => `${e.instancePath || '(root)'} ${e.message}`);
    return { ok: valid, errors };
  };
}

const validateGame = makeValidator('game.schema.json');

module.exports = { validateGame };
