import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../server/routers';
import { createContext } from '../server/_core/context';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[API] Incoming request:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Convert Vercel request to Fetch API Request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;
    
    console.log('[API] Request URL:', url);
    
    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body) {
        body = JSON.stringify(req.body);
      }
    }
    
    const fetchRequest = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body,
    });

    console.log('[API] Calling tRPC handler');

    // Handle tRPC request
    const response = await fetchRequestHandler({
      endpoint: '/api',
      req: fetchRequest,
      router: appRouter,
      createContext: () => createContext({ req: req as any, res: res as any }),
    });

    console.log('[API] tRPC response status:', response.status);

    // Convert Fetch API Response to Vercel response
    const responseBody = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(responseBody);
  } catch (error) {
    console.error('[API] Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[API] Error stack:', errorStack);
    
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}
