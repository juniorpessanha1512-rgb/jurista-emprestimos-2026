const ADMIN_PASSWORD = "151612";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  
  if (req.method === 'POST' && url.includes('login')) {
    const password = req.body.password || (req.body.json && req.body.json.password);
    if (password === ADMIN_PASSWORD) {
      res.setHeader('Set-Cookie', 'simple_auth_session=true; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax');
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  if (req.method === 'GET' && url.includes('check')) {
    const cookies = req.headers.cookie || '';
    return res.status(200).json({ authenticated: cookies.includes('simple_auth_session=true') });
  }

  return res.status(404).json({ error: 'Not found' });
};
