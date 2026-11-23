# Hosting the Mandara Collateral Maker

The live app is the Mandara-branded single-file build in `site/index.html` (21 Nov 2026), served behind HTTP Basic authentication. Any username is accepted; the password is the `SITE_PASSWORD` secret, which is not in this repository.

## Current deploy (Cloudflare Worker)

The Mandara-collateral API token can edit Workers but cannot create Cloudflare Pages projects, so the app is deployed as a Worker with static assets on the same account as Mandara AI:

`https://mandara-collateral-maker.mandara-collateral.workers.dev`

```sh
export CLOUDFLARE_ACCOUNT_ID=4d9924ff72b543740cfc6f212d7d3fde
export CLOUDFLARE_API_TOKEN=...   # from the box secrets file, never committed
npx wrangler deploy --secrets-file /path/to/secrets.json
```

`secrets.json` should contain `{"SITE_PASSWORD":"..."}` and must not be committed (see `.gitignore`).

## Cloudflare Pages (when a token with Pages: Edit is available)

Project name: `mandara-collateral-maker` (URL `https://mandara-collateral-maker.pages.dev`).

```sh
npx wrangler pages project create mandara-collateral-maker --production-branch=cloudflare-pages
# deploy the site folder plus functions/_middleware.js
npx wrangler pages deploy ./pages-dist --project-name=mandara-collateral-maker
npx wrangler pages secret put SITE_PASSWORD --project-name=mandara-collateral-maker
```

Build the Pages upload directory as `pages-dist/index.html` (copy of `site/index.html`) and `pages-dist/functions/_middleware.js`.

Do not merge this branch to `main` without an explicit go-ahead. `main` stays the generic, rebrandable Collateral Maker.
