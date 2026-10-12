# SHIFTLINE — Cloudflare Pages

Static browser game migration prepared from the original [SHIFTLINE on Hatchable](https://se6f1x.hatchable.site/) v92 game source. Hatchable v93 adds only a standalone progress transfer helper; its game code remains unchanged. This repository contains the actual six-course racing game, cockpit, Track Observatory and source. The original Hatchable site is preserved.

## Cloudflare Workers deployment (current site)

Cloudflare project: **shiftline-game** — https://shiftline-game.jackbowerman.workers.dev/

The live address ends in `workers.dev`, meaning this deployment uses **Cloudflare Workers static assets**, not Cloudflare Pages. The root `wrangler.jsonc` declares the matching Worker name and the exact `./public` static assets directory; the repository intentionally has no separate build step.

Open **Cloudflare → Workers & Pages → shiftline-game → Settings → Builds** and check:

- Git repository: `Jacko952508/shiftline-cloudflare`
- Production branch: `main`
- Root directory: repo root (blank or `/`)
- **Build command: empty** (or `exit 0`)
- **Deploy command: `npx wrangler deploy`**

Cloudflare should deploy on each push. Its Worker static asset serving uses `wrangler.jsonc` to upload the files in `public` and expose `index.html` at the root URL. Do not configure a second Pages app unless you intend to migrate hosting types.

**Asset migration status:** The exact original Three.js r186 assets have been restored to `public/vendor/`. The seven original MP3 tracks remain queued for the GitHub [verified asset importer](.github/workflows/import-hatchable-assets.yml), which is scheduled after UTC midnight and can be manually started from GitHub Actions. Until they are imported, 3D gameplay should initialise but recorded soundtracks may be unavailable. The asset importer checks original SHA-256 hashes, then commits the missing assets and lets Cloudflare redeploy automatically.

## Transfer your existing progress

Once the original Hatchable site is accessible, open [SHIFTLINE save export](https://se6f1x.hatchable.site/transfer.html) **in the same browser** where you previously played. Choose **Copy my SHIFTLINE save**. On the final Cloudflare Pages address, open **/transfer.html**, paste the save, and choose **Import this save**. The tool reads only the `shiftlineEclipseProgressV1` localStorage key and never sends the contents to a server. Import requires explicit confirmation and replaces any save already present on the new domain. Some browsers/webviews keep separate localStorage even on the same website, so use the browser profile where you normally play.

## Notes

- Multiplayer connects to the external `tuber-racers-relay.onrender.com` service; confirm WebSocket access from the new Cloudflare Pages domain.
- Saved records/customisations use origin-specific browser localStorage. They **do not automatically carry** from the Hatchable domain to a new Pages domain. Keep the old site available during migration.
- Built-in music is streamed from local `public/music/*.mp3`, not an external third party.
- The app is static, with no Hatchable API functions or database required.
- `public/_headers` adds Cloudflare caching and security headers.
