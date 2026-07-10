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

function crossCheckGame(game, tiers) {
  const errors = [];
  const fileIds = new Set(game.configMap.files.map((f) => f.id));
  const settings = game.configMap.settings;
  const tierNames = new Set(Object.keys(tiers.gpuTiers));

  for (const [id, s] of Object.entries(settings)) {
    if (!fileIds.has(s.fileId)) {
      errors.push(`setting "${id}" references unknown fileId "${s.fileId}"`);
    }
  }

  function checkValue(settingId, value, where) {
    const s = settings[settingId];
    if (!s) {
      errors.push(`${where} references undeclared setting "${settingId}"`);
      return;
    }
    if (s.type === 'enum' && s.values && !s.values.includes(value)) {
      errors.push(`${where}: value "${value}" for "${settingId}" not in declared values`);
    }
  }

  for (const entry of game.impactTable) {
    checkValue(entry.settingId, entry.from, 'impactTable');
    checkValue(entry.settingId, entry.to, 'impactTable');
  }

  for (const rec of game.recommendations) {
    for (const [settingId, value] of Object.entries(rec.settings)) {
      checkValue(settingId, value, `recommendation "${rec.id}"`);
    }
    if (!tierNames.has(rec.tier)) {
      errors.push(`recommendation "${rec.id}" uses unknown tier "${rec.tier}"`);
    }
  }

  for (const b of game.baselines) {
    if (!tierNames.has(b.tier)) {
      errors.push(`baseline uses unknown tier "${b.tier}"`);
    }
  }

  return { ok: errors.length === 0, errors };
}

const validateTiers = makeValidator('tiers.schema.json');

const validateReport = makeValidator('report.schema.json');

module.exports = { validateGame, crossCheckGame, validateTiers, validateReport };
