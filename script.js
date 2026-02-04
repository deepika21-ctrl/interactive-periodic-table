// --------------------
// CATEGORY COLORS (for legend + tile styling)
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
let elements = [];

// --------------------
// HELPERS
// --------------------
function normalizeCategory(rawCat) {
  if (!rawCat) return "Unknown";
  const c = String(rawCat).toLowerCase().trim();

  if (c.includes("noble gas")) return "Noble Gas";
  if (c.includes("alkali metal") && !c.includes("alkaline")) return "Alkali Metal";
  if (c.includes("alkaline earth metal")) return "Alkaline Earth Metal";
  if (c.includes("metalloid")) return "Metalloid";
  if (c.includes("halogen")) return "Halogen";
  if (c.includes("transition metal") && c.includes("post")) return "Post-transition Metal";
  if (c.includes("post-transition metal")) return "Post-transition Metal";
  if (c.includes("transition metal")) return "Transition Metal";
  if (c.includes("lanthanide")) return "Lanthanide";
  if (c.includes("actinide")) return "Actinide";
  if (c.includes("nonmetal")) return "Non-metal";
  if (c.includes("unknown")) return "Unknown";
  return "Unknown";
}

function formatMass(mass) {
  if (mass === null || mass === undefined || mass === "") return "—";
  const n = Number(mass);
  if (Number.isNaN(n)) return String(mass);
  return n.toFixed(3).replace(/\.?0+$/, "");
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
// DATA LOADING
// --------------------
async function loadElements() {
  const res = await fetch("elements.json");
  if (!res.ok) throw new Error("Failed to fetch elements.json");

  const data = await res.json();
  const list = Array.isArray(data.elements) ? data.elements : [];

  elements = list.map(el => ({
    number: el.number,
    symbol: el.symbol,
    name: el.name,
    category: normalizeCategory(el.category),
    atomic_mass: el.atomic_mass,
    phase: el.phase || "—",
    group: el.group || "—",
    period: el.period || "—",
    xpos: el.xpos,
    ypos: el.ypos
  }));
}

// --------------------
// DROPDOWN
// --------------------
function populateCategoryDropdown() {
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  const used = new Set(elements.map(e => e.category));
  Object.keys(categoryColors).forEach(cat => {
    if (!used.has(cat)) return;
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
    <div class="kv"><div class="k">Atomic Number</div><div class="v">${el.number}</div></div>
    <div class="kv"><div class="k">Atomic Mass</div><div class="v">${formatMass(el.atomic_mass)}</div></div>
    <div class="kv"><div class="k">Category</div><div class="v">${el.category}</div></div>
    <div class="kv"><div class="k">Phase</div><div class="v">${el.phase}</div></div>
    <div class="kv"><div class="k">Group</div><div class="v">${el.group}</div></div>
    <div class="kv"><div class="k">Period</div><div class="v">${el.period}</div></div>
  `;
  modalBackdrop.classList.remove("hidden");
  elementModal.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  elementModal.classList.add("hidden");
}

// --------------------
// DESKTOP: SCALE TABLE TO FIT SCREEN (NO SCROLLBARS)
// --------------------
function fitTableToDesktopScreen() {
  const isDesktop = window.matchMedia("(min-width: 1025px)").matches;
  if (!isDesktop) {
    table.style.transform = "";
    return;
  }

  if (!table || table.childElementCount === 0) return;

  const headerEl = document.querySelector("header");
  const controlsEl = document.querySelector(".controls");
  const legendEl = document.querySelector(".legend");
  const footerEl = document.querySelector("footer");

  if (!headerEl || !controlsEl || !legendEl || !footerEl) return;

  // Reset transform before measuring
  table.style.transform = "";

  // Measure available space (viewport minus UI sections)
  const padding = 24; // safe breathing
  const availableWidth = window.innerWidth - padding;

  const usedHeight =
    headerEl.getBoundingClientRect().height +
    controlsEl.getBoundingClientRect().height +
    legendEl.getBoundingClientRect().height +
    footerEl.getBoundingClientRect().height;

  const availableHeight = window.innerHeight - usedHeight - 16; // extra safety

  // Measure table natural size
  const tableWidth = table.scrollWidth;
  const tableHeight = table.scrollHeight;

  if (!tableWidth || !tableHeight) return;

  const scale = Math.min(
    1,
    availableWidth / tableWidth,
    availableHeight / tableHeight
  );

  table.style.transform = `scale(${scale})`;
}

let fitRaf = null;
function scheduleFit() {
  if (fitRaf) cancelAnimationFrame(fitRaf);
  fitRaf = requestAnimationFrame(() => {
    fitTableToDesktopScreen();
    fitRaf = null;
  });
}

// --------------------
// RENDER (exact periodic layout using xpos/ypos)
// --------------------
function renderTable(list) {
  table.innerHTML = "";

  if (!list || list.length === 0) {
    table.innerHTML = `<div style="padding:12px; color:#cbd5f5;">No elements match your search/filter.</div>`;
    return;
  }

  const cols = 18;
  const maxY = Math.max(...list.map(e => e.ypos));

  const posMap = new Map();
  list.forEach(el => posMap.set(`${el.ypos}-${el.xpos}`, el));

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

      // long symbols (3 letters) like Uue
      if (String(el.symbol).length > 2) card.classList.add("wide-symbol");

      const color = categoryColors[el.category] || categoryColors["Unknown"];
      card.style.backgroundColor = color + "33";
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
      String(el.number) === q;

    return matchCategory && matchSearch;
  });

  renderTable(filtered);
  scheduleFit();
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

window.addEventListener("resize", scheduleFit);

// --------------------
// INIT
// --------------------
(async function init() {
  renderLegend();

  try {
    await loadElements();
    populateCategoryDropdown();
    applyFilters();

    // Fit once after first paint
    setTimeout(scheduleFit, 0);
  } catch (err) {
    table.innerHTML = `<div style="padding:12px; color:#fca5a5;">
      Error loading elements dataset. Make sure <b>elements.json</b> is in the repo root.
    </div>`;
    console.error(err);
  }
})();
