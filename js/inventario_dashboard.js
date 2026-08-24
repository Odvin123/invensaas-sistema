let token = localStorage.getItem("token");
let tenantId = localStorage.getItem("tenant_id");
const STOCK_BAJO_UMBRAL = 5;

// Cache
let productosCache = [];
let categoriasCache = [];
let proveedoresCache = [];
let clientesCache = [];
let vendedoresCache = [];

function logout() {
  if (confirm("¿Cerrar sesión?")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  }
}

function filtrarPorEstado(tipo) {
  showView("productos");
  cargarProductosConFiltro(tipo);
}

function limpiarFiltroProductos() {
  document.getElementById("productos-titulo").textContent =
    "Todos los Productos";
  cargarProductosConFiltro("todos");
}

let productosVistaBase = [];

async function cargarProductosConFiltro(tipo) {
  const tbody = document.getElementById("productos-tbody");
  tbody.innerHTML =
    '<tr><td colspan="8" class="loading-state"><i class="fas fa-spinner"></i> Cargando...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      let productos = data.productos || [];

      if (tipo === "stock-bajo") {
        productos = productos.filter(
          (p) =>
            parseFloat(p.stock) > 0 && parseFloat(p.stock) <= STOCK_BAJO_UMBRAL,
        );
        document.getElementById("productos-titulo").textContent =
          "⚠️ Productos con Stock Bajo";
      } else if (tipo === "agotados") {
        productos = productos.filter((p) => parseFloat(p.stock) === 0);
        document.getElementById("productos-titulo").textContent =
          "🚫 Productos Agotados";
      } else if (tipo === "stock-normal") {
        productos = productos.filter(
          (p) => parseFloat(p.stock) > STOCK_BAJO_UMBRAL,
        );
        document.getElementById("productos-titulo").textContent =
          "✅ Productos con Stock Normal";
      } else {
        document.getElementById("productos-titulo").textContent =
          "📦 Todos los Productos";
      }

      productosVistaBase = productos;
      const buscarInput = document.getElementById("productos-buscar-input");
      if (buscarInput) buscarInput.value = "";
      aplicarFiltroBusquedaProductos();
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}

function aplicarFiltroBusquedaProductos() {
  const texto = (document.getElementById("productos-buscar-input")?.value || "")
    .toLowerCase()
    .trim();
  let productos = productosVistaBase;

  if (texto) {
    productos = productos.filter(
      (p) =>
        (p.descripcion && p.descripcion.toLowerCase().includes(texto)) ||
        (p.id && p.id.toString().includes(texto)) ||
        (p.categoria_nombre &&
          p.categoria_nombre.toLowerCase().includes(texto)) ||
        (p.proveedor_nombre &&
          p.proveedor_nombre.toLowerCase().includes(texto)),
    );
  }

  renderProductosCompletos(productos);
  document.getElementById("productos-contador").textContent =
    `${productos.length} producto(s)`;
}

function filtrarProductosView() {
  aplicarFiltroBusquedaProductos();
}

function renderProductosCompletos(productos) {
  const tbody = document.getElementById("productos-tbody");
  tbody.innerHTML = "";

  if (!productos || productos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted" style="padding:20px;">No hay productos con este filtro.</td></tr>';
    return;
  }

  productos.forEach((p) => {
    const stock = parseFloat(p.stock) || 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td><strong>${p.id}</strong></td>
                    <td>${p.descripcion || "Sin descripción"}</td>
                    <td>${p.categoria_nombre || "N/A"}</td>
                    <td>${p.proveedor_nombre || "N/A"}</td>
                    <td style="text-align:center;font-weight:600;">${formatStock(stock)}</td>
                    <td style="text-align:right;font-weight:600;color:var(--primary);">C$${parseFloat(p.precio).toFixed(2)}</td>
                    <td style="text-align:right;color:var(--text-light);">C$${parseFloat(p.costo).toFixed(2)}</td>
                    <td style="text-align:center;">
                        <div class="actions-cell" style="justify-content:center;">
                            <button class="btn-sm btn-edit" onclick="openModal('product', {id:${p.id}})"><i class="fas fa-edit"></i></button>
                            <button class="btn-sm btn-delete" onclick="deleteProducto(${p.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

let topProductsChart = null;
let categoryChart = null;

function initCharts() {
  const ctx1 = document.getElementById("topProductsChart").getContext("2d");
  topProductsChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Cargando..."],
      datasets: [
        {
          label: "Unidades",
          data: [0],
          backgroundColor: ["#6366f1"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });

  const ctx2 = document.getElementById("categoryChart").getContext("2d");
  categoryChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Sin datos"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["#6366f1"],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 10, usePointStyle: true, pointStyle: "circle" },
        },
      },
    },
  });
}

