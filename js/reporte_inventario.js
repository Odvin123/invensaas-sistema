(function () {
  console.log("🚀 ===== REPORTE INVENTARIO INICIADO =====");

  const token = localStorage.getItem("token");
  const API_URL =
    window.API_URL || "https://invensaas-backend.onrender.com/api";
  let todosLosMovimientos = [];

  console.log("🔑 Token:", token ? "✅ Sí" : "❌ No");
  console.log("🌐 API_URL:", API_URL);

  if (!token) {
    document.getElementById("movimientos-tbody").innerHTML =
      '<tr><td colspan="8" class="empty">❌ Sesión no válida. <a href="login.html">Iniciar sesión</a></td></tr>';
    return;
  }

  const tbody = document.getElementById("movimientos-tbody");
  const totalEntradasEl = document.getElementById("total-entradas");
  const totalSalidasEl = document.getElementById("total-salidas");
  const balanceNetoEl = document.getElementById("balance-neto");

  function formatNumber(value) {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  function renderMovimientos(movimientos) {
    if (!movimientos || movimientos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="empty">📭 No hay movimientos que coincidan con los filtros.</td></tr>';
      return;
    }

    let html = "";
    let totalEntradas = 0;
    let totalSalidas = 0;

    movimientos.forEach((m) => {
      const tipo = m.tipo || "";
      const cantidad = Number(m.cantidad) || 0;
      const stockAntes = Number(m.stock_antes) || 0;
      const stockDespues = Number(m.stock_despues) || 0;

      if (tipo === "ENTRADA") totalEntradas += cantidad;
      else if (tipo === "SALIDA") totalSalidas += cantidad;

      const color =
        tipo === "ENTRADA"
          ? "#22c55e"
          : tipo === "SALIDA"
            ? "#ef4444"
            : "#f59e0b";
      const icon = tipo === "ENTRADA" ? "📥" : tipo === "SALIDA" ? "📤" : "⚡";

      html += `
                <tr>
                    <td>${formatDate(m.fecha)}</td>
                    <td><strong>${m.producto_nombre || "Desconocido"}</strong></td>
                    <td style="color:${color}; font-weight:600;">${icon} ${tipo}</td>
                    <td style="text-align:center; font-weight:600;">${formatNumber(cantidad)}</td>
                    <td style="text-align:center;">${formatNumber(stockAntes)}</td>
                    <td style="text-align:center;">${formatNumber(stockDespues)}</td>
                    <td>${m.usuario_nombre || "Sistema"}</td>
                    <td>${m.referencia || "—"}</td>
                </tr>
            `;
    });

    tbody.innerHTML = html;

    const balance = totalEntradas - totalSalidas;
    totalEntradasEl.textContent = formatNumber(totalEntradas);
    totalSalidasEl.textContent = formatNumber(totalSalidas);
    balanceNetoEl.textContent = formatNumber(balance);
    balanceNetoEl.style.color =
      balance > 0 ? "#22c55e" : balance < 0 ? "#ef4444" : "#64748b";

    console.log("✅ Tabla renderizada con", movimientos.length, "movimientos");
  }

  async function loadMovimientos() {
    console.log("🔄 Cargando movimientos...");
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    try {
      const response = await fetch(`${API_URL}/admin/inventario/movimientos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Status:", response.status);

      if (response.status === 401) {
        tbody.innerHTML =
          '<tr><td colspan="8" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td></tr>';
        return;
      }

      const data = await response.json();
      console.log("📦 Datos recibidos:", data);

      if (!data.success || !data.movimientos) {
        tbody.innerHTML =
          '<tr><td colspan="8" class="empty">❌ Error al cargar movimientos.</td></tr>';
        return;
      }

      todosLosMovimientos = data.movimientos;
      console.log("📊 Movimientos encontrados:", todosLosMovimientos.length);

      aplicarFiltros();
    } catch (error) {
      console.error("❌ Error:", error);
      tbody.innerHTML = `<tr><td colspan="8" class="empty">❌ Error de conexión: ${error.message}</td></tr>`;
    }
  }

  window.exportarCSV = function () {
    const rows = tbody.querySelectorAll("tr");

    if (rows.length === 0 || rows[0].classList.contains("empty")) {
      alert("⚠️ No hay datos para exportar.");
      return;
    }

    const data = [];
    const headers = [
      "Fecha",
      "Producto",
      "Tipo",
      "Cantidad",
      "Stock Antes",
      "Stock Después",
      "Usuario",
      "Referencia",
    ];
    data.push(headers);

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 0) {
        const rowData = [];
        cols.forEach((col) => {
          let text = col.textContent.trim();
          text = text.replace(/[^\w\s\d.,$C\-]/g, "").trim();
          rowData.push(text);
        });
        if (rowData.length === 8) {
          data.push(rowData);
        }
      }
    });

    let csvContent = "";
    data.forEach((row) => {
      const escapedRow = row.map((cell) => {
        if (
          typeof cell === "string" &&
          (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
        ) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const now = new Date();
    const fechaStr = now.toISOString().slice(0, 10);
    link.setAttribute("download", `movimientos_inventario_${fechaStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ CSV exportado correctamente");
  };

  function aplicarFiltros() {
    const tipo = document.getElementById("tipo-movimiento").value;
    const fechaInicio = document.getElementById("fecha-inicio").value;
    const fechaFin = document.getElementById("fecha-fin").value;
    const buscarProducto = document
      .getElementById("buscar-producto")
      .value.toLowerCase()
      .trim();

    console.log("🔍 Aplicando filtros:", {
      tipo,
      fechaInicio,
      fechaFin,
      buscarProducto,
    });

    let filtrados = todosLosMovimientos;

    if (tipo !== "TODOS") {
      filtrados = filtrados.filter((m) => m.tipo === tipo);
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      filtrados = filtrados.filter((m) => new Date(m.fecha) >= inicio);
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter((m) => new Date(m.fecha) <= fin);
    }

    if (buscarProducto) {
      filtrados = filtrados.filter(
        (m) =>
          m.producto_nombre &&
          m.producto_nombre.toLowerCase().includes(buscarProducto),
      );
    }

    console.log("📊 Resultados filtrados:", filtrados.length);
    renderMovimientos(filtrados);
  }

  document
    .getElementById("btn-ejecutar")
    .addEventListener("click", aplicarFiltros);
  document.getElementById("btn-recargar").addEventListener("click", () => {
    document.getElementById("tipo-movimiento").value = "TODOS";
    document.getElementById("fecha-inicio").value = "";
    document.getElementById("fecha-fin").value = "";
    document.getElementById("buscar-producto").value = "";
    loadMovimientos();
  });

  document
    .getElementById("tipo-movimiento")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("fecha-inicio")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("fecha-fin")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("buscar-producto")
    .addEventListener("input", aplicarFiltros);

  function init() {
    loadMovimientos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
