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
const legend = document.getElementById("legend");

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
function normalizeCategory(c){
  if(!c) return "Unknown";
  c = c.toLowerCase();
  if(c.includes("noble")) return "Noble Gas";
  if(c.includes("alkali metal") && !c.includes("alkaline")) return "Alkali Metal";
  if(c.includes("alkaline")) return "Alkaline Earth Metal";
  if(c.includes("metalloid")) return "Metalloid";
  if(c.includes("halogen")) return "Halogen";
  if(c.includes("post")) return "Post-transition Metal";
  if(c.includes("transition")) return "Transition Metal";
  if(c.includes("lanthanide")) return "Lanthanide";
  if(c.includes("actinide")) return "Actinide";
  if(c.includes("nonmetal")) return "Non-metal";
  return "Unknown";
}

/* ---------- LEGEND ---------- */
function renderLegend(){
  legend.innerHTML = "";
  Object.entries(categoryColors).forEach(([cat,color])=>{
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-color" style="background:${color}"></span>${cat}`;
    legend.appendChild(item);
  });
}

/* ---------- MODAL ---------- */
function openModal(el){
  modalTitle.textContent = `${el.name} (${el.symbol})`;
  modalBody.innerHTML = `
    <div class="kv"><div class="k">Atomic Number</div><div class="v">${el.number}</div></div>
    <div class="kv"><div class="k">Atomic Mass</div><div class="v">${el.atomic_mass ?? "—"}</div></div>
    <div class="kv"><div class="k">Category</div><div class="v">${el.category}</div></div>
    <div class="kv"><div class="k">Phase</div><div class="v">${el.phase ?? "—"}</div></div>
  `;
  modalBackdrop.classList.remove("hidden");
  elementModal.classList.remove("hidden");
}

function closeModal(){
  modalBackdrop.classList.add("hidden");
  elementModal.classList.add("hidden");
}

/* ---------- RENDER ---------- */
function renderTable(list){
  table.innerHTML = "";
  const map = new Map();
  list.forEach(e => map.set(`${e.ypos}-${e.xpos}`, e));

  const maxY = Math.max(...list.map(e=>e.ypos));
  for(let y=1;y<=maxY;y++){
    for(let x=1;x<=18;x++){
      const key = `${y}-${x}`;
      const el = map.get(key);
      if(!el){
        table.appendChild(Object.assign(document.createElement("div"),{className:"empty-cell"}));
        continue;
      }

      const card = document.createElement("div");
      card.className = "element";

      if(el.symbol.length > 2) card.classList.add("wide-symbol");

      const color = categoryColors[el.category] || categoryColors.Unknown;
      card.style.background = color + "33";
      card.style.borderColor = color;
      card.style.setProperty("--glow", color);

      card.innerHTML = `
        <div class="no">${el.number}</div>
        <div class="symbol">${el.symbol}</div>
        <div class="name">${el.name}</div>
      `;

      card.onclick = () => openModal(el);
      table.appendChild(card);
    }
  }
}

/* ---------- FILTERS ---------- */
function applyFilters(){
  const q = searchInput.value.toLowerCase();
  const cat = categoryFilter.value;

  renderTable(
    elements.filter(el =>
      (cat === "all" || el.category === cat) &&
      (
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase().includes(q) ||
        String(el.number) === q
      )
    )
  );
}

/* ---------- INIT ---------- */
(async function(){
  renderLegend();
  const res = await fetch("elements.json");
  const data = await res.json();

  elements = data.elements.map(e=>({
    ...e,
    category: normalizeCategory(e.category)
  }));

  categoryFilter.innerHTML =
    `<option value="all">All Categories</option>` +
    [...new Set(elements.map(e=>e.category))]
      .map(c=>`<option value="${c}">${c}</option>`).join("");

  applyFilters();
})();

searchInput.oninput = applyFilters;
categoryFilter.onchange = applyFilters;
resetBtn.onclick = ()=>{ searchInput.value=""; categoryFilter.value="all"; applyFilters(); };
closeModalBtn.onclick = closeModal;
modalBackdrop.onclick = closeModal;
document.onkeydown = e => e.key==="Escape" && closeModal();
