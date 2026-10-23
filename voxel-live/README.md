# VOXEL FORGE — live in-chat game
Dedicated update branch; never merge into production Shiftline without explicit request.

Source engine: `voxel-live/engine-vN.js`
Release descriptor: `voxel-live/releases/vN.js`
The in-chat viewer imports the engine pinned by Git commit SHA through jsDelivr and checks for sequential numbered release descriptors every 30 seconds while active.

## Next version
1. Copy the last working engine, make requested changes and validate its JavaScript syntax.
2. Create a new immutable `engine-vN.js` file on this branch. Record the returned **Git commit SHA**.
3. Create `releases/vN.js` containing `export const release={version:N,engineCommit:'<commit>',engineFile:'engine-vN.js',message:'...'};`
4. Verify the engine at `https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@<commit>/voxel-live/engine-vN.js` returns JavaScript.
5. Verify the release at `https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@voxel-chat-live/voxel-live/releases/vN.js`.
6. If the release URL gives a stale 404, purge exactly that path through `https://purge.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@voxel-chat-live/voxel-live/releases/vN.js` and retry.

Hot upgrades preserve player position and changed blocks using `snapshot()` and `mount(root, resume)`; localStorage is also attempted as a secondary option.

The viewer does not independently act on arbitrary user messages; the assistant must edit and publish an engine when the user requests one.

## REALITY ENGINE V4 (2026-10-23)
- World expands 64×64 → 256×256 blocks (16× terrain area), vertical range 64 blocks. Old origin and block edits remain compatible.
- Chunk streaming near the camera with adaptive render radius; remote chunks are discarded from GPU memory.
- Procedural METROPOLIS district at (160,160), with gridded roads, multistorey glazed towers, plazas and lit streets. Director Mode: GO TO MEGACITY.
- Six vehicle profiles: SKYRIDER VTOL, HAWK helicopter, STRIKE JET, DUNE BUGGY, HOVERBIKE, HYDROFOIL. Touch steering, throttles, climb/descend, exit and boost.
- Developer controls: world atlas (tap teleport), render radius, debug HUD, flat terrain brush, observation tower, lightning and fireworks.
- Water shader and adaptive mobile draw radius, procedural NPCs near the city and original spawn.
- This build runs from GitHub/CDN in the **already sent VOXEL FORGE ChatGPT widget**. Do NOT deploy using Hatchable.

### Important deployment detail
The previously sent in-chat widget has a hard-coded release discovery branch **nimbus-chat-live**, path `voxel-live/releases/vN.js` (first V2 pinned to a commit).
Therefore **create each version's release pointer on `nimbus-chat-live`**, even though the source engine lives in `voxel-chat-live`. Each pointer must use the exact commit of the engine file creation/update; validate this sequence before informing the user.

## REALITY ENGINE V5 — Crescent Coast (2026-10-23)

- New active/default smooth landscape (non-voxel terrain) **CRESCENT COAST**, rendered inside the same in-chat widget.
- 256×256 coastal heightmap mesh with computed normals, procedural high-frequency soil texture, slope/tone vertex colour, curved Catmull-Rom asphalt roads and markings, winding coastal boulevard, 3D suspension bridge, marina, modern coastal apartments, instanced forest and road traffic.
- Original 256×256 editable VOXEL world remains selectable using Director Mode > VOXEL WORLD; block edits and previous player position are retained via the existing snapshot/localStorage workflow.
- Total **nine vehicles**: SkyRider VTOL, HAWK helicopter, strike jet, dune buggy, hoverbike, hydrofoil, ASTRA GT sports coupe, ATLAS 6×6 truck, Coast Guard seaplane.
- Director Mode includes Crescent Coast / Voxel World switches and the new vehicles. On smooth map touch buttons change to MAP and DRIVE. Smooth-mode ground/vehicle physics uses a continuous height sampler.
- On smooth map meteor impact deforms height vertices visibly and saves crater parameters. Original voxel-building tools require switching back to the voxel world.
- Mobile performance: building windows are batched in InstancedMesh; vegetation is instanced; voxel chunk meshing disabled when rendering the smooth world; models hidden when far/unneeded; old scene resources cleaned on update.
- A critical initialisation-order error was caught during source review: both the Three.js scene and `newMapActive` must be initialized *before* city traffic group construction. Confirm these declaration positions on every future update.

