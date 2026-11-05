// Recuperamos los datos guardados en la memoria del teléfono, o usamos los valores por defecto
const savedCif = localStorage.getItem("amiCalc_cif") || "10";
const savedMargin = localStorage.getItem("amiCalc_margin") || "30";

// NUEVA VARIABLE GLOBAL PARA MONEDA
let appCurrency = localStorage.getItem("amiCalc_currency") || "$";

let state = {
  pieceName: "", 
  hours: "", 
  rate: "",
  cif: parseInt(savedCif, 10), 
  margin: parseInt(savedMargin, 10), 
  nextId: 4,
  materials: [
    { id: 1, type: "Hilo", name: "Hilo", unitCost: "", qty: "" },
    { id: 2, type: "Ojitos", name: "Ojitos", unitCost: "", qty: "" },
    { id: 3, type: "Relleno", name: "Relleno", unitCost: "", qty: "" }
  ]
};

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

function compute() {
  const materialsTotal = state.materials.reduce((sum, m) => sum + (parseFloat(m.unitCost) || 0) * (parseFloat(m.qty) || 0), 0);
  const laborTotal = (parseFloat(state.hours) || 0) * (parseFloat(state.rate) || 0);
  const directCost = materialsTotal + laborTotal;
  const cifAmount = directCost * (state.cif / 100);
  const subtotal = directCost + cifAmount;
  const marginAmount = subtotal * (state.margin / 100);
  const price = (subtotal + marginAmount) || 0.01;
  return { materialsTotal, laborTotal, cifAmount, marginAmount, price: price > 0 ? price : 0.01 };
}

function updateTotals() {
  const { materialsTotal, laborTotal, cifAmount, marginAmount, price } = compute();
  
  // SE CAMBIÓ "$" POR appCurrency
  document.getElementById("priceOut").textContent = `${appCurrency}${fmt(price)}`;
  document.getElementById("priceMeta").textContent = state.pieceName;

  const rows = [
    { label: "Materiales directos", amount: materialsTotal, color: "var(--color-neutral-400)" },
    { label: "Mano de obra", amount: laborTotal, color: "var(--color-neutral-300)" },
    { label: "Gastos indirectos", amount: cifAmount, color: "var(--color-neutral-200)" },
    { label: "Margen de ganancia", amount: marginAmount, color: "var(--color-accent-400)" }
  ];
  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = "";
  rows.forEach((r) => {
    const pct = (r.amount / price) * 100;
    const block = document.createElement("div");
    // SE CAMBIÓ "$" POR appCurrency
    block.innerHTML = `
      <div class="breakdown-row-label"><span>${r.label}</span><span>${appCurrency}${fmt(r.amount)} <span class="pct">(${fmt(pct)}%)</span></span></div>
      <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${Math.min(100, pct)}%;background:${r.color};"></div></div>
    `;
    breakdown.appendChild(block);
  });

  document.getElementById("cifVal").textContent = `${state.cif}%`;
  document.getElementById("marginVal").textContent = `${state.margin}%`;
  
  // SE ACTUALIZA LA ETIQUETA DE MONEDA EN "TARIFA POR HORA"
  const rateLabel = document.getElementById("rateLabel");
  if(rateLabel) rateLabel.textContent = `Tarifa por hora (${appCurrency})`;
}

