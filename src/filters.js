// Reads the checked state of #filters checkboxes, updates the marker layer,
// and re-renders the sidebar list.

export function applyFilters(markers, layer) {
  const checked = Array.from(document.querySelectorAll('#filters input:checked')).map(i => i.value);
  layer.clearLayers();
  markers.forEach(m => {
    if (checked.includes(m.tor.mode)) layer.addLayer(m);
  });
  return checked;
}

export function updateStats(markers, tors, checked) {
  const shown = markers.filter(m => checked.includes(m.tor.mode)).length;
  const done = tors.filter(t => t.mode).length;
  document.getElementById('stats').textContent = `${done} / ${tors.length} done · showing ${shown}`;
}

// onSelect(tor) is called when the user clicks a list item.
// Keeping this as a callback avoids a circular import between filters.js and map.js.
export function renderList(listEl, tors, onSelect, filterText) {
  listEl.innerHTML = '';
  const q = (filterText || '').toLowerCase();
  tors
    .filter(t => t.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(t => {
      const li = document.createElement('li');
      const modeLabel = t.mode === 'R' ? 'Run' : t.mode === 'H' ? 'Hike' : 'Not done';
      li.innerHTML =
        `<span class="h-name">${t.name}</span>` +
        `<span class="h-meta">${t.height} m · ${modeLabel}${t.lowPrecision ? ' · approx.' : ''}</span>`;
      li.addEventListener('click', () => onSelect(t));
      listEl.appendChild(li);
    });
}