function updateCharts(productos) {
  if (categoryChart && productos && productos.length > 0) {
    const categorias = {};
    productos.forEach((p) => {
      const cat = p.categoria_nombre || "Sin categoría";
      categorias[cat] = (categorias[cat] || 0) + 1;
    });
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#3b82f6",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
      "#8b5cf6",
      "#f472b6",
    ];
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.data.datasets[0].backgroundColor = colors.slice(
      0,
      labels.length,
    );
    categoryChart.update();
  }

  if (topProductsChart && productos && productos.length > 0) {
    const sorted = [...productos]
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 10);

    const labels = sorted.map((p) =>
      p.descripcion && p.descripcion.length > 12
        ? p.descripcion.substring(0, 11) + "…"
        : p.descripcion || "Sin nombre",
    );
    const data = sorted.map((p) => p.stock || 0);

    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#3b82f6",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
      "#8b5cf6",
      "#f472b6",
    ];

    topProductsChart.data.labels = labels;
    topProductsChart.data.datasets[0].data = data;
    topProductsChart.data.datasets[0].backgroundColor = colors;
    topProductsChart.update();
  }
}

function showView(viewId) {
  document
    .querySelectorAll(".view-content")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById("view-" + viewId).classList.add("active");
  document
    .querySelectorAll(".main-menu a")
    .forEach((a) => a.classList.remove("active"));
  document
    .querySelector(`.main-menu a[data-view="${viewId}"]`)
    ?.classList.add("active");

  const loadMap = {
    dashboard: loadDashboardData,
    productos: loadProductos,
    categorias: loadCategorias,
    proveedores: loadProveedores,
    clientes: loadClientes,
    vendedores: loadVendedores,
  };
  if (loadMap[viewId]) loadMap[viewId]();
}

document.querySelectorAll(".main-menu a[data-view]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showView(el.dataset.view);
  });
});

