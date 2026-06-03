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
<div id="s" style="font-family:sans-serif;padding:20px">Spracovávam...</div>
<script>
(function(){
  var msg = ${JSON.stringify(msg)};
  var el = document.getElementById('s');
  if(window.opener){
    try{
      window.opener.postMessage(msg,'*');
      el.innerHTML='<b style="color:green">✅ Token odoslaný — čakaj na zatvorenie okna</b>';
      setTimeout(function(){window.close();},3000);
    }catch(e){
      el.innerHTML='<b style="color:red">❌ postMessage chyba: '+e.message+'</b>';
    }
  }else{
    el.innerHTML='<b style="color:red">❌ window.opener je NULL</b>';
  }
})();
<\/script>
</body></html>`);
  } catch(e) {
    res.status(500).send('Chyba: ' + e.message);
  }
};
