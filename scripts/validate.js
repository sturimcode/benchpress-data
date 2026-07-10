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

  const seenFileIds = new Set();
  for (const f of game.configMap.files) {
    if (seenFileIds.has(f.id)) {
      errors.push(`duplicate configMap file id "${f.id}"`);
    }
    seenFileIds.add(f.id);
  }

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
    if (s.type === 'enum') {
      if (s.values && !s.values.includes(value)) {
        errors.push(`${where}: value "${value}" for "${settingId}" not in declared values`);
      }
    } else if (s.type === 'bool') {
      if (typeof value !== 'boolean') {
        errors.push(`${where}: value "${value}" for "${settingId}" must be a boolean`);
      }
    } else if (s.type === 'int') {
      if (!Number.isInteger(value)) {
        errors.push(`${where}: value "${value}" for "${settingId}" must be an integer`);
      }
    } else if (s.type === 'float') {
      if (typeof value !== 'number') {
        errors.push(`${where}: value "${value}" for "${settingId}" must be a number`);
      }
    }
  }

  for (const entry of game.impactTable) {
    checkValue(entry.settingId, entry.from, 'impactTable');
    checkValue(entry.settingId, entry.to, 'impactTable');
  }

  const seenRecIds = new Set();
  for (const rec of game.recommendations) {
    if (seenRecIds.has(rec.id)) {
      errors.push(`duplicate recommendation id "${rec.id}"`);
    }
    seenRecIds.add(rec.id);
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

function validateRepo(rootDir, gameOverride) {
  const { readdirSync, existsSync } = require('node:fs');
  const errors = [];

  function readJsonFile(relFile) {
    try {
      return JSON.parse(readFileSync(path.join(rootDir, relFile), 'utf8'));
    } catch (err) {
      errors.push(`${relFile}: invalid JSON (${err.message})`);
      return null;
    }
  }

  const tiers = readJsonFile('tiers.json');
  let tiersOk = false;
  if (tiers !== null) {
    const tiersResult = validateTiers(tiers);
    errors.push(...tiersResult.errors.map((e) => `tiers.json: ${e}`));
    tiersOk = tiersResult.ok;
  }

  let gameFiles;
  if (gameOverride) {
    gameFiles = [gameOverride];
  } else {
    gameFiles = readdirSync(path.join(rootDir, 'games'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join('games', f));
  }

  const slugToFile = new Map();
  for (const file of gameFiles) {
    const game = readJsonFile(file);
    if (game === null) continue;
    const shape = validateGame(game);
    errors.push(...shape.errors.map((e) => `${file}: ${e}`));
    if (shape.ok) {
      if (!gameOverride) {
        const slug = game.identity.slug;
        if (slugToFile.has(slug)) {
          errors.push(`${file}: identity.slug "${slug}" is already used by ${slugToFile.get(slug)}`);
        } else {
          slugToFile.set(slug, file);
        }
        const expected = `${slug}.json`;
        if (path.basename(file) !== expected) {
          errors.push(`${file}: filename does not match identity.slug (expected ${expected})`);
        }
      }
      if (tiersOk) {
        const refs = crossCheckGame(game, tiers);
        errors.push(...refs.errors.map((e) => `${file}: ${e}`));
      }
    }
  }

  let reportCount = 0;
  const reportsDir = path.join(rootDir, 'reports');
  if (existsSync(reportsDir)) {
    for (const f of readdirSync(reportsDir).filter((f) => f.endsWith('.json'))) {
      reportCount += 1;
      const report = readJsonFile(path.join('reports', f));
      if (report === null) continue;
      const result = validateReport(report);
      errors.push(...result.errors.map((e) => `reports/${f}: ${e}`));
    }
  }

  return { errors, gameCount: gameFiles.length, reportCount };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const gameFlag = args.indexOf('--game');
  if (gameFlag !== -1 && !args[gameFlag + 1]) {
    console.error('--game requires a file path');
    process.exit(1);
  }
  const gameOverride = gameFlag === -1 ? null : args[gameFlag + 1];
  const { errors, gameCount, reportCount } = validateRepo(path.join(__dirname, '..'), gameOverride);
  console.log(`games checked: ${gameCount}, reports checked: ${reportCount}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`FAIL ${e}`);
    process.exit(1);
  }
  console.log('all valid');
}

module.exports = { validateGame, crossCheckGame, validateTiers, validateReport, validateRepo };
