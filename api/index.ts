import type { VercelRequest, VercelResponse } from '@vercel/node';

// Senha padrão
const ADMIN_PASSWORD = "151612";

// Armazenar sessões em memória (em produção usar Redis)
const sessions = new Map<string, { createdAt: number }>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  // Sessão válida por 30 dias
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - session.createdAt < thirtyDaysInMs;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const path = req.url?.split('?')[0] || '';
    console.log(`[API] ${req.method} ${path}`);

    // Health check
    if (path === '/api/health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Login endpoint
    if (path === '/api/auth/login' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const password = body.password || body.json?.password;

      if (password === ADMIN_PASSWORD) {
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { createdAt: Date.now() });
        
        res.setHeader('Set-Cookie', `simple_auth_session=${sessionToken}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`);
        return res.status(200).json({ success: true });
      }

      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Check auth endpoint
    if (path === '/api/auth/check' && req.method === 'GET') {
      const cookies = req.headers.cookie || '';
      const sessionMatch = cookies.match(/simple_auth_session=([^;]+)/);
      const token = sessionMatch ? sessionMatch[1] : undefined;
      const authenticated = isValidSession(token);

      return res.status(200).json({ authenticated });
    }

    // Logout endpoint
    if (path === '/api/auth/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'simple_auth_session=; Path=/; Max-Age=0; HttpOnly');
      return res.status(200).json({ success: true });
    }

    // 404
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