function renderMaterialRow(m) {
  const row = document.createElement("div");
  row.className = "material-row";
  
  const isOtro = m.type === "Otro";

  // MEJORA 1: Usamos display: none para que el campo desaparezca por completo y no rompa el diseño
  // SE CAMBIÓ "$" POR appCurrency EN EL LABEL "Costo unit."
  row.innerHTML = `
    <div class="field">
      <label>Insumo</label>
      <select class="input type-select">
        <option value="Hilo" ${m.type === 'Hilo' ? 'selected' : ''}>Hilo</option>
        <option value="Ojitos" ${m.type === 'Ojitos' ? 'selected' : ''}>Ojitos</option>
        <option value="Relleno" ${m.type === 'Relleno' ? 'selected' : ''}>Relleno</option>
        <option value="Empaque" ${m.type === 'Empaque' ? 'selected' : ''}>Empaque</option>
        <option value="Otro" ${m.type === 'Otro' ? 'selected' : ''}>Otro...</option>
      </select>
    </div>
    <div class="field name-field" style="display: ${isOtro ? 'block' : 'none'};">
      <label>¿Qué es?</label>
      <input class="input name-input" type="text" placeholder="Ej. Accesorios" value="${m.name === m.type ? '' : m.name}">
    </div>
    <div class="field">
      <label>Costo unit. (${appCurrency})</label>
      <input class="input cost-input" type="number" min="0" step="0.01" value="${m.unitCost}">
    </div>
    <div class="field">
      <label>Cantidad</label>
      <input class="input qty-input" type="number" min="0" step="0.1" value="${m.qty}">
    </div>
    <button class="btn btn-icon btn-ghost del-btn" aria-label="Eliminar" style="color: var(--color-neutral-300);"><i class="ph ph-trash"></i></button>
  `;

  const typeSelect = row.querySelector(".type-select");
  const nameField = row.querySelector(".name-field");
  const nameInput = row.querySelector(".name-input");
  const costInput = row.querySelector(".cost-input");
  const qtyInput = row.querySelector(".qty-input");
  const delBtn = row.querySelector(".del-btn");

  typeSelect.addEventListener("change", (e) => {
    m.type = e.target.value;
    if (m.type === "Otro") {
      nameField.style.display = "block"; 
      m.name = nameInput.value;
    } else {
      nameField.style.display = "none"; 
      m.name = m.type;
    }
    updateTotals();
  });

  nameInput.addEventListener("input", (e) => { 
    if(m.type === "Otro") {
      m.name = e.target.value; 
      updateTotals(); 
    }
  });
  costInput.addEventListener("input", (e) => { m.unitCost = e.target.value; updateTotals(); });
  qtyInput.addEventListener("input", (e) => { m.qty = e.target.value; updateTotals(); });

  delBtn.addEventListener("click", () => {
    state.materials = state.materials.filter((x) => x.id !== m.id);
    renderMaterialsList();
  });
  return row;
}

function renderMaterialsList() {
  const list = document.getElementById("materialsList");
  list.innerHTML = "";
  state.materials.forEach((m) => list.appendChild(renderMaterialRow(m)));
  document.getElementById("noMaterials").style.display = state.materials.length === 0 ? "block" : "none";
  updateTotals();
}

function bindStaticInputs() {
  // Inicializamos los campos visuales con los datos guardados
  document.getElementById("rate").value = state.rate;
  document.getElementById("cif").value = state.cif;
  document.getElementById("margin").value = state.margin;

  document.getElementById("pieceName").addEventListener("input", (e) => { state.pieceName = e.target.value; updateTotals(); });
  document.getElementById("hours").addEventListener("input", (e) => { state.hours = e.target.value; updateTotals(); });
  
  // La tarifa no se guarda: el campo sale vacío cada vez que se abre la app
  document.getElementById("rate").addEventListener("input", (e) => { 
    state.rate = e.target.value;
    updateTotals();
  });
  // MEJORA 2: Al mover estos controles, se guardan automáticamente en el teléfono
  document.getElementById("cif").addEventListener("input", (e) => {
    state.cif = parseInt(e.target.value, 10) || 0; 
    localStorage.setItem("amiCalc_cif", state.cif);
    updateTotals(); 
  });
  document.getElementById("margin").addEventListener("input", (e) => { 
    state.margin = parseInt(e.target.value, 10) || 0; 
    localStorage.setItem("amiCalc_margin", state.margin);
    updateTotals(); 
  });

  document.getElementById("addMaterial").addEventListener("click", () => {
    state.materials.push({ id: state.nextId++, type: "Hilo", name: "Hilo", unitCost: "", qty: "" });
    renderMaterialsList();
  });

  // El botón reiniciar limpia el proyecto y la tarifa, pero RESPETA los porcentajes guardados
  document.getElementById("resetBtn").addEventListener("click", () => {
    state = {
      pieceName: "", 
      hours: "", 
      rate: "",
      cif: state.cif, 
      margin: state.margin, 
      nextId: 4,
      materials: [
        { id: 1, type: "Hilo", name: "Hilo", unitCost: "", qty: "" },
        { id: 2, type: "Ojitos", name: "Ojitos", unitCost: "", qty: "" },
        { id: 3, type: "Relleno", name: "Relleno", unitCost: "", qty: "" }
      ]
    };
    document.getElementById("pieceName").value = "";
    document.getElementById("hours").value = "";
    document.getElementById("rate").value = "";
    renderMaterialsList();
  });

  document.getElementById("saveBtn").addEventListener("click", preparePrintAndSave);
}

