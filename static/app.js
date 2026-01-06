const seedPatterns = window.seedPatterns || [];
const brandOptions = window.brandOptions || [];
const typeOptions = window.typeOptions || [];
const patternsEndpoint = '/api/patterns';
let adminLogged = false;
let currentImageData = '';
let patterns = [];
let apiAvailable = false;

function generateCode(brand, model, type, year) {
  const clean = (val) => (val || '').toString().trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
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
    patterns = data.patterns || [];
    apiAvailable = true;
    refreshDropdowns(patterns);
    renderCards(patterns);
  } catch (err) {
    console.warn('API unavailable, falling back to seed data', err);
    patterns = seedPatterns;
    refreshDropdowns(patterns);
    renderCards(patterns);
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
    body.innerHTML = `
      <p class="text-primary text-uppercase fw-semibold small mb-2">${item.type || ''}</p>
      <h5 class="card-title">${item.name}</h5>
      <p class="text-muted mb-1">${item.brand || ''} ${item.model || ''} ${item.year || ''}</p>
      <p class="text-muted mb-3">Trim: ${item.trim || 'N/A'}</p>
    `;

    const tagWrap = document.createElement('div');
    tagWrap.className = 'mb-3';
    (item.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-light text-dark me-1';
        badge.textContent = tag;
        tagWrap.appendChild(badge);
      });
    body.appendChild(tagWrap);

    const actions = document.createElement('div');
    actions.className = 'd-flex gap-2 mt-auto';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary';
    editBtn.textContent = 'Edit';
    editBtn.disabled = !adminLogged;
    editBtn.addEventListener('click', () => startEdit(index));
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.disabled = !adminLogged;
    deleteBtn.addEventListener('click', () => deletePattern(index));
    actions.appendChild(deleteBtn);

    body.appendChild(actions);
    card.appendChild(body);
    col.appendChild(card);
    cardsWrap.appendChild(col);
  });
}

function resetForm() {
  document.getElementById('editing-index').value = '';
  document.getElementById('code').value = '';
  document.getElementById('type').value = '';
  document.getElementById('brand').value = '';
  document.getElementById('custom-brand').classList.add('d-none');
  document.getElementById('brand-search').value = '';
  document.getElementById('year').value = '';
  document.getElementById('model').value = '';
  document.getElementById('trim').value = '';
  document.getElementById('tags').value = '';
  document.getElementById('image_file').value = '';
  document.getElementById('image_data').value = '';
  document.getElementById('image_url').value = '';
  document.getElementById('image-preview-wrap').classList.add('d-none');
  currentImageData = '';
}

function toggleAdminUI(show) {
  document.getElementById('admin-info').classList.toggle('d-none', !show);
  document.getElementById('new-pattern-wrap').classList.toggle('d-none', !show);
  document.getElementById('pattern-form').classList.toggle('d-none', !show);
}

function startEdit(index) {
  const item = patterns[index];
  document.getElementById('editing-index').value = index;
  document.getElementById('code').value = item.code || '';
  document.getElementById('type').value = item.type || '';
  document.getElementById('brand').value = brandOptions.includes(item.brand) ? item.brand : 'Custom';
  if (!brandOptions.includes(item.brand)) {
    document.getElementById('custom-brand').classList.remove('d-none');
    document.getElementById('custom-brand').value = item.brand || '';
  }
  document.getElementById('year').value = item.year || '';
  document.getElementById('model').value = item.model || '';
  document.getElementById('trim').value = item.trim || '';
  document.getElementById('tags').value = item.tags || '';
  document.getElementById('image_url').value = item.image_url || '';
  document.getElementById('image_data').value = item.image_data || '';
  if (item.image_data || item.image_url) {
    currentImageData = item.image_data || '';
    const preview = document.getElementById('image-preview');
    preview.src = item.image_data || item.image_url;
    document.getElementById('image-preview-wrap').classList.remove('d-none');
    document.getElementById('image-path-label').textContent = item.image_url ? item.image_url : 'Inline image';
  }
  document.getElementById('open-form-btn').click();
}

async function deletePattern(index) {
  const item = patterns[index];
  if (!item || !item.code) return;
  if (!confirm('Delete this pattern?')) return;
  if (apiAvailable) {
    const res = await fetch(patternsEndpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: item.code }),
    });
    if (!res.ok) {
      alert('Failed to delete');
      return;
    }
    patterns = patterns.filter((p) => p.code !== item.code);
  } else {
    patterns = patterns.filter((p) => p.code !== item.code);
  }
  applyFilters();
}

