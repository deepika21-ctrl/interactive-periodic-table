// --------------------
// CATEGORY COLORS (expanded for full table)
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
let elements = []; // loaded from elements.json

// --------------------
// HELPERS
// --------------------
function normalizeCategory(cat) {
  if (!cat) return "Unknown";
  const c = String(cat).toLowerCase();

  if (c.includes("noble gas")) return "Noble Gas";
  if (c.includes("alkali metal")) return "Alkali Metal";
  if (c.includes("alkaline earth metal")) return "Alkaline Earth Metal";
  if (c.includes("halogen")) return "Halogen";
  if (c.includes("metalloid")) return "Metalloid";
  if (c.includes("lanthanide")) return "Lanthanide";
  if (c.includes("actinide")) return "Actinide";
  if (c.includes("transition metal")) return "Transition Metal";
  if (c.includes("post-transition metal")) return "Post-transition Metal";
  if (c.includes("nonmetal")) return "Non-metal";

  return "Unknown";
}

function getColorForCategory(category) {
  return categoryColors[category] || categoryColors["Unknown"];
}

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
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

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

  // Keep it clean: show the most useful properties
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
// RENDER (uses xpos/ypos for correct placement)
// --------------------
function renderTable(list) {
  table.innerHTML = "";

  if (!list || list.length === 0) {
    table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">No elements match your search/filter.</div>`;
    return;
  }

  const cols = 18;
  const maxY = Math.max(...elements.map(e => e.ypos)); // full table height

 const posMap = new Map();
list.forEach(el => {
 posMap.set(`${el.ypos}-${el.xpos}`, el);

});


  for (let y = 1; y <= maxY; y++) {
    for (let x = 1; x <= cols; x++) {
      const key = `${y}-${x}`;
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
// LOAD DATA (elements.json must be in repo root)
// --------------------
async function loadElements() {
  const res = await fetch("elements.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load elements.json");

  const data = await res.json();
  const raw = data.elements || [];

  elements = raw.map(e => ({
    atomicNumber: e.number,
    symbol: e.symbol,
    name: e.name,
    atomicMass: e.atomic_mass,
    phase: e.phase,
    category: normalizeCategory(e.category),
    group: e.group,
    period: e.period,
    xpos: e.xpos,
    ypos: e.ypos
  }));
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
(async function init() {
  renderLegend();

  try {
    await loadElements();
    populateCategoryDropdown();
    applyFilters();
  } catch (err) {
    table.innerHTML = `<div style="padding:12px; color:#fca5a5;">
      Error loading elements dataset. Make sure <b>elements.json</b> is uploaded in the repo root.
    </div>`;
    console.error(err);
  }
})();