function preparePrintAndSave() {
  const { materialsTotal, laborTotal, cifAmount, marginAmount, price } = compute();
  document.getElementById("printPieceName").textContent = `Cotización — ${state.pieceName || "(sin nombre)"}`;
  document.getElementById("printDate").textContent = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  const body = document.getElementById("printMaterialsBody");
  body.innerHTML = "";
  
  const validMaterials = state.materials.filter(m => m.unitCost !== "" || m.qty !== "");
  
  validMaterials.forEach((m) => {
    const tr = document.createElement("tr");
    const finalName = m.type === "Otro" ? (m.name || "Otro insumo") : m.type;
    // SE CAMBIÓ "$" POR appCurrency
    tr.innerHTML = `<td>${finalName}</td><td>${m.type}</td><td>${m.qty || 0}</td><td>${appCurrency}${fmt(m.unitCost || 0)}</td><td>${appCurrency}${fmt((m.unitCost || 0) * (m.qty || 0))}</td>`;
    body.appendChild(tr);
  });

  // SE CAMBIÓ "$" POR appCurrency EN TODO EL RESUMEN DE IMPRESIÓN
  document.getElementById("printSummary").innerHTML = `
    <div class="print-summary-row"><span>Materiales directos</span><span>${appCurrency}${fmt(materialsTotal)}</span></div>
    <div class="print-summary-row"><span>Mano de obra (${state.hours || 0}h × ${appCurrency}${state.rate || 0})</span><span>${appCurrency}${fmt(laborTotal)}</span></div>
    <div class="print-summary-row"><span>Gastos indirectos (${state.cif}%)</span><span>${appCurrency}${fmt(cifAmount)}</span></div>
    <div class="print-summary-row"><span>Margen de ganancia (${state.margin}%)</span><span>${appCurrency}${fmt(marginAmount)}</span></div>
  `;
  document.getElementById("printPrice").textContent = `${appCurrency}${fmt(price)}`;

  if (typeof AndroidApp !== "undefined") {
    AndroidApp.generarPDF();
  } else {
    window.print();
  }
}

// ==========================================
// NUEVA LÓGICA DE PANTALLAS (INICIO Y MONEDA)
// ==========================================

function showScreen(screenId) {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("currency-screen").style.display = "none";
  document.getElementById("app-view").style.display = "none";
  
  const target = document.getElementById(screenId);
  if (target) {
      if (screenId === "app-view") {
          target.style.display = "block";
      } else {
          target.style.display = "flex";
      }
  }
}

function bindNavigationInputs() {
  const btnEnterApp = document.getElementById("btnEnterApp");
  const btnGoToCurrency = document.getElementById("btnGoToCurrency");
  const btnSaveCurrency = document.getElementById("btnSaveCurrency");
  const btnBackToStart = document.getElementById("btnBackToStart");

  if (btnEnterApp) {
      btnEnterApp.addEventListener("click", () => {
          showScreen("app-view");
      });
  }

  if (btnGoToCurrency) {
      btnGoToCurrency.addEventListener("click", () => {
          const currSelect = document.getElementById("currencySelect");
          if(currSelect) currSelect.value = appCurrency;
          showScreen("currency-screen");
      });
  }

  if (btnSaveCurrency) {
      btnSaveCurrency.addEventListener("click", () => {
          const val = document.getElementById("currencySelect").value;
          appCurrency = val;
          localStorage.setItem("amiCalc_currency", appCurrency);
          
          const label = document.getElementById("startCurrencyLabel");
          if(label) label.textContent = val;
          
          updateTotals();
          renderMaterialsList(); 
          showScreen("start-screen");
      });
  }

  if (btnBackToStart) {
      btnBackToStart.addEventListener("click", () => {
          showScreen("start-screen");
      });
  }
}

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================

bindStaticInputs();
bindNavigationInputs();
renderMaterialsList();

// Configurar pantalla inicial y moneda guardada
document.addEventListener("DOMContentLoaded", () => {
    const label = document.getElementById("startCurrencyLabel");
    if(label) label.textContent = appCurrency;
    showScreen("start-screen");
});