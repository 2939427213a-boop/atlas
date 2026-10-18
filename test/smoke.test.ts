import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import worker from '../src/worker/index';

describe('scaffold', () => {
  it('applies the migrations', async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('beacons', 'salts', 'counters') ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(['beacons', 'counters', 'salts']);
  });

  it('answers unknown API paths with 404', async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request('https://atlas.example.test/api/nope'), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });
});
