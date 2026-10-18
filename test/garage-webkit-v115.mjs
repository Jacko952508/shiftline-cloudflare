// Keep the iPhone WebKit gate on the authored fleet and current garage.
process.env.FLEET_BROWSERS='webkit';
await import('./fleet-browser-v162.mjs');
