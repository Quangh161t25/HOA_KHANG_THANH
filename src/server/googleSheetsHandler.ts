import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleSheetsApi, resolveSheetsConfig, type SheetsEnv } from './sheetsCore.js';

/**
 * Adapter Node (Vite dev server + Vercel) cho lõi sheetsCore.
 * Cloudflare Pages dùng functions/api/google-sheets/[[path]].ts với cùng lõi.
 */
export async function googleSheetsHandler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const readJson = async (): Promise<unknown> => {
    if (req.body !== undefined) {
      return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  const pathname = (req.url || '').split('?')[0];
  const result = await handleSheetsApi(
    req.method || 'GET',
    pathname,
    readJson,
    resolveSheetsConfig(process.env as SheetsEnv),
  );

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
