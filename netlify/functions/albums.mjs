import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Robustne nájdi priečinok data/albums za behu na Netlify.
// included_files v netlify.toml zabalí data/albums/** k funkcii, no presné
// umiestnenie v bundli sa líši, preto skúšame viacero kandidátov a vezmeme
// prvý, ktorý reálne existuje (nespoliehame sa slepo na process.cwd()).
function findAlbumsDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), 'data', 'albums'),
    path.join(here, 'data', 'albums'),
    path.join(here, '..', 'data', 'albums'),
    path.join(here, '..', '..', 'data', 'albums'),
    path.join(here, '..', '..', '..', 'data', 'albums'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    } catch { /* skús ďalší */ }
  }
  return null;
}

export default async (req, context) => {
  try {
    const dir = findAlbumsDir();
    if (!dir) {
      return Response.json([], { headers: { 'Cache-Control': 'no-store' } });
    }
    const albums = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
        slug: f.replace('.json', ''),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return Response.json(albums, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
