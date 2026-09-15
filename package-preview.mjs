import { mkdir, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Source CSVs, workshop logs and repository files never enter this package.
const publicFiles = ['index.html', 'style.css', 'app.js', 'model.js', 'simulation.js', 'memo.js', 'case-data.json'];
const destination = new URL('./output/vercel-preview/', import.meta.url);
await mkdir(destination, { recursive: true });
const dataText = await readFile(new URL('./dist/case-data.json', import.meta.url), 'utf8');
const data = JSON.parse(dataText);
function assertSafe(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(first_name|last_name|email|respondent_id)$/i.test(key)) throw Error(`Private field in deployment: ${key}`);
    assertSafe(child);
  }
}
assertSafe(data);
if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(dataText)) throw Error('Email-like content in public data');
const manifest = [];
for (const name of publicFiles) {
  const source = new URL(`./dist/${name}`, import.meta.url);
  const contents = await readFile(source);
  await copyFile(source, new URL(name, destination));
  manifest.push({ name, bytes: contents.length, sha256: createHash('sha256').update(contents).digest('hex') });
}
await writeFile(new URL('vercel.json', destination), JSON.stringify({ framework: null, buildCommand: '', installCommand: '', cleanUrls: false }, null, 2));
const unexpected = (await readdir(destination)).filter(name => !publicFiles.includes(name) && name !== 'vercel.json');
if (unexpected.length) throw Error(`Unexpected deployment files: ${unexpected.join(', ')}`);
await writeFile(new URL('./output/preview-manifest.json', import.meta.url), JSON.stringify({ preparedAt: new Date().toISOString(), files: manifest, privacyCheck: 'passed', rawCsvIncluded: false }, null, 2));
console.log(`Verified static preview package: ${fileURLToPath(destination)} (${manifest.length} app files; no raw CSVs)`);
