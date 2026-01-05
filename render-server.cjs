const path = require('path');
const express = require('express');
const { handler } = require('./netlify/functions/app.cjs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

async function forwardToNetlifyHandler(req, res, pathOverride = null) {
  try {
    let body = req.body;
    if (body === undefined || body === null || body === '') {
      body = null;
    } else if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }

    const event = {
      httpMethod: req.method,
      path: pathOverride || req.originalUrl,
      headers: req.headers,
      queryStringParameters: req.query,
      body,
    };

    const out = await handler(event);

    if (out && out.headers) {
      res.set(out.headers);
    }

    res.status(out?.statusCode || 200).send(out?.body ?? '');
  } catch (error) {
    console.error('Handler forwarding failed', error);
    res.status(500).send('Internal Server Error');
  }
}

app.get('/api', (req, res) => {
  res.status(200).json({ ok: true });
});

app.all('/api/patterns', (req, res) => forwardToNetlifyHandler(req, res, '/api/patterns'));
app.all('/api/patterns/*', (req, res) => forwardToNetlifyHandler(req, res, req.originalUrl));
app.all('/.netlify/functions/app/*', forwardToNetlifyHandler);
app.all('/.netlify/functions/app', forwardToNetlifyHandler);

app.get('/', async (req, res) => {
  try {
    const out = await handler({ httpMethod: 'GET', path: '/', headers: req.headers, queryStringParameters: {}, body: null });
    if (out && out.headers) {
      res.set(out.headers);
    }
    res.status(out?.statusCode || 200).send(out?.body ?? '');
  } catch (error) {
    console.error('Homepage handling failed', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Render server listening on port ${port}`);
});
