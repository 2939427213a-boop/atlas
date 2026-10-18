import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { prune } from '../src/worker/retention';

const NOW = Date.UTC(2026, 9, 10, 9, 17);
const DAY = 86_400_000;
const insert = (receivedAt: number, day: string) => env.DB.prepare(`INSERT INTO beacons (received_at, day, schema, pv, seq, final, dvid,
  path, active_ms, n_events, n_clicks, bot, events) VALUES (?1, ?2, 1, 'pppppppppppp', 0, 0, 'd', '/', 0, 0, 0, 0, '[]')`).bind(receivedAt, day);
const days = async (table: string) => (await env.DB.prepare(`SELECT day FROM ${table} ORDER BY day`).all<{ day: string }>()).results.map((r) => r.day);

describe('prune', () => {
  it('deletes raw events past retention, old salts and old counters', async () => {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM beacons'), env.DB.prepare('DELETE FROM salts'), env.DB.prepare('DELETE FROM counters'),
      insert(NOW - 731 * DAY, '2024-10-09'), insert(NOW - 10 * DAY, '2026-09-30'),
      env.DB.prepare("INSERT INTO salts (day, salt) VALUES ('2026-10-09', 'old'), ('2026-10-10', 'today')"),
      env.DB.prepare("INSERT INTO counters (day, n) VALUES ('2026-06-01', 3), ('2026-10-10', 4)"),
    ]);
    await prune(env, NOW);
    expect(await days('beacons')).toEqual(['2026-09-30']);
    expect(await days('salts')).toEqual(['2026-10-10']);
    expect(await days('counters')).toEqual(['2026-10-10']);
  });
});
