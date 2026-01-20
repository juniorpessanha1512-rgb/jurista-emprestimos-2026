import { neon } from '@neondatabase/serverless';

// Configuração do Banco de Dados
const sql = neon(process.env.DATABASE_URL);

// Senha de acesso
const ADMIN_PASSWORD = "151612";

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  
  try {
    // 1. Endpoint de Login
    if (req.method === 'POST' && url.includes('/api/auth/login')) {
      let body = req.body;
      
      // No Vercel, o body pode vir como string ou objeto
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }
      
      const password = body?.password || body?.json?.password;
      
      if (password === ADMIN_PASSWORD) {
        res.setHeader('Set-Cookie', 'simple_auth_session=true; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax');
        return res.status(200).json({ success: true });
      }
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // 2. Endpoint de Check Auth
    if (req.method === 'GET' && url.includes('/api/auth/check')) {
      const cookies = req.headers.cookie || '';
      return res.status(200).json({ authenticated: cookies.includes('simple_auth_session=true') });
    }

    // 3. Endpoint de Teste de Banco de Dados
    if (req.method === 'GET' && url.includes('/api/db-test')) {
      const result = await sql`SELECT NOW() as now`;
      return res.status(200).json({ success: true, db_time: result[0].now });
    }

    // 4. Listar Clientes (Exemplo de uso do banco)
    if (req.method === 'GET' && url.includes('/api/clients')) {
      const clients = await sql`SELECT * FROM clients LIMIT 10`;
      return res.status(200).json(clients);
    }

    // 5. Endpoint de Health Check
    if (req.method === 'GET' && url.includes('/api/health')) {
      return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
    }

    return res.status(404).json({ error: 'Endpoint não encontrado: ' + url });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
}
