// V162 replaces the modular-parts editor; validate the complete collection.
process.env.FLEET_BROWSERS='chromium';
await import('./fleet-browser-v162.mjs');
