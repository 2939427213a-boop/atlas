import type { Env } from './env';
import { utcDay } from './visitor';

const DAY = 86_400_000;

/** Daily cron: raw events past RETENTION_DAYS, salts from earlier days, counters older than 90 days. */
export async function prune(env: Env, now = Date.now()): Promise<void> {
  const keepDays = Number(env.RETENTION_DAYS || '730');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM beacons WHERE received_at < ?1').bind(now - keepDays * DAY),
    env.DB.prepare('DELETE FROM salts WHERE day < ?1').bind(utcDay(now)),
    env.DB.prepare('DELETE FROM counters WHERE day < ?1').bind(utcDay(now - 90 * DAY)),
  ]);
}
