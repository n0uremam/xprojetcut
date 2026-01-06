import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const seedPatterns = [];
const memoryStore = [];

const brandOptions = [
  "Abarth", "AC", "Acura", "Aiways", "Alfa Romeo", "Alpina", "Apollo", "Ariel", "Aston Martin", "Audi", "BAIC", "Baojun", "Bentley", "Bestune", "BMW", "Brilliance", "Bugatti", "Buick", "BYD", "Cadillac", "Canoo", "Changan", "Chery", "Chevrolet", "Chrysler", "Citroën", "Cupra", "Dacia", "Daewoo", "Daihatsu", "Datsun", "DeLorean", "Dodge", "Dongfeng", "DS Automobiles", "Exeed", "FAW", "Ferrari", "Fiat", "Fisker", "Ford", "Foton", "Geely", "Genesis", "GMC", "Great Wall", "Haval", "Hennessey", "HiPhi", "Hino", "Holden", "Honda", "Hongqi", "Hozon", "Hummer", "Hyundai", "Infiniti", "Isuzu", "JAC", "Jaguar", "Jeep", "Jetour", "JMC", "Karma", "Kia", "Koenigsegg", "Lada", "Lamborghini", "Lancia", "Land Rover", "Leapmotor", "Lexus", "Li Auto", "Lincoln", "Lotus", "Lucid", "Lynk & Co", "Mahindra", "Maserati", "Maybach", "Maxus", "Mazda", "McLaren", "Mercedes-Benz", "Mercury", "MG", "Mini", "Mitsubishi", "Morgan", "Neta", "NIO", "Nissan", "Opel", "Pagani", "Peugeot", "Polestar", "Pontiac", "Porsche", "Proton", "Ram", "Renault", "Rimac", "Rivian", "Rolls-Royce", "Roewe", "Saab", "Saleen", "Saturn", "Scion", "Seat", "Seres", "Shelby", "Škoda", "Skyworth", "Smart", "Soueast", "SsangYong", "Subaru", "Suzuki", "Tata", "Tesla", "Toyota", "Vauxhall", "Venucia", "VinFast", "Volkswagen", "Volvo", "Voyah", "Wey", "Wuling", "XPeng", "Yudo", "Zedriv", "Zeekr", "Zotye", "Custom",
];

const typeOptions = [
  "Exterior",
  "Interior",
  "Motorcycle",
  "Transport Trucks",
  "Window Tint",
];

let pool;
let tableInitialized = false;
let dbModeLogged = false;

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function getConnectionString(env) {
  if (env && env.NETLIFY_DATABASE_URL) return env.NETLIFY_DATABASE_URL;
  if (env && env.DATABASE_URL) return env.DATABASE_URL;
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || null;
  }
  return null;
}

async function getSqlClient(env) {
  const connectionString = getConnectionString(env);
  if (!connectionString) {
    if (!dbModeLogged) {
      console.log('DB: memory (no connection string)');
      dbModeLogged = true;
    }
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: true } });
    await pool.query('SELECT 1');
    if (!dbModeLogged) {
      console.log('DB: cockroach');
      dbModeLogged = true;
    }
  }

  return async (strings, ...values) => {
    const text = strings.reduce(
      (acc, str, idx) => acc + str + (idx < values.length ? `$${idx + 1}` : ''),
      ''
    );
    const result = await pool.query(text, values);
    return result.rows;
  };
}

