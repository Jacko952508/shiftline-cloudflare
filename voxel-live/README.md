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
