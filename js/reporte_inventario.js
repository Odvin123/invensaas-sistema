// js/reporte_inventario.js
console.log("🚀 ===== REPORTE INVENTARIO JS CARGADO =====");

// ============================================
// CONFIGURACIÓN
// ============================================
const token = localStorage.getItem("token");
const API_URL = window.API_URL || "https://invensaas-backend.onrender.com/api";
let movimientosCache = [];

console.log("🔑 Token:", token ? "✅ Existe" : "❌ No existe");
console.log("🌐 API_URL:", API_URL);

// ============================================
// ELEMENTOS DOM
// ============================================
const tbody = document.getElementById("movimientos-tbody");
const totalEntradasEl = document.getElementById("total-entradas");
const totalSalidasEl = document.getElementById("total-salidas");
const balanceNetoEl = document.getElementById("balance-neto");

console.log("📋 Elementos DOM:", {
  tbody: tbody ? "✅ Existe" : "❌ No existe",
  totalEntradasEl: totalEntradasEl ? "✅ Existe" : "❌ No existe",
  totalSalidasEl: totalSalidasEl ? "✅ Existe" : "❌ No existe",
  balanceNetoEl: balanceNetoEl ? "✅ Existe" : "❌ No existe",
});

// ============================================
// FUNCIONES DE FORMATO
// ============================================
function formatNumber(value) {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

// ============================================
// CARGAR MOVIMIENTOS
// ============================================
async function loadMovimientos() {
  console.log("🔍 loadMovimientos() ejecutándose...");
  tbody.innerHTML =
    '<tr><td colspan="8" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando movimientos...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/inventario/movimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📡 Status response:", response.status);

    if (response.status === 401 || response.status === 403) {
      alert("Sesión expirada. Redirigiendo...");
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();
    console.log("📦 Data recibida:", data);

    if (data.success) {
      movimientosCache = data.movimientos || [];
      console.log("📦 Movimientos cargados:", movimientosCache.length);

      if (movimientosCache.length > 0) {
        console.log("📋 Primer movimiento:", movimientosCache[0]);
      }

      renderMovimientos(movimientosCache);
      updateSummary(movimientosCache);
    } else {
      console.log("❌ Error en la respuesta:", data);
      tbody.innerHTML =
        '<tr><td colspan="8" class="empty">❌ Error al cargar movimientos.</td></tr>';
    }
  } catch (error) {
    console.error("❌ Error en loadMovimientos:", error);
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty">❌ Error de conexión: ' +
      error.message +
      "</td></tr>";
  }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderMovimientos(movimientos) {
  console.log(
    "🎨 renderMovimientos() ejecutándose con",
    movimientos.length,
    "movimientos",
  );
  tbody.innerHTML = "";

  if (!movimientos || movimientos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty">📭 No hay movimientos registrados.</td></tr>';
    return;
  }

  movimientos.forEach((m, index) => {
    const tr = document.createElement("tr");
    const tipo = m.tipo || "DESCONOCIDO";
    const cantidad = parseFloat(m.cantidad) || 0;
    const stockAntes = parseFloat(m.stock_antes) || 0;
    const stockDespues = parseFloat(m.stock_despues) || 0;

    let tipoColor = "";
    let tipoIcon = "";
    if (tipo === "ENTRADA") {
      tipoColor = "#22c55e";
      tipoIcon = "📥";
    } else if (tipo === "SALIDA") {
      tipoColor = "#ef4444";
      tipoIcon = "📤";
    } else {
      tipoColor = "#f59e0b";
      tipoIcon = "⚡";
    }

    tr.innerHTML = `
            <td>${formatDate(m.fecha)}</td>
            <td><strong>${m.producto_nombre || "Desconocido"}</strong></td>
            <td style="color:${tipoColor}; font-weight:600;">${tipoIcon} ${tipo}</td>
            <td style="text-align:center; font-weight:600;">${formatNumber(cantidad)}</td>
            <td style="text-align:center;">${formatNumber(stockAntes)}</td>
            <td style="text-align:center;">${formatNumber(stockDespues)}</td>
            <td>${m.usuario_nombre || "Sistema"}</td>
            <td>${m.referencia || "—"}</td>
        `;
    tbody.appendChild(tr);

    if (index === 0) {
      console.log("✅ Primera fila renderizada:", tr);
    }
  });

  console.log("✅ Tabla renderizada con", movimientos.length, "filas");
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function updateSummary(movimientos) {
  console.log("📊 updateSummary() ejecutándose...");

  let totalEntradas = 0;
  let totalSalidas = 0;

  movimientos.forEach((m) => {
    const cantidad = parseFloat(m.cantidad) || 0;
    const tipo = m.tipo || "";

    if (tipo === "ENTRADA") {
      totalEntradas += cantidad;
    } else if (tipo === "SALIDA") {
      totalSalidas += cantidad;
    }
  });

  const balance = totalEntradas - totalSalidas;

  console.log("📊 Totales:", { totalEntradas, totalSalidas, balance });

  totalEntradasEl.textContent = totalEntradas.toFixed(2);
  totalSalidasEl.textContent = totalSalidas.toFixed(2);
  balanceNetoEl.textContent = balance.toFixed(2);

  if (balance > 0) {
    balanceNetoEl.style.color = "#22c55e";
  } else if (balance < 0) {
    balanceNetoEl.style.color = "#ef4444";
  } else {
    balanceNetoEl.style.color = "#64748b";
  }
}

// ============================================
// FILTRAR
// ============================================
function aplicarFiltros() {
  const tipo = document.getElementById("tipo-movimiento").value;
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  let filtrados = movimientosCache;

  if (tipo !== "TODOS") {
    filtrados = filtrados.filter((m) => m.tipo === tipo);
  }

  if (fechaInicio) {
    const inicio = new Date(fechaInicio);
    filtrados = filtrados.filter((m) => new Date(m.fecha) >= inicio);
  }

  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59);
    filtrados = filtrados.filter((m) => new Date(m.fecha) <= fin);
  }

  renderMovimientos(filtrados);
  updateSummary(filtrados);
}

// ============================================
// EXPORTAR CSV
// ============================================
function exportCSV() {
  if (movimientosCache.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  let csv =
    "Fecha,Hora,Producto,Tipo,Cantidad,Stock Antes,Stock Después,Usuario,Referencia\n";

  movimientosCache.forEach((m) => {
    const fecha = new Date(m.fecha);
    csv += `"${fecha.toLocaleDateString("es-ES")}","${fecha.toLocaleTimeString("es-ES")}","${m.producto_nombre || ""}","${m.tipo || ""}","${parseFloat(m.cantidad) || 0}","${parseFloat(m.stock_antes) || 0}","${parseFloat(m.stock_despues) || 0}","${m.usuario_nombre || ""}","${m.referencia || ""}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `movimientos_inventario_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// EVENTOS
// ============================================
document
  .getElementById("btn-ejecutar")
  .addEventListener("click", aplicarFiltros);
document.getElementById("btn-recargar").addEventListener("click", () => {
  document.getElementById("tipo-movimiento").value = "TODOS";
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  loadMovimientos();
});
document.getElementById("btn-exportar").addEventListener("click", exportCSV);

// ============================================
// INICIALIZAR
// ============================================
console.log("🚀 Inicializando reporte_inventario.js...");

if (!token) {
  alert("Sesión no válida. Redirigiendo...");
  window.location.href = "login.html";
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("✅ DOM listo, cargando movimientos...");
      loadMovimientos();
    });
  } else {
    console.log("✅ DOM ya listo, cargando movimientos...");
    loadMovimientos();
  }
}
