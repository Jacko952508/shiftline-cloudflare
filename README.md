# SHIFTLINE — Cloudflare Pages

Static browser game migrated from the original [SHIFTLINE on Hatchable](https://se6f1x.hatchable.site/) v92. This repository contains the actual six-course racing game, cockpit, Track Observatory and source. The original Hatchable site is preserved.

## Cloudflare Pages setup

1. Open [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) and select **Create > Pages > Connect to Git**.
2. Select **Jacko952508/shiftline-cloudflare**, production branch **main**.
3. Framework preset: **None**. Build command: **leave blank**. Build output directory: **public**. Root directory: **/**.
4. Deploy and test all six courses, Track Observatory, sound, and multiplayer.

**Important:** Wait until **public/.shiftline-assets-complete** appears in GitHub before the first Cloudflare production deploy. The nine original MP3 and Three.js vendor files total about 19 MB and cannot be downloaded from Hatchable during its daily bandwidth suspension. The [Import original SHIFTLINE assets](.github/workflows/import-hatchable-assets.yml) GitHub Action automatically tries after the next UTC midnight (00:27 UTC daily) and may also be launched through Actions > Run workflow. It checks every file's original SHA256 hash and commits the original binary assets. After successful import, subsequent scheduled runs do nothing. The site does not need Hatchable bandwidth once the assets are imported.

## Notes

- Multiplayer connects to the external `tuber-racers-relay.onrender.com` service; confirm WebSocket access from the new Cloudflare Pages domain.
- Saved records/customisations use origin-specific browser localStorage. They **do not automatically carry** from the Hatchable domain to a new Pages domain. Keep the old site available during migration.
- Built-in music is streamed from local `public/music/*.mp3`, not an external third party.
- The app is static, with no Hatchable API functions or database required.
- `public/_headers` adds Cloudflare caching and security headers.
