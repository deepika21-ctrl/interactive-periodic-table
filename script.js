// --------------------
// CATEGORY COLORS (full table)
// --------------------
const categoryColors = {
  "Non-metal": "#38bdf8",
  "Noble Gas": "#c084fc",
  "Alkali Metal": "#fb7185",
  "Alkaline Earth Metal": "#fbbf24",
  "Metalloid": "#34d399",
  "Halogen": "#fb923c",
  "Transition Metal": "#60a5fa",
  "Post-transition Metal": "#a3e635",
  "Lanthanide": "#f472b6",
  "Actinide": "#fca5a5",
  "Unknown": "#94a3b8"
};

function normalizeCategory(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).toLowerCase();

  if (s.includes("noble")) return "Noble Gas";
  if (s.includes("alkali metal")) return "Alkali Metal";
  if (s.includes("alkaline earth")) return "Alkaline Earth Metal";
  if (s.includes("halogen")) return "Halogen";
  if (s.includes("metalloid")) return "Metalloid";
  if (s.includes("lanthanide")) return "Lanthanide";
  if (s.includes("actinide")) return "Actinide";
  if (s.includes("post-transition")) return "Post-transition Metal";
  if (s.includes("transition")) return "Transition Metal";

  // nonmetals in this dataset come as diatomic/polyatomic
  if (s.includes("nonmetal")) return "Non-metal";

  return "Unknown";
}

function getColorForCategory(cat) {
  return categoryColors[cat] || categoryColors["Unknown"];
}

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
// STATE
// --------------------
let elements = [];

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
  // Keep "All Categories" already in HTML
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
    <div class="kv"><div class="k">Atomic Mass</div><div class="v">${el.atomicMass ?? "—"}</div></div>
    <div class="kv"><div class="k">Category</div><div class="v">${el.category}</div></div>
    <div class="kv"><div class="k">Phase</div><div class="v">${el.phase ?? "—"}</div></div>
    <div class="kv"><div class="k">Group</div><div class="v">${el.group ?? "—"}</div></div>
    <div class="kv"><div class="k">Period</div><div class="v">${el.period ?? "—"}</div></div>
  `;

  modalBackdrop.classList.remove("hidden");
  elementModal.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  elementModal.classList.add("hidden");
}

// --------------------
// RENDER (EXACT 18x9 GRID)
// --------------------
function renderTable(list) {
  table.innerHTML = "";

  if (!list || list.length === 0) {
    table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">No elements match your search/filter.</div>`;
    return;
  }

  const cols = 18;
  const maxPeriod = Math.max(...list.map(e => e.period));

  // Map by (period, group)
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

      const color = getColorForCategory(el.category);
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
// LOAD DATA + INIT
// --------------------
async function loadElements() {
  const res = await fetch("./elements.json");
  const data = await res.json();

  // Your JSON has { "elements": [...] }
  elements = data.elements.map(el => ({
    atomicNumber: el.number,
    symbol: el.symbol,
    name: el.name,
    atomicMass: el.atomic_mass,
    category: normalizeCategory(el.category),
    phase: el.phase,
    group: el.xpos,
    period: el.ypos
  }));

  renderLegend();
  populateCategoryDropdown();
  applyFilters();
}

loadElements().catch(err => {
  console.error("Failed to load elements.json:", err);
  table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">Error loading data. Check console.</div>`;
});
