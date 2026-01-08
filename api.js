import { ensureTable, getSqlClient } from './db.js';

const memoryStore = [];

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(res, data, status = 200) {
  res.set(jsonHeaders);
  res.status(status).send(JSON.stringify(data));
}

function normalizePattern(payload) {
  return {
    code: String(payload.code || ''),
    name: String(payload.name || payload.model || 'Pattern'),
    description: String(payload.description || ''),
    type: String(payload.type || ''),
    brand: String(payload.brand || ''),
    year: String(payload.year || ''),
    model: String(payload.model || ''),
    trim: String(payload.trim || ''),
    image_url: String(payload.image_url || ''),
    image_data: String(payload.image_data || ''),
    tags: String(payload.tags || ''),
  };
}

function memoryUpsert(pattern) {
  const index = memoryStore.findIndex((item) => item.code === pattern.code);
  if (index >= 0) {
    memoryStore[index] = pattern;
  } else {
    memoryStore.unshift(pattern);
  }
}

export async function handleApi(req, res) {
  if (req.method === 'OPTIONS') {
    res.set(jsonHeaders);
    return res.status(204).send('');
  }

  const sql = await getSqlClient();

  if (!sql) {
    if (req.method === 'GET') {
      return jsonResponse(res, { patterns: memoryStore, source: 'memory' });
    }
    if (req.method === 'POST') {
      const pattern = normalizePattern(req.body || {});
      if (!pattern.code || !pattern.type || !pattern.brand || !pattern.model) {
        return jsonResponse(res, { error: 'Missing required fields' }, 400);
      }
      memoryUpsert(pattern);
      return jsonResponse(res, { pattern, source: 'memory' });
    }
    if (req.method === 'DELETE') {
      const code = String((req.body || {}).code || '');
      if (!code) return jsonResponse(res, { error: 'Missing pattern code' }, 400);
      const index = memoryStore.findIndex((item) => item.code === code);
      if (index >= 0) memoryStore.splice(index, 1);
      return jsonResponse(res, { ok: true, source: 'memory' });
    }
    return jsonResponse(res, { error: 'Method not allowed' }, 405);
  }

  await ensureTable(sql);

  if (req.method === 'GET') {
    const rows = await sql`SELECT code, name, description, type, brand, year, model, trim, image_url, image_data, tags
      FROM patterns
      ORDER BY created_at DESC`;
    return jsonResponse(res, { patterns: rows, source: 'cockroach' });
  }

  if (req.method === 'POST') {
    const pattern = normalizePattern(req.body || {});
    if (!pattern.code || !pattern.type || !pattern.brand || !pattern.model) {
      return jsonResponse(res, { error: 'Missing required fields' }, 400);
    }
    const rows = await sql`INSERT INTO patterns (code, name, description, type, brand, year, model, trim, image_url, image_data, tags)
      VALUES (${pattern.code}, ${pattern.name}, ${pattern.description}, ${pattern.type}, ${pattern.brand}, ${pattern.year}, ${pattern.model}, ${pattern.trim}, ${pattern.image_url}, ${pattern.image_data}, ${pattern.tags})
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        brand = EXCLUDED.brand,
        year = EXCLUDED.year,
        model = EXCLUDED.model,
        trim = EXCLUDED.trim,
        image_url = EXCLUDED.image_url,
        image_data = EXCLUDED.image_data,
        tags = EXCLUDED.tags
      RETURNING code, name, description, type, brand, year, model, trim, image_url, image_data, tags`;
    return jsonResponse(res, { pattern: rows[0], source: 'cockroach' });
  }

  if (req.method === 'DELETE') {
    const code = String((req.body || {}).code || '');
    if (!code) return jsonResponse(res, { error: 'Missing pattern code' }, 400);
    await sql`DELETE FROM patterns WHERE code = ${code}`;
    return jsonResponse(res, { ok: true, source: 'cockroach' });
  }

  return jsonResponse(res, { error: 'Method not allowed' }, 405);
}
