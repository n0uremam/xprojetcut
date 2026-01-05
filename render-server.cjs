const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

(async () => {
  const { onRequest } = await import('./functions/api/[...all].js');

  async function forwardToOnRequest(req, res, pathOverride = null) {
    try {
      const targetPath = pathOverride || req.originalUrl;
      const fullUrl = `${req.protocol}://${req.get('host')}${targetPath}`;
      const headers = new Headers();
      Object.entries(req.headers || {}).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });

      let body;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body === undefined || req.body === null || req.body === '') {
          body = undefined;
        } else if (typeof req.body === 'string') {
          body = req.body;
        } else {
          body = JSON.stringify(req.body);
        }
      }

      const cfRequest = new Request(fullUrl, {
        method: req.method,
        headers,
        body,
      });

      const cfResp = await onRequest({ request: cfRequest, env: process.env });
      res.status(cfResp.status || 200);
      cfResp.headers.forEach((v, k) => res.setHeader(k, v));
      const text = await cfResp.text();
      res.send(text);
    } catch (error) {
      console.error('Forwarding to onRequest failed', error);
      res.status(500).send('Internal Server Error');
    }
  }

  app.all('/api', forwardToOnRequest);
  app.all('/api/*', forwardToOnRequest);
  app.all('/.netlify/functions/app', forwardToOnRequest);
  app.all('/.netlify/functions/app/*', forwardToOnRequest);

  app.get('/', (req, res) => forwardToOnRequest(req, res, '/'));

  app.listen(port, () => {
    console.log(`Render server listening on port ${port}`);
  });
})().catch((error) => {
  console.error('Render server failed to start', error);
  process.exit(1);
});
