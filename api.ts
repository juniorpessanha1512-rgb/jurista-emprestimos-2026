import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './server/routers';
import { createContext } from './server/_core/context';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Convert Vercel request to Fetch API Request
  const url = `https://${req.headers.host}${req.url}`;
  const fetchRequest = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  // Handle tRPC request
  const response = await fetchRequestHandler({
    endpoint: '/api',
    req: fetchRequest,
    router: appRouter,
    createContext: () => createContext({ req: req as any, res: res as any }),
  });

  // Convert Fetch API Response to Vercel response
  const body = await response.text();
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.send(body);
}
