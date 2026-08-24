let todosLosProductos = [];
let categoriasUnicas = new Set();
let chartBarInstance = null;
let chartPieInstance = null;

const token = localStorage.getItem("token");
const tenantId = localStorage.getItem("tenant_id");

const formatMoney = (amount) => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

function logout() {
  if (confirm("¿Seguro que deseas cerrar sesión?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
}

async function cargarDatos() {
  const tbody = document.getElementById("tabla-cuerpo");
  tbody.innerHTML =
    '<tr><td colspan="10" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Cargando...</td></tr>';

  try {
    const apiUrl =
      typeof API_URL !== "undefined" ? API_URL : "http://localhost:3000/api";

    const response = await fetch(`${apiUrl}/admin/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Error en la respuesta");

    const data = await response.json();
    const productosRaw = data.productos || [];

    todosLosProductos = productosRaw.map((p) => {
      const stock = parseFloat(p.stock) || 0;
      const costo = parseFloat(p.costo) || 0;
      const precio = parseFloat(p.precio) || 0;

      const inversion = stock * costo;
      const valorVenta = stock * precio;
      const ganancia = valorVenta - inversion;
      const margen = inversion > 0 ? (ganancia / inversion) * 100 : 0;

      return {
        ...p,
        stock,
        costo,
        precio,
        inversion,
        valorVenta,
        ganancia,
        margen,
      };
    });

    categoriasUnicas = new Set(
      todosLosProductos.map((p) => p.categoria_nombre).filter(Boolean),
    );
    llenarSelectCategorias();

    aplicarFiltros();
  } catch (error) {
    console.error(error);
    tbody.innerHTML =
      '<tr><td colspan="10" style="text-align:center; color:red; padding:20px;">Error al cargar</td></tr>';
  }
}

function llenarSelectCategorias() {
  const select = document.getElementById("filtroCategoria");
  select.innerHTML = '<option value="todas">📂 Todas las Categorías</option>';

  categoriasUnicas.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const categoriaSeleccionada =
    document.getElementById("filtroCategoria").value;
  const textoBusqueda = document
    .getElementById("busquedaTexto")
    .value.toLowerCase();

  const datosFiltrados = todosLosProductos.filter((p) => {
    const coincideCategoria =
      categoriaSeleccionada === "todas" ||
      p.categoria_nombre === categoriaSeleccionada;
    const coincideTexto = (p.descripcion || "")
      .toLowerCase()
      .includes(textoBusqueda);
    return coincideCategoria && coincideTexto;
  });

  actualizarStats(datosFiltrados);
  renderizarTabla(datosFiltrados);
  renderizarGraficos(datosFiltrados);
}

function actualizarStats(datos) {
  let totalVenta = 0;
  let totalInversion = 0;
  let totalGanancia = 0;
  let totalUnidades = 0;

  datos.forEach((p) => {
    totalVenta += p.valorVenta;
    totalInversion += p.inversion;
    totalGanancia += p.ganancia;
    totalUnidades += p.stock;
  });

  document.getElementById("stat-valor-venta").textContent =
    formatMoney(totalVenta);
  document.getElementById("stat-inversion").textContent =
    formatMoney(totalInversion);
  document.getElementById("stat-ganancia").textContent =
    formatMoney(totalGanancia);
  document.getElementById("stat-unidades").textContent =
    formatNumber(totalUnidades);
}

function renderizarTabla(datos) {
  const tbody = document.getElementById("tabla-cuerpo");
  tbody.innerHTML = "";

  if (datos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--text-light);">No se encontraron productos</td></tr>';
    return;
  }

  const datosOrdenados = [...datos].sort((a, b) => b.id - a.id);

  datosOrdenados.forEach((p) => {
    const tr = document.createElement("tr");
    const claseMargen =
      p.margen >= 30 ? "margin-good" : p.margen < 10 ? "margin-bad" : "";

    tr.innerHTML = `
                    <td>#${p.id}</td>
                    <td style="font-weight:500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.descripcion || ""}">${p.descripcion || "Sin nombre"}</td>
                    <td><span class="badge-category">${p.categoria_nombre || "General"}</span></td>
                    <td class="col-num">${formatNumber(p.stock)}</td>
                    <td class="col-num">${formatMoney(p.costo)}</td>
                    <td class="col-num">${formatMoney(p.precio)}</td>
                    <td class="col-num" style="font-weight:600;">${formatMoney(p.inversion)}</td>
                    <td class="col-num" style="font-weight:600;">${formatMoney(p.valorVenta)}</td>
                    <td class="col-num" style="color: ${p.ganancia >= 0 ? "var(--success)" : "var(--danger)"}">${formatMoney(p.ganancia)}</td>
                    <td class="col-num ${claseMargen}">${formatNumber(p.margen)}%</td>
                `;
    tbody.appendChild(tr);
  });
}

function renderizarGraficos(datos) {
  const top5 = [...datos].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
  const labelsBar = top5.map((p) =>
    p.descripcion
      ? p.descripcion.length > 12
        ? p.descripcion.substring(0, 12) + "..."
        : p.descripcion
      : "Item",
  );
  const dataBar = top5.map((p) => p.ganancia);

  const ctxBar = document.getElementById("barChart").getContext("2d");
  if (chartBarInstance) chartBarInstance.destroy();

  chartBarInstance = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: labelsBar,
      datasets: [
        {
          label: "Ganancia",
          data: dataBar,
          backgroundColor: "#6366f1",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  const cats = {};
  datos.forEach((p) => {
    const cat = p.categoria_nombre || "Otros";
    cats[cat] = (cats[cat] || 0) + p.valorVenta;
  });

  const ctxPie = document.getElementById("doughnutChart").getContext("2d");
  if (chartPieInstance) chartPieInstance.destroy();

  chartPieInstance = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: Object.keys(cats),
      datasets: [
        {
          data: Object.values(cats),
          backgroundColor: [
            "#6366f1",
            "#8b5cf6",
            "#ec4899",
            "#f59e0b",
            "#10b981",
            "#3b82f6",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            font: { size: 11 },
            padding: 10,
          },
        },
      },
    },
  });
}

function recargarDatos() {
  document.getElementById("filtroCategoria").value = "todas";
  document.getElementById("busquedaTexto").value = "";
  cargarDatos();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  cargarDatos();
});
