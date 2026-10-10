// Station surveys from /contribute. POST stores one in Redis; GET returns them
// all, but only with the ADMIN_TOKEN (see docs/contributions.md).
import type { APIRoute } from 'astro';
import { ADMIN_TOKEN } from 'astro:env/server';
import { parseSurvey } from '../../lib/survey';
import { redis, redisConfigured } from '../../lib/redis';

export const prerender = false;

const LIST = 'metroexit:submissions';
// Generous enough for someone logging a few stations in a row.
const RATE_LIMIT = 30;
const RATE_WINDOW_S = 60 * 60;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Could not read the form.' }, 400);
  }

  // Hidden field that people never see but form-filling bots do. Pretend it worked.
  if (raw.website) return json({ ok: true }, 200);

  const survey = parseSurvey(raw);
  if (typeof survey === 'string') return json({ error: survey }, 400);

  const record = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), ...survey };

  if (!redisConfigured) {
    // `npm run dev` without Redis: print it so the form can still be tried out.
    if (import.meta.env.DEV) {
      console.log('[submissions] Redis not configured, not stored:\n' + JSON.stringify(record, null, 2));
      return json({ ok: true, id: record.id }, 200);
    }
    return json({ error: 'Submissions are not set up yet. Please try again later.' }, 503);
  }

  // Rate limit by a hash of the IP, so raw addresses are never stored.
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateKey = `metroexit:rate:${(await sha256(ip)).slice(0, 16)}`;

  try {
    const [count] = await redis(['INCR', rateKey], ['EXPIRE', rateKey, RATE_WINDOW_S, 'NX']);
    if (Number(count) > RATE_LIMIT) return json({ error: 'That’s a lot of surveys! Try again in an hour.' }, 429);
    await redis(['RPUSH', LIST, JSON.stringify(record)]);
  } catch (err) {
    console.error(err);
    return json({ error: 'Couldn’t save that. Please try again.' }, 502);
  }
  return json({ ok: true, id: record.id }, 200);
};

export const GET: APIRoute = async ({ request }) => {
  if (!ADMIN_TOKEN || !(await isAdmin(request.headers.get('authorization'))))
    return json({ error: 'unauthorized' }, 401);
  if (!redisConfigured) return json({ error: 'not-configured' }, 503);
  const [items] = await redis(['LRANGE', LIST, 0, -1]);
  return json(
    (items as string[]).map((s) => JSON.parse(s)),
    200,
  );
};

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compares hashes rather than the tokens themselves, so the time taken doesn't
// reveal how much of a guessed token was right.
async function isAdmin(header: string | null) {
  const given = header?.replace(/^Bearer\s+/i, '') ?? '';
  return (await sha256(given)) === (await sha256(ADMIN_TOKEN ?? ''));
}
