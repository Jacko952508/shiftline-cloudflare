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
