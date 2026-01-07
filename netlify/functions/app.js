// Compatibility shim for Render deployments that start `node netlify/functions/app.js`.
// Imports the main Express server so the app listens on the configured PORT.
import '../../server.js';
