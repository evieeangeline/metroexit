// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// Pages are prerendered as static HTML; only /api/* runs as Vercel Functions.
export default defineConfig({
  adapter: vercel(),
  env: {
    schema: {
      // TfNSW Open Data API token, read at runtime on the server only.
      TFNSW_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Upstash Redis for /contribute submissions. Vercel's integration sets KV_REST_API_*;
      // a database made on upstash.com uses UPSTASH_REDIS_REST_*. Either pair works.
      KV_REST_API_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      KV_REST_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      UPSTASH_REDIS_REST_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      UPSTASH_REDIS_REST_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Password for reading submissions back (GET /api/submissions, npm run export-submissions).
      ADMIN_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