**Update compatibility:** The pre-existing ChatGPT widget requires sequential numbered releases from `nimbus-chat-live/voxel-live/releases/vN.js`. Since old sessions may remain on V3 due broken/cached V4, the V4 recovery manifest points to the exact same immutable V5 engine commit as V5 release. Those release pointers are on `nimbus-chat-live`; engine source remains `voxel-chat-live/voxel-live/engine-v5.js`.

**Current immutable V5 engine commit**: `b8f1e23b85fa47ade7a293dcf57d95bcff3db6ad`.

**No Hatchable deployment.** Only GitHub source and the existing in-chat widget. Do not claim user-device runtime testing; only GitHub source and static JS checked. CDN branch caches may need a purge if still stale.


## REALITY ENGINE V8 / V9 / V10 (2026-10-23)

### V8 — Physics + Living City
- Optional Rapier 3D WASM through \`https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm\`, fixed 30 Hz simulation for interactive crates/barrels with impulses and kinematic vehicle contacts.
- Collision/physics fallback when CDN/WASM fails, avoiding a fatal game startup.
- Terrain-sampled vehicle suspension and body lean (approximate, NOT a complete real-car tyre/constraint model).
- Instanced pedestrian NPCs, changing destinations and work schedules, six simulated businesses with stocks and earnings, resource economy and animated delivery trucks; aggregate state lives in \`directorState\`.

### V9 — World Mutation Engine
- Safe protocol string: \`reality.world/1\`. JSON only, not executable JavaScript.
- Editor: Director > WORLD MUTATIONS. Parsed commands checked for whitelisted operations, bounds and unique \`id\`. Replays are skipped. Every successful mutation is saved into the persistent event history.
- Operations: \`terrain.deform\` ({x,z,radius,depth}), \`city.supply\` ({resource,amount}), \`city.business\` ({index,stock}), \`physics.spawn\` ({x,z,count}), \`vehicle.spawn\` ({type}), \`climate.set\` ({weather}), \`traffic.control\` ({paused}).
- Public JSON feed: \`nimbus-chat-live/voxel-live/world-mutations/live.json\` (GitHub Raw). The running game polls every 30 seconds. Keep at most 15 fresh events in its \`events\` array, use never-repeated IDs and preserve \`protocol:"reality.world/1"\`. An engine version upgrade remains a separate sequential release via \`releases/vN.js\`.
- Example publishable JSON payload:

\`\`\`json
{
  "protocol": "reality.world/1",
  "revision": 2,
  "events": [
    {
      "protocol": "reality.world/1",
      "id": "coastal-supply-002",
      "op": "city.supply",
      "args": {"resource": "food", "amount": 150}
    }
  ]
}
\`\`\`

### V10 — Reality Experiments
- Nearby portal uses an offscreen render target at reduced resolution and only refreshes once every 11 frames; shader fallback if render errors. Walk through the A and B gates to teleport.
- Fractureable prebuilt pavilion with local debris and a Director rebuild tool; damage state persists (whole-city structural physics is NOT implemented).
- Moving visible cloud/rain fronts; low-gravity player movement mode. Limited to Crescent Coast.
- Additional mutation operations: \`portal.travel\` ({destination:"marina"|"lighthouse"}), \`gravity.set\` ({low}), \`structure.fracture\` ({state:"collapse"|"rebuild"}), \`storm.front\` ({enabled}), \`physics.impulse\` ({x,z,power}).

### Releases and QA
- V8 engine pinned to \`7ecd100df77ad0b0eb009bcbe78a9cd517e87a1f\`.
- V9 engine pinned to \`3b26f27c8ad82c06cd58d98ca4fa00914375358c\`.
- V10 engine pinned to \`ad0443cdc81ea4b0023d35e34c5c5584c50b282c\`.
- Release pointers on \`nimbus-chat-live\`; game code on \`voxel-chat-live\`. Do not modify live SHIFT LINE main.
- Each engine passed source compilation checks (\`new Function(...)\`), version manifest checks and static scene-initialization order checks. Not yet validated in the iPhone ChatGPT WebGL runtime.
- User selected GitHub-only distribution: do NOT deploy to Hatchable.


## V11 — ASTRAEUS: The Celestial Expanse (2026-10-23)

GitHub source: \`voxel-chat-live/voxel-live/engine-v11.js\`.
Immutable engine commit: \`40c8235c90a2bb35eb66af38f4870f4b45a38c78\`.
Live ChatGPT update descriptor: \`nimbus-chat-live/voxel-live/releases/v11.js\`.
**This is the next selectable world inside the existing in-chat Reality Engine; do not redeploy with Hatchable or touch Shiftline production main.**

### Visual engine
- Deep-space environment with animated 4-octave fBm nebula dome, thousands of parallax stars and additive corona sprites.
- Three procedurally shaded planets: AEON (giant, complex translucent particle-like rings and orbiting moons), NIX (polar aurora shells), EMBER (volcanic atmosphere). A luminous star and a singularity accretion-disc shader complete the astronomical scale.
- Hundreds of GPU-instanced asteroids with unique per-instance colours and rotations, alien beacons and complex scene monuments.
- KESTREL XR exploration craft with bespoke metallic body, canopy, wings, swept engine nacelles, animated ion jets, scanner dome and floating companion micro-probe.
- View-dependent distance culling for rare artefacts and adjustable pixel density based on measured frame time. No live HDR or per-frame expensive cubemap capture.

### Exploration and control
- First V11 launch automatically opens space; Director > ASTRAEUS SPACE WORLD reopens later. Return to Crescent Coast/Voxel World at any time.
- Existing left-side joystick steers/throttles the craft. Swipe the 3D viewport to look/aim. RISE/DIVE hold buttons, BOOST toggles, SCAN discovers points of interest, SIGHTS lists destinations, WARP animates warp travel.
- Eight discoverable regions: Silent Array, Crystal Reef, AEON ringed giant, Ember Drift, Horizon Gate, NIX ice world, Ghost Ark and Gravity Well X9.
- Position, orientation and all discovered sightings live in \`directorState.spacePosition\` and \`directorState.spaceDiscoveries\`, included in the engine's snapshot for hot updates.
- Space has its own dedicated render loop. The voxel and Crescent Coast scenes are hidden and not ticked, preserving device performance.
- Shader/runtime errors in space rendering attempt to return to the previous terrestrial world rather than leaving a black screen.

### Verification limitations
- Exact source and immutable GitHub descriptor verified, JavaScript parsed, startup ordering inspected.
- **Not yet proven to render on the user's iPhone or to have a non-cached CDN response**.
- The existing viewer must be at V10 to pick up V11 on the next update; older versions install sequentially unless they use a direct pinned V11 loader.


## V12 — ASTRAEUS OVERDRIVE graphics rebuild (2026-10-23)

**Source:** \`voxel-live/engine-v12.js\`, branch \`voxel-chat-live\`.
**Immutable pinned engine commit:** \`b06b618984d9dc1d7be79435d65ef69711e601ee\`.
**Release manifest:** \`nimbus-chat-live/voxel-live/releases/v12.js\`.

V12 is a concrete renderer/asset overhaul, not merely new labels:
- Dedicated WebGL multi-pass space renderer: full-sized scene render target, reduced-resolution selective glow extraction and blur, filmic composite, vignette, subtle chromatic dispersion and shader grain. Final stage uses Three's \`colorspace_fragment\` conversion.
- Optional half-float HDR in "cinema" quality when \`EXT_color_buffer_float\` is supported; normal mode uses unsigned byte sRGB buffers. Default "adaptive" retains bloom but adjusts image resolution and bloom-buffer scale. Disabling/failing the effect falls back to direct WebGL render.
- Updated 4-octave domain-warped planet surface shader with storm bands, irregular continents, geothermal cracks, edge scattering and independent animated cloud shell layers.
- Three instanced GPU nebula dust groups, 2,000+ mobile particles with depth/parallax; a monumental ringed orbital cathedral built using instanced geometry and animated energy patterns near the initial space arrival.
- Kestrel XR sculpting pass: instanced armour plates, tube-geometry trim following actual wing shape, cockpit details, RCS nozzles and procedurally animated ion exhaust.
- Postprocess gravitational light-bending effect projected around Gravity Well X9; black hole visible only when in camera frustum/range.
- "V12 REVEAL" button positions player at the revamped arrival sector; "CAMERA" cycles views; "GRAPHICS" cycles adaptive/cinema/battery; "POST FX" toggles the whole post pipeline for a direct visual comparison. HUD shows FX mode and rendering statistics.
- Existing ASTRAEUS discoveries and both terrestrial worlds remain available, and \`snapshot()\` interface is unchanged. First V12 entry changes only space scene positioning, not discovery logs.
- No Hatchable deployment; do not touch SHIFT LINE production main.

QA: source parses and pinned manifest verified on GitHub. CDN response could not be verified in the available web environment; actual shader compilation, device FPS and visual quality **not yet verified on iPhone**. Do not claim otherwise.
