let token = localStorage.getItem("token");
let cortesCache = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    alert("Sesión no válida");
    window.location.href = "login.html";
    return;
  }

  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaFin").value = hoy;

  cargarCortes();
});

async function cargarCortes() {
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;

  const tbody = document.getElementById("cortesTbody");
  tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="loading-state">
                        <i class="fas fa-spinner"></i>
                        <div>Cargando...</div>
                    </td>
                </tr>
            `;

  try {
    let url = `${API_URL}/admin/cortes/historial`;
    const params = new URLSearchParams();

    if (fechaInicio) params.append("inicio", fechaInicio);
    if (fechaFin) params.append("fin", fechaFin);

    if (params.toString()) {
      url += "?" + params.toString();
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Error al cargar datos");

    const data = await response.json();

    if (data.success) {
      cortesCache = data.cortes || [];
      renderCortes(cortesCache);
      calcularEstadisticas(cortesCache);
      document.getElementById("statsGrid").style.display = "grid";
    } else {
      mostrarError(data.message || "Error al cargar cortes");
    }
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error de conexión al cargar los cortes");
  }
}

function renderCortes(cortes) {
  const tbody = document.getElementById("cortesTbody");
  tbody.innerHTML = "";

  if (!cortes || cortes.length === 0) {
    tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>No hay cortes de caja registrados</h3>
                            <p>Los cortes aparecerán aquí una vez que se realicen desde el punto de venta</p>
                        </td>
                    </tr>
                `;
    return;
  }

  cortes.forEach((corte) => {
    const diferencia = parseFloat(corte.diferencia) || 0;
    const ganancia = parseFloat(corte.ganancia) || 0;

    let diferenciaClass = "money-neutral";
    let diferenciaIcon = "fa-check-circle";
    let estadoBadge = "badge-success";
    let estadoTexto = "Cuadrado";

    if (diferencia > 0) {
      diferenciaClass = "money-positive";
      diferenciaIcon = "fa-arrow-up";
      estadoBadge = "badge-warning";
      estadoTexto = "Sobrante";
    } else if (diferencia < 0) {
      diferenciaClass = "money-negative";
      diferenciaIcon = "fa-arrow-down";
      estadoBadge = "badge-danger";
      estadoTexto = "Faltante";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td><strong>#${corte.id}</strong></td>
                    <td>${formatearFecha(corte.fecha_cierre)}</td>
                    <td>${corte.usuario_nombre || "N/A"}</td>
                    <td class="money-neutral">C$${parseFloat(corte.total_ventas).toFixed(2)}</td>
                    <td class="text-muted">C$${parseFloat(corte.total_costo).toFixed(2)}</td>
                    <td class="money-positive">C$${ganancia.toFixed(2)}</td>
                    <td>
                        <div class="detail-row">
                            <span class="detail-item">S: C$${parseFloat(corte.efectivo_sistema).toFixed(2)}</span>
                            <span class="detail-item">R: C$${parseFloat(corte.efectivo_real).toFixed(2)}</span>
                        </div>
                    </td>
                    <td class="${diferenciaClass}">
                        <i class="fas ${diferenciaIcon}"></i> C$${Math.abs(diferencia).toFixed(2)}
                    </td>
                    <td>
                        <div class="detail-row">
                            <span class="detail-item" style="background:#dcfce7;color:#16a34a;">
                                <i class="fas fa-money-bill"></i> C$${parseFloat(corte.total_efectivo).toFixed(0)}
                            </span>
                            <span class="detail-item" style="background:#dbeafe;color:#2563eb;">
                                <i class="fas fa-credit-card"></i> C$${parseFloat(corte.total_tarjeta).toFixed(0)}
                            </span>
                            ${
                              parseFloat(corte.total_transferencia) > 0
                                ? `
                            <span class="detail-item" style="background:#fef3c7;color:#d97706;">
                                <i class="fas fa-exchange-alt"></i> C$${parseFloat(corte.total_transferencia).toFixed(0)}
                            </span>
                            `
                                : ""
                            }
                            ${
                              parseFloat(corte.total_credito) > 0
                                ? `
                            <span class="detail-item" style="background:#fee2e2;color:#dc2626;">
                                <i class="fas fa-file-invoice"></i> C$${parseFloat(corte.total_credito).toFixed(0)}
                            </span>
                            `
                                : ""
                            }
                        </div>
                    </td>
                    <td><span class="badge ${estadoBadge}">${estadoTexto}</span></td>
                `;
    tbody.appendChild(tr);
  });
}

function calcularEstadisticas(cortes) {
  const totalCortes = cortes.length;
  const totalVentas = cortes.reduce(
    (sum, c) => sum + parseFloat(c.total_ventas || 0),
    0,
  );
  const totalGanancia = cortes.reduce(
    (sum, c) => sum + parseFloat(c.ganancia || 0),
    0,
  );
  const totalDiferencia = cortes.reduce(
    (sum, c) => sum + parseFloat(c.diferencia || 0),
    0,
  );

  document.getElementById("totalCortes").textContent = totalCortes;
  document.getElementById("totalVentas").textContent =
    `C$${totalVentas.toFixed(2)}`;
  document.getElementById("totalGanancia").textContent =
    `C$${totalGanancia.toFixed(2)}`;

  const diffElement = document.getElementById("totalDiferencia");
  diffElement.textContent = `C$${Math.abs(totalDiferencia).toFixed(2)}`;
  diffElement.className =
    totalDiferencia >= 0 ? "money-positive" : "money-negative";
}

function formatearFecha(fecha) {
  if (!fecha) return "N/A";
  const d = new Date(fecha);
  return d.toLocaleString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function limpiarFiltros() {
  document.getElementById("fechaInicio").value = "";
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaFin").value = hoy;
  cargarCortes();
}

function mostrarError(mensaje) {
  const tbody = document.getElementById("cortesTbody");
  tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i>
                        <h3>${mensaje}</h3>
                    </td>
                </tr>
            `;
  document.getElementById("statsGrid").style.display = "none";
}

function exportarExcel() {
  if (!cortesCache || cortesCache.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  let csv =
    "ID,Fecha Cierre,Usuario,Ventas,Costo,Ganancia,Efectivo Sistema,Efectivo Real,Diferencia,Total Efectivo,Total Tarjeta,Total Transferencia,Total Credito,Estado\n";

  cortesCache.forEach((corte) => {
    const diferencia = parseFloat(corte.diferencia) || 0;
    let estado = "Cuadrado";
    if (diferencia > 0) estado = "Sobrante";
    else if (diferencia < 0) estado = "Faltante";

    csv += `${corte.id},"${corte.fecha_cierre}",${corte.usuario_nombre || "N/A"},${corte.total_ventas},${corte.total_costo},${corte.ganancia},${corte.efectivo_sistema},${corte.efectivo_real},${corte.diferencia},${corte.total_efectivo},${corte.total_tarjeta},${corte.total_transferencia},${corte.total_credito},${estado}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cortes_caja_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
