import { mkdir, writeFile } from 'node:fs/promises';
import { compare } from '../src/compare.ts';
import { scopeFor } from '../src/config.ts';
import { render } from '../src/report.ts';
import { demoFixture, demoTime } from '../fixtures/synthetic.ts';

const fixture = demoFixture();
const report = compare(scopeFor(fixture.config, demoTime), fixture.receipts, demoTime, true);
if (report.completeness !== 'COMPLETE' || report.residual?.closing !== '25000.00' || report.lines.length !== 20) throw new Error('Synthetic acceptance failed.');
await mkdir('release/demo', { recursive: true });
for (const [extension, content] of Object.entries(render(report))) await writeFile(`release/demo/rapport.${extension}`, content, 'utf8');
await writeFile('fixtures/synthetic.json', JSON.stringify(fixture, null, 2) + '\n', 'utf8');
console.log(`Synthetic acceptance passed: ${report.lines.length} lines; opening ${report.residual.opening}; movement ${report.residual.movement}; closing ${report.residual.closing} NOK; ${report.candidates.length} candidates, ${report.unresolved.length} unresolved.`);
