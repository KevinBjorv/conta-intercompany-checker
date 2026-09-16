import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const live = JSON.parse(readFileSync('workflows/conta-intercompany.json', 'utf8'));
const demo = JSON.parse(readFileSync('workflows/conta-synthetic-demo.json', 'utf8'));
test('bundled code runs with n8n property-definition hardening and no runtime modules', () => {
  const code = demo.nodes.find((n: any) => n.name === 'Synthetic comparison').parameters.jsCode;
  assert.doesNotMatch(code, /\brequire\s*\(|\bimport\s*\(/);
  const result = runInNewContext(`Object.defineProperty = () => ({}); Object.defineProperties = () => ({}); (function(){${code}})()`, {});
  assert.equal(result[0].json.report.completeness, 'COMPLETE');
  assert.equal(result[0].json.report.residual.closing, '25000.00');
});
test('live export is inactive, credential-free, GET-only, raw bytes, no redirects or implicit retries', () => {
  assert.equal(live.active, false); assert.deepEqual(live.pinData, {});
  const http = live.nodes.filter((n: any) => n.type === 'n8n-nodes-base.httpRequest');
  assert.equal(http.length, 2);
  for (const n of http) {
    assert.equal(n.parameters.method, 'GET'); assert.equal(n.parameters.genericAuthType, 'httpHeaderAuth');
    assert.equal(n.parameters.options.redirect.redirect.followRedirects, false);
    assert.equal(n.parameters.options.response.response.responseFormat, 'file');
    assert.equal(n.parameters.options.response.response.fullResponse, true);
    assert.equal(n.parameters.options.response.response.outputPropertyName, 'raw');
    assert.equal(n.credentials, undefined); assert.equal(n.retryOnFail, undefined);
  }
  assert.equal(live.nodes.find((n: any) => n.type === 'n8n-nodes-base.scheduleTrigger').disabled, true);
  assert.equal(live.settings.timezone, 'Europe/Oslo'); assert.equal(live.settings.saveManualExecutions, false);
});
test('every connection points to an existing node; both credential branches return to the loop', () => {
  for (const workflow of [live, demo]) {
    const names = new Set(workflow.nodes.map((n: any) => n.name));
    for (const [from, connection] of Object.entries(workflow.connections)) {
      assert.ok(names.has(from));
      for (const branch of (connection as any).main) for (const link of branch) assert.ok(names.has(link.node));
    }
  }
  for (const side of ['A', 'B']) assert.equal(live.connections[`Accept response ${side}`].main[0][0].node, 'Dispatch request');
});
