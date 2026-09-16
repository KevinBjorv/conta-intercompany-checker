import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const target = resolve(process.argv[2] ?? '../Bjorvand AI');
const route = 'app/workflows/conta-intercompany-checker';
const copies = [
  ['site/page.tsx', `${route}/page.tsx`], ['site/opengraph-image.tsx', `${route}/opengraph-image.tsx`],
  ['site/en-conta.json', 'i18n/en-conta.json'],
  ...['conta-intercompany.json', 'conta-synthetic-demo.json'].map(f => [`workflows/${f}`, `public/workflow-assets/conta-intercompany/${f}`]),
  ...['html', 'csv', 'json'].map(ext => [`release/demo/rapport.${ext}`, `public/workflow-assets/conta-intercompany/rapport.${ext}`]),
  ['release/demo/conta-demonstrasjon.mp4', 'public/workflow-assets/conta-intercompany/conta-demonstrasjon.mp4'],
  ['release/conta-intercompany-checker-0.1.0.tar.gz', 'public/workflow-assets/conta-intercompany/conta-intercompany-checker-0.1.0.tar.gz'],
  ...['SETUP.md', 'API-CONTRACT.md', 'LIVE-ACCEPTANCE.md', 'RELEASE-STATUS.md'].map(f => [`docs/${f}`, `public/workflow-assets/conta-intercompany/${f}`]),
];
const sitePackage = JSON.parse(await readFile(resolve(target, 'package.json'), 'utf8'));
if (sitePackage.name !== 'bjorvand-ai') throw new Error('Wrong site target.');
for (const [source, destination] of copies) { const dest = resolve(target, destination); await mkdir(dirname(dest), { recursive: true }); await copyFile(source, dest); }
const invariant = ['/workflows/conta-intercompany-checker', '/workflows/conta-intercompany-checker/opengraph-image', '/workflow-assets/conta-intercompany/conta-synthetic-demo.json', '/workflow-assets/conta-intercompany/conta-intercompany.json', '/workflow-assets/conta-intercompany/rapport.html', '/workflow-assets/conta-intercompany/SETUP.md', '/workflow-assets/conta-intercompany/conta-demonstrasjon.mp4', '/workflow-assets/conta-intercompany/conta-intercompany-checker-0.1.0.tar.gz', 'conta-checker-header', 'conta-checker-hero', 'conta-checker-closing', 'n8n · Conta · MIT'];
await writeFile(resolve(target, 'i18n/invariants-conta.json'), JSON.stringify(invariant, null, 2) + '\n');
const sitemapFile = resolve(target, 'app/sitemap.ts'); let sitemap = await readFile(sitemapFile, 'utf8');
if (!sitemap.includes('/workflows/conta-intercompany-checker')) {
  const marker = 'const pages: MetadataRoute.Sitemap = [';
  if (!sitemap.includes(marker)) throw new Error('Sitemap insertion point changed.');
  sitemap = sitemap.replace(marker, marker + '\n    { url: `${SITE_URL}/workflows/conta-intercompany-checker`, lastModified: new Date("2026-09-16T00:00:00+02:00"), changeFrequency: "monthly", priority: 0.7 },');
  await writeFile(sitemapFile, sitemap);
}
console.log('Installed additive bilingual site draft and synthetic downloads. Run localize, validate:i18n, typecheck and build in the site repository. Not published.');