function openModal(type, data = null) {
  document.getElementById("modal-" + type).style.display = "block";
  if (type === "product") {
    document.getElementById("product-modal-title").textContent = data
      ? "Editar Producto"
      : "Agregar Producto";

    const stockInput = document.getElementById("product-stock");
    const stockLabel = document.getElementById("stock-label");

    if (data) {
      stockInput.disabled = true;
      stockInput.style.background = "#f1f5f9";
      stockLabel.textContent = "(no editable, usa Entrada)";

      const producto = productosCache.find((p) => p.id == data.id)
|| productosVistaBase.find((p) => p.id == data.id)
|| data;

document.getElementById("product-id").value = producto.id;
document.getElementById("product-descripcion").value = producto.descripcion || "";
document.getElementById("product-stock").value = formatStock(producto.stock);
document.getElementById("product-costo").value = parseFloat(producto.costo).toFixed(2);
document.getElementById("product-precio").value = parseFloat(producto.precio).toFixed(2);
document.getElementById("product-clave").value = producto.id;
    } else {
      stockInput.disabled = false;
      stockInput.style.background = "";
      stockLabel.textContent = "(solo al crear)";
      document.getElementById("productForm").reset();
      document.getElementById("product-id").value = "";
      document.getElementById("product-clave").value = "Auto-Generada";
    }
    loadProductFormData();
  } else if (type === "categoria") {
    document.getElementById("categoria-modal-title").textContent = data
      ? "Editar Categoría"
      : "Nueva Categoría";
    document.getElementById("categoria-id").value = data ? data.id : "";
    document.getElementById("categoria-nombre").value = data ? data.nombre : "";
  } else if (type === "proveedor") {
    document.getElementById("proveedor-modal-title").textContent = data
      ? "Editar Proveedor"
      : "Nuevo Proveedor";
    document.getElementById("proveedor-id").value = data ? data.id : "";
    document.getElementById("proveedor-nombre").value = data ? data.nombre : "";
    document.getElementById("proveedor-telefono").value = data
      ? data.telefono
      : "";
    document.getElementById("proveedor-correo").value = data
      ? data.correo_contacto
      : "";
  } else if (type === "cliente") {
    document.getElementById("cliente-modal-title").textContent = data
      ? "Editar Cliente"
      : "Nuevo Cliente";
    document.getElementById("cliente-id").value = data ? data.id : "";
    document.getElementById("cliente-nombre").value = data ? data.nombre : "";
  } else if (type === "vendedor") {
    document.getElementById("vendedor-modal-title").textContent = data
      ? "Editar Vendedor"
      : "Nuevo Vendedor";
    document.getElementById("vendedor-id").value = data ? data.id : "";
    document.getElementById("vendedor-nombre").value = data ? data.nombre : "";
  }
}

