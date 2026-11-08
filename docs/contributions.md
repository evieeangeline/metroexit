# Station surveys

Status as of 9 November 2026: **working, storing to Upstash Redis.** The survey now lives in the station card on the home page; it replaced the separate `/contribute` form on this date.

Platform door numbers aren't published anywhere (see [data-sources.md](data-sources.md#4-platform-door-numbers)), so volunteers map platforms in person. The survey assumes every platform has doors 4 to 21, with door 4 at the south (Bankstown) end. That's confirmed at Victoria Cross and Gadigal, but not yet on the Bankstown line, whose stations are converted Sydney Trains stations; there the form asks people to say in the notes if the numbers are different.

The form is inside the station card on the home page, so there's nothing to open or navigate to. Pick a station on the map (on a phone, the card slides up), then:

1. Pick the platform: to Tallawong, to Bankstown, or both sides, if the two sides have the same things at the same doors.
2. Tap a door on the train (six carriages of three doors), then tap what's next to it: escalators, stairs, lift, accessible door, seats or help point. Marked doors show their icons.
3. Optionally type anything else in one line, and tap Send.

A submission needs a platform and at least one door with something marked. After sending, they can map the other side of the same station in one tap. Stations with "coming soon" status don't show the survey (none right now). On desktop, the form only shows for the station that's been clicked, not one that's just hovered.

### Submission shape

```json
{
  "id": "…",
  "receivedAt": "2026-11-09T…Z",
  "station": "victoria-cross",
  "platform": "both",
  "doors": [{ "door": 4, "features": ["lift", "accessible"], "note": "" }],
  "notes": "escalators at 10 go to Miller St",
  "name": ""
}
```

Submissions from before 9 November 2026 have the first form's shape instead: `platforms` (lowest and highest door, and which end each was at) and `connections` (way off, nearest door, where it leads). `npm run export-submissions` counts both.

Southbound was `"sydenham"` until the Bankstown line opened on 30 October 2026, when trains started running through to Bankstown. It's `"bankstown"` now, and the API and export read `"sydenham"` as `"bankstown"`.

`note` and `name` are always empty from the card; the API still accepts them, and older submissions have them.

Links like `/?station=gadigal` open the map with that station's card and survey showing. The old `/contribute?station=<id>` links redirect there.

Underground signal is patchy, so answers are kept on the phone (`localStorage`, one draft per station) as people tap. If sending fails, they can tap Send again later and nothing is lost.

## How it's built

```
station card (DoorSurvey) ──POST──► /api/submissions (Vercel Function) ──► Upstash Redis list
                                         checks the answers, rate limits
npm run export-submissions ──GET + ADMIN_TOKEN──► /api/submissions ──► data/submissions.json
```

| File                              | Role                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/DoorSurvey.astro` | The form inside the station card. Watches `data-pinned` / `data-shown` on `.card`, which `MetroMap.astro` sets. |
| `src/lib/icons.ts`                | The feature icons.                                                                                              |
| `src/pages/contribute.astro`      | Redirects old links to `/?station=…`.                                                                           |
| `src/lib/survey.ts`               | The survey's shape and the server-side check (`parseSurvey`): allowed values, length limits.                    |
| `src/pages/api/submissions.ts`    | POST stores a survey. GET returns them all, but only with `ADMIN_TOKEN`.                                        |
| `src/lib/redis.ts`                | A tiny Upstash REST client using `fetch`, so there's no extra dependency.                                       |
| `scripts/export-submissions.mjs`  | Downloads everything to `data/submissions.json` (gitignored) and prints a count per station.                    |

**Why Redis?** A Vercel Function can't save files: each request may run on a fresh machine and its disk is thrown away. Submissions have to go to a hosted database, and Upstash Redis is the simplest option Vercel offers. Its free tier is far more than this needs.

**Spam:** a hidden "website" field catches bots that fill in every input, and each IP can send 30 surveys an hour. IPs are hashed for the rate limit and never stored. Submissions aren't shown on the site, so the worst spam can do is clutter the export.

## Setting it up on Vercel

1. In the Vercel dashboard, open the project and go to **Storage → Create Database → Upstash for Redis** (in the Marketplace). Pick the free plan and a Sydney region if one is offered, and connect it to this project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's environment variables.
2. Make an admin password: run `openssl rand -hex 24`. Add it as `ADMIN_TOKEN` under **Settings → Environment Variables**.
3. Redeploy so the function picks up the new variables.
4. Test it: pick a station on `https://<your-site>/` and send a survey, then run the export below.

Without the Redis variables, the live site tells volunteers "Submissions are not set up yet", and `npm run dev` prints each submission to the terminal instead of storing it.

## Reading the submissions

Put the site address and admin password in `.env.local` (it's gitignored):

```sh
SITE_URL=https://your-site.vercel.app
ADMIN_TOKEN=the-same-token-as-on-vercel
```

Then:

```sh
npm run export-submissions
```

This writes `data/submissions.json` and prints how many platforms have been logged at each station. You can also get the raw JSON with `curl -H "Authorization: Bearer $ADMIN_TOKEN" https://your-site.vercel.app/api/submissions`.

The data can also be browsed in the Upstash console, under the `metroexit:submissions` list.

## Still to do

- Turn submissions into the door guide: combine the surveys for each platform, settle disagreements, and write the result into the station data.
- Delete test or junk submissions. For now, use the Upstash console (`LREM`) or filter them out after exporting.
