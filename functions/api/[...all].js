import { Pool } from 'pg';

const seedPatterns = [];

const brandOptions = [
  "Abarth",
  "AC",
  "Acura",
  "Aiways",
  "Alfa Romeo",
  "Alpina",
  "Apollo",
  "Ariel",
  "Aston Martin",
  "Audi",
  "BAIC",
  "Baojun",
  "Bentley",
  "Bestune",
  "BMW",
  "Brilliance",
  "Bugatti",
  "Buick",
  "BYD",
  "Cadillac",
  "Canoo",
  "Changan",
  "Chery",
  "Chevrolet",
  "Chrysler",
  "Citroën",
  "Cupra",
  "Dacia",
  "Daewoo",
  "Daihatsu",
  "Datsun",
  "DeLorean",
  "Dodge",
  "Dongfeng",
  "DS Automobiles",
  "Exeed",
  "FAW",
  "Ferrari",
  "Fiat",
  "Fisker",
  "Ford",
  "Foton",
  "Geely",
  "Genesis",
  "GMC",
  "Great Wall",
  "Haval",
  "Hennessey",
  "HiPhi",
  "Hino",
  "Holden",
  "Honda",
  "Hongqi",
  "Hozon",
  "Hummer",
  "Hyundai",
  "Infiniti",
  "Isuzu",
  "JAC",
  "Jaguar",
  "Jeep",
  "Jetour",
  "JMC",
  "Karma",
  "Kia",
  "Koenigsegg",
  "Lada",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Leapmotor",
  "Lexus",
  "Li Auto",
  "Lincoln",
  "Lotus",
  "Lucid",
  "Lynk & Co",
  "Mahindra",
  "Maserati",
  "Maybach",
  "Maxus",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Mercury",
  "MG",
  "Mini",
  "Mitsubishi",
  "Morgan",
  "Neta",
  "NIO",
  "Nissan",
  "Opel",
  "Pagani",
  "Peugeot",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Proton",
  "Ram",
  "Renault",
  "Rimac",
  "Rivian",
  "Rolls-Royce",
  "Roewe",
  "Saab",
  "Saleen",
  "Saturn",
  "Scion",
  "Seat",
  "Seres",
  "Shelby",
  "Škoda",
  "Skyworth",
  "Smart",
  "Soueast",
  "SsangYong",
  "Subaru",
  "Suzuki",
  "Tata",
  "Tesla",
  "Toyota",
  "Vauxhall",
  "Venucia",
  "VinFast",
  "Volkswagen",
  "Volvo",
  "Voyah",
  "Wey",
  "Wuling",
  "XPeng",
  "Yudo",
  "Zedriv",
  "Zeekr",
  "Zotye",
  "Custom",
];

const typeOptions = [
  "Exterior",
  "Interior",
  "Motorcycle",
  "Transport Trucks",
  "Window Tint",
];