function closeModal(type) {
  document.getElementById("modal-" + type).style.display = "none";
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

async function loadDashboardData() {
  await loadProductos();
  await loadProveedores(false);
}

async function loadDashboardData() {
  await loadProductos();
  await loadProveedores(false);
}

async function loadProductFormData() {
  try {
    const [provResp, catResp] = await Promise.all([
      fetch(`${API_URL}/admin/proveedores`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/admin/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const provData = await provResp.json();
    const catData = await catResp.json();

    const provSelect = document.getElementById("product-proveedor");
    provSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    if (provData.success) {
      provData.proveedores.forEach((p) => {
        provSelect.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
      });
    }

    const catSelect = document.getElementById("product-categoria");
    catSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    if (catData.success) {
      catData.categorias.forEach((c) => {
        catSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
      });
    }

    const productId = document.getElementById("product-id").value;
    if (productId) {
      const producto = productosCache.find((p) => p.id == productId);
      if (producto) {
        document.getElementById("product-proveedor").value =
          producto.proveedor_id || "";
        document.getElementById("product-categoria").value =
          producto.categoria_id || "";
      }
    }
  } catch (e) {
    console.error("Error loading form data:", e);
  }
}

async function loadProductos() {
  const tbody = document.getElementById("inventory-tbody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="loading-state"><i class="fas fa-spinner"></i> Cargando productos...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    const data = await response.json();

    if (data.success) {
      productosCache = data.productos || [];
      renderProductosDashboard(productosCache.slice(0, 10));
      updateStats(productosCache);
      updateCharts(productosCache);
      // También actualizar la vista completa de productos
      cargarProductosConFiltro("todos");
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}
function renderProductosDashboard(productos) {
  const tbody = document.getElementById("inventory-tbody");
  tbody.innerHTML = "";

  if (!productos || productos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-state"><i class="fas fa-box-open"></i><br>No hay productos registrados.</td></tr>';
    return;
  }

  productos.forEach((p) => {
    const stock = parseFloat(p.stock) || 0;
    let statusClass = "in-stock";
    let statusText = "En Stock";
    if (stock === 0) {
      statusClass = "out-of-stock";
      statusText = "Agotado";
    } else if (stock <= STOCK_BAJO_UMBRAL) {
      statusClass = "low-stock";
      statusText = "Stock Bajo";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td><strong>${p.id}</strong></td>
                    <td>${p.descripcion || "Sin descripción"}</td>
                    <td>${p.categoria_nombre || "N/A"}</td>
                    <td style="text-align:center;font-weight:600;">${formatStock(stock)}</td>
                    <td style="text-align:right;font-weight:600;color:var(--primary);">C$${parseFloat(p.precio).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td style="text-align:center;">
                        <div class="actions-cell" style="justify-content:center;">
                            <button class="btn-sm btn-edit" onclick="openModal('product', {id:${p.id}})"><i class="fas fa-edit"></i></button>
                            <button class="btn-sm btn-delete" onclick="deleteProducto(${p.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

function updateStats(productos) {
  let total = 0,
    normal = 0,
    bajo = 0,
    agotado = 0,
    valorTotal = 0;
  productos.forEach((p) => {
    const stock = parseFloat(p.stock) || 0;
    const precio = parseFloat(p.precio) || 0;
    total++;
    valorTotal += stock * precio;
    if (stock === 0) agotado++;
    else if (stock <= STOCK_BAJO_UMBRAL) bajo++;
    else normal++;
  });
  document.getElementById("total-productos").textContent = total;
  document.getElementById("stock-normal").textContent = normal;
  document.getElementById("stock-bajo-count").textContent = bajo;
  document.getElementById("stock-agotados").textContent = agotado;
  document.getElementById("valor-inventario").textContent =
    `C$${valorTotal.toFixed(2)}`;
}

// Product Form Submit
document
  .getElementById("productForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const isEditing = !!id;

    const data = {
      proveedor_id: document.getElementById("product-proveedor").value,
      categoria_id: document.getElementById("product-categoria").value,
      descripcion: document.getElementById("product-descripcion").value.trim(),
      stock: parseFloat(document.getElementById("product-stock").value) || 0,
      costo: parseFloat(document.getElementById("product-costo").value) || 0,
      precio: parseFloat(document.getElementById("product-precio").value) || 0,
    };

    if (!data.proveedor_id || !data.categoria_id || !data.descripcion) {
      alert("⚠️ Proveedor, Categoría y Descripción son obligatorios.");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/admin/productos/${id}`
      : `${API_URL}/admin/productos`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `✅ Producto ${isEditing ? "actualizado" : "creado"} exitosamente.`,
        );
        closeModal("product");
        loadDashboardData();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

async function deleteProducto(id) {
  if (!confirm("⚠️ ¿Eliminar este producto?")) return;
  try {
    const response = await fetch(`${API_URL}/admin/productos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok && result.success) {
      alert("✅ Producto eliminado.");
      loadDashboardData();
    } else {
      alert("❌ Error: " + (result.message || "No se puede eliminar."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

async function loadCategorias() {
  const tbody = document.getElementById("categorias-tbody");
  tbody.innerHTML =
    '<tr><td colspan="3" class="loading-state"><i class="fas fa-spinner"></i> Cargando...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      categoriasCache = data.categorias || [];
      tbody.innerHTML = "";
      if (categoriasCache.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">No hay categorías.</td></tr>';
        return;
      }
      categoriasCache.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                            <td>${c.id}</td>
                            <td><strong>${c.nombre}</strong></td>
                            <td style="text-align:center;">
                                <div class="actions-cell" style="justify-content:center;">
                                    <button class="btn-sm btn-edit" onclick="openModal('categoria', {id:${c.id}, nombre:'${c.nombre}'})"><i class="fas fa-edit"></i></button>
                                    <button class="btn-sm btn-delete" onclick="deleteCategoria(${c.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}

document
  .getElementById("categoriaForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("categoria-id").value;
    const nombre = document.getElementById("categoria-nombre").value.trim();
    const isEditing = !!id;

    if (!nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/admin/categorias/${id}`
      : `${API_URL}/admin/categorias`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Categoría ${isEditing ? "actualizada" : "creada"}.`);
        closeModal("categoria");
        loadCategorias();
        loadDashboardData();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

function formatStock(value) {
  if (value === null || value === undefined) return "0.00";
  // Si es string, convertirlo a número
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

async function deleteCategoria(id) {
  if (!confirm("⚠️ ¿Eliminar esta categoría?")) return;
  try {
    const response = await fetch(`${API_URL}/admin/categorias/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok && result.success) {
      alert("✅ Categoría eliminada.");
      loadCategorias();
      loadDashboardData();
    } else {
      alert("❌ Error: " + (result.message || "Tiene productos asociados."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

async function loadProveedores(render = true) {
  if (!render) {
    try {
      const response = await fetch(`${API_URL}/admin/proveedores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) proveedoresCache = data.proveedores || [];
      document.getElementById("total-proveedores").textContent =
        proveedoresCache.length;
    } catch (e) {
      console.error(e);
    }
    return;
  }

  const tbody = document.getElementById("proveedores-tbody");
  tbody.innerHTML =
    '<tr><td colspan="5" class="loading-state"><i class="fas fa-spinner"></i> Cargando...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/proveedores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      proveedoresCache = data.proveedores || [];
      tbody.innerHTML = "";
      if (proveedoresCache.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">No hay proveedores.</td></tr>';
        return;
      }
      proveedoresCache.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                            <td>${p.id}</td>
                            <td><strong>${p.nombre}</strong></td>
                            <td>${p.telefono || "—"}</td>
                            <td>${p.correo_contacto || "—"}</td>
                            <td style="text-align:center;">
                                <div class="actions-cell" style="justify-content:center;">
                                    <button class="btn-sm btn-edit" onclick="openModal('proveedor', {id:${p.id}, nombre:'${p.nombre}', telefono:'${p.telefono || ""}', correo_contacto:'${p.correo_contacto || ""}'})"><i class="fas fa-edit"></i></button>
                                    <button class="btn-sm btn-delete" onclick="deleteProveedor(${p.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}

document
  .getElementById("proveedorForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("proveedor-id").value;
    const isEditing = !!id;

    const data = {
      nombre: document.getElementById("proveedor-nombre").value.trim(),
      telefono: document.getElementById("proveedor-telefono").value.trim(),
      correo_contacto: document.getElementById("proveedor-correo").value.trim(),
    };

    if (!data.nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/admin/proveedores/${id}`
      : `${API_URL}/admin/proveedores`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Proveedor ${isEditing ? "actualizado" : "creado"}.`);
        closeModal("proveedor");
        loadProveedores(true);
        loadDashboardData();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

async function deleteProveedor(id) {
  if (!confirm("⚠️ ¿Eliminar este proveedor?")) return;
  try {
    const response = await fetch(`${API_URL}/admin/proveedores/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok && result.success) {
      alert("✅ Proveedor eliminado.");
      loadProveedores(true);
      loadDashboardData();
    } else {
      alert("❌ Error: " + (result.message || "Tiene productos asociados."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

async function loadClientes() {
  const tbody = document.getElementById("clientes-tbody");
  tbody.innerHTML =
    '<tr><td colspan="3" class="loading-state"><i class="fas fa-spinner"></i> Cargando...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/clientes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      clientesCache = data.clientes || [];
      tbody.innerHTML = "";
      if (clientesCache.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">No hay clientes.</td></tr>';
        return;
      }
      clientesCache.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                            <td>${c.id}</td>
                            <td><strong>${c.nombre}</strong></td>
                            <td style="text-align:center;">
                                <div class="actions-cell" style="justify-content:center;">
                                    <button class="btn-sm btn-edit" onclick="openModal('cliente', {id:${c.id}, nombre:'${c.nombre}'})"><i class="fas fa-edit"></i></button>
                                    ${c.nombre.toLowerCase() !== "público general" ? `<button class="btn-sm btn-delete" onclick="deleteCliente(${c.id})"><i class="fas fa-trash"></i></button>` : ""}
                                </div>
                            </td>
                        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}

document
  .getElementById("clienteForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("cliente-id").value;
    const nombre = document.getElementById("cliente-nombre").value.trim();
    const isEditing = !!id;

    if (!nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/admin/clientes/${id}`
      : `${API_URL}/admin/clientes`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Cliente ${isEditing ? "actualizado" : "creado"}.`);
        closeModal("cliente");
        loadClientes();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

async function deleteCliente(id) {
  if (!confirm("⚠️ ¿Eliminar este cliente?")) return;
  try {
    const response = await fetch(`${API_URL}/admin/clientes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok && result.success) {
      alert("✅ Cliente eliminado.");
      loadClientes();
    } else {
      alert("❌ Error: " + (result.message || "Es el cliente por defecto."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

async function loadVendedores() {
  const tbody = document.getElementById("vendedores-tbody");
  tbody.innerHTML =
    '<tr><td colspan="3" class="loading-state"><i class="fas fa-spinner"></i> Cargando...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/vendedores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      vendedoresCache = data.vendedores || [];
      tbody.innerHTML = "";
      if (vendedoresCache.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">No hay vendedores.</td></tr>';
        return;
      }
      vendedoresCache.forEach((v) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                            <td>${v.id}</td>
                            <td><strong>${v.nombre}</strong></td>
                            <td style="text-align:center;">
                                <div class="actions-cell" style="justify-content:center;">
                                    <button class="btn-sm btn-edit" onclick="openModal('vendedor', {id:${v.id}, nombre:'${v.nombre}'})"><i class="fas fa-edit"></i></button>
                                    ${v.nombre.toLowerCase() !== "administrador" ? `<button class="btn-sm btn-delete" onclick="deleteVendedor(${v.id})"><i class="fas fa-trash"></i></button>` : ""}
                                </div>
                            </td>
                        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted" style="padding:20px;">Error de conexión</td></tr>';
  }
}

document
  .getElementById("vendedorForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("vendedor-id").value;
    const nombre = document.getElementById("vendedor-nombre").value.trim();
    const isEditing = !!id;

    if (!nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/admin/vendedores/${id}`
      : `${API_URL}/admin/vendedores`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Vendedor ${isEditing ? "actualizado" : "creado"}.`);
        closeModal("vendedor");
        loadVendedores();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

async function deleteVendedor(id) {
  if (!confirm("⚠️ ¿Eliminar este vendedor?")) return;
  try {
    const response = await fetch(`${API_URL}/admin/vendedores/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok && result.success) {
      alert("✅ Vendedor eliminado.");
      loadVendedores();
    } else {
      alert("❌ Error: " + (result.message || "Es el vendedor por defecto."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}
let entradaProductos = [];

async function agregarProductoEntrada() {
  document.getElementById("modal-buscar-producto").style.display = "block";

  try {
    const response = await fetch(`${API_URL}/admin/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      productosCache = data.productos || [];
      renderBusquedaProductos(productosCache);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderBusquedaProductos(productos) {
  const tbody = document.getElementById("buscar-productos-tbody");
  tbody.innerHTML = "";
  if (productos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted" style="padding:20px;">No hay productos.</td></tr>';
    return;
  }
  productos.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.descripcion || "Sin nombre"}</td>
                    <td style="text-align:center;font-weight:600;">${formatStock(p.stock)}</td>
                    <td style="text-align:right;">C$${parseFloat(p.precio || 0).toFixed(2)}</td>
                    <td style="text-align:right;">C$${parseFloat(p.costo || 0).toFixed(2)}</td>
                    <td style="text-align:center;">
                        <button class="btn-sm btn-success" onclick="seleccionarProductoEntrada(${p.id})">Seleccionar</button>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

function filtrarProductosBusqueda() {
  const filtro = document
    .getElementById("buscar-producto-filtro")
    .value.toLowerCase();
  const filtered = productosCache.filter(
    (p) =>
      (p.descripcion && p.descripcion.toLowerCase().includes(filtro)) ||
      (p.id && p.id.toString().includes(filtro)),
  );
  renderBusquedaProductos(filtered);
}

function calcularPromedioPonderado(
  stockAnterior,
  valorAnterior,
  cantidadNueva,
  valorNuevo,
) {
  const stockTotal = stockAnterior + cantidadNueva;
  if (stockTotal <= 0) return valorNuevo;
  if (stockAnterior <= 0) return valorNuevo;
  return (
    (stockAnterior * valorAnterior + cantidadNueva * valorNuevo) / stockTotal
  );
}

function actualizarPromedioEntrada(id) {
  const item = entradaProductos.find((p) => p.id === id);
  if (!item) return;

  item.costoPromedio = calcularPromedioPonderado(
    item.stockAnterior,
    item.costoAnterior,
    item.cantidad,
    item.costoNuevo,
  );
  item.precioPromedio = calcularPromedioPonderado(
    item.stockAnterior,
    item.precioAnterior,
    item.cantidad,
    item.precioNuevo,
  );

  const celda = document.getElementById(`entrada-promedio-${id}`);
  if (celda) {
    const costoCambio = Math.abs(item.costoNuevo - item.costoAnterior) > 0.001;
    const precioCambio =
      Math.abs(item.precioNuevo - item.precioAnterior) > 0.001;
    celda.innerHTML = `
                    Costo: C$${item.costoPromedio.toFixed(2)} ${costoCambio ? '<i class="fas fa-sync-alt" style="color:var(--primary);" title="Promedio ponderado aplicado"></i>' : ""}<br>
                    Precio: C$${item.precioPromedio.toFixed(2)} ${precioCambio ? '<i class="fas fa-sync-alt" style="color:var(--primary);" title="Promedio ponderado aplicado"></i>' : ""}
                `;
  }
}

function actualizarEntradaCampo(id, campo, valor) {
  const item = entradaProductos.find((p) => p.id === id);
  if (!item) return;

  if (campo === "cantidad") {
    let cantidad = parseFloat(valor);
    if (isNaN(cantidad) || cantidad < 0.01) cantidad = 1;
    item.cantidad = cantidad;
  } else if (campo === "costoNuevo") {
    const v = parseFloat(valor);
    item.costoNuevo = isNaN(v) || v < 0 ? item.costoAnterior : v;
  } else if (campo === "precioNuevo") {
    const v = parseFloat(valor);
    item.precioNuevo = isNaN(v) || v < 0 ? item.precioAnterior : v;
  }

  actualizarPromedioEntrada(id);
}

function seleccionarProductoEntrada(id) {
  closeModal("buscar-producto");

  if (entradaProductos.find((p) => p.id === id)) {
    alert("⚠️ Este producto ya está en la lista.");
    return;
  }

  const producto = productosCache.find((p) => p.id === id);
  if (!producto) {
    alert("❌ No se pudo cargar la información del producto.");
    return;
  }

  const stockAnterior = parseFloat(producto.stock) || 0;
  const costoAnterior = parseFloat(producto.costo) || 0;
  const precioAnterior = parseFloat(producto.precio) || 0;
  const descripcion = producto.descripcion || "Sin nombre";

  const item = {
    id: id,
    descripcion: descripcion,
    cantidad: 1,
    stockAnterior: stockAnterior,
    costoAnterior: costoAnterior,
    precioAnterior: precioAnterior,
    costoNuevo: costoAnterior,
    precioNuevo: precioAnterior,
    costoPromedio: costoAnterior,
    precioPromedio: precioAnterior,
  };
  entradaProductos.push(item);

  const tbody = document.getElementById("entrada-productos-tbody");
  if (tbody.querySelector("td[colspan]")) tbody.innerHTML = "";

  const tr = document.createElement("tr");
  tr.dataset.productoId = id;
  tr.innerHTML = `
                <td>${descripcion}<br><small style="color:var(--text-light);">Stock actual: ${formatStock(stockAnterior)}</small></td>
                <td style="text-align:center;">
                    <input type="number" value="1" style="width:80px;padding:6px;border:2px solid var(--border);border-radius:6px;text-align:center;font-size:14px;"
                           step="any" min="0.01"
                           oninput="actualizarEntradaCampo(${id}, 'cantidad', this.value)">
                </td>
                <td style="text-align:center;">
                    <input type="number" value="${costoAnterior.toFixed(2)}" style="width:90px;padding:6px;border:2px solid var(--border);border-radius:6px;text-align:center;font-size:14px;"
                           step="0.01" min="0"
                           oninput="actualizarEntradaCampo(${id}, 'costoNuevo', this.value)">
                </td>
                <td style="text-align:center;">
                    <input type="number" value="${precioAnterior.toFixed(2)}" style="width:90px;padding:6px;border:2px solid var(--border);border-radius:6px;text-align:center;font-size:14px;"
                           step="0.01" min="0"
                           oninput="actualizarEntradaCampo(${id}, 'precioNuevo', this.value)">
                </td>
                <td style="text-align:center; font-size:12px;" id="entrada-promedio-${id}">
                    Costo: C$${costoAnterior.toFixed(2)}<br>Precio: C$${precioAnterior.toFixed(2)}
                </td>
                <td style="text-align:center;">
                    <button type="button" class="btn-sm btn-delete" onclick="eliminarProductoEntrada(this, ${id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
  tbody.appendChild(tr);
}

function eliminarProductoEntrada(btn, id) {
  const row = btn.closest("tr");
  row.remove();
  entradaProductos = entradaProductos.filter((p) => p.id !== id);
  const tbody = document.getElementById("entrada-productos-tbody");
  if (tbody.children.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted" style="padding:20px;">Haz clic en "Agregar Producto"</td></tr>';
  }
}

document
  .getElementById("entradaForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    if (entradaProductos.length === 0) {
      alert("⚠️ Agrega al menos un producto.");
      return;
    }

    const data = {
      productos: entradaProductos.map((p) => ({
        producto_id: p.id,
        cantidad: p.cantidad,

        costo: parseFloat(p.costoNuevo.toFixed(2)),
        precio: parseFloat(p.precioNuevo.toFixed(2)),
      })),
      referencia: document.getElementById("entrada-referencia").value.trim(),
      motivo: document.getElementById("entrada-motivo").value.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/admin/inventario/entradas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `✅ Entrada registrada con ${entradaProductos.length} producto(s).`,
        );
        loadDashboardData();
        entradaProductos = [];
        document.getElementById("entrada-productos-tbody").innerHTML =
          '<tr><td colspan="6" class="text-center text-muted" style="padding:20px;">Haz clic en "Agregar Producto"</td></tr>';
        document.getElementById("entrada-referencia").value = "";
        document.getElementById("entrada-motivo").value = "";
        loadDashboardData();
      } else {
        alert("❌ Error: " + (result.message || "Falló el registro."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

function exportCSV() {
  if (!productosCache || productosCache.length === 0) {
    alert("No hay productos para exportar.");
    return;
  }

  let csv = "ID,Descripción,Categoría,Stock,Precio,Costo\n";
  productosCache.forEach((p) => {
    csv += `${p.id},"${p.descripcion || ""}",${p.categoria_nombre || "N/A"},${p.stock || 0},${p.precio || 0},${p.costo || 0}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!token || !tenantId) {
    alert("Sesión no válida. Redirigiendo...");
    localStorage.clear();
    window.location.href = "login.html";
    return;
  }

  const nombreEmpresa =
    localStorage.getItem("nombre_empresa") || tenantId.toUpperCase();
  document.getElementById("company-name-display").textContent = nombreEmpresa;
  document.getElementById("avatar-initial").textContent = nombreEmpresa
    .charAt(0)
    .toUpperCase();
  document.getElementById("welcome-message").textContent =
    `Bienvenido, Administrador`;
  document.getElementById("company-subtitle").textContent =
    `Gestionando: ${nombreEmpresa}`;

  initCharts();
  loadDashboardData();
});
