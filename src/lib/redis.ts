// Minimal Upstash Redis client over its REST API, so serverless functions don't
// need a connection pool or an extra dependency. Vercel's Upstash integration
// sets KV_REST_API_*; a database created on upstash.com directly uses UPSTASH_REDIS_REST_*.
import { KV_REST_API_TOKEN, KV_REST_API_URL, UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from 'astro:env/server';

const url = KV_REST_API_URL || UPSTASH_REDIS_REST_URL;
const token = KV_REST_API_TOKEN || UPSTASH_REDIS_REST_TOKEN;

export const redisConfigured = !!(url && token);

type Command = (string | number)[];

/** Runs commands in one round trip and returns each result, in order. */
export async function redis(...commands: Command[]): Promise<unknown[]> {
  if (!url || !token) throw new Error('Redis is not configured');
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Redis responded ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = out.find((r) => r.error);
  if (failed) throw new Error(`Redis error: ${failed.error}`);
  return out.map((r) => r.result);
}
