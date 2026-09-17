// Development-only retention proof. Prunes a COPY of a completed synthetic
// scheduling test through n8n's own timers, never a customer data directory.
import assert from 'node:assert/strict';
import { appendFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, basename, dirname } from 'node:path';
import { DatabaseSync, backup } from 'node:sqlite';

const source = resolve(process.argv[2] ?? '');
assert.equal(dirname(source), resolve('.qa'), 'Source must be a local .qa scheduling test.');
assert.match(basename(source), /^schedule-\d+$/);
const credentials = JSON.parse(await readFile(resolve(source, 'credentials.json'), 'utf8'));
assert.deepEqual(credentials.map(c => c.data), ['A', 'B'].map(side => ({ name: 'apiKey', value: `synthetic-${side}-only` })));
const sourceDb = new DatabaseSync(resolve(source, '.n8n/database.sqlite'), { readOnly: true });
const workflows = sourceDb.prepare('SELECT id,active,activeVersionId FROM workflow_entity').all();
assert.deepEqual(workflows.map(w => ({ ...w })), [{ id: 'contaScheduleProof', active: 0, activeVersionId: null }]);
const rows = sourceDb.prepare('SELECT e.id,e.mode,e.status,d.data FROM execution_entity e JOIN execution_data d ON d.executionId=e.id').all();
assert.equal(rows.length, 1, 'Expected one completed synthetic scheduled execution.');
assert.equal(rows[0].mode, 'trigger'); assert.equal(rows[0].status, 'success');
const require = createRequire(import.meta.url);
const { parse } = require('../.qa/runtime/node_modules/flatted');
const output = parse(rows[0].data).resultData.runData['Private reports'][0].data.main[0][0];
assert.equal(output.json.lines.length, 20);
assert.equal(output.json.residual.closing, '25000.00');
for (const format of ['html', 'csv', 'json']) {
  assert.ok(output.binary[format].data.length > 100);
  assert.equal(output.binary[format].id, undefined, 'This proof covers inline binary data only.');
}

const directory = resolve(`.qa/retention-${Date.now()}`);
await mkdir(resolve(directory, '.n8n'), { recursive: true });
const databasePath = resolve(directory, '.n8n/database.sqlite');
await backup(sourceDb, databasePath);
sourceDb.close();
await copyFile(resolve(source, '.n8n/config'), resolve(directory, '.n8n/config'));
// Zero retention is deliberate ONLY in this disposable copy. Never recommend
// these accelerated settings for an operational accounting workflow.
const retention = { EXECUTIONS_DATA_PRUNE: 'true', EXECUTIONS_DATA_MAX_AGE: '0',
  EXECUTIONS_DATA_PRUNE_MAX_COUNT: '0', EXECUTIONS_DATA_HARD_DELETE_BUFFER: '0',
  EXECUTIONS_DATA_PRUNE_SOFT_DELETE_INTERVAL: '1', EXECUTIONS_DATA_PRUNE_HARD_DELETE_INTERVAL: '1' };
const env = { ...process.env, ...retention, DB_TYPE: 'sqlite', DB_SQLITE_DATABASE: 'database.sqlite',
  EXECUTIONS_MODE: 'regular', N8N_USER_FOLDER: directory, N8N_DEFAULT_BINARY_DATA_MODE: 'default',
  N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_TEMPLATES_ENABLED: 'false',
  N8N_LOG_LEVEL: 'debug', N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_HOST: '127.0.0.1',
  N8N_PORT: '5698', N8N_RUNNERS_BROKER_PORT: '5699' };
const runtime = spawn(process.execPath, [resolve('.qa/runtime/node_modules/n8n/bin/n8n'), 'start'], { env, cwd: directory, windowsHide: true });
let runtimeLog = ''; let spawnError; let result;
runtime.on('error', error => { spawnError = error; });
const log = buffer => { runtimeLog += buffer; appendFileSync(resolve(directory, 'runtime.log'), buffer); };
runtime.stdout.on('data', log); runtime.stderr.on('data', log);
await writeFile(resolve(directory, 'runtime-process.json'), JSON.stringify({ pid: runtime.pid, dataDirectory: directory }));
console.log('Testing n8n automatic pruning in a new isolated copy of synthetic execution data.');
try {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    if (spawnError || runtime.exitCode !== null) throw new Error('The isolated n8n retention server stopped unexpectedly.');
    const db = new DatabaseSync(databasePath, { readOnly: true });
    const counts = Object.fromEntries(['execution_entity', 'execution_data'].map(table => [table, db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]));
    db.close();
    if (counts.execution_entity === 0 && counts.execution_data === 0) {
      assert.match(runtimeLog, /Soft-deleted executions/);
      assert.match(runtimeLog, /Hard-deleted executions/);
      result = { checkedAt: new Date().toISOString(), n8nVersion: require('../.qa/runtime/node_modules/n8n/package.json').version,
        scope: 'Actual n8n pruning timers deleted a copied synthetic scheduled execution and its inline HTML/CSV/JSON. No live Conta, Cloud, filesystem/S3 binary storage, backups or physical secure erasure claim.',
        workflowSha256: JSON.parse(await readFile('release/n8n-schedule-results.json', 'utf8')).workflowSha256,
        testOnlyRetention: retention, before: { execution_entity: rows.length, execution_data: rows.length, storedFormats: ['html', 'csv', 'json'] }, after: counts };
      break;
    }
    await new Promise(done => setTimeout(done, 2000));
  }
  if (!result) throw new Error('n8n did not automatically prune the copied execution within four minutes.');
} finally {
  if (runtime.exitCode === null && runtime.pid) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(runtime.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else runtime.kill('SIGTERM');
    await new Promise(done => { if (runtime.exitCode !== null) done(); else { runtime.once('close', done); setTimeout(done, 5000); } });
  }
}
const original = new DatabaseSync(resolve(source, '.n8n/database.sqlite'), { readOnly: true });
assert.equal(original.prepare('SELECT COUNT(*) AS count FROM execution_entity').get().count, rows.length);
original.close();
result.cleanup = 'Owned test server stopped. Original synthetic execution retained; only the disposable copy was pruned.';
await writeFile('release/n8n-retention-results.json', JSON.stringify(result, null, 2) + '\n');
console.log('PASS automatic soft/hard pruning of synthetic execution and inline reports; original evidence preserved.');