function setupTypeOptions() {
  const typeSelect = document.getElementById('type');
  typeSelect.innerHTML = '';
  typeOptions.forEach((type) => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });
  const custom = document.createElement('option');
  custom.value = 'Custom';
  custom.textContent = 'Custom (add type)';
  typeSelect.appendChild(custom);

  const filterSelect = document.getElementById('type-select');
  filterSelect.innerHTML = '<option value="">All types</option>';
}

function setupBrandOptions() {
  populateBrandSelect();
  const filterSelect = document.getElementById('brand-select');
  filterSelect.innerHTML = '<option value="">All brands</option>';
}

document.addEventListener('DOMContentLoaded', () => {
  setupTypeOptions();
  setupBrandOptions();
  fetchPatterns();

  document.getElementById('login-btn').addEventListener('click', () => {
    const form = document.getElementById('login-form');
    form.classList.toggle('d-none');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    adminLogged = false;
    document.getElementById('logout-btn').classList.add('d-none');
    document.getElementById('login-btn').classList.remove('d-none');
    toggleAdminUI(false);
    const form = document.getElementById('login-form');
    form.classList.add('d-none');
  });

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (username === 'admin' && password === 'admin123') {
      adminLogged = true;
      toggleAdminUI(true);
      document.getElementById('login-btn').classList.add('d-none');
      document.getElementById('logout-btn').classList.remove('d-none');
      document.getElementById('login-form').classList.add('d-none');
    } else {
      alert('Invalid credentials');
    }
  });

  document.getElementById('open-form-btn').addEventListener('click', () => {
    document.getElementById('pattern-form').classList.toggle('d-none');
  });

  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    resetForm();
    document.getElementById('pattern-form').classList.add('d-none');
  });

  document.getElementById('brand').addEventListener('change', (e) => {
    const val = e.target.value;
    const customField = document.getElementById('custom-brand');
    customField.classList.toggle('d-none', val !== 'Custom');
  });

  document.getElementById('brand-search').addEventListener('input', (e) => {
    populateBrandSelect(e.target.value, document.getElementById('brand').value);
  });

  document.getElementById('type').addEventListener('change', (e) => {
    const val = e.target.value;
    const customField = document.getElementById('custom-type');
    customField.classList.toggle('d-none', val !== 'Custom');
  });

  document.getElementById('image_file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      currentImageData = ev.target.result;
      document.getElementById('image_data').value = currentImageData;
      const preview = document.getElementById('image-preview');
      preview.src = currentImageData;
      document.getElementById('image-preview-wrap').classList.remove('d-none');
      document.getElementById('image-path-label').textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('filter-form').addEventListener('change', applyFilters);
  document.getElementById('search-input').addEventListener('input', applyFilters);

  document.getElementById('pattern-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const brandSel = document.getElementById('brand').value;
    const brandVal = brandSel === 'Custom' ? document.getElementById('custom-brand').value.trim() : brandSel;
    const typeSel = document.getElementById('type').value;
    const typeVal = typeSel === 'Custom' ? document.getElementById('custom-type').value.trim() : typeSel;

    const payload = {
      code: document.getElementById('code').value || generateCode(brandVal, document.getElementById('model').value, typeVal, document.getElementById('year').value),
      type: typeVal,
      brand: brandVal,
      year: document.getElementById('year').value.trim(),
      model: document.getElementById('model').value.trim(),
      trim: document.getElementById('trim').value.trim(),
      tags: document.getElementById('tags').value.trim(),
      image_url: document.getElementById('image_url').value.trim(),
      image_data: currentImageData || document.getElementById('image_data').value,
      name: `${brandVal} ${document.getElementById('model').value.trim()} ${document.getElementById('year').value.trim()}`.trim(),
      isEdit: Boolean(document.getElementById('editing-index').value),
    };

    if (apiAvailable) {
      const res = await fetch(patternsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert('Failed to save pattern');
        return;
      }
      const data = await res.json();
      if (payload.isEdit) {
        const idx = patterns.findIndex((p) => p.code === payload.code);
        if (idx >= 0) {
          patterns[idx] = data.pattern;
        } else {
          patterns.push(data.pattern);
        }
      } else {
        patterns.push(data.pattern);
      }
    } else {
      const existingIdx = patterns.findIndex((p) => p.code === payload.code);
      if (existingIdx >= 0) {
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        payload.code = `${payload.code}-${suffix}`;
      }
      patterns.push(payload);
    }

    resetForm();
    document.getElementById('pattern-form').classList.add('d-none');
    applyFilters();
  });
});
