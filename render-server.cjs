const path = require('path');
const express = require('express');
const { handler } = require('./netlify/functions/app.cjs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.text({ type: '*/*' }));
app.use(express.static(path.join(__dirname)));

async function forwardToHandler(req, res) {
  try {
    const result = await handler({
      path: req.path,
      httpMethod: req.method,
      headers: req.headers,
      body: typeof req.body === 'string' ? req.body : undefined,
    });

    if (result && result.headers) {
      res.set(result.headers);
    }

    res.status(result?.statusCode || 200).send(result?.body ?? '');
  } catch (error) {
    console.error('Handler forwarding failed', error);
    res.status(500).send('Internal Server Error');
  }
}

app.all('/.netlify/functions/app', forwardToHandler);
app.all('/api*', forwardToHandler);

app.listen(port, () => {
  console.log(`Render server listening on port ${port}`);
});
