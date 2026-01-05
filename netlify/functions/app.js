import express from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handler } = require("./app.cjs");

export { handler };

function buildEvent(req) {
  const hasBody = req.body !== undefined && req.body !== null && req.body !== "";
  return {
    httpMethod: req.method,
    path: req.originalUrl,
    headers: req.headers,
    queryStringParameters: req.query,
    body: hasBody ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body)) : null,
  };
}

async function forwardToHandler(req, res) {
  try {
    const event = buildEvent(req);
    const result = await handler(event);
    res.status(result.statusCode || 200);
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
    res.send(result.body || "");
  } catch (err) {
    console.error("Render proxy error", err);
    res.status(500).send("Internal Server Error");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("."));

  app.get("/", async (req, res) => {
    const event = { httpMethod: "GET", path: "/", headers: req.headers, queryStringParameters: req.query, body: null };
    try {
      const result = await handler(event);
      res.status(result.statusCode || 200);
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      res.send(result.body || "");
    } catch (err) {
      console.error("Render root proxy error", err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.all("/.netlify/functions/app", forwardToHandler);
  app.all("/.netlify/functions/app/*", forwardToHandler);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Render proxy listening on ${port}`);
  });
}
