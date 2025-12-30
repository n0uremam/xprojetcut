(() => {
  const typeSelect = document.getElementById('type-select');
  const brandSelect = document.getElementById('brand-select');
  const yearSelect = document.getElementById('year-select');
  const modelSelect = document.getElementById('model-select');
  const trimSelect = document.getElementById('trim-select');
  const jsonInput = document.getElementById('filters-json');

  if (!jsonInput) return;

  const options = JSON.parse(jsonInput.value || '[]');

  const selected = {
    type: typeSelect?.dataset.selected || '',
    brand: brandSelect?.dataset.selected || '',
    year: yearSelect?.dataset.selected || '',
    model: modelSelect?.dataset.selected || '',
    trim: trimSelect?.dataset.selected || '',
  };

  function uniqueValues(filtered, key) {
    return Array.from(new Set(filtered.map((item) => item[key]).filter(Boolean))).sort();
  }

  function populateSelect(select, values, placeholder) {
    if (!select) return;
    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      if (value === selected[select.name]) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function refresh() {
    const byType = selected.type ? options.filter((o) => o.type === selected.type) : options;
    const byBrand = selected.brand
      ? byType.filter((o) => o.brand === selected.brand)
      : byType;
    const byYear = selected.year ? byBrand.filter((o) => o.year === selected.year) : byBrand;
    const byModel = selected.model ? byYear.filter((o) => o.model === selected.model) : byYear;

    populateSelect(typeSelect, uniqueValues(options, 'type'), 'All types');
    populateSelect(brandSelect, uniqueValues(byType, 'brand'), 'All brands');
    populateSelect(yearSelect, uniqueValues(byBrand, 'year'), 'All years');
    populateSelect(modelSelect, uniqueValues(byYear, 'model'), 'All models');
    populateSelect(trimSelect, uniqueValues(byModel, 'trim'), 'All trims');
  }

  [typeSelect, brandSelect, yearSelect, modelSelect].forEach((select) => {
    if (!select) return;
    select.addEventListener('change', (event) => {
      selected[select.name] = event.target.value;
      refresh();
    });
  });

  refresh();
})();
