exports.handler = async () => {
  const patterns = [
    {
      code: "AUD-A4-EXT-20",
      name: "Audi A4 Exterior Wrap",
      description: "Full-body exterior pattern sized for 2020 Audi A4.",
      type: "Exterior",
      brand: "Audi",
      year: "2020",
      model: "A4",
      trim: "Premium",
      image_url: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=60",
      tags: "wrap,sedan,paint-protection",
    },
    {
      code: "AUD-Q5-INT-21",
      name: "Audi Q5 Interior Kit",
      description: "Dashboard and console pattern set for 2021 Audi Q5.",
      type: "Interior",
      brand: "Audi",
      year: "2021",
      model: "Q5",
      trim: "Sport",
      image_url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=60",
      tags: "dashboard,suv,luxury",
    },
    {
      code: "BMW-X5-EXT-22",
      name: "BMW X5 Exterior Protection",
      description: "Front-end pattern kit for 2022 BMW X5.",
      type: "Exterior",
      brand: "BMW",
      year: "2022",
      model: "X5",
      trim: "xDrive",
      image_url: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=60",
      tags: "suv,ppf,front-kit",
    },
    {
      code: "TES-3-INT-19",
      name: "Tesla Model 3 Interior",
      description: "Center console and dash overlay for Model 3.",
      type: "Interior",
      brand: "Tesla",
      year: "2019",
      model: "Model 3",
      trim: "Long Range",
      image_url: "https://images.unsplash.com/photo-1511391038130-89ba48c93fd3?auto=format&fit=crop&w=800&q=60",
      tags: "ev,console,sedan",
    },
  ];

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
          <div>
            <p class="text-uppercase text-primary fw-semibold small mb-1">Admin tools</p>
            <h2 class="h5 mb-2">Sign in to manage patterns</h2>
            <p class="text-muted small mb-0">Use the default credentials <span class="fw-semibold">admin / admin123</span> to test adding and editing patterns locally.</p>
          </div>
          <div class="text-end">
            <button class="btn btn-primary" id="open-form-btn" type="button" disabled>New pattern</button>
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
          <div class="col-md-3">
            <label class="form-label">Code</label>
            <input class="form-control" id="code" name="code" type="text" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Name</label>
            <input class="form-control" id="name" name="name" type="text" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Type</label>
            <input class="form-control" id="type" name="type" type="text" placeholder="Exterior / Interior" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Brand</label>
            <input class="form-control" id="brand" name="brand" type="text" required>
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
            <label class="form-label">Image URL</label>
            <input class="form-control" id="image_url" name="image_url" type="url" placeholder="https://" required>
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="description" name="description" rows="2" required></textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Tags (comma separated)</label>
            <input class="form-control" id="tags" name="tags" type="text" placeholder="wrap, sedan, ppf">
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
            <input type="search" name="search" class="form-control" id="search-input" placeholder="Search by name, description, or tags">
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

    <script>
      const patterns = ${JSON.stringify(patterns)};
      let adminLogged = false;

      function unique(values) {
        return Array.from(new Set(values.filter(Boolean))).sort();
      }

      function applyFilters() {
        const search = document.getElementById('search-input').value.toLowerCase();
        const type = document.getElementById('type-select').value;
        const brand = document.getElementById('brand-select').value;
        const year = document.getElementById('year-select').value;
        const model = document.getElementById('model-select').value;
        const trim = document.getElementById('trim-select').value;

        const filtered = patterns.filter((p) => {
          const matchSearch = !search ||
            p.name.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search) ||
            (p.tags || '').toLowerCase().includes(search);
          const matchType = !type || p.type === type;
          const matchBrand = !brand || p.brand === brand;
          const matchYear = !year || p.year === year;
          const matchModel = !model || p.model === model;
          const matchTrim = !trim || p.trim === trim;
          return matchSearch && matchType && matchBrand && matchYear && matchModel && matchTrim;
        });

        renderCards(filtered);
        refreshDropdowns(filtered);
      }

      function renderCards(list) {
        const container = document.getElementById('cards');
        container.innerHTML = '';
        if (!list.length) {
          container.innerHTML = '<div class="col-12 text-center text-muted py-5"><p class="lead">No patterns found. Try adjusting the filters.</p></div>';
          return;
        }
        list.forEach((p) => {
          const tags = (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
          const tagHtml = tags
            .map((t) => '<span class="badge text-bg-light">' + t + '</span>')
            .join('');
          const card = document.createElement('div');
          card.className = 'col-md-4';
          card.innerHTML =
            '<div class="card h-100 shadow-sm border-0">' +
            '<img src="' + p.image_url + '" class="card-img-top" alt="' + p.name + '">' +
            '<div class="card-body d-flex flex-column">' +
            '<div class="d-flex justify-content-between align-items-start mb-2">' +
            '<span class="badge bg-primary">' + p.code + '</span>' +
            '<small class="text-muted">' + p.type + '</small>' +
            '</div>' +
            '<h5 class="card-title mb-1">' + p.name + '</h5>' +
            '<p class="text-muted small">' + p.description + '</p>' +
            '<p class="mb-1 fw-semibold">' + p.brand + ' • ' + p.year + ' • ' + p.model + ' • ' + p.trim + '</p>' +
            '<div class="mt-auto d-flex flex-wrap gap-2">' + tagHtml + '</div>' +
            (adminLogged ? '<div class="mt-3 d-flex justify-content-end"><button class="btn btn-sm btn-outline-primary" data-code="' + p.code + '" data-action="edit">Edit</button></div>' : '') +
            '</div>' +
            '</div>';
          container.appendChild(card);
        });

        if (adminLogged) {
          container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
              const code = event.target.getAttribute('data-code');
              const index = patterns.findIndex((item) => item.code === code);
              if (index >= 0) {
                startEditing(index);
              }
            });
          });
        }
      }

      function refreshDropdowns(list) {
        const typeSelect = document.getElementById('type-select');
        const brandSelect = document.getElementById('brand-select');
        const yearSelect = document.getElementById('year-select');
        const modelSelect = document.getElementById('model-select');
        const trimSelect = document.getElementById('trim-select');

        const allTypes = unique(patterns.map((p) => p.type));
        const typeFiltered = typeSelect.value ? patterns.filter((p) => p.type === typeSelect.value) : patterns;
        const brandFiltered = brandSelect.value ? typeFiltered.filter((p) => p.brand === brandSelect.value) : typeFiltered;
        const yearFiltered = yearSelect.value ? brandFiltered.filter((p) => p.year === yearSelect.value) : brandFiltered;
        const modelFiltered = modelSelect.value ? yearFiltered.filter((p) => p.model === modelSelect.value) : yearFiltered;

        fillSelect(typeSelect, allTypes, 'All types');
        fillSelect(brandSelect, unique(typeFiltered.map((p) => p.brand)), 'All brands');
        fillSelect(yearSelect, unique(brandFiltered.map((p) => p.year)), 'All years');
        fillSelect(modelSelect, unique(yearFiltered.map((p) => p.model)), 'All models');
        fillSelect(trimSelect, unique(modelFiltered.map((p) => p.trim)), 'All trims');
      }

      function fillSelect(select, values, placeholder) {
        const current = select.value;
        select.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = placeholder;
        select.appendChild(defaultOpt);
        values.forEach((val) => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = val;
          if (val === current) opt.selected = true;
          select.appendChild(opt);
        });
      }

      document.getElementById('filter-form').addEventListener('change', applyFilters);
      document.getElementById('search-input').addEventListener('input', applyFilters);

      function toggleAdminUI(isLoggedIn) {
        adminLogged = isLoggedIn;
        document.getElementById('login-btn').classList.toggle('d-none', isLoggedIn);
        document.getElementById('logout-btn').classList.toggle('d-none', !isLoggedIn);
        document.getElementById('open-form-btn').disabled = !isLoggedIn;
        document.getElementById('pattern-form').classList.toggle('d-none', !isLoggedIn);
        document.querySelector('.admin-panel').classList.toggle('border-success', isLoggedIn);
        document.querySelector('.admin-panel').classList.toggle('border', isLoggedIn);
        renderCards(patterns);
      }

      document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-form').classList.toggle('d-none');
      });

      document.getElementById('logout-btn').addEventListener('click', () => {
        toggleAdminUI(false);
        document.getElementById('login-form').classList.add('d-none');
      });

      document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const valid = username === 'admin' && password === 'admin123';
        if (valid) {
          toggleAdminUI(true);
          document.getElementById('login-form').classList.add('d-none');
        } else {
          alert('Invalid credentials. Use admin / admin123 for the demo.');
        }
      });

      document.getElementById('open-form-btn').addEventListener('click', () => {
        document.getElementById('pattern-form').classList.remove('d-none');
        resetForm();
      });

      document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        resetForm();
      });

      function resetForm() {
        document.getElementById('editing-index').value = '';
        document.getElementById('pattern-form').reset();
        document.getElementById('save-pattern-btn').textContent = 'Save pattern';
      }

      function startEditing(index) {
        const item = patterns[index];
        document.getElementById('editing-index').value = String(index);
        document.getElementById('code').value = item.code;
        document.getElementById('name').value = item.name;
        document.getElementById('type').value = item.type;
        document.getElementById('brand').value = item.brand;
        document.getElementById('year').value = item.year;
        document.getElementById('model').value = item.model;
        document.getElementById('trim').value = item.trim;
        document.getElementById('image_url').value = item.image_url;
        document.getElementById('description').value = item.description;
        document.getElementById('tags').value = item.tags || '';
        document.getElementById('pattern-form').classList.remove('d-none');
        document.getElementById('save-pattern-btn').textContent = 'Update pattern';
        document.getElementById('pattern-form').scrollIntoView({ behavior: 'smooth' });
      }

      document.getElementById('pattern-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const newItem = {
          code: document.getElementById('code').value.trim(),
          name: document.getElementById('name').value.trim(),
          description: document.getElementById('description').value.trim(),
          type: document.getElementById('type').value.trim(),
          brand: document.getElementById('brand').value.trim(),
          year: document.getElementById('year').value.trim(),
          model: document.getElementById('model').value.trim(),
          trim: document.getElementById('trim').value.trim(),
          image_url: document.getElementById('image_url').value.trim() || 'https://via.placeholder.com/800x450.png?text=Pattern',
          tags: document.getElementById('tags').value.trim(),
        };

        const editIndexValue = document.getElementById('editing-index').value;
        if (editIndexValue !== '') {
          const idx = parseInt(editIndexValue, 10);
          patterns[idx] = newItem;
        } else {
          patterns.push(newItem);
        }

        resetForm();
        refreshDropdowns(patterns);
        applyFilters();
      });

      // Initialize
      refreshDropdowns(patterns);
      renderCards(patterns);
    </script>
  </body>
  </html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html,
  };
};
