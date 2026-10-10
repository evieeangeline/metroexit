// Live Sydney Metro positions, proxied from the TfNSW GTFS-realtime feed so the
// API key never reaches the browser. Responses are cached at Vercel's edge for
// 10 s, so every visitor shares one upstream request.
import type { APIRoute } from 'astro';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { TFNSW_API_KEY } from 'astro:env/server';
import { LIVE_TRAINS } from '../../config';

export const prerender = false;

const FEED = 'https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/metro';
const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

export interface Metro {
  id: string;
  lat: number;
  lon: number;
  bearing: number | null;
  tripId: string | null;
}

// Browsers must never cache this (they honour stale-while-revalidate and would
// hand back the previous positions). Only Vercel's CDN caches it, via its own header.
const json = (body: unknown, status: number, cdnCache?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...(cdnCache && { 'vercel-cdn-cache-control': cdnCache }),
    },
  });

export const GET: APIRoute = async () => {
  // Feature switched off (src/config.ts): don't spend API quota on it.
  if (!LIVE_TRAINS) return json({ error: 'disabled' }, 404);

  const key = TFNSW_API_KEY;
  if (!key) return json({ error: 'not-configured' }, 503);

  let res: Response;
  try {
    res = await fetch(FEED, {
      headers: { authorization: `apikey ${key}`, accept: 'application/x-google-protobuf' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json({ error: 'upstream-unreachable' }, 502);
  }
  if (!res.ok) return json({ error: 'upstream', status: res.status }, 502);

  const feed = FeedMessage.decode(new Uint8Array(await res.arrayBuffer()));
  const metros: Metro[] = [];
  for (const entity of feed.entity) {
    const v = entity.vehicle;
    const pos = v?.position;
    // Only trains in service (with a trip) that report a position.
    if (!v || !pos || !v.trip?.tripId) continue;
    metros.push({
      id: v.vehicle?.id || entity.id,
      lat: pos.latitude,
      lon: pos.longitude,
      bearing: pos.bearing ?? null,
      tripId: v.trip.tripId,
    });
  }

  const updated = Number(feed.header.timestamp ?? 0) * 1000 || Date.now();
  return json({ updated, metros }, 200, 'max-age=10, stale-while-revalidate=10');
};
