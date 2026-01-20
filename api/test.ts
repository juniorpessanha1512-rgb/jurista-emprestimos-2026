import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[TEST API] Request received:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  res.status(200).json({
    success: true,
    message: 'API test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
