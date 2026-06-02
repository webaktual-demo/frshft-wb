export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const data = await r.json();
    if (data.error) return res.status(400).send(data.error_description);
    const token = data.access_token;
    const msg = JSON.stringify('authorization:github:success:' + JSON.stringify({ token, provider: 'github' }))
      .replace(/</g, '\\u003c');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`<!DOCTYPE html><html><body><script>
      window.opener&&window.opener.postMessage(
        ${msg},'https://www.freshfit.sk'
      );window.close();<\/script></body></html>`);
  } catch(e) { res.status(500).send(e.message); }
}
