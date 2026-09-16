import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const paths = { '/': ['release/demo/rapport.html', 'text/html; charset=utf-8'], '/rapport.csv': ['release/demo/rapport.csv', 'text/csv; charset=utf-8'], '/rapport.json': ['release/demo/rapport.json', 'application/json; charset=utf-8'] };
createServer(async (req, res) => {
  const file = paths[req.url];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { res.writeHead(200, { 'content-type': file[1] }); res.end(await readFile(file[0])); } catch { res.writeHead(500); res.end('Missing demo artifact'); }
}).listen(8766, '127.0.0.1', () => console.log('Synthetic report preview: http://127.0.0.1:8766'));
