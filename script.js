// --------------------
// DATA (starter 10 with real positions)
// --------------------
const elements = [
  { atomicNumber: 1,  symbol: "H",  name: "Hydrogen",  atomicMass: "1.008",  category: "Non-metal",            valency: 1, group: 1,  period: 1 },
  { atomicNumber: 2,  symbol: "He", name: "Helium",    atomicMass: "4.0026", category: "Noble Gas",           valency: 0, group: 18, period: 1 },

  { atomicNumber: 3,  symbol: "Li", name: "Lithium",   atomicMass: "6.94",   category: "Alkali Metal",        valency: 1, group: 1,  period: 2 },
  { atomicNumber: 4,  symbol: "Be", name: "Beryllium", atomicMass: "9.0122", category: "Alkaline Earth Metal",valency: 2, group: 2,  period: 2 },

  { atomicNumber: 5,  symbol: "B",  name: "Boron",     atomicMass: "10.81",  category: "Metalloid",           valency: 3, group: 13, period: 2 },
  { atomicNumber: 6,  symbol: "C",  name: "Carbon",    atomicMass: "12.011", category: "Non-metal",           valency: 4, group: 14, period: 2 },
  { atomicNumber: 7,  symbol: "N",  name: "Nitrogen",  atomicMass: "14.007", category: "Non-metal",           valency: 3, group: 15, period: 2 },
  { atomicNumber: 8,  symbol: "O",  name: "Oxygen",    atomicMass: "15.999", category: "Non-metal",           valency: 2, group: 16, period: 2 },
  { atomicNumber: 9,  symbol: "F",  name: "Fluorine",  atomicMass: "18.998", category: "Halogen",             valency: 1, group: 17, period: 2 },
  { atomicNumber: 10, symbol: "Ne", name: "Neon",      atomicMass: "20.180", category: "Noble Gas",           valency: 0, group: 18, period: 2 }
];

// --------------------
// CATEGORY COLORS (stronger)
// --------------------
const categoryColors = {
  "Non-metal": "#38bdf8",
  "Noble Gas": "#c084fc",
  "Alkali Metal": "#fb7185",
  "Alkaline Earth Metal": "#fbbf24",
  "Metalloid": "#34d399",
  "Halogen": "#fb923c"
};

// --------------------
// DOM
// --------------------
const table = document.getElementById("periodic-table");
const legendContainer = document.getElementById("legend");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resetBtn = document.getElementById("resetBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const elementModal = document.getElementById("elementModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

// --------------------
// LEGEND
// --------------------
function renderLegend() {
  legendContainer.innerHTML = "";
  Object.entries(categoryColors).forEach(([category, color]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-color" style="background:${color}"></span>
      <span>${category}</span>
    `;
    legendContainer.appendChild(item);
  });
}

// --------------------
// DROPDOWN
// --------------------
function populateCategoryDropdown() {
  const cats = [...new Set(elements.map(e => e.category))].sort();
  cats.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// --------------------
// MODAL
// --------------------
function openModal(el) {
  modalTitle.textContent = `${el.name} (${el.symbol})`;
  modalBody.innerHTML = `
    <div class="kv"><div class="k">Atomic Number</div><div class="v">${el.atomicNumber}</div></div>
    <div class="kv"><div class="k">Atomic Mass</div><div class="v">${el.atomicMass}</div></div>
    <div class="kv"><div class="k">Category</div><div class="v">${el.category}</div></div>
    <div class="kv"><div class="k">Valency</div><div class="v">${el.valency}</div></div>
  `;
  modalBackdrop.classList.remove("hidden");
  elementModal.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  elementModal.classList.add("hidden");
}

// --------------------
// RENDER (real periodic layout)
// --------------------
function renderTable(list) {
  table.innerHTML = "";

  if (!list || list.length === 0) {
    table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">No elements match your search/filter.</div>`;
    return;
  }

  const cols = 18;
  const maxPeriod = Math.max(...list.map(e => e.period));

  const posMap = new Map();
  list.forEach(el => posMap.set(`${el.period}-${el.group}`, el));

  for (let p = 1; p <= maxPeriod; p++) {
    for (let g = 1; g <= cols; g++) {
      const key = `${p}-${g}`;
      const el = posMap.get(key);

      if (!el) {
        const empty = document.createElement("div");
        empty.className = "empty-cell";
        table.appendChild(empty);
        continue;
      }

      const card = document.createElement("div");
      card.className = "element";

      const color = categoryColors[el.category] || "#94a3b8";
      card.style.backgroundColor = color + "33";
      card.style.borderColor = color;
      card.style.setProperty("--glow", color);

      card.innerHTML = `
        <div class="no">${el.atomicNumber}</div>
        <div class="symbol">${el.symbol}</div>
        <div class="name">${el.name}</div>
      `;

      card.addEventListener("click", () => openModal(el));
      table.appendChild(card);
    }
  }
}

// --------------------
// FILTERS
// --------------------
function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const filtered = elements.filter(el => {
    const matchCategory = (cat === "all") || (el.category === cat);

    const matchSearch =
      q === "" ||
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.atomicNumber) === q;

    return matchCategory && matchSearch;
  });

  renderTable(filtered);
}

// --------------------
// EVENTS
// --------------------
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  applyFilters();
});

closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// --------------------
// INIT
// --------------------
renderLegend();
populateCategoryDropdown();
applyFilters();