let memoryStore = [];

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const corsHeaders = {
  ...jsonHeaders,
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let pool;
let tableInitialized = false;
let dbModeLogged = false;

function getConnectionString(env) {
  if (env && env.DATABASE_URL) return env.DATABASE_URL;
  if (env && env.NETLIFY_DATABASE_URL) return env.NETLIFY_DATABASE_URL;
  if (typeof process !== 'undefined' && process.env) {
    return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || null;
  }
  return null;
}

async function getSqlClient(env) {
  const connectionString = getConnectionString(env);
  if (!connectionString) {
    if (!dbModeLogged) {
      console.log('DB: memory');
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
  const html = `<!DOCTYPE html>
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
            <label class="form-label">Year</label>
            <input class="form-control" id="year" name="year" type="text" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Model</label>
            <input class="form-control" id="model" name="model" type="text" required>
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
          <div class="col-md-1">
            <label class="form-label">Year</label>
            <select class="form-select" name="year" id="year-select"></select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Model</label>
            <select class="form-select" name="model" id="model-select"></select>
          </div>
          <div class="col-md-1">
            <label class="form-label">Trim</label>
            <select class="form-select" name="trim" id="trim-select"></select>
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

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      const seedPatterns = ${JSON.stringify(seedPatterns)};
      const brandOptions = ${JSON.stringify(brandOptions)};
      const typeOptions = ${JSON.stringify(typeOptions)};
      const patternsEndpoint = '/api/patterns';
      let adminLogged = false;
      let currentImageData = '';
      let patterns = [];
      let apiAvailable = false;

      function generateCode(brand, model, type, year) {
        const clean = (val) =>
          (val || '')
            .toString()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toUpperCase();
        const prefix = clean(brand).slice(0, 3) || 'PAT';
        const modelPart = clean(model).slice(0, 4) || 'ITEM';
        const typePart = clean(type).slice(0, 3) || 'GEN';
        const yearPart = clean(year).slice(-2) || 'YY';
        const unique = Date.now().toString().slice(-5);
        return [prefix, modelPart, typePart, yearPart, unique].join('-');
      }

      function populateBrandSelect(filter = '', selectedValue = '') {
        const select = document.getElementById('brand');
        const normalized = filter.trim().toLowerCase();
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a brand';
        select.appendChild(placeholder);
        const visible = brandOptions.filter((brand) => brand.toLowerCase().includes(normalized));
        visible.forEach((brand) => {
          const opt = document.createElement('option');
          opt.value = brand;
          opt.textContent = brand;
          if (brand === selectedValue) opt.selected = true;
          select.appendChild(opt);
        });

        const customOpt = document.createElement('option');
        customOpt.value = 'Custom';
        customOpt.textContent = 'Custom (add brand)';
        if (selectedValue === 'Custom') customOpt.selected = true;
        select.appendChild(customOpt);

        if (selectedValue && !visible.includes(selectedValue) && selectedValue !== 'Custom') {
          const opt = document.createElement('option');
          opt.value = selectedValue;
          opt.textContent = selectedValue;
          opt.selected = true;
          select.appendChild(opt);
        }
      }

      function countBy(list, key) {
        return list.reduce((acc, item) => {
          const val = item[key];
          if (!val) return acc;
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
      }

      async function fetchPatterns() {
        try {
          const res = await fetch(patternsEndpoint, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('Failed to load patterns');
          const data = await res.json();
            if (Array.isArray(data.patterns)) {
              patterns = data.patterns.map((p) => ({
                ...p,
                tags: p.tags || '',
                image_data: p.image_data || '',
                description: p.description || '',
              }));
              apiAvailable = true;
            }
        } catch (err) {
          console.warn('Falling back to local patterns', err);
          patterns = [];
          apiAvailable = false;
        }
        refreshDropdowns(patterns);
        renderCards(patterns);
      }

      async function persistPattern(item) {
        if (!apiAvailable) return false;
        const res = await fetch(patternsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error('Save failed');
        return res.json();
      }

      async function removePattern(code) {
        if (!apiAvailable) return false;
        const res = await fetch(patternsEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) throw new Error('Delete failed');
        return true;
      }

      function populateTypeFormOptions(selectedValue = '') {
        const select = document.getElementById('type');
        const counts = countBy(patterns, 'type');
        const dynamicTypes = Object.keys(counts).filter((type) => !typeOptions.includes(type));
        const options = [...typeOptions, ...dynamicTypes];

        select.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a type';
        select.appendChild(placeholder);

        options.forEach((type) => {
          const opt = document.createElement('option');
          opt.value = type;
          const countLabel = counts[type] ? ' (' + counts[type] + ')' : '';
          opt.textContent = type + countLabel;
          if (type === selectedValue) opt.selected = true;
          select.appendChild(opt);
        });

        const otherOpt = document.createElement('option');
        otherOpt.value = 'other';
        otherOpt.textContent = 'Other (custom)';
        select.appendChild(otherOpt);

        if (selectedValue && !options.includes(selectedValue)) {
          select.value = 'other';
          const customField = document.getElementById('custom-type');
          customField.classList.remove('d-none');
          customField.value = selectedValue;
        }
      }

      function applyFilters() {
        const search = document.getElementById('search-input').value.toLowerCase();
        const type = document.getElementById('type-select').value;
        const brand = document.getElementById('brand-select').value;
        const year = document.getElementById('year-select').value;
        const model = document.getElementById('model-select').value;
        const trim = document.getElementById('trim-select').value;

        const filtered = patterns.filter((p) => {
          const matchSearch =
            !search ||
            p.name.toLowerCase().includes(search) ||
            (p.tags || '').toLowerCase().includes(search) ||
            (p.brand || '').toLowerCase().includes(search) ||
            (p.model || '').toLowerCase().includes(search);
          const matchType = !type || p.type === type;
          const matchBrand = !brand || p.brand === brand;
          const matchYear = !year || p.year === year;
          const matchModel = !model || p.model === model;
          const matchTrim = !trim || p.trim === trim;
          return matchSearch && matchType && matchBrand && matchYear && matchModel && matchTrim;
        });

        refreshDropdowns(filtered);
        renderCards(filtered);
      }

      function refreshDropdowns(list) {
        const typeCounts = countBy(list, 'type');
        const brandCounts = countBy(list, 'brand');
        const yearCounts = countBy(list, 'year');
        const modelCounts = countBy(list, 'model');
        const trimCounts = countBy(list, 'trim');

        const typeSelect = document.getElementById('type-select');
        typeSelect.innerHTML = '<option value="">All types</option>';
        Object.keys(typeCounts)
          .sort()
          .forEach((type) => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = `${type} (${typeCounts[type]})`;
            typeSelect.appendChild(opt);
          });

        const brandSelect = document.getElementById('brand-select');
        brandSelect.innerHTML = '<option value="">All brands</option>';
        Object.keys(brandCounts)
          .sort()
          .forEach((brand) => {
            const opt = document.createElement('option');
            opt.value = brand;
            opt.textContent = `${brand} (${brandCounts[brand]})`;
            brandSelect.appendChild(opt);
          });

        const yearSelect = document.getElementById('year-select');
        yearSelect.innerHTML = '<option value="">All years</option>';
        Object.keys(yearCounts)
          .sort((a, b) => (a || '').localeCompare(b || ''))
          .forEach((year) => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = `${year} (${yearCounts[year]})`;
            yearSelect.appendChild(opt);
          });

        const modelSelect = document.getElementById('model-select');
        modelSelect.innerHTML = '<option value="">All models</option>';
        Object.keys(modelCounts)
          .sort()
          .forEach((model) => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = `${model} (${modelCounts[model]})`;
            modelSelect.appendChild(opt);
          });

        const trimSelect = document.getElementById('trim-select');
        trimSelect.innerHTML = '<option value="">All trims</option>';
        Object.keys(trimCounts)
          .sort()
          .forEach((trim) => {
            const opt = document.createElement('option');
            opt.value = trim;
            opt.textContent = `${trim} (${trimCounts[trim]})`;
            trimSelect.appendChild(opt);
          });
      }

      function resolveImageSrc(path, inlineData) {
        if (inlineData) return inlineData;
        if (path) return path;
        return 'https://via.placeholder.com/800x450.png?text=Pattern';
      }

      function renderCards(list) {
        const cardsWrap = document.getElementById('cards');
        cardsWrap.innerHTML = '';
        if (!list.length) {
          cardsWrap.innerHTML = '<p class="text-muted">No patterns found.</p>';
          return;
        }

        list.forEach((item, index) => {
          const col = document.createElement('div');
          col.className = 'col-md-4';
          const card = document.createElement('div');
          card.className = 'card h-100 shadow-sm';

          const img = document.createElement('img');
          img.src = resolveImageSrc(item.image_url, item.image_data);
          img.alt = item.name;
          img.className = 'card-img-top zoomable';
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', () => {
            document.getElementById('zoom-image').src = img.src;
            const modalEl = document.getElementById('imageModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
          });
          card.appendChild(img);

          const body = document.createElement('div');
          body.className = 'card-body d-flex flex-column';
          const title = document.createElement('h5');
          title.className = 'card-title';
          title.textContent = item.name;
          body.appendChild(title);

          const badgeRow = document.createElement('div');
          badgeRow.className = 'd-flex flex-wrap gap-2 mb-2';

          const typeBadge = document.createElement('span');
          typeBadge.className = 'badge text-bg-primary';
          typeBadge.textContent = item.type || 'Unknown type';
          badgeRow.appendChild(typeBadge);

          const brandBadge = document.createElement('span');
          brandBadge.className = 'badge text-bg-secondary';
          brandBadge.textContent = item.brand || 'Unknown brand';
          badgeRow.appendChild(brandBadge);

          const yearBadge = document.createElement('span');
          yearBadge.className = 'badge text-bg-light text-muted';
          yearBadge.textContent = item.year || 'Year N/A';
          badgeRow.appendChild(yearBadge);

          const modelBadge = document.createElement('span');
          modelBadge.className = 'badge text-bg-light text-muted';
          modelBadge.textContent = item.model || 'Model N/A';
          badgeRow.appendChild(modelBadge);

          const trimBadge = document.createElement('span');
          trimBadge.className = 'badge text-bg-light text-muted';
          trimBadge.textContent = item.trim || 'Trim N/A';
          badgeRow.appendChild(trimBadge);

          body.appendChild(badgeRow);

          const tags = document.createElement('div');
          tags.className = 'mb-3';
          tags.innerHTML = `<strong>Software:</strong> ${(item.tags || '').replace(/,/g, ', ') || '—'}`;
          body.appendChild(tags);

          const actions = document.createElement('div');
          actions.className = 'd-flex gap-2 mt-auto';

          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-outline-primary btn-sm flex-grow-1';
          editBtn.textContent = 'Edit';
          editBtn.disabled = !adminLogged;
          editBtn.addEventListener('click', () => startEditing(index));
          actions.appendChild(editBtn);

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-outline-danger btn-sm flex-grow-1';
          deleteBtn.textContent = 'Delete';
          deleteBtn.disabled = !adminLogged;
          deleteBtn.addEventListener('click', async () => {
            if (!confirm('Delete this pattern?')) return;
            try {
              if (apiAvailable) {
                await removePattern(item.code);
                await fetchPatterns();
              } else {
                patterns = patterns.filter((p) => p.code !== item.code);
                applyFilters();
              }
            } catch (err) {
              alert('Unable to delete: ' + err.message);
            }
          });
          actions.appendChild(deleteBtn);

          body.appendChild(actions);
          card.appendChild(body);
          col.appendChild(card);
          cardsWrap.appendChild(col);
        });
      }

      function toggleAdminUI(isLoggedIn) {
          adminLogged = isLoggedIn;
          document.getElementById('login-btn').classList.toggle('d-none', isLoggedIn);
          document.getElementById('logout-btn').classList.toggle('d-none', !isLoggedIn);
          document.getElementById('new-pattern-wrap').classList.toggle('d-none', !isLoggedIn);
          document.getElementById('pattern-form').classList.toggle('d-none', !isLoggedIn);
          document.getElementById('login-form').classList.toggle('d-none', isLoggedIn);
          document.getElementById('admin-info').classList.toggle('d-none', isLoggedIn);
          document.querySelector('.admin-panel').classList.toggle('border-success', isLoggedIn);
          document.querySelector('.admin-panel').classList.toggle('border', isLoggedIn);
          renderCards(patterns);
        }

      document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('admin-info').classList.remove('d-none');
        document.getElementById('login-form').classList.toggle('d-none');
      });

      document.getElementById('logout-btn').addEventListener('click', () => {
        toggleAdminUI(false);
        resetForm();
      });

      document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (username === 'admin' && password === 'admin123') {
          toggleAdminUI(true);
          resetForm();
        } else {
          alert('Invalid credentials');
        }
      });

      document.getElementById('open-form-btn').addEventListener('click', () => {
        resetForm();
        document.getElementById('pattern-form').classList.remove('d-none');
        document.getElementById('pattern-form').scrollIntoView({ behavior: 'smooth' });
      });

      document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        resetForm();
      });

      document.getElementById('image_file').addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          currentImageData = loadEvent.target.result;
          document.getElementById('image_data').value = currentImageData;
          document.getElementById('image_url').value = '';
          showPreview('', currentImageData, file.name);
        };
        reader.readAsDataURL(file);
      });

      document.getElementById('type').addEventListener('change', (event) => {
        const customField = document.getElementById('custom-type');
        const isOther = event.target.value === 'other';
        customField.classList.toggle('d-none', !isOther);
        if (!isOther) {
          customField.value = '';
        }
      });

      function resetForm() {
        document.getElementById('editing-index').value = '';
        document.getElementById('image_data').value = '';
        document.getElementById('image_url').value = '';
        currentImageData = '';
        document.getElementById('image-preview-wrap').classList.add('d-none');
        document.getElementById('pattern-form').reset();
        document.getElementById('custom-type').classList.add('d-none');
        document.getElementById('custom-type').value = '';
        document.getElementById('custom-brand').classList.add('d-none');
        document.getElementById('custom-brand').value = '';
        document.getElementById('save-pattern-btn').textContent = 'Save pattern';
        populateTypeFormOptions();
        populateBrandSelect(document.getElementById('brand-search').value || '');
      }

      function showPreview(path, inlineData = '', label = '') {
        if (!path && !inlineData) {
          document.getElementById('image-preview-wrap').classList.add('d-none');
          return;
        }
        document.getElementById('image-preview').src = resolveImageSrc(path, inlineData);
        const labelText = inlineData ? (label ? 'Uploaded: ' + label : 'Uploaded image') : path;
        document.getElementById('image-path-label').textContent = labelText;
        document.getElementById('image-preview-wrap').classList.remove('d-none');
      }

      function startEditing(index) {
        const item = patterns[index];
        document.getElementById('editing-index').value = String(index);
        document.getElementById('code').value = item.code;
        populateTypeFormOptions(item.type);
        populateBrandSelect(document.getElementById('brand-search').value || '', item.brand);
        if (!brandOptions.includes(item.brand) && item.brand) {
          document.getElementById('brand').value = 'Custom';
          const customField = document.getElementById('custom-brand');
          customField.classList.remove('d-none');
          customField.value = item.brand;
        }
        document.getElementById('year').value = item.year;
        document.getElementById('model').value = item.model;
        document.getElementById('trim').value = item.trim;
        document.getElementById('image_url').value = item.image_url || '';
        document.getElementById('image_data').value = item.image_data || '';
        currentImageData = item.image_data || '';
        showPreview(item.image_url, item.image_data || '');
        document.getElementById('tags').value = item.tags || '';
        document.getElementById('pattern-form').classList.remove('d-none');
        document.getElementById('save-pattern-btn').textContent = 'Update pattern';
        document.getElementById('pattern-form').scrollIntoView({ behavior: 'smooth' });
      }

      document.getElementById('pattern-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const uploadedData = document.getElementById('image_data').value.trim();
        const existingUrl = document.getElementById('image_url').value.trim();
        const typeField = document.getElementById('type');
        const customTypeField = document.getElementById('custom-type');
        const resolvedType = typeField.value === 'other' ? customTypeField.value.trim() : typeField.value.trim();
        if (!resolvedType) {
          alert('Please select or enter a type.');
          return;
        }
        const brandSelect = document.getElementById('brand');
        const customBrandField = document.getElementById('custom-brand');
        const brandValue = brandSelect.value === 'Custom' ? customBrandField.value.trim() : brandSelect.value.trim();
        if (!brandValue) {
          alert('Please choose or enter a brand.');
          return;
        }
        const derivedName = brandValue + ' ' + document.getElementById('model').value.trim() + (resolvedType ? ' (' + resolvedType + ')' : '');
        const existingCode = document.getElementById('code').value.trim();
        const generatedCode = existingCode || generateCode(brandValue, document.getElementById('model').value, resolvedType, document.getElementById('year').value);
        document.getElementById('code').value = generatedCode;
        const newItem = {
          code: generatedCode,
          name: derivedName.trim(),
          type: resolvedType,
          brand: brandValue,
          year: document.getElementById('year').value.trim(),
          model: document.getElementById('model').value.trim(),
          trim: document.getElementById('trim').value.trim(),
          image_url: uploadedData ? '' : existingUrl || 'https://via.placeholder.com/800x450.png?text=Pattern',
          image_data: uploadedData,
          tags: document.getElementById('tags').value.trim(),
          description: '',
        };

        const editIndexValue = document.getElementById('editing-index').value;
        try {
          if (apiAvailable) {
            await persistPattern({ ...newItem, isEdit: editIndexValue !== '' });
            await fetchPatterns();
          } else {
            if (editIndexValue !== '') {
              const idx = parseInt(editIndexValue, 10);
              patterns[idx] = newItem;
            } else {
              patterns.push(newItem);
            }
            refreshDropdowns(patterns);
            applyFilters();
          }
          resetForm();
        } catch (err) {
          alert('Unable to save pattern: ' + err.message);
        }
      });

      // Initialize
      populateBrandSelect();
      populateTypeFormOptions();
      refreshDropdowns(patterns);
      renderCards(patterns);
      fetchPatterns();
    </script>
  </body>
  </html>`;
  return html;
}

async function handleApi(request, env) {
  let sql;
  try {
    sql = await getSqlClient(env);
  } catch (err) {
    console.error('Database client error', err);
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500, headers: jsonHeaders });
  }

  const method = request.method || 'GET';

  if (method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  if (!sql) {
    if (method === 'GET') {
      return new Response(JSON.stringify({ patterns: memoryStore, source: 'memory' }), { status: 200, headers: jsonHeaders });
    }
    if (method === 'POST') {
      try {
        const payload = await request.json();
        const isEdit = Boolean(payload.isEdit);
        let incomingCode = payload.code;
        if (!isEdit) {
          const exists = memoryStore.find((item) => item.code === incomingCode);
          if (exists) {
            incomingCode = incomingCode + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
          }
        }
        const updatedItem = { ...payload, code: incomingCode };
        const updated = memoryStore.filter((item) => item.code !== updatedItem.code);
        updated.unshift(updatedItem);
        memoryStore = updated;
        return new Response(JSON.stringify({ pattern: updatedItem, source: 'memory' }), { status: 200, headers: jsonHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
      }
    }
    if (method === 'DELETE') {
      try {
        const payload = await request.json();
        memoryStore = memoryStore.filter((item) => item.code !== payload.code);
        return new Response(JSON.stringify({ ok: true, source: 'memory' }), { status: 200, headers: jsonHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
      }
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  try {
    await ensureTable(sql);
  } catch (err) {
    console.error('Unable to prepare database', err);
    return new Response(JSON.stringify({ error: 'Database not ready' }), { status: 500, headers: jsonHeaders });
  }

  if (method === 'GET') {
    try {
      const rows = await sql`SELECT code, name, description, type, brand, year, model, trim, image_url, image_data, tags FROM patterns ORDER BY created_at DESC`;
      return new Response(JSON.stringify({ patterns: rows, source: 'cockroach' }), { status: 200, headers: jsonHeaders });
    } catch (err) {
      console.error('Database query failed', err);
      return new Response(JSON.stringify({ error: 'Database query failed' }), { status: 500, headers: jsonHeaders });
    }
  }

  if (method === 'POST') {
    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
    }

    if (!payload.code || !payload.type || !payload.brand || !payload.model) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: jsonHeaders });
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
    if (!isEdit) {
      const existing = await sql`SELECT code FROM patterns WHERE code = ${sanitized.code}`;
      if (existing.length) {
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        sanitized.code = `${sanitized.code}-${suffix}`;
      }
    }

    try {
      const rows = await sql`INSERT INTO patterns (code, name, description, type, brand, year, model, trim, image_url, image_data, tags)
        VALUES (${sanitized.code}, ${sanitized.name}, ${sanitized.description}, ${sanitized.type}, ${sanitized.brand}, ${sanitized.year}, ${sanitized.model}, ${sanitized.trim}, ${sanitized.image_url}, ${sanitized.image_data}, ${sanitized.tags})
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, brand = EXCLUDED.brand, year = EXCLUDED.year, model = EXCLUDED.model, trim = EXCLUDED.trim, image_url = EXCLUDED.image_url, image_data = EXCLUDED.image_data, tags = EXCLUDED.tags
        RETURNING code, name, description, type, brand, year, model, trim, image_url, image_data, tags`;

      return new Response(JSON.stringify({ pattern: rows[0], source: 'cockroach' }), { status: 200, headers: jsonHeaders });
    } catch (err) {
      console.error('Database write failed', err);
      return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500, headers: jsonHeaders });
    }
  }

  if (method === 'DELETE') {
    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
    }
    if (!payload.code) {
      return new Response(JSON.stringify({ error: 'Missing pattern code' }), { status: 400, headers: jsonHeaders });
    }
    try {
      await sql`DELETE FROM patterns WHERE code = ${payload.code}`;
      return new Response(JSON.stringify({ ok: true, source: 'cockroach' }), { status: 200, headers: jsonHeaders });
    } catch (err) {
      console.error('Database delete failed', err);
      return new Response(JSON.stringify({ error: 'Database delete failed' }), { status: 500, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/patterns')) {
    return handleApi(request, env);
  }

  if (pathname === '/api' || pathname === '/api/') {
    return new Response(renderPage(), { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
