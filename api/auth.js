export default async function handler(req, res) {
  const { code } = req.query;

  // Krok 1: Ak nie je code → presmeruj na GitHub OAuth
  if (!code) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      scope: 'repo',
      redirect_uri: 'https://www.freshfit.sk/api/auth'
    });
    return res.redirect(
      'https://github.com/login/oauth/authorize?' + params.toString()
    );
  }

  // Krok 2: Vymeni code za token
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
    const payload = JSON.stringify({
      token: token,
      provider: 'github'
    });
    const message = 'authorization:github:success:' + payload;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`<!DOCTYPE html><html><body><script>
      (function() {
        var msg = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage(msg, '*');
          setTimeout(function(){ window.close(); }, 500);
        } else {
          document.body.innerText = 'Prihlásenie úspešné, zatvor toto okno.';
        }
      })();
    <\/script></body></html>`);
  } catch(e) { res.status(500).send(e.message); }
}
