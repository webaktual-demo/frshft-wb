module.exports = async function handler(req, res) {
  const { code } = req.query;

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
    if (data.error) return res.status(400).send(data.error || 'Auth error');
    const token = data.access_token;
    const msg = 'authorization:github:success:' +
                JSON.stringify({ token: token, provider: 'github' });
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`<!DOCTYPE html><html><body>
<p style="font-family:sans-serif;padding:20px;color:#888">Prihlasujem...</p>
<script>
(function(){
  var msg = ${JSON.stringify(msg)};
  if(window.opener){
    window.opener.postMessage(msg,'*');
    setTimeout(function(){window.close();},800);
  } else {
    document.body.innerHTML='<p style="font-family:sans-serif;padding:20px">Prihlásenie úspešné. Zatvor toto okno.</p>';
  }
})();
<\/script>
</body></html>`);
  } catch(e) {
    res.status(500).send('Chyba: ' + e.message);
  }
};
