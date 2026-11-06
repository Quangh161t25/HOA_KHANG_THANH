import type { Plugin } from 'vite';
import { googleSheetsHandler } from './googleSheetsHandler';

export function googleSheetsPlugin(): Plugin {
  return {
    name: 'vite-plugin-google-sheets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/google-sheets/')) return next();
        void googleSheetsHandler(req, res);
      });
    },
  };
}
