import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const roots = ['src', 'tests', 'fixtures', 'workflows', 'docs', 'scripts', 'site', 'release/demo', '.github'];
const files = ['.gitattributes', '.gitignore', 'README.md', 'LICENSE', 'SPEC.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'release/n8n-smoke-results.json', 'release/video-verification.json'];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && path !== 'docs/conta-openapi.json') files.push(path);
  }
}
for (const root of roots) await walk(root);
const manifest = [];
const blocks = [];
function addFile(name, data) {
  if (Buffer.byteLength(name) > 100) throw new Error('USTAR file path too long.');
  const h = Buffer.alloc(512);
  const field = (value, offset, length) => h.write(value, offset, length, 'utf8');
  const octal = (value, length) => value.toString(8).padStart(length - 1, '0') + '\0';
  field(name, 0, 100); field(octal(0o644, 8), 100, 8); field(octal(0, 8), 108, 8); field(octal(0, 8), 116, 8);
  field(octal(data.length, 12), 124, 12); field(octal(0, 12), 136, 12); field('        ', 148, 8);
  field('0', 156, 1); field('ustar\0', 257, 6); field('00', 263, 2);
  field(h.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0') + '\0 ', 148, 8);
  blocks.push(h, data, Buffer.alloc((512 - data.length % 512) % 512));
}
for (const file of files.sort()) {
  const data = await readFile(file);
  // Only explicit source/doc/synthetic paths enter the archive, never .qa, .env,
  // private recordings, vendor schemas, browser sessions or installed dependencies.
  manifest.push({ path: file, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
  addFile(file, data);
}
const manifestText = JSON.stringify({ version: '0.1.0', classification: 'synthetic pilot; not live accepted', files: manifest }, null, 2) + '\n';
await writeFile('release/manifest.json', manifestText); addFile('manifest.json', Buffer.from(manifestText));
blocks.push(Buffer.alloc(1024));
const archive = gzipSync(Buffer.concat(blocks));
await writeFile('release/conta-intercompany-checker-0.1.0.tar.gz', archive);
await writeFile('release/SHA256SUMS.txt', createHash('sha256').update(archive).digest('hex') + '  conta-intercompany-checker-0.1.0.tar.gz\n');
console.log(`Packaged ${files.length} original and synthetic files; excluded credentials, private data and installed dependencies.`);
