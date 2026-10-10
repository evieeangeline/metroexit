// Downloads every station survey from the live site to data/submissions.json and
// prints how many platforms each station has. Needs ADMIN_TOKEN (and SITE_URL,
// unless you pass --url) in the environment or in .env / .env.local.
//
//   npm run export-submissions
//   npm run export-submissions -- --url https://my-preview.vercel.app
import { existsSync, writeFileSync } from 'node:fs';

for (const file of ['.env', '.env.local']) if (existsSync(file)) process.loadEnvFile(file);

const urlArg = process.argv.indexOf('--url');
const site = (urlArg > -1 ? process.argv[urlArg + 1] : process.env.SITE_URL)?.replace(/\/$/, '');
const token = process.env.ADMIN_TOKEN;
if (!site || !token) {
  console.error('Set SITE_URL (or pass --url) and ADMIN_TOKEN. See docs/contributions.md.');
  process.exit(1);
}

const res = await fetch(`${site}/api/submissions`, { headers: { authorization: `Bearer ${token}` } });
if (!res.ok) {
  console.error(`${site}/api/submissions responded ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const submissions = await res.json();
writeFileSync('data/submissions.json', JSON.stringify(submissions, null, 2) + '\n');
console.log(`Saved ${submissions.length} submissions to data/submissions.json\n`);

const tally = {};
for (const s of submissions) {
  const t = (tally[s.station] ??= { tallawong: 0, sydenham: 0 });
  for (const p of s.platforms ?? []) t[p.towards]++;
}
for (const [station, t] of Object.entries(tally).sort()) {
  console.log(`${station.padEnd(22)} towards Tallawong: ${t.tallawong}  towards Sydenham: ${t.sydenham}`);
}
