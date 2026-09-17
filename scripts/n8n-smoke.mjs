// Development-only integration harness; never included in a customer workflow.
// An isolated npm installation of n8n is expected at .qa/runtime.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { scopeFor } from '../src/config.ts';
import { requestPlan } from '../src/transport.ts';

const directory = resolve(`.qa/smoke-${Date.now()}`);
await mkdir(directory, { recursive: true });
const base = JSON.parse(await readFile('workflows/conta-intercompany.json', 'utf8'));
const demo = JSON.parse(await readFile('workflows/conta-synthetic-demo.json', 'utf8'));
const fixture = JSON.parse(await readFile('fixtures/synthetic.json', 'utf8'));
const env = { ...process.env, DB_TYPE: 'sqlite', DB_SQLITE_DATABASE: 'database.sqlite', EXECUTIONS_MODE: 'regular',
  N8N_USER_FOLDER: directory, N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_TEMPLATES_ENABLED: 'false',
  N8N_LOG_LEVEL: 'info', N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_RUNNERS_BROKER_PORT: '5689', N8N_PORT: '5688' };
async function command(args, name) {
  const child = spawn(process.execPath, [resolve('.qa/runtime/node_modules/n8n/bin/n8n'), ...args], { env, cwd: directory, windowsHide: true });
  let output = ''; let timedOut = false;
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const timeout = setTimeout(() => {
    timedOut = true;
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }, 240000);
  let status;
  try { status = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); }); }
  finally { clearTimeout(timeout); }
  await writeFile(resolve(directory, `${name}.log`), output);
  if (status !== 0 || timedOut) throw new Error(`${name} failed; see its isolated smoke-test log.`);
  return output;
}
function extract(output) {
  // CLI logs precede the execution object. Only this top-level execution is parsed.
  const start = output.indexOf('{\n  "');
  if (start < 0) throw new Error('No execution output. See the isolated smoke-test logs.');
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < output.length; i++) {
    const c = output[i];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(output.slice(start, i + 1));
  }
  throw new Error('Truncated execution output.');
}
const harnesses = [];
demo.id = 'contaSynthetic01'; harnesses.push({ workflow: demo, name: 'demo', expected: 'COMPLETE' });
base.id = 'contaInvalid001'; harnesses.push({ workflow: structuredClone(base), name: 'invalid-config', expected: 'INCOMPLETE' });
const observed = [];
const fixtures = new Map();
// Actual HTTP nodes and synthetic Header Auth credentials; this server never
// proxies requests or contacts Conta. Customer exports retain the Conta allowlist.
const server = createServer((req, res) => {
  if (req.url.startsWith('/fixtures/')) {
    const [, , scenario, encodedKey, attempt] = req.url.split('/');
    const key = decodeURIComponent(encodedKey), side = key[0];
    const observation = { scenario, key, attempt: Number(attempt), method: req.method, credentialCorrect: req.headers.apikey === `synthetic-${side}-only`, receivedAt: Date.now() };
    observed.push(observation);
    let status = 200; const headers = { 'content-type': 'application/json' };
    if (req.method !== 'GET' || req.headers.apikey !== `synthetic-${side}-only` || scenario === 'forbidden') status = 403;
    if (scenario === 'retry' && key === 'A:accounts' && attempt === '1') { status = 429; headers['retry-after'] = '2'; }
    if (scenario === 'retry-date' && key === 'A:accounts' && attempt === '1') {
      status = 503; headers['retry-after'] = new Date(Date.now() + 4000).toUTCString();
      observation.retryAfterDeadline = Date.parse(headers['retry-after']);
    }
    if (scenario === 'retry-exhausted') status = 503;
    if (scenario === 'auth-failure') status = 401;
    // Leave the socket unanswered: exercise the shipped 30-second timeout.
    if (scenario === 'timeout') return;
    const match = (fixtures.get(scenario) ?? fixture).receipts.find(r => r.request.key === key);
    if (!match) { res.writeHead(404); res.end('{}'); return; }
    const body = structuredClone(match.body);
    if (scenario === 'changed' && key === 'B:after') { body.trialBalanceOutputSub[0].sumChanged = '-140001.00'; body.trialBalanceOutputSub[0].sumOutgoing = '-225001.00'; }
    if (scenario === 'missing-account' && key === 'B:before') body.trialBalanceOutputSub = [];
    if (scenario === 'mismatched-movement' && key === 'A:details:1560') body[0].amount = '14999.00';
    if (scenario === 'malformed' && key === 'B:details:2960') { res.writeHead(200, headers); res.end('{"truncated":'); return; }
    if (scenario === 'empty-body' && key === 'B:details:2960') { res.writeHead(200, headers); res.end(); return; }
    // Match the documented numeric JSON wire types without rounding ID tokens.
    const raw = JSON.stringify(body).replace(/"(id|transactionId|sumIngoing|sumChanged|sumOutgoing|amount)":"(-?\d+(?:\.\d+)?)"/g, '"$1":$2');
    res.writeHead(status, headers); res.end(raw);
  } else if (req.url === '/redirect') { res.writeHead(302, { location: '/must-not-follow' }); res.end(); }
  else if (req.url === '/must-not-follow') { res.writeHead(500); res.end('Redirect followed incorrectly'); }
  else { res.writeHead(429, { 'content-type': 'application/json', 'retry-after': '2' }); res.end('{"id":9223372036854775807,"amount":0.01}'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
for (const scenario of ['success', 'retry', 'forbidden', 'changed', 'multiple-accounts', 'retry-date', 'retry-exhausted', 'timeout', 'auth-failure', 'malformed', 'empty-body', 'missing-account', 'mismatched-movement']) {
  const workflow = structuredClone(base); workflow.id = `conta${scenario}01`; workflow.name = `TEST ONLY Conta ${scenario}`;
  const config = structuredClone(fixture.config); config.liveValidation = { reference: 'SYNTHETIC HARNESS ONLY', signsDatesOpeningAndOmissionsVerified: true };
  const scenarioFixture = structuredClone(fixture);
  if (scenario === 'multiple-accounts') {
    for (const [side, account, id, opening, movement, closing] of [['A', '1570', '30', '1.00', '2.00', '3.00'], ['B', '2970', '40', '-1.00', '-1.00', '-2.00']]) {
      config.companies[side].accounts.push({ number: account, dedicatedToOtherCompany: true, positionsInNok: true });
      scenarioFixture.receipts.find(r => r.request.key === `${side}:accounts`).body.push({ id, bookkeepingAccountNo: account, isActive: true });
      for (const kind of ['before', 'after']) scenarioFixture.receipts.find(r => r.request.key === `${side}:${kind}`).body.trialBalanceOutputSub.push({ bookkeepingAccountNo: account, sumIngoing: opening, sumChanged: movement, sumOutgoing: closing });
      scenarioFixture.receipts.push({ request: { key: `${side}:details:${account}` }, body: [{ id: id + '00', transactionId: id + '000', date: '2026-08-01', bookkeepingAccountNo: account, amount: movement, isResetTransaction: false, isCorrection: false }] });
    }
  }
  fixtures.set(scenario, scenarioFixture);
  workflow.nodes.find(n => n.name === 'Configuration').parameters.jsCode = `return [{json:${JSON.stringify(config)}}];`;
  // Change only destination and synthetic credentials in the development copy.
  for (const node of workflow.nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest')) {
    const side = node.name.at(-1);
    node.parameters.url = `={{ 'http://127.0.0.1:${port}/fixtures/${scenario}/' + encodeURIComponent($json.request.key) + '/' + $json.attempt }}`;
    node.credentials = { httpHeaderAuth: { id: `contaSynthetic${side}`, name: `TEST ONLY synthetic ${side}` } };
  }
  harnesses.push({ workflow, name: scenario, config, expected: ['success', 'retry', 'retry-date', 'multiple-accounts'].includes(scenario) ? 'COMPLETE' : 'INCOMPLETE' });
}
// Additional 64-bit precision and redirect probes.
for (const [i, path] of ['/raw', '/redirect'].entries()) {
  const http = structuredClone(base.nodes.find(n => n.name === 'Conta GET A'));
  http.name = 'HTTP probe'; http.parameters.url = `http://127.0.0.1:${port}${path}`;
  delete http.parameters.authentication; delete http.parameters.genericAuthType;
  const workflow = { ...structuredClone(demo), id: `contaHttpProbe${i}`, name: `TEST ONLY HTTP probe ${i}`,
    nodes: [structuredClone(demo.nodes[0]), http, { id: `decode${i}`, name: 'Decode raw response', type: 'n8n-nodes-base.code', typeVersion: 2, position: [600,0], parameters: { jsCode: "const input = $input.first(); const body = input.binary?.raw ? (await this.helpers.getBinaryDataBuffer(0, 'raw')).toString('utf8') : null; return [{json:{...input.json,body}}];" } }], connections: { 'Manual demo': { main: [[{ node: 'HTTP probe', type: 'main', index: 0 }]] }, 'HTTP probe': { main: [[{node:'Decode raw response',type:'main',index:0}]] } } };
  harnesses.push({ workflow, name: `http-${i}`, expected: i === 0 ? 429 : 302 });
}
try {
  await writeFile(resolve(directory, 'synthetic-credentials.json'), JSON.stringify(['A', 'B'].map(side => ({ id: `contaSynthetic${side}`, name: `TEST ONLY synthetic ${side}`, type: 'httpHeaderAuth', data: { name: 'apiKey', value: `synthetic-${side}-only` } }))));
  await command(['import:credentials', `--input=${resolve(directory, 'synthetic-credentials.json')}`], 'import-credentials');
  await writeFile(resolve(directory, 'import.json'), JSON.stringify(harnesses.map(h => h.workflow)));
  await command(['import:workflow', `--input=${resolve(directory, 'import.json')}`], 'import');
  const results = [];
  for (const h of harnesses) {
    console.log(`Executing ${h.name} in n8n…`);
    const output = await command(['execute', `--id=${h.workflow.id}`, '--rawOutput'], h.name);
    const execution = extract(output);
    assert.ok(!execution.data.resultData.error, `${h.name}: ${JSON.stringify(execution.data.resultData.error)}`);
    const runData = execution.data.resultData.runData;
    if (typeof h.expected === 'number') {
      const item = runData['Decode raw response'][0].data.main[0][0].json;
      assert.equal(item.statusCode, h.expected);
      if (h.expected === 429) { assert.equal(item.body, '{"id":9223372036854775807,"amount":0.01}'); assert.equal(item.headers['retry-after'], '2'); }
    } else {
      const item = runData['Private reports'][0].data.main[0][0];
      assert.equal(item.json.completeness, h.expected);
      assert.deepEqual(Object.keys(item.binary).sort(), ['csv', 'html', 'json']);
      if (h.expected === 'COMPLETE') {
        assert.equal(item.json.residual.closing, h.name === 'multiple-accounts' ? '25001.00' : '25000.00');
        assert.equal(item.json.lines.length, h.name === 'multiple-accounts' ? 22 : 20);
        if (h.name === 'multiple-accounts') assert.equal(item.json.accounts.length, 4);
      }
      else assert.equal(item.json.agreement, null);
      const requests = observed.filter(r => r.scenario === h.name);
      assert.ok(requests.every(r => r.method === 'GET' && r.credentialCorrect));
      if (h.name === 'retry' || h.name === 'retry-date') {
        assert.ok(runData['Honor Retry-After']?.length >= 1);
        assert.deepEqual(requests.slice(0, 2).map(r => r.attempt), [1, 2]);
        assert.ok(requests[1].receivedAt >= (requests[0].retryAfterDeadline ?? requests[0].receivedAt + 2000));
      }
      if (h.name === 'retry-exhausted' || h.name === 'timeout') {
        assert.deepEqual(requests.map(r => [r.key, r.attempt]), [['A:accounts', 1], ['A:accounts', 2], ['A:accounts', 3]]);
        assert.equal(runData['Honor Retry-After'].length, 2);
        if (h.name === 'timeout') for (let i = 1; i < 3; i++) assert.ok(requests[i].receivedAt - requests[i - 1].receivedAt >= 30000);
      }
      if (h.name === 'auth-failure' || h.name === 'forbidden') assert.equal(requests.length, 1);
      if (['success', 'multiple-accounts'].includes(h.name)) {
        assert.deepEqual(requests.map(r => r.key), requestPlan(scopeFor(h.config, new Date())).map(r => r.key));
      }
    }
    results.push({ scenario: h.name, passed: true, status: execution.status, reportStatus: typeof h.expected === 'string' ? h.expected : null, fixtureRequests: observed.filter(r => r.scenario === h.name).length });
    console.log(`PASS ${h.name}`);
  }
  const n8nVersion = JSON.parse(await readFile('.qa/runtime/node_modules/n8n/package.json', 'utf8')).version;
  const workflowHashes = Object.fromEntries(await Promise.all(['conta-intercompany.json', 'conta-synthetic-demo.json'].map(async name => [name, createHash('sha256').update(await readFile('workflows/' + name)).digest('hex')])));
  await writeFile('release/n8n-smoke-results.json', JSON.stringify({ date: new Date().toISOString(), n8nVersion, nodeVersion: process.version, platform: process.platform, scope: 'Local self-hosted CLI with actual HTTP nodes, synthetic Header Auth credentials and a loopback fixture server. No Conta integration, Cloud or schedule acceptance.', workflowHashes, results }, null, 2) + '\n');
} finally { server.closeAllConnections(); server.close(); }
