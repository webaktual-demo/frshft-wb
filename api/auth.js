module.exports = async function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'repo user',
    redirect_uri: 'https://www.freshfit.sk/api/callback'
  });
  return res.redirect(
    'https://github.com/login/oauth/authorize?' + params.toString()
  );
};
