# Station surveys

Status as of 10 October 2026: **built, not yet connected to storage on Vercel.** Follow [Setting it up on Vercel](#setting-it-up-on-vercel) once.

Platform door numbers aren't published anywhere (see [data-sources.md](data-sources.md#4-platform-door-numbers)), so volunteers collect them in person. Anyone standing on a metro platform can open `/contribute` on their phone and record:

- the station, and which platforms they can see (towards Tallawong, towards Sydenham, or both, e.g. at Chatswood)
- for each of those platforms, the lowest and highest door numbers and whether each is at the front or back of the train. Picking the end for one door fills in the opposite end for the other. Everything is optional, so someone who can only reach one end can log just that door.
- optionally, any escalators, stairs and lifts they're next to, with the nearest door and where each one leads
- notes, and their name if they want credit

A submission needs a station, at least one platform and at least one door number.

Each station card on the map links to the form with that station already selected (`/contribute?station=<id>`).

Underground signal is patchy, so the form saves answers on the phone as people type. If sending fails, they can tap Send again later and nothing is lost.

## How it's built

```
/contribute (static page) ──POST──► /api/submissions (Vercel Function) ──► Upstash Redis list
                                         checks the answers, rate limits
npm run export-submissions ──GET + ADMIN_TOKEN──► /api/submissions ──► data/submissions.json
```

| File                             | Role                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/pages/contribute.astro`     | The form. Draft saved in `localStorage`. Prerendered like the home page.                     |
| `src/lib/survey.ts`              | The survey's shape and the server-side check (`parseSurvey`): allowed values, length limits. |
| `src/pages/api/submissions.ts`   | POST stores a survey. GET returns them all, but only with `ADMIN_TOKEN`.                     |
| `src/lib/redis.ts`               | A tiny Upstash REST client using `fetch`, so there's no extra dependency.                    |
| `scripts/export-submissions.mjs` | Downloads everything to `data/submissions.json` (gitignored) and prints a count per station. |

**Why Redis?** A Vercel Function can't save files: each request may run on a fresh machine and its disk is thrown away. Submissions have to go to a hosted database, and Upstash Redis is the simplest option Vercel offers. Its free tier is far more than this needs.

**Spam:** a hidden "website" field catches bots that fill in every input, and each IP can send 30 surveys an hour. IPs are hashed for the rate limit and never stored. Submissions aren't shown on the site, so the worst spam can do is clutter the export.

## Setting it up on Vercel

1. In the Vercel dashboard, open the project and go to **Storage → Create Database → Upstash for Redis** (in the Marketplace). Pick the free plan and a Sydney region if one is offered, and connect it to this project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's environment variables.
2. Make an admin password: run `openssl rand -hex 24`. Add it as `ADMIN_TOKEN` under **Settings → Environment Variables**.
3. Redeploy so the function picks up the new variables.
4. Test it: send a survey from `https://<your-site>/contribute`, then run the export below.

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
