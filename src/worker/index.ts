import { checkAccess } from './access';
import { exportRows, renderDashboard } from './admin';
import type { Env } from './env';
import { handleIngest, type Cf } from './ingest';
import { prune } from './retention';

const isAdmin = (p: string) => p === '/admin' || p.startsWith('/admin/');
const empty = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/e') return handleIngest(request, env, ctx, request.cf as Cf | undefined);
    if (isAdmin(url.pathname)) {
      const local = (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && env.DEV_ADMIN_OPEN === '1';
      if (!local) {
        const denied = await checkAccess(request, env);
        if (denied) return empty(denied);
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return empty(405);
      if (url.pathname === '/admin' || url.pathname === '/admin/') return renderDashboard(env, url);
      if (url.pathname === '/admin/export.ndjson') return exportRows(env, url);
      return empty(404);
    }
    if (url.pathname.startsWith('/api/')) return empty(404);
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(prune(env));
  },
} satisfies ExportedHandler<Env>;
