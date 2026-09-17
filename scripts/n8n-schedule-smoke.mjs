// Development-only scheduling proof. Uses an isolated local n8n data directory,
// synthetic credentials and a loopback server. Never contacts Conta.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { scopeFor } from '../src/config.ts';

const require = createRequire(import.meta.url);
const { parse } = require('../.qa/runtime/node_modules/flatted');
const stamp = Date.now();
const directory = resolve(`.qa/schedule-${stamp}`);
await mkdir(directory, { recursive: true });
const cli = resolve('.qa/runtime/node_modules/n8n/bin/n8n');
const env = { ...process.env, DB_TYPE: 'sqlite', DB_SQLITE_DATABASE: 'database.sqlite', EXECUTIONS_MODE: 'regular', N8N_USER_FOLDER: directory, N8N_DIAGNOSTICS_ENABLED: 'false',
  N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_TEMPLATES_ENABLED: 'false',
  N8N_LOG_LEVEL: 'info', N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_HOST: '127.0.0.1',
  N8N_PORT: '5698', N8N_RUNNERS_BROKER_PORT: '5699' };
const databasePath = resolve(directory, '.n8n/database.sqlite');
const workflowText = await readFile('workflows/conta-intercompany.json', 'utf8');
const workflow = JSON.parse(workflowText);
const fixture = JSON.parse(await readFile('fixtures/synthetic.json', 'utf8'));
const config = fixture.config;
config.period = 'last-completed-month';
config.liveValidation = { reference: 'SYNTHETIC SCHEDULE TEST ONLY', signsDatesOpeningAndOmissionsVerified: true };
const scope = scopeFor(config, new Date());
const observed = [];
const server = createServer((req, res) => {
  const key = decodeURIComponent(req.url.slice(1));
  const row = fixture.receipts.find(r => r.request.key === key);
  const credentialCorrect = req.headers.apikey === `synthetic-${key[0]}-only`;
  observed.push({ key, method: req.method, credentialCorrect });
  if (req.method !== 'GET' || !credentialCorrect || !row) { res.writeHead(403); res.end('{}'); return; }
  const body = structuredClone(row.body);
  if (row.request.kind === 'details') for (const line of body) {
    line.date = line.date.endsWith('-31') ? scope.endDate : scope.startDate.slice(0, 8) + line.date.slice(-2);
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body).replace(/"(id|transactionId|sumIngoing|sumChanged|sumOutgoing|amount)":"(-?\d+(?:\.\d+)?)"/g, '"$1":$2'));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
workflow.id = 'contaScheduleProof'; workflow.name = 'TEST ONLY synthetic scheduled Conta check';
const schedule = workflow.nodes.find(n => n.type === 'n8n-nodes-base.scheduleTrigger');
const originalSchedule = structuredClone(schedule.parameters);
schedule.disabled = false;
schedule.parameters.rule.interval = [{ field: 'cronExpression', expression: '* * * * *' }];
workflow.nodes.find(n => n.type === 'n8n-nodes-base.manualTrigger').disabled = true;
workflow.nodes.find(n => n.name === 'Configuration').parameters.jsCode = `return [{json:${JSON.stringify(config)}}];`;
for (const n of workflow.nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest')) {
  const side = n.name.at(-1);
  n.parameters.url = `={{ 'http://127.0.0.1:${port}/' + encodeURIComponent($json.request.key) }}`;
  n.credentials = { httpHeaderAuth: { id: `contaSchedule${side}`, name: `TEST ONLY ${side}` } };
}
async function command(args, label) {
  const child = spawn(process.execPath, [cli, ...args], { env, cwd: directory, windowsHide: true, timeout: 120000 });
  let output = '';
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const status = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); });
  await writeFile(resolve(directory, `${label}.log`), output);
  if (status) throw new Error(`${label} failed. See the isolated schedule test log.`);
}
let runtime;
let runtimeLog = '';
let result;
try {
  await writeFile(resolve(directory, 'credentials.json'), JSON.stringify(['A', 'B'].map(side => ({
    id: `contaSchedule${side}`, name: `TEST ONLY ${side}`, type: 'httpHeaderAuth', data: { name: 'apiKey', value: `synthetic-${side}-only` },
  }))));
  await writeFile(resolve(directory, 'workflow.json'), JSON.stringify(workflow));
  await command(['import:credentials', `--input=${resolve(directory, 'credentials.json')}`], 'credentials');
  console.log('Imported synthetic credentials into a new isolated n8n data directory.');
  await command(['import:workflow', `--input=${resolve(directory, 'workflow.json')}`], 'import');
  await command(['publish:workflow', `--id=${workflow.id}`], 'publish');
  runtime = spawn(process.execPath, [cli, 'start'], { env, cwd: directory, windowsHide: true });
  const log = b => { runtimeLog += b; appendFileSync(resolve(directory, 'runtime.log'), b); };
  runtime.stdout.on('data', log); runtime.stderr.on('data', log);
  await writeFile(resolve(directory, 'runtime-process.json'), JSON.stringify({ pid: runtime.pid, dataDirectory: directory }));
  let spawnError; runtime.on('error', e => { spawnError = e; });
  const readyDeadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < readyDeadline) {
    if (spawnError || runtime.exitCode !== null) throw new Error('The isolated n8n server stopped during startup.');
    try { ready = (await fetch('http://127.0.0.1:5698/healthz/readiness', { signal: AbortSignal.timeout(2000) })).ok; } catch { /* Startup may still be in progress. */ }
    if (ready) break;
    await new Promise(done => setTimeout(done, 2000));
  }
  if (!ready) throw new Error('Isolated n8n did not become ready within two minutes.');
  console.log('Waiting for a real one-minute Schedule Trigger in isolated n8n (maximum two minutes).');
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (spawnError || runtime.exitCode !== null) throw new Error('The isolated n8n server stopped before a scheduled run completed.');
    const db = new DatabaseSync(databasePath, { readOnly: true });
    const row = db.prepare('SELECT e.id,e.mode,e.status,e.finished,e.startedAt,e.stoppedAt,d.data FROM execution_entity e LEFT JOIN execution_data d ON d.executionId=e.id WHERE e.workflowId=? ORDER BY e.id DESC LIMIT 1').get(workflow.id);
    db.close();
    if (row?.status === 'error' || row?.status === 'crashed') throw new Error(`Scheduled execution failed with ${row.status}.`);
    if (row?.status === 'success' && row.finished && row.data?.length > 100) {
      assert.equal(row.mode, 'trigger');
      const data = parse(row.data);
      const output = data.resultData.runData['Private reports'][0].data.main[0][0];
      assert.equal(output.json.completeness, 'COMPLETE');
      assert.equal(output.json.residual.closing, '25000.00');
      assert.equal(output.json.scope.startDate, scope.startDate);
      assert.equal(output.json.scope.endDate, scope.endDate);
      assert.equal(output.json.lines.length, 20);
      const savedJson = JSON.parse(Buffer.from(output.binary.json.data, 'base64').toString('utf8'));
      assert.equal(savedJson.residual.closing, '25000.00');
      assert.match(Buffer.from(output.binary.html.data, 'base64').toString('utf8'), /Mellomværendekontroll/);
      assert.match(Buffer.from(output.binary.csv.data, 'base64').toString('utf8'), /Absolutt utgående differanse NOK/);
      assert.deepEqual(observed.map(r => r.key), fixture.receipts.map(r => r.request.key));
      assert.ok(observed.every(r => r.method === 'GET' && r.credentialCorrect));
      result = { checkedAt: new Date().toISOString(), workflowSha256: createHash('sha256').update(workflowText).digest('hex'),
        scope: 'Real activated local self-hosted Schedule Trigger, one-minute test cadence, synthetic credentials and loopback fixture API. Persisted reports read back from isolated execution storage. Not a monthly production, pruning-policy, Cloud or live Conta acceptance.',
        originalMonthlySchedule: originalSchedule, testSchedule: schedule.parameters, timezone: workflow.settings.timezone,
        period: { startDate: scope.startDate, endDate: scope.endDate },
        execution: { id: row.id, mode: row.mode, status: row.status, startedAt: row.startedAt, stoppedAt: row.stoppedAt },
        report: { completeness: output.json.completeness, closingResidual: savedJson.residual.closing, lines: savedJson.lines.length, storedFormats: Object.keys(output.binary) },
        getRequestsVerified: observed.length };
      break;
    }
    await new Promise(done => setTimeout(done, 2000));
  }
  if (!result) throw new Error('No completed scheduled run within the two-minute test bound.');
} finally {
  if (runtime && runtime.exitCode === null && runtime.pid) {
    // Stop only the child process tree created above, never another n8n instance.
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(runtime.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else runtime.kill('SIGTERM');
    await new Promise(done => { if (runtime.exitCode !== null) done(); else { runtime.once('close', done); setTimeout(done, 5000); } });
  }
  await writeFile(resolve(directory, 'runtime.log'), runtimeLog);
  try { await command(['unpublish:workflow', `--id=${workflow.id}`], 'unpublish'); }
  finally { server.close(); }
}
const db = new DatabaseSync(databasePath, { readOnly: true });
const active = db.prepare('SELECT active,activeVersionId FROM workflow_entity WHERE id=?').get(workflow.id);
assert.equal(active.active, 0); assert.equal(active.activeVersionId, null); db.close();
result.cleanup = 'Isolated server stopped and test workflow unpublished; synthetic execution retained privately for inspection.';
await writeFile('release/n8n-schedule-results.json', JSON.stringify(result, null, 2) + '\n');
console.log('PASS real scheduled execution, last-completed-month scope, persisted HTML/CSV/JSON retrieval and test deactivation.');
