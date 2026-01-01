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
      </div>
    </nav>

    <main class="container pb-5">
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
          const tagHtml = tags.map((t) => `<span class="badge text-bg-light">${t}</span>`).join('');
          const card = document.createElement('div');
          card.className = 'col-md-4';
          card.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
              <img src="${p.image_url}" class="card-img-top" alt="${p.name}">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge bg-primary">${p.code}</span>
                  <small class="text-muted">${p.type}</small>
                </div>
                <h5 class="card-title mb-1">${p.name}</h5>
                <p class="text-muted small">${p.description}</p>
                <p class="mb-1 fw-semibold">${p.brand} • ${p.year} • ${p.model} • ${p.trim}</p>
                <div class="mt-auto d-flex flex-wrap gap-2">${tagHtml}</div>
              </div>
            </div>`;
          container.appendChild(card);
        });
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
