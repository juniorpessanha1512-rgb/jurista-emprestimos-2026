// Handler de autenticação simplificado
const ADMIN_PASSWORD = "151612";

module.exports = async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const url = req.url;

  try {
    // Endpoint de Login
    if (method === 'POST' && url.includes('login')) {
      const body = req.body;
      const password = body.password || (body.json && body.json.password);

      if (password === ADMIN_PASSWORD) {
        // Definir cookie de sessão
        res.setHeader('Set-Cookie', `simple_auth_session=true; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`);
        return res.status(200).json({ success: true });
      }
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Endpoint de Check
    if (method === 'GET' && url.includes('check')) {
      const cookies = req.headers.cookie || '';
      const authenticated = cookies.includes('simple_auth_session=true');
      return res.status(200).json({ authenticated });
    }

    // Endpoint de Logout
    if (method === 'POST' && url.includes('logout')) {
      res.setHeader('Set-Cookie', 'simple_auth_session=; Path=/; Max-Age=0; HttpOnly');
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Não encontrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
};