async function ensureTable(sql) {
  if (tableInitialized) return;
  await sql`CREATE TABLE IF NOT EXISTS patterns (
    code text primary key,
    name text not null,
    description text,
    type text,
    brand text,
    year text,
    model text,
    trim text,
    image_url text,
    image_data text,
    tags text,
    created_at timestamptz default now()
  )`;
  await sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS image_data text`;
  tableInitialized = true;
}

function renderPage() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Patterns Library</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/static/styles.css">
  </head>
  <body>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
      <div class="container">
        <a class="navbar-brand fw-bold" href="#">Patterns Library</a>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" id="login-btn" type="button">Admin login</button>
          <button class="btn btn-outline-secondary btn-sm d-none" id="logout-btn" type="button">Logout</button>
        </div>
      </div>
    </nav>

    <main class="container pb-5">
      <section class="admin-panel shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div id="admin-info" class="d-none">
            <p class="text-uppercase text-primary fw-semibold small mb-1">Admin tools</p>
            <h2 class="h5 mb-0">Sign in to manage patterns</h2>
          </div>
          <div class="text-end d-none" id="new-pattern-wrap">
            <button class="btn btn-primary" id="open-form-btn" type="button">New pattern</button>
          </div>
        </div>

        <form class="row gy-3 mt-3 d-none" id="login-form">
          <div class="col-md-4">
            <label class="form-label">Username</label>
            <input class="form-control" id="login-username" name="username" type="text" autocomplete="username" required>
          </div>
          <div class="col-md-4">
            <label class="form-label">Password</label>
            <input class="form-control" id="login-password" name="password" type="password" autocomplete="current-password" required>
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-success" type="submit">Sign in</button>
          </div>
        </form>

        <form class="row gy-3 mt-3 d-none" id="pattern-form">
          <input type="hidden" id="editing-index" value="">
          <input type="hidden" id="image_data" value="">
          <input type="hidden" id="image_url" value="">
          <input type="hidden" id="code" name="code" value="">
          <div class="col-md-3">
            <label class="form-label">Type</label>
            <select class="form-select" id="type" name="type" required></select>
            <input class="form-control mt-2 d-none" id="custom-type" name="custom-type" type="text" placeholder="Custom type">
          </div>
          <div class="col-md-3">
            <label class="form-label">Brand</label>
            <div class="d-flex flex-column gap-2">
              <input class="form-control" id="brand-search" type="search" placeholder="Search brand">
              <select class="form-select" id="brand" name="brand" required></select>
              <input class="form-control d-none" id="custom-brand" name="custom-brand" type="text" placeholder="Custom brand">
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label">Model</label>
            <input class="form-control" id="model" name="model" type="text" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Year</label>
            <input class="form-control" id="year" name="year" type="text" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Trim</label>
            <input class="form-control" id="trim" name="trim" type="text" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Upload image</label>
            <input class="form-control" id="image_file" name="image_file" type="file" accept="image/*">
            <div class="mt-2 d-none" id="image-preview-wrap">
              <img alt="Preview" id="image-preview" class="img-fluid rounded" style="max-height: 180px; object-fit: cover;">
              <div class="small text-muted mt-1" id="image-path-label"></div>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label">Software Name (comma separated)</label>
            <input class="form-control" id="tags" name="tags" type="text" placeholder="Software name, optional">
          </div>
          <div class="col-12 d-flex gap-2">
            <button class="btn btn-primary" type="submit" id="save-pattern-btn">Save pattern</button>
            <button class="btn btn-outline-secondary" type="button" id="cancel-edit-btn">Cancel</button>
          </div>
        </form>
      </section>

      <section class="mb-4 text-center">
        <p class="text-uppercase text-primary fw-semibold small mb-1">Library</p>
        <h1 class="fw-bold">Explore Patterns Database</h1>
        <p class="text-muted">Discover and filter automotive patterns by type, brand, year, model, and trim specifications.</p>
      </section>

      <section class="filter-card shadow-sm rounded-4 p-4 mb-4 bg-white">
        <form class="row gy-3 align-items-end" id="filter-form">
          <div class="col-md-4">
            <label class="form-label">Search patterns</label>
            <input type="search" name="search" class="form-control" id="search-input" placeholder="Search by name or software">
          </div>
          <div class="col-md-2">
            <label class="form-label">Type</label>
            <select class="form-select" name="type" id="type-select"></select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Brand</label>
            <select class="form-select" name="brand" id="brand-select"></select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Model</label>
            <select class="form-select" name="model" id="model-select"></select>
          </div>
          <div class="col-md-1">
            <label class="form-label">Year</label>
            <select class="form-select" name="year" id="year-select"></select>
          </div>
          <div class="col-md-1">
            <label class="form-label">Trim</label>
            <select class="form-select" name="trim" id="trim-select"></select>
          </div>
          <div class="col-md-2 d-flex align-items-end justify-content-end">
            <button class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2" type="button" id="reset-filters-btn">
              <span aria-hidden="true">↻</span>
              <span>Reset Filters</span>
            </button>
          </div>
        </form>
      </section>

      <section class="row g-4" id="cards"></section>
    </main>

    <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-dark border-0">
          <div class="modal-body p-0">
            <img id="zoom-image" class="img-fluid w-100" alt="Pattern zoom preview">
          </div>
        </div>
      </div>
    </div>

    <script>
      window.seedPatterns = ${JSON.stringify(seedPatterns)};
      window.brandOptions = ${JSON.stringify(brandOptions)};
      window.typeOptions = ${JSON.stringify(typeOptions)};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/static/app.js"></script>
  </body>
  </html>`;
}

