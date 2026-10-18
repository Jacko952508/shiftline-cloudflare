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

## V146 recovery and mobile workload

Centred collision-checked recovery now resets lateral velocity, steering, bank and camera follow for both the player and AI, with skipped gates excluded from clean-pass rewards. Distant opponents keep racing but their meshes and animations are culled beyond the useful track view. Impact bursts reuse their particle vectors and palette colour.


## V147 graphics finish

Native-framebuffer anti-aliasing smooths iPhone race edges while retaining the safe direct WebKit renderer. Six smaller, course-specific HDR reflection fields, coated-alloy response and filtered specular detail balance metal highlights and shadows. Rounded, shaded, opaque canopy lobes retain existing instancing, tree placement and clearance bounds. No extra lights, draw calls or post-processing passes are introduced by the material finish.


## V148 complete surface art pass

Adds fitted procedural panel seams, vents, stencil markings and filtered wear to tunnel and obstacle surfaces; bevels the existing service and obstacle hardware inside its original bounds. All six ship families receive layered coatings and manufactured surface detail while preserving their silhouettes and cosmetic selections. Distant orbital façades gain filtered window lights and stepped crowns; rock relief, leaf mottling and rounded hero canopies improve the six world backgrounds. The material shaders add no lights or rendering passes. Public-source verification compares deployed asset hashes with this commit.


## V162 Flightworks collection

Replaces the modular garage with six selectable airframes and three authored editions per airframe. Each edition defines complete wing geometry, nose proportions, stabilisers, materials, colour and matching exhaust. All eighteen are available in the collection; records and XP remain in the existing save. Editions persist per ship and encode through the existing multiplayer livery field as well as the new edition field.

The fleet uses closed capped lofts, sealed aerofoils, continuous canopy sockets and seated nozzles. Object-space micrograin avoids UV atlas seams. Static bodywork is batched by material for racing and the new architectural showroom. `test/fleet-v162.mjs` checks manifold surfaces, structural contacts, ray-tested wing inlay support, distinct physical editions, wingspans and network compatibility. `test/fleet-browser-v162.mjs` renders eighteen editions in Chromium and WebKit, checks legacy saves and mobile layouts, and launches a race.
