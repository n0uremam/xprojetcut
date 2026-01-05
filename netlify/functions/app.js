import { createRequire } from 'node:module';

// Compatibility shim: allow environments still pointing to app.js to load the
// CommonJS entrypoint without changing business logic.
const require = createRequire(import.meta.url);
require('./app.cjs');
