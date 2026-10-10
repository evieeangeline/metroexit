# metroexit

for those moments when you are sprinting to the bus, which door would optimize my route outta here? well... now you know :)

## Website

The site is an [Astro](https://astro.build) page in `src/`, prerendered as static HTML.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

- `src/data/metro.ts`: stations, their lines, and how far along the exit data is for each (`ready` / `mapping` / `soon`). When the Bankstown line opens, change its status and the legend label in `src/pages/index.astro`.
- `src/components/MetroMap.astro`: the interactive map. It projects real lat/lon onto the SVG, so new stations only need coordinates.
- `src/pages/api/metros.ts`: live metro positions. A Vercel Function fetches the TfNSW GTFS-realtime vehicle positions feed (`/v2/gtfs/vehiclepos/metro`), decodes the protobuf and returns JSON. The map polls it every 10 seconds. Responses are cached at the edge for 10 seconds, so traffic doesn't use up the API quota.

### Station surveys

Door numbers aren't published, so volunteers log them at `/contribute`. Submissions go to Upstash Redis through `src/pages/api/submissions.ts`, and `npm run export-submissions` downloads them. Setup steps are in [docs/contributions.md](docs/contributions.md).

### Live metro data

Live train positions are on (`LIVE_TRAINS` in `src/config.ts`). They need `TFNSW_API_KEY` set locally and on Vercel; without it, the map shows one decorative train. See [docs/live-trains.md](docs/live-trains.md) for how it works, how to turn it on and what's left to do.

To deploy, import the repo into Vercel. It detects Astro and the `@astrojs/vercel` adapter automatically.
