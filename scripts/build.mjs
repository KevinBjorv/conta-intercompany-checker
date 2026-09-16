import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await mkdir('dist', { recursive: true });
await mkdir('workflows', { recursive: true });
// n8n task runners intentionally disable Object.defineProperty. Avoid esbuild's
// IIFE/CommonJS export getters by emitting an ordinary object from ESM instead.
const result = await build({ stdin: { contents: 'import { initialize, dispatch, accept, compare, render, scopeFor } from "./src/public.ts"; export const Checker = { initialize, dispatch, accept, compare, render, scopeFor };', resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', charset: 'utf8', minify: false });
const esm = result.outputFiles[0].text;
if (!/export \{\s*Checker\s*\};?\s*$/.test(esm)) throw new Error('Unexpected bundle export shape.');
const bundle = esm.replace(/export \{\s*Checker\s*\};?\s*$/, '');
if (/\brequire\s*\(|\bimport\s*\(/.test(bundle)) throw new Error('Runtime imports are prohibited.');
await writeFile('dist/checker.js', bundle);
const config = {
  environment: 'sandbox', period: 'last-completed-month', tolerance: '0.01',
  companies: Object.fromEntries(['A', 'B'].map(side => [side, { organizationId: 'REPLACE_ME', name: `Company ${side}`, authorized: false, currency: 'NOK', accounts: [{ number: side === 'A' ? '1560' : '2960', dedicatedToOtherCompany: false, positionsInNok: false }] }])),
  sharedInvoiceNumbersConfirmed: false, candidateDateWindowDays: 3,
  liveValidation: { reference: '', signsDatesOpeningAndOmissionsVerified: false },
};
const node = (name, type, typeVersion, parameters, position, extra = {}) => ({ id: createHash('sha256').update(name).digest('hex').slice(0, 32), name, type: `n8n-nodes-base.${type}`, typeVersion, parameters, position, ...extra });
const code = (name, body, position) => node(name, 'code', 2, { mode: 'runOnceForAllItems', jsCode: bundle + '\n' + body }, position);
const item = expression => `return [{ json: ${expression}, pairedItem: { item: 0 } }];`;
const finalize = `const report = $input.first().json.report;
const files = Checker.render(report);
const binary = {};
for (const [ext, content] of Object.entries(files)) binary[ext] = { data: Buffer.from(content, 'utf8').toString('base64'), mimeType: {html:'text/html',csv:'text/csv',json:'application/json'}[ext], fileName: 'mellomvaerendekontroll.' + ext };
return [{ json: report, binary, pairedItem: { item: 0 } }];`;
const nodes = [
  node('Manual run', 'manualTrigger', 1, {}, [-880, -80]),
  node('Monthly run (disabled)', 'scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '0 6 1 * *' }] } }, [-880, 100], { disabled: true }),
  node('Configuration', 'code', 2, { jsCode: `// No API keys here. Select separate Header Auth credentials in Conta GET A/B.\nreturn [{json: ${JSON.stringify(config, null, 2)}}];` }, [-660, -80]),
  code('Validate scope', item('Checker.initialize($input.first().json, new Date())'), [-440, -80]),
  code('Dispatch request', item('Checker.dispatch($input.first().json, new Date())'), [-220, -80]),
  node('Route', 'switch', 3.2, { mode: 'expression', numberOutputs: 4, output: '={{ ({A:0,B:1,WAIT:2,DONE:3})[$json.route] }}' }, [0, -80]),
  ...['A', 'B'].map((side, i) => node(`Conta GET ${side}`, 'httpRequest', 4.2, {
    method: 'GET', url: '={{ $json.request.url }}', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    options: { redirect: { redirect: { followRedirects: false } }, timeout: 30000,
      response: { response: { fullResponse: true, neverError: true, responseFormat: 'file', outputPropertyName: 'raw' } } },
  }, [260, i * 180 - 280], { onError: 'continueRegularOutput', notes: `Select customer-owned Header Auth credential ${side}: header name apiKey. Restrict credential allowed domains to the chosen Conta gateway.`, notesInFlow: true })),
  ...['A', 'B'].map((side, i) => code(`Accept response ${side}`, "const response = {...$input.first().json};\ntry { if ($input.first().binary?.raw) response.body = (await this.helpers.getBinaryDataBuffer(0, 'raw')).toString('utf8'); } catch { response.body = undefined; }\n" + item("Checker.accept($('Dispatch request').item.json, response, new Date())"), [560, i * 180 - 280])),
  node('Honor Retry-After', 'wait', 1.1, { resume: 'timeInterval', amount: '={{ $json.waitSeconds }}', unit: 'seconds' }, [260, 140], { webhookId: 'conta-intercompany-retry' }),
  code('Private reports', finalize, [260, 340]),
  node('Read me', 'stickyNote', 1, { content: '## Mellomværendekontroll for Conta\nGET-only. Two authorized companies; dedicated NOK accounts.\nRead README and docs/SETUP.md. Configure credentials in HTTP nodes only.\nINCOMPLETE is never zero. COMPLETE is not accountant approval.\nMonthly trigger is disabled. Live report semantics require documented validation.\nReports stay in this private execution. No email or publishing nodes.', height: 270, width: 430 }, [-880, -430]),
];
const connections = {};
const connect = (from, to, output = 0) => { connections[from] ??= { main: [] }; while (connections[from].main.length <= output) connections[from].main.push([]); connections[from].main[output].push({ node: to, type: 'main', index: 0 }); };
connect('Manual run', 'Configuration'); connect('Monthly run (disabled)', 'Configuration'); connect('Configuration', 'Validate scope'); connect('Validate scope', 'Dispatch request'); connect('Dispatch request', 'Route');
for (const [i, side] of ['A', 'B'].entries()) { connect('Route', `Conta GET ${side}`, i); connect(`Conta GET ${side}`, `Accept response ${side}`); connect(`Accept response ${side}`, 'Dispatch request'); }
connect('Route', 'Honor Retry-After', 2); connect('Honor Retry-After', 'Dispatch request'); connect('Route', 'Private reports', 3);
const settings = { executionOrder: 'v1', timezone: 'Europe/Oslo', saveDataErrorExecution: 'none', saveDataSuccessExecution: 'all', saveManualExecutions: false, saveExecutionProgress: false, executionTimeout: 1800 };
const workflow = { name: 'Conta intercompany checker — private pilot', active: false, nodes, connections, settings, pinData: {}, tags: [] };
await writeFile('workflows/conta-intercompany.json', JSON.stringify(workflow, null, 2) + '\n');
const fixture = JSON.parse(await readFile('fixtures/synthetic.json', 'utf8'));
const demoNodes = [node('Manual demo', 'manualTrigger', 1, {}, [0, 0]),
  code('Synthetic comparison', `const fixture = ${JSON.stringify(fixture)};\nconst now = new Date('2026-09-16T12:00:00Z');\n` + item('({report:Checker.compare(Checker.scopeFor(fixture.config, now), fixture.receipts, now, true)})'), [240, 0]),
  code('Private reports', finalize, [480, 0])];
const link = name => ({ main: [[{ node: name, type: 'main', index: 0 }]] });
await writeFile('workflows/conta-synthetic-demo.json', JSON.stringify({ name: 'Conta intercompany — synthetic demo', active: false, nodes: demoNodes, connections: { 'Manual demo': link('Synthetic comparison'), 'Synthetic comparison': link('Private reports') }, settings, pinData: {}, tags: [] }, null, 2) + '\n');
console.log('Built import-free Code nodes and two inactive workflows.');
