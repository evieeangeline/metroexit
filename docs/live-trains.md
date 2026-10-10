# Live trains on the map

Status as of 9 October 2026: **switched on.** It works against the real feed, but the motion between updates still looks wrong at times: trains sometimes jump forward quickly. See [Known problems](#known-problems). To hide it again, set `LIVE_TRAINS = false` in `src/config.ts`.

When it's off, the map shows one decorative train shuttling Tallawong ↔ Sydenham, and `/api/metros` returns 404 so it doesn't use any API quota.

## Turning it on

1. In `src/config.ts`, set `LIVE_TRAINS = true`.
2. Put a TfNSW API key in `.env` as `TFNSW_API_KEY=…`. It's created under **API Tokens** on your Open Data Hub profile. Restart `npm run dev` afterwards.
3. On Vercel, add the same variable under Project → Settings → Environment Variables, then redeploy.

With the switch on but no key, the map falls back to the decorative train and a chip reading "live data offline · simulated".

## What it does

- Draws every Sydney Metro train that's in service as a small capsule on the map.
- Each train sits on its side of the line according to its direction of travel, like two tracks.
- A chip at the top right of the map reads "16 metros live · updated 8s ago" and ticks every second.
- Each train pulses whenever fresh data arrives.
- Trains are meant to stop only at stations, never between them (see [Motion model](#motion-model)).

## How it's built

```
TfNSW GTFS-realtime ──► /api/metros (Vercel Function) ──► map script (polls every 10 s)
   protobuf, needs key        decodes, filters, JSON           snaps to line, animates
```

| File                            | Role                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config.ts`                 | The `LIVE_TRAINS` switch.                                                                                                                                                                                       |
| `src/pages/api/metros.ts`       | Fetches the feed with the key, decodes the protobuf with `gtfs-realtime-bindings`, keeps only vehicles that have a trip and a position, and returns `{ updated, metros: [{ id, lat, lon, bearing, tripId }] }`. |
| `src/components/MetroMap.astro` | The map script: polling, snapping, the motion model, the chip, and the decorative fallback train.                                                                                                               |
| `astro.config.mjs`              | Uses `@astrojs/vercel`. The page is still prerendered; only the API route runs as a function.                                                                                                                   |

### Data source

- **Feed:** `https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/metro`, from the [Public Transport - Realtime Vehicle Positions v2](https://opendata.transport.nsw.gov.au/data/dataset/public-transport-realtime-vehicle-positions-v2) dataset.
- **Auth:** the header `Authorization: apikey <token>`.
- **Format:** GTFS-realtime protobuf. TfNSW adds a custom extension (1007) for occupancy, which we ignore.

### Caching

- **Browser:** gets `Cache-Control: no-store`. This matters: with an ordinary `stale-while-revalidate` header, browsers serve the _previous_ response from cache and refetch in the background, so the map was always one update behind.
- **Vercel's CDN:** caches via `Vercel-CDN-Cache-Control: max-age=10, stale-while-revalidate=10`. All visitors share roughly one upstream request every 10 seconds, so traffic doesn't eat the API quota.

### Snapping to the line

- Each fix is projected onto the SVG and snapped to the nearest point on the drawn route: Tallawong → Sydenham, or the Bankstown branch.
- Fixes more than about 1.3 km from any line (30 SVG units, e.g. a depot) are drawn where they are and glide between fixes.
- Direction of travel comes from comparing the vehicle's compass bearing with the line's direction at that point.

## What the real feed looks like

These observations come from sampling the feed on the evening of 8 October 2026.

- **Fleet size:** about 15–16 trains in service.
- **Update rate and age:** the feed header timestamp moves every 10–15 seconds, and fixes are typically 8–17 seconds old when they reach the browser.
- **Moving trains:** at metro speeds a train covers 150–300 m between updates. That's only about 4–7 px on the map, so real-time movement looks very slow.
- **Dwelling:** trains often sit at a platform for 30 seconds or more.
- **Tunnels:** the feed loses trains in tunnels and keeps repeating the last fix. Under the harbour, between Victoria Cross and Barangaroo, one train reported the exact same position for 30+ seconds with a bearing of exactly `360`, which looks like a placeholder.
- **Depot trains:** trains parked at the depot have no trip and are filtered out by the API.

## Motion model

Gliding straight from one fix to the next looked bad: trains parked mid-tunnel waiting for their next fix. The current model in `MetroMap.astro`, under "live mode":

1. **Station positions:** each station is placed along each route path, in path-length units.
2. **Per-train state:** each train keeps its last real fix (`lObs`, `tObs`), a direction, a speed `v` and the position it's currently drawn at (`shown`).
3. **Target position:** the target is `lObs + direction × v × (now − tObs)`, capped at the next station in the direction of travel. So a train coasts to the next station and waits there until a new fix shows it has left.
4. **Speed:**
   - It's measured from successive fixes, averaged with the previous estimate and capped at 100 km/h.
   - Before a train's speed has been measured, it's assumed to be 55 km/h.
   - It's set to 0 while the train is within a platform length (about 170 m) of a station and not moving.
5. **Stale fixes:** a fix that hasn't moved and isn't at a station is treated as stale and ignored. This handles the tunnel freezes.
6. **Drawing:** the drawn position chases the target smoothly (exponential, rate 2.5/s). It never moves backwards for small differences; it only eases back if it's more than about 430 m (10 units) behind.

A 25-second check against the real feed showed 12 stops, all at stations and none between them.

## Known problems

**Trains sometimes jump forward quickly.** This is why the feature is off. Likely causes, roughly most to least likely:

1. **Catching up after a stale period.** A train in a tunnel coasts to the next station and waits. When a real fix finally arrives, it's often well past that station. The target leaps ahead, and the 2.5/s chase covers the gap in about a second. Nothing limits how fast the drawn train may move.
2. **Wrong time base.** Lag compensation uses the feed's header timestamp, not each vehicle's own `vehicle.timestamp`. If a fix is older than the header says, `dt` is wrong. Then the speed estimate (`moved / dt`) comes out too high and the prediction runs ahead.
3. **Noisy speed estimates.** Speed comes from two fixes. The first fix after a dwell, or after a tunnel, can give an unrealistic value. The 100 km/h cap limits the damage but doesn't remove it.
4. **Snapping to the wrong part of the line.** Snapping picks the nearest point on the whole path. Where the drawn line passes close to itself, or near the Sydenham junction, a fix can snap to a far-away part of the path and the train jumps.
5. **Direction changes at the termini.** When a train reverses at Tallawong or Sydenham, the drawn train jumps straight to the new fix on purpose.

## Ideas for next time

- **Record before tuning.** Save 30–60 minutes of `/api/metros` responses and add a replay mode, so the motion can be tuned offline and repeatably. A debug overlay showing raw fixes next to the drawn trains would make each problem above obvious.
- **Limit the drawn speed.** Cap how fast the drawn train may move, e.g. about 1.5× the train's real top speed. Spread big corrections over the next update interval instead of jumping.
- **Use each vehicle's own timestamp.** Have the API return `vehicle.timestamp` and use it for `tObs` and the speed estimate.
- **Search near the last position.** Snap only within a window around the train's previous position, so a fix can't snap to the other side of a curve.
- **Use timetable predictions instead of GPS.** The trip-updates feed (`/v2/gtfs/realtime/metro`) gives predicted arrival and departure times for each stop. Animating each train from departure to arrival along the line would sidestep tunnel GPS entirely and match how a metro actually runs. This is probably the most robust fix.
- **Use the real track geometry.** Use `shapes.txt` from the static GTFS feed (`/v2/gtfs/schedule/metro`), instead of the smoothed station-to-station curves, so snapped positions match the actual track.

## Licence and obligations

The data is CC BY 4.0 under the [Open Data Hub terms](https://opendata.transport.nsw.gov.au).

- **Attribution:** when the feature is on, the footer reads "Live positions and station data © Transport for NSW, used under CC BY 4.0. Positions are approximate." This is driven by the same switch.
- **No endorsement:** the footer also says the site isn't affiliated with TfNSW, and it uses no TfNSW logos.
- **Key handling:** the API key stays on the server (`.env` locally, Vercel environment variables in production). It's never sent to the browser or committed to git.
