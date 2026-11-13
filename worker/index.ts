/**
 * Cloudflare Worker: phục vụ app (thư mục dist) + API Google Sheets.
 * Biến môi trường (GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_SPREADSHEET_ID...)
 * nạp bằng: npx wrangler secret bulk .env
 */
import { handleSheetsApi, resolveSheetsConfig, type SheetsEnv } from '../src/server/sheetsCore';

interface Env extends SheetsEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/google-sheets/')) {
      const result = await handleSheetsApi(request.method, url.pathname, () => request.json(), resolveSheetsConfig(env));
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ success: false, error: 'API không tồn tại' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Còn lại: file tĩnh của app (mở thẳng /ton-ngay... trả về index.html)
    return env.ASSETS.fetch(request);
  },
};
