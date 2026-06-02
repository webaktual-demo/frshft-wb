import fs from 'fs';
import path from 'path';
export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'data', 'albums');
    if (!fs.existsSync(dir)) return res.json([]);
    const albums = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
        slug: f.replace('.json','')
      }))
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    res.setHeader('Cache-Control','no-store');
    res.json(albums);
  } catch(e) { res.status(500).json({error:e.message}); }
}
