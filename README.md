# SHIFTLINE — Cloudflare Workers

Static browser game migration prepared from the original [SHIFTLINE on Hatchable](https://se6f1x.hatchable.site/) v92 game source. Hatchable v93 adds only a standalone progress transfer helper; its game code remains unchanged. This repository contains the actual six-course racing game, cockpit, Track Observatory and source. The original Hatchable site is preserved.

## Cloudflare Workers deployment (current site)

Cloudflare project: **shiftline-game** — https://shiftline-game.beyondthebox.workers.dev/

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

Once the original Hatchable site is accessible, open [SHIFTLINE save export](https://se6f1x.hatchable.site/transfer.html) **in the same browser** where you previously played. Choose **Copy my SHIFTLINE save**. On the Cloudflare Workers address, open **/transfer.html**, paste the save, and choose **Import this save**. The tool reads only the `shiftlineEclipseProgressV1` localStorage key and never sends the contents to a server. Import requires explicit confirmation and replaces any save already present on the new domain. Some browsers/webviews keep separate localStorage even on the same website, so use the browser profile where you normally play.

## Notes

- Multiplayer connects to the external `tuber-racers-relay.onrender.com` service; confirm WebSocket access from the Cloudflare Workers domain.
- Saved records/customisations use origin-specific browser localStorage. They **do not automatically carry** from the Hatchable domain to a new Pages domain. Keep the old site available during migration.
- Built-in recorded music loads from local `public/music/*.mp3`. While those files remain unavailable, the existing Web Audio synthesis worker provides a fallback.
- The app is static, with no Hatchable API functions or database required.
- `public/_headers` adds Cloudflare caching and security headers.

## Workers Builds verification

A successful GitHub Actions source test does **not** prove the Worker deployed.
The Cloudflare GitHub check named **Workers Builds: shiftline-game** must
finish successfully, and the production HTML must serve the same versioned
`race-engine.js?v=...` reference as `public/index.html`. If the check fails
before uploading assets, use **Cloudflare → Workers & Pages → shiftline-game →
Deployments / Builds** to inspect and retry that deployment. Do not rely on a
cache-busting query parameter alone; it cannot publish missing files.

## Troubleshooting

Open [/diagnostics.html](https://shiftline-game.beyondthebox.workers.dev/diagnostics.html) on the deployed site to check whether Cloudflare actually serves HTML, JS modules, the Three.js engine, and MP3 assets with correct MIME types. If a file returns a 200 HTML page instead of JavaScript, check Workers Builds **Deploy command** is `npx wrangler deploy`, root is repo root, and `wrangler.jsonc` contains `assets.directory: "./public"`. The main page displays a module-load error with a link to diagnostics if startup fails. The origin cannot be live-tested from the current GitHub tool connection.

## V145 final stability pass

Corrects high-DPI iPhone race viewport scaling, avoids unused HDR target allocation in Low quality, clears captured steering/fire/keys on pause and restart, pauses solo countdowns on interruption, resets stale race notifications, and aligns Observatory chapter jumps with authored act boundaries. Existing fleet, course scenery, saves and controls are retained.
