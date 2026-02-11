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

let elements = [];

/* ---------- HELPERS ---------- */
function normalizeCategory(rawCat) {
  if (!rawCat) return "Unknown";
  const c = String(rawCat).toLowerCase().trim();

  if (c.includes("noble gas")) return "Noble Gas";
  if (c.includes("alkali metal") && !c.includes("alkaline")) return "Alkali Metal";
  if (c.includes("alkaline earth metal")) return "Alkaline Earth Metal";
  if (c.includes("metalloid")) return "Metalloid";
  if (c.includes("halogen")) return "Halogen";
  if (c.includes("post-transition metal")) return "Post-transition Metal";
  if (c.includes("transition metal") && !c.includes("post")) return "Transition Metal";
  if (c.includes("lanthanide")) return "Lanthanide";
  if (c.includes("actinide")) return "Actinide";
  if (c.includes("nonmetal")) return "Non-metal";
  return "Unknown";
}

function formatMass(mass) {
  if (mass === null || mass === undefined || mass === "") return "—";
  const n = Number(mass);
  if (Number.isNaN(n)) return String(mass);
  return n.toFixed(3).replace(/\.?0+$/, "");
}

/* ---------- LEGEND ---------- */
function renderLegend() {
  legendContainer.innerHTML = "";
  Object.entries(categoryColors).forEach(([cat, color]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-color" style="background:${color}"></span>
      <span>${cat}</span>
    `;
    legendContainer.appendChild(item);
  });
}

/* ---------- CATEGORY DROPDOWN ---------- */
function populateCategoryDropdown() {
  const used = new Set(elements.map(e => e.category));
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  Object.keys(categoryColors).forEach(cat => {
    if (!used.has(cat)) return;
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

/* ---------- MODAL ---------- */
function openModal(el) {
  modalTitle.textContent = `${el.name} (${el.symbol})`;
  modalBody.innerHTML = `
    <div class="kv"><div class="k">Atomic Number</div><div class="v">${el.number}</div></div>
    <div class="kv"><div class="k">Atomic Mass</div><div class="v">${formatMass(el.atomic_mass)}</div></div>
    <div class="kv"><div class="k">Category</div><div class="v">${el.category}</div></div>
    <div class="kv"><div class="k">Phase</div><div class="v">${el.phase || "—"}</div></div>
  `;
  modalBackdrop.classList.remove("hidden");
  elementModal.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  elementModal.classList.add("hidden");
}

/* ---------- RENDER TABLE (18 columns using xpos/ypos) ---------- */
function renderTable(list) {
  table.innerHTML = "";

  if (!list.length) {
    table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">No elements match your search/filter.</div>`;
    return;
  }

  const cols = 18;
  const maxY = Math.max(...list.map(e => Number(e.ypos) || 1));
  const posMap = new Map();

  list.forEach(el => {
    const y = Number(el.ypos);
    const x = Number(el.xpos);
    if (!Number.isFinite(y) || !Number.isFinite(x)) return;
    posMap.set(`${y}-${x}`, el);
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

      if (String(el.symbol).length > 2) card.classList.add("wide-symbol");

      const color = categoryColors[el.category] || categoryColors["Unknown"];
      card.style.background = color + "33";
      card.style.borderColor = color;
      card.style.setProperty("--glow", color);

      card.innerHTML = `
        <div class="no">${el.number}</div>
        <div class="symbol">${el.symbol}</div>
        <div class="name">${el.name}</div>
      `;

      card.addEventListener("click", () => openModal(el));
      table.appendChild(card);
    }
  }
}

/* ---------- FILTERS ---------- */
function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const filtered = elements.filter(el => {
    const matchCategory = (cat === "all") || (el.category === cat);
    const matchSearch =
      q === "" ||
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.number) === q;

    return matchCategory && matchSearch;
  });

  renderTable(filtered);
}

/* ---------- EVENTS ---------- */
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

/* ---------- INIT ---------- */
(async function init() {
  renderLegend();

  try {
    const res = await fetch("elements.json");
    if (!res.ok) throw new Error("elements.json not found or failed to load");

    const data = await res.json();
    const list = Array.isArray(data.elements) ? data.elements : data;

    elements = list.map(el => ({
      ...el,
      category: normalizeCategory(el.category)
    }));

    populateCategoryDropdown();
    applyFilters();
  } catch (err) {
    console.error(err);
    table.innerHTML = `
      <div style="padding:12px; color:#fca5a5;">
        Error loading elements data. Make sure <b>elements.json</b> is in the same folder as <b>index.html</b>.
      </div>
    `;
  }
})();