function toJson(res, data, status = 200) {
  res.set(jsonHeaders);
  res.status(status).send(JSON.stringify(data));
}

async function handleApi(req, res) {
  const sql = await getSqlClient(process.env);
  const useMemory = !sql;

  if (!useMemory) {
    try {
      await ensureTable(sql);
    } catch (err) {
      console.error('Unable to prepare database', err);
      return toJson(res, { error: 'Database not ready' }, 500);
    }
  }

  try {
    if (req.method === 'GET') {
      if (useMemory) {
        return toJson(res, { patterns: memoryStore, source: 'memory' });
      }
      const rows = await sql`SELECT code, name, description, type, brand, year, model, trim, image_url, image_data, tags FROM patterns ORDER BY created_at DESC`;
      return toJson(res, { patterns: rows, source: 'cockroach' });
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      if (!payload.code || !payload.type || !payload.brand || !payload.model) {
        return toJson(res, { error: 'Missing required fields' }, 400);
      }
      const sanitized = {
        code: String(payload.code),
        name: String(payload.name || payload.model || 'Pattern'),
        description: String(payload.description || ''),
        type: String(payload.type),
        brand: String(payload.brand),
        year: String(payload.year || ''),
        model: String(payload.model),
        trim: String(payload.trim || ''),
        image_url: String(payload.image_url || ''),
        image_data: String(payload.image_data || ''),
        tags: String(payload.tags || ''),
      };
      const isEdit = Boolean(payload.isEdit);
      if (useMemory) {
        const existingIndex = memoryStore.findIndex((p) => p.code === sanitized.code);
        if (!isEdit && existingIndex >= 0) {
          const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
          sanitized.code = `${sanitized.code}-${suffix}`;
        }
        if (existingIndex >= 0) {
          memoryStore[existingIndex] = sanitized;
        } else {
          memoryStore.unshift(sanitized);
        }
        return toJson(res, { pattern: sanitized, source: 'memory' });
      }
      if (!isEdit) {
        const existing = await sql`SELECT code FROM patterns WHERE code = ${sanitized.code}`;
        if (existing.length) {
          const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
          sanitized.code = `${sanitized.code}-${suffix}`;
        }
      }
      const rows = await sql`INSERT INTO patterns (code, name, description, type, brand, year, model, trim, image_url, image_data, tags)
        VALUES (${sanitized.code}, ${sanitized.name}, ${sanitized.description}, ${sanitized.type}, ${sanitized.brand}, ${sanitized.year}, ${sanitized.model}, ${sanitized.trim}, ${sanitized.image_url}, ${sanitized.image_data}, ${sanitized.tags})
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, brand = EXCLUDED.brand, year = EXCLUDED.year, model = EXCLUDED.model, trim = EXCLUDED.trim, image_url = EXCLUDED.image_url, image_data = EXCLUDED.image_data, tags = EXCLUDED.tags
        RETURNING code, name, description, type, brand, year, model, trim, image_url, image_data, tags`;
      return toJson(res, { pattern: rows[0], source: 'cockroach' });
    }

    if (req.method === 'DELETE') {
      const payload = req.body || {};
      if (!payload.code) return toJson(res, { error: 'Missing pattern code' }, 400);
      if (useMemory) {
        const idx = memoryStore.findIndex((p) => p.code === payload.code);
        if (idx >= 0) memoryStore.splice(idx, 1);
        return toJson(res, { ok: true, source: 'memory' });
      }
      await sql`DELETE FROM patterns WHERE code = ${payload.code}`;
      return toJson(res, { ok: true, source: 'cockroach' });
    }

    return toJson(res, { error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('Database operation failed', err);
    return toJson(res, { error: 'Database operation failed' }, 500);
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(renderPage());
});

app.get('/api', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(renderPage());
});

app.all('/api/patterns', (req, res) => {
  handleApi(req, res);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
