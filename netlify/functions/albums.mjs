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

// Rate limiting: najviac 60 požiadaviek za minútu z jednej IP (v pamäti
// inštancie funkcie). Hlavnú záťaž aj tak zachytí CDN cache nižšie — albumy
// sa menia len novým nasadením, ktoré cache na Netlify vyprázdni.
const WINDOW_MS = 60_000;
const MAX_HITS = 60;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  return ++h.n > MAX_HITS;
}

const CACHE = {
  'Cache-Control': 'public, max-age=60',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export default async (req, context) => {
  if (limited(context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown')) {
    return Response.json({ error: 'Príliš veľa požiadaviek, skúste o chvíľu.' }, { status: 429, headers: { 'Retry-After': '60' } });
  }
  try {
    const dir = findAlbumsDir();
    if (!dir) {
      return Response.json([], { headers: CACHE });
    }
    const albums = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
        slug: f.replace('.json', ''),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return Response.json(albums, { headers: CACHE });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Albumy sa nepodarilo načítať.' }, { status: 500 });
  }
};
