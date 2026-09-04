let token = localStorage.getItem("token");
let tenantId = localStorage.getItem("tenant_id");

let ventaActual = [];
let productosInventarioCache = [];
let categoriasCache = [];
let proveedoresCache = [];
let clientesCachePOS = [];
let vendedoresCachePOS = [];

const defaultCliente = "PUBLICO EN GENERAL";
const defaultVendedor = "MOSTRADOR";

async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_URL}/admin/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data[endpoint] || [];
  } catch (error) {
    console.error(`Error al cargar ${endpoint}:`, error);
    return [];
  }
}

function loadState() {
  const currentCliente =
    localStorage.getItem("currentClienteName") || defaultCliente;
  const currentVendedor =
    localStorage.getItem("currentVendedorName") || defaultVendedor;

  document.getElementById("footer-cliente").textContent = currentCliente;
  document.getElementById("footer-vendedor").textContent = currentVendedor;

  if (!localStorage.getItem("currentClienteId"))
    localStorage.setItem("currentClienteId", 1);
  if (!localStorage.getItem("currentVendedorId"))
    localStorage.setItem("currentVendedorId", 1);
}

function openClienteSelectionModal() {
  if (!token) {
    alert("Sesión no válida.");
    return;
  }
  document.getElementById("clienteSelectionModal").style.display = "block";
  if (clientesCachePOS.length === 0) loadClientesForPOS();
  else renderClientesForPOS(clientesCachePOS);
}
function calcularSubtotalConDescuento() {
  const precioStr = document
    .getElementById("precio_unitario")
    .value.replace("C$", "")
    .trim();
  const precio = parseFloat(precioStr) || 0;

  const cantidadStr = document.getElementById("cantidad_venta").value.trim();
  const cantidad = cantidadStr === "" ? 0 : parseFloat(cantidadStr) || 0;

  const descuento =
    parseFloat(document.getElementById("descuento_producto").value) || 0;

  const subtotal = cantidad * precio;
  const subtotalConDescuento = Math.max(0, subtotal - descuento);

  const display = document.getElementById("subtotal-con-descuento");

  if (cantidad === 0 || cantidadStr === "") {
    display.textContent = "C$0.00";
    display.style.color = "#6366f1";
    return;
  }

  display.textContent = `C$${subtotalConDescuento.toFixed(2)}`;

  const descuentoInput = document.getElementById("descuento_producto");
  if (descuento > subtotal) {
    descuentoInput.style.borderColor = "#ef4444";
    display.style.color = "#ef4444";
    display.textContent += " ⚠️ Descuento mayor al subtotal";
  } else {
    descuentoInput.style.borderColor = "#e2e8f0";
    display.style.color = "#6366f1";
  }
}

function closeClienteSelectionModal() {
  document.getElementById("clienteSelectionModal").style.display = "none";
}

function openVendedorSelectionModal() {
  if (!token) {
    alert("Sesión no válida.");
    return;
  }
  document.getElementById("vendedorSelectionModal").style.display = "block";
  if (vendedoresCachePOS.length === 0) loadVendedoresForPOS();
  else renderVendedoresForPOS(vendedoresCachePOS);
}

function closeVendedorSelectionModal() {
  document.getElementById("vendedorSelectionModal").style.display = "none";
}

async function loadClientesForPOS() {
  clientesCachePOS = await fetchData("clientes");
  renderClientesForPOS(clientesCachePOS);
}

async function loadVendedoresForPOS() {
  vendedoresCachePOS = await fetchData("vendedores");
  renderVendedoresForPOS(vendedoresCachePOS);
}

function renderClientesForPOS(clientes) {
  const tbody = document.getElementById("clientes-tbody");
  tbody.innerHTML = "";
  if (clientes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-light);">No hay clientes registrados.</td></tr>';
    return;
  }
  clientes.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${c.id}</td>
                    <td>${c.nombre}</td>
                    <td style="text-align:center;">
                        <button class="btn" style="background:var(--primary); color:white; padding:4px 12px; border:none; border-radius:6px; cursor:pointer;" onclick="selectClientFromModal('${c.nombre.replace(/'/g, "\\'")}', ${c.id})">Seleccionar</button>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

function renderVendedoresForPOS(vendedores) {
  const tbody = document.getElementById("vendedores-tbody");
  tbody.innerHTML = "";
  if (vendedores.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-light);">No hay vendedores registrados.</td></tr>';
    return;
  }
  vendedores.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${v.id}</td>
                    <td>${v.nombre}</td>
                    <td style="text-align:center;">
                        <button class="btn" style="background:var(--primary); color:white; padding:4px 12px; border:none; border-radius:6px; cursor:pointer;" onclick="selectVendedorFromModal('${v.nombre.replace(/'/g, "\\'")}', ${v.id})">Seleccionar</button>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

function filterClientesPOS() {
  const filtro = document
    .getElementById("filtro-cliente-pos")
    .value.toLowerCase();
  const clientesFiltrados = clientesCachePOS.filter(
    (c) =>
      c.nombre.toLowerCase().includes(filtro) ||
      c.id.toString().includes(filtro),
  );
  renderClientesForPOS(clientesFiltrados);
}

function filterVendedoresPOS() {
  const filtro = document
    .getElementById("filtro-vendedor-pos")
    .value.toLowerCase();
  const vendedoresFiltrados = vendedoresCachePOS.filter(
    (v) =>
      v.nombre.toLowerCase().includes(filtro) ||
      v.id.toString().includes(filtro),
  );
  renderVendedoresForPOS(vendedoresFiltrados);
}

function selectClientFromModal(name, id) {
  localStorage.setItem("currentClienteName", name);
  localStorage.setItem("currentClienteId", id);
  document.getElementById("footer-cliente").textContent = name;
  closeClienteSelectionModal();
}

function selectVendedorFromModal(name, id) {
  localStorage.setItem("currentVendedorName", name);
  localStorage.setItem("currentVendedorId", id);
  document.getElementById("footer-vendedor").textContent = name;
  closeVendedorSelectionModal();
}

function openMovimientoVentasModal() {
  if (!token) {
    alert("Sesión no válida.");
    window.location.href = "login.html";
    return;
  }
  document.getElementById("movimientoVentasModal").style.display = "block";
  loadCategoriasAndInitBusqueda();
}

function closeMovimientoVentasModal() {
  document.getElementById("movimientoVentasModal").style.display = "none";
  document.getElementById("movimientoVentasForm").reset();
  clearMovimientoInputs();
}

function openBusquedaProductoModal() {
  document.getElementById("busquedaProductoModal").style.display = "block";
  filterProductsByClasificacion(true);
  document.getElementById("filtro_descripcion").value = "";
  document.getElementById("filtro_descripcion").focus();
}

function closeBusquedaProductoModal() {
  document.getElementById("busquedaProductoModal").style.display = "none";
}

async function loadCategoriasAndInitBusqueda() {
  await Promise.all([
    loadCategoriasPDV(),
    loadInventarioPDV(),
    loadProveedoresPDV(),
  ]);
  renderClasificaciones();
}

async function loadCategoriasPDV() {
  categoriasCache = await fetchData("categorias");
}

async function loadInventarioPDV() {
  productosInventarioCache = await fetchData("productos");
  if (
    document.getElementById("busquedaProductoModal").style.display === "block"
  ) {
    renderBusquedaProductos(productosInventarioCache);
  }
}

async function loadProveedoresPDV() {
  proveedoresCache = await fetchData("proveedores");
}

function renderClasificaciones() {
  const select = document.getElementById("clasificacion");
  select.innerHTML = '<option value="TODOS">TODOS</option>';
  categoriasCache.forEach((c) => {
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

function filterProductsByClasificacion(isInitialLoad = false) {
  const clasificacionId = document.getElementById("clasificacion").value;
  if (!isInitialLoad) clearMovimientoInputs();

  let productosFiltrados = productosInventarioCache;
  if (clasificacionId !== "TODOS") {
    productosFiltrados = productosInventarioCache.filter(
      (p) => p.categoria_id == clasificacionId,
    );
  }

  if (
    document.getElementById("busquedaProductoModal").style.display === "block"
  ) {
    renderBusquedaProductos(productosFiltrados);
  }
}

function filterBusquedaProductos() {
  const filtro = document
    .getElementById("filtro_descripcion")
    .value.toLowerCase();
  const clasificacionId = document.getElementById("clasificacion").value;

  let productosBase = productosInventarioCache;
  if (clasificacionId !== "TODOS") {
    productosBase = productosBase.filter(
      (p) => p.categoria_id == clasificacionId,
    );
  }

  const productosFiltrados = productosBase.filter(
    (p) =>
      p.descripcion.toLowerCase().includes(filtro) ||
      p.id.toString().includes(filtro),
  );

  renderBusquedaProductos(productosFiltrados);
}

function renderBusquedaProductos(productos) {
  const tbody = document.getElementById("busqueda-tbody");
  tbody.innerHTML = "";

  if (productos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-light);">No se encontraron productos.</td></tr>';
    return;
  }

  productos.forEach((p) => {
    const proveedor = proveedoresCache.find(
      (prov) => prov.id === p.proveedor_id,
    );
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.descripcion}</td>
                    <td style="text-align:center;">${p.stock}</td>
                    <td style="text-align:right;">C$${parseFloat(p.precio).toFixed(2)}</td>
                    <td>${proveedor ? proveedor.nombre : "N/A"}</td>
                    <td style="text-align:center;">
                        <button class="btn" style="background:var(--success); color:white; padding:4px 12px; border:none; border-radius:6px; cursor:pointer;" onclick="selectProductForSale(${p.id})">Seleccionar</button>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}
function selectProductForSale(productId) {
  const producto = productosInventarioCache.find((p) => p.id === productId);
  if (!producto) return;

  document.getElementById("selected_product_id").value = producto.id;
  document.getElementById("selected_product_clave").value = producto.id;
  document.getElementById("producto_nombre").value = producto.descripcion;
  document.getElementById("existencia_stock").value = parseFloat(
    producto.stock,
  ).toFixed(2);
  document.getElementById("precio_unitario").value =
    `C$${parseFloat(producto.precio).toFixed(2)}`;
  document.getElementById("cantidad_venta").value = "";
  document.getElementById("descuento_producto").value = "0.00";

  closeBusquedaProductoModal();
  //validateStock();
  calcularSubtotalConDescuento();
}
function validateStock() {
    const stock = parseFloat(document.getElementById('existencia_stock').value) || 0;
    const cantidadInput = document.getElementById('cantidad_venta');
    const cantidadStr = cantidadInput.value.trim();
    
    if (cantidadStr === '') {
        cantidadInput.style.borderColor = 'var(--border)';
        return;
    }
    
    let cantidad = parseFloat(cantidadStr);
    
    if (isNaN(cantidad) || cantidad <= 0) {
        cantidadInput.style.borderColor = '#ef4444';
        return;
    }
    
    cantidadInput.style.borderColor = 'var(--border)';
    
    if (stock > 0 && stock < cantidad) {
        cantidadInput.style.borderColor = '#eab308';
    }
    
    calcularSubtotalConDescuento();
}
function clearMovimientoInputs() {
  document.getElementById("selected_product_id").value = "";
  document.getElementById("selected_product_clave").value = "";
  document.getElementById("producto_nombre").value = "";
  document.getElementById("existencia_stock").value = "--";
  document.getElementById("precio_unitario").value = "C$0.00";
  document.getElementById("cantidad_venta").value = " ";
  document.getElementById("descuento_producto").value = "0.00";
  document.getElementById("subtotal-con-descuento").textContent = "C$0.00";
  document.getElementById("descuento_producto").style.borderColor = "#e2e8f0";
}
document.getElementById('movimientoVentasForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const productId = parseInt(document.getElementById('selected_product_id').value);
    const cantidadStr = document.getElementById('cantidad_venta').value.trim();
    const cantidadInput = document.getElementById('cantidad_venta');
    const stock = parseFloat(document.getElementById('existencia_stock').value) || 0;
    const precioStr = document.getElementById('precio_unitario').value.replace('C$', '').trim();
    const precio = parseFloat(precioStr) || 0;
    const descuento = parseFloat(document.getElementById('descuento_producto').value) || 0;

    if (!productId) {
        alert("❌ Debe seleccionar un producto primero.");
        return;
    }
    
    if (cantidadStr === '' || isNaN(parseFloat(cantidadStr)) || parseFloat(cantidadStr) <= 0) {
        cantidadInput.style.borderColor = '#ef4444';
        cantidadInput.focus();
        return; 
    }
    
    const cantidad = parseFloat(cantidadStr);

    const productoData = productosInventarioCache.find(p => p.id === productId);
    if (!productoData) return;

    const existingItem = ventaActual.find(item => item.id === productId);
    const currentlyInSale = existingItem ? existingItem.cantidad : 0;

    if ((currentlyInSale + cantidad) > stock) {
        cantidadInput.style.borderColor = '#ef4444';
        cantidadInput.focus();
        return; 
    }

    const subtotal = cantidad * precio;
    if (descuento > subtotal) {
        alert(`❌ El descuento (C$${descuento.toFixed(2)}) no puede ser mayor al subtotal (C$${subtotal.toFixed(2)})`);
        return;
    }

    addProductToSale(productoData, cantidad, precio, descuento);
    closeMovimientoVentasModal();
});
function addProductToSale(producto, cantidad, precio, descuento = 0) {
  cantidad = parseFloat(cantidad) || 0;
  precio = parseFloat(precio) || 0;
  descuento = parseFloat(descuento) || 0;

  if (cantidad <= 0) {
    alert("La cantidad debe ser mayor a 0.");
    return;
  }

  const subtotal = cantidad * precio;

  if (descuento > subtotal) {
    alert(
      `❌ El descuento (C$${descuento.toFixed(2)}) no puede ser mayor al subtotal (C$${subtotal.toFixed(2)})`,
    );
    return;
  }

  const importe = subtotal - descuento;

  const existingItem = ventaActual.find((item) => item.id === producto.id);

  if (existingItem) {
    alert(
      `⚠️ El producto "${producto.descripcion}" ya está en la venta. Se agregará como nuevo item.`,
    );
    ventaActual.push({
      id: producto.id,
      clave: producto.id,
      descripcion: producto.descripcion,
      cantidad: cantidad,
      precio: precio,
      descuento: descuento,
      importe: importe,
      subtotal: subtotal,
    });
  } else {
    ventaActual.push({
      id: producto.id,
      clave: producto.id,
      descripcion: producto.descripcion,
      cantidad: cantidad,
      precio: precio,
      descuento: descuento,
      importe: importe,
      subtotal: subtotal,
    });
  }

  renderVentaActual();
}
function removeItemFromSale() {
  if (ventaActual.length > 0) {
    ventaActual.pop();
    renderVentaActual();
  } else {
    alert("No hay elementos para eliminar.");
  }
}

function clearSale() {
  if (confirm("¿Está seguro de borrar toda la venta actual?")) {
    ventaActual = [];
    renderVentaActual();
  }
}

function renderVentaActual() {
  const tbody = document.getElementById("pos-tbody");
  tbody.innerHTML = "";
  let totalVenta = 0;

  if (ventaActual.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty"><i class="fas fa-search"></i> Presione 🔍 para añadir productos.</td></tr>';
    document.getElementById("total-amount").textContent = "C$0.00";
    return;
  }

  ventaActual.forEach((item) => {
    totalVenta += item.importe;
    const tr = document.createElement("tr");

    let descuentoTexto = "";
    if (item.descuento && item.descuento > 0) {
      descuentoTexto = ` (${item.cantidad} × C$${item.precio.toFixed(2)} - C$${item.descuento.toFixed(2)} = C$${item.importe.toFixed(2)})`;
    }

    tr.innerHTML = `
            <td>${item.cantidad}</td>
            <td>${item.clave}</td>
            <td>${item.descripcion} ${descuentoTexto}</td>
            <td style="text-align:right;">C$${item.precio.toFixed(2)}</td>
            <td style="text-align:right;">C$${item.importe.toFixed(2)}</td>
        `;
    tbody.appendChild(tr);
  });

  document.getElementById("total-amount").textContent =
    `C$${totalVenta.toFixed(2)}`;
}

function openCajaModal(total, clienteNombre, vendedorNombre) {
  document.getElementById("cajaModal").style.display = "block";
  document.getElementById("pago-efectivo").value = total.toFixed(2);
  document.getElementById("caja-total-a-pagar").textContent =
    `C$${total.toFixed(2)}`;
  document.getElementById("total-letras").textContent = numeroALetras(total);
  calcularCambio();

  window.currentClienteNombre = clienteNombre;
  window.currentVendedorNombre = vendedorNombre;
}

function closeCajaModal() {
  document.getElementById("cajaModal").style.display = "none";
  document.getElementById("cajaForm").reset();
}

function calcularCambio() {
  const totalVentaStr = document
    .getElementById("total-amount")
    .textContent.replace("C$", "");
  const totalVenta = parseFloat(totalVentaStr);

  const efectivo =
    parseFloat(document.getElementById("pago-efectivo").value) || 0;
  const tarjeta =
    parseFloat(document.getElementById("pago-tarjeta").value) || 0;
  const transferencia =
    parseFloat(document.getElementById("pago-transferencia").value) || 0;
  const credito =
    parseFloat(document.getElementById("pago-credito").value) || 0;

  const totalPagado = efectivo + tarjeta + transferencia + credito;
  const cambio = totalPagado - totalVenta;

  const cambioDisplay = document.getElementById("caja-monto-cambio");
  cambioDisplay.textContent = `C$${cambio.toFixed(2)}`;
  cambioDisplay.style.color = cambio >= 0 ? "var(--success)" : "var(--danger)";
}

function handleCobrar() {
  console.log("💰 handleCobrar() ejecutado");

  if (ventaActual.length === 0) {
    alert("No hay productos en la venta para cobrar.");
    return;
  }

  const clienteActualNombre =
    localStorage.getItem("currentClienteName") || "PUBLICO EN GENERAL";
  const vendedorActualNombre =
    localStorage.getItem("currentVendedorName") || "MOSTRADOR";

  const totalVentaStr = document
    .getElementById("total-amount")
    .textContent.replace("C$", "");
  const totalVenta = parseFloat(totalVentaStr);

  console.log("📊 Total a cobrar:", totalVenta);
  console.log("👤 Cliente:", clienteActualNombre);
  console.log("👤 Vendedor:", vendedorActualNombre);

  openCajaModal(totalVenta, clienteActualNombre, vendedorActualNombre);
}

async function finalizarVentaDesdeCaja() {
  const totalVentaStr = document
    .getElementById("total-amount")
    .textContent.replace("C$", "");
  const totalVenta = parseFloat(totalVentaStr);

  const efectivo =
    parseFloat(document.getElementById("pago-efectivo").value) || 0;
  const tarjeta =
    parseFloat(document.getElementById("pago-tarjeta").value) || 0;
  const transferencia =
    parseFloat(document.getElementById("pago-transferencia").value) || 0;
  const credito =
    parseFloat(document.getElementById("pago-credito").value) || 0;

  const totalPagado = efectivo + tarjeta + transferencia + credito;

  if (totalPagado < totalVenta) {
    alert(
      `¡ERROR! Falta pagar C$${(totalVenta - totalPagado).toFixed(2)}. Complete el pago.`,
    );
    return;
  }

  const pagos = [];
  if (efectivo > 0) pagos.push({ metodo: "Efectivo", monto: efectivo });
  if (tarjeta > 0) pagos.push({ metodo: "Tarjeta", monto: tarjeta });
  if (transferencia > 0)
    pagos.push({ metodo: "Transferencia", monto: transferencia });
  if (credito > 0) pagos.push({ metodo: "Credito", monto: credito });

  if (pagos.length === 0) {
    alert("Debe ingresar al menos un pago para finalizar la venta.");
    return;
  }

  const btnAceptar = document.querySelector("#cajaModal .btn-primary");
  btnAceptar.disabled = true;

  try {
    const ventaData = {
      cliente_id: parseInt(localStorage.getItem("currentClienteId")) || 1,
      vendedor_id: parseInt(localStorage.getItem("currentVendedorId")) || 1,
      es_factura: document.getElementById("check-factura").checked,
      detalles: ventaActual.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        descuento: item.descuento || 0,
        importe: item.importe,
      })),
      pagos: pagos,
      descuento_total: ventaActual.reduce(
        (summ, item) => summ + (item.descuento || 0),
        0,
      ),
    };

    const response = await fetch(`${API_URL}/admin/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ventaData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(
        `¡ÉXITO! Venta #${result.folio} registrada. Cambio: C$${result.cambio}`,
      );

      const clienteNombre =
        window.currentClienteNombre ||
        localStorage.getItem("currentClienteName") ||
        "PUBLICO EN GENERAL";
      const vendedorNombre =
        window.currentVendedorNombre ||
        localStorage.getItem("currentVendedorName") ||
        "MOSTRADOR";

      generateTicket(
        result.folio,
        ventaActual,
        totalVenta,
        clienteNombre,
        vendedorNombre,
        result.cambio,
        efectivo,
      );

      ventaActual = [];
      renderVentaActual();
      closeCajaModal();
      loadInventarioPDV();
    } else {
      alert(
        "Error al registrar la venta: " +
          (result.message || "Error desconocido."),
      );
    }
  } catch (error) {
    alert("Error de conexión o de red al procesar la venta.");
    console.error("Error:", error);
  } finally {
    btnAceptar.disabled = false;
  }
}

function generateTicket(
  folio,
  productos,
  total,
  clienteNombre,
  vendedorNombre,
  cambio,
  efectivo,
) {
  console.log("🔍 generateTicket llamado con:");
  console.log("  folio:", folio);
  console.log("  productos:", productos);
  console.log("  total:", total);
  console.log("  clienteNombre:", clienteNombre);
  console.log("  vendedorNombre:", vendedorNombre);
  console.log("  cambio:", cambio);
  console.log("  efectivo:", efectivo);

  const now = new Date();
  const fechaHora = now.toLocaleString("es-NI");
  const nombreEmpresa = localStorage.getItem("nombre_empresa") || "TU EMPRESA";

  if (!productos || productos.length === 0) {
    alert("⚠️ No hay productos para generar la factura.");
    return;
  }

  const ticketData = {
    folio: folio || 0,
    fechaHora: fechaHora,
    clienteNombre: clienteNombre || "PUBLICO EN GENERAL",
    vendedorNombre: vendedorNombre || "MOSTRADOR",
    productos: productos.map((p) => ({
      id: p.id || p.clave || "N/A",
      descripcion: p.descripcion || "Sin descripción",
      cantidad: p.cantidad || 1,
      precio: p.precio || 0,
      importe: (p.cantidad || 1) * (p.precio || 0),
    })),
    total: total || 0,
    cambio: cambio || 0,
    efectivo: efectivo || total || 0,
    nombreEmpresa: nombreEmpresa,
  };

  console.log("📄 Datos a guardar:", ticketData);

  localStorage.setItem("ticketData", JSON.stringify(ticketData));

  const saved = localStorage.getItem("ticketData");
  console.log("✅ Datos guardados en localStorage:", saved ? "SÍ" : "NO");

  window.open(
    "ticket.html",
    "_blank",
    "width=400,height=700,resizable,scrollbars",
  );
}

function numeroALetras(num) {
  if (num === 0) return "CERO";
  return num.toFixed(2).replace(".", " con ") + " córdobas";
}

function updateDateTime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  document.getElementById("current-date").textContent = dateStr;
  document.getElementById("current-time").textContent = timeStr;
}

function openWindow(url) {
  window.open(
    url,
    "_blank",
    "width=1000,height=700,scrollbars=yes,resizable=yes",
  );
}

async function handleCorteCaja() {
  if (!token) {
    alert("Sesión no válida.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/cortes/resumen`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success && data.datos) {
      console.log("✅ Datos recibidos:", data.datos);
      console.log("💰 Pagos:", data.datos.pagos);
      console.log("💰 EFECTIVO DEL DÍA:", data.datos.pagos?.efectivo || 0);
      mostrarCorteCajaModal(data.datos);
    } else {
      alert(
        "Error al cargar los datos del corte: " +
          (data.message || "Error desconocido"),
      );
    }
  } catch (error) {
    console.error("Error en handleCorteCaja:", error);
    alert("Error al cargar el corte: " + error.message);
  }
}

function mostrarCorteCajaModal(datos) {
  const inicio = new Date(datos.fecha_inicio_hoy);
  const fin = new Date(datos.fecha_fin_hoy);

  document.getElementById("corte-fecha-inicio").textContent =
    inicio.toLocaleString("es-NI");
  document.getElementById("corte-fecha-fin").textContent =
    fin.toLocaleString("es-NI");

  document.getElementById("corte-total-ventas").textContent =
    `C$${parseFloat(datos.total_ventas_hoy || 0).toFixed(2)}`;

  const pagos = datos.pagos || {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    credito: 0,
  };

  document.getElementById("corte-efectivo").textContent =
    `C$${parseFloat(pagos.efectivo || 0).toFixed(2)}`;
  document.getElementById("corte-tarjeta").textContent =
    `C$${parseFloat(pagos.tarjeta || 0).toFixed(2)}`;
  document.getElementById("corte-transferencia").textContent =
    `C$${parseFloat(pagos.transferencia || 0).toFixed(2)}`;
  document.getElementById("corte-credito").textContent =
    `C$${parseFloat(pagos.credito || 0).toFixed(2)}`;

  // Arqueo
  const fondoInicialSugerido = datos.fondo_inicial_sugerido || 0;
  document.getElementById("corte-fondo-inicial").value = fondoInicialSugerido;
  document.getElementById("corte-efectivo-sistema").value = parseFloat(
    pagos.efectivo || 0,
  ).toFixed(2);

  window.corteDatosActuales = {
    total_ventas_hoy: datos.total_ventas_hoy || 0,
    pagos_hoy: pagos,
  };

  calcularEfectivoEsperado();

  document.getElementById("corte-efectivo-real").value = "";
  document.getElementById("corte-diferencia-display").textContent = "C$0.00";
  document.getElementById("corte-diferencia-display").style.background =
    "#d1ecf1";
  document.getElementById("corte-diferencia-display").style.color = "#0c5460";

  document.getElementById("corteCajaModal").style.display = "block";
}

function calcularEfectivoEsperado() {
  const fondoInicial =
    parseFloat(document.getElementById("corte-fondo-inicial").value) || 0;
  const efectivoSistema =
    parseFloat(document.getElementById("corte-efectivo-sistema").value) || 0;
  const efectivoEsperado = fondoInicial + efectivoSistema;

  document.getElementById("corte-efectivo-esperado").textContent =
    `C$${efectivoEsperado.toFixed(2)}`;

  if (document.getElementById("corte-efectivo-real").value) {
    calcularDiferenciaCorte();
  }
}

function calcularDiferenciaCorte() {
  const fondoInicial =
    parseFloat(document.getElementById("corte-fondo-inicial").value) || 0;
  const efectivoSistema =
    parseFloat(document.getElementById("corte-efectivo-sistema").value) || 0;
  const efectivoEsperado = fondoInicial + efectivoSistema;
  const efectivoReal =
    parseFloat(document.getElementById("corte-efectivo-real").value) || 0;

  const diferencia = efectivoReal - efectivoEsperado;

  const display = document.getElementById("corte-diferencia-display");
  display.textContent = `C$${diferencia.toFixed(2)}`;

  if (diferencia > 0) {
    display.style.background = "#d4edda";
    display.style.color = "#155724";
    display.textContent += " (Sobrante)";
  } else if (diferencia < 0) {
    display.style.background = "#f8d7da";
    display.style.color = "#721c24";
    display.textContent += " (Faltante)";
  } else {
    display.style.background = "#d1ecf1";
    display.style.color = "#0c5460";
    display.textContent += " (✓ Cuadrado)";
  }
}

async function procesarCorteCaja() {
  const fondoInicial =
    parseFloat(document.getElementById("corte-fondo-inicial").value) || 0;
  const efectivoReal = parseFloat(
    document.getElementById("corte-efectivo-real").value,
  );

  if (isNaN(efectivoReal)) {
    alert("Debe ingresar el efectivo contado real");
    return;
  }

  const efectivoSistema =
    parseFloat(document.getElementById("corte-efectivo-sistema").value) || 0;
  const efectivoEsperado = fondoInicial + efectivoSistema;
  const diferencia = efectivoReal - efectivoEsperado;

  const pagos = window.corteDatosActuales?.pagos_hoy || {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    credito: 0,
  };

  if (
    !confirm(
      `¿Confirmar el corte de caja?\n\n` +
        `📊 Ventas del Día: C$${(window.corteDatosActuales?.total_ventas_hoy || 0).toFixed(2)}\n` +
        `💰 Efectivo en Sistema: C$${efectivoSistema.toFixed(2)}\n` +
        `💵 Fondo Inicial: C$${fondoInicial.toFixed(2)}\n` +
        `📈 Efectivo Esperado: C$${efectivoEsperado.toFixed(2)}\n` +
        `💲 Efectivo Real: C$${efectivoReal.toFixed(2)}\n` +
        `📉 Diferencia: C$${diferencia.toFixed(2)}`,
    )
  ) {
    return;
  }

  const corteData = {
    total_ventas: parseFloat(window.corteDatosActuales?.total_ventas_hoy || 0),
    total_costo: 0,
    ganancia: 0,
    pagos: pagos,
    fondo_inicial: fondoInicial,
    efectivo_sistema: efectivoSistema,
    efectivo_real: efectivoReal,
    efectivo_esperado: efectivoEsperado,
    diferencia: diferencia,
  };

  console.log("📦 Enviando al backend:", corteData);

  try {
    const response = await fetch(`${API_URL}/admin/cortes/realizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(corteData),
    });

    const result = await response.json();

    if (result.success) {
      alert(
        `✅ Corte de caja realizado exitosamente.\n\n` +
          `📊 Resumen:\n` +
          `- Ventas del Día: C$${corteData.total_ventas.toFixed(2)}\n` +
          `- Efectivo Sistema: C$${efectivoSistema.toFixed(2)}\n` +
          `- Fondo Inicial: C$${fondoInicial.toFixed(2)}\n` +
          `- Diferencia: C$${diferencia.toFixed(2)}`,
      );
      closeCorteCajaModal();
    } else {
      alert(
        "Error al realizar el corte: " +
          (result.message || "Error desconocido"),
      );
    }
  } catch (error) {
    console.error("Error en procesarCorteCaja:", error);
    alert("Error al procesar el corte de caja: " + error.message);
  }
}

function closeCorteCajaModal() {
  document.getElementById("corteCajaModal").style.display = "none";
}
function handleCancelarNV() {
  if (confirm("¿Cancelar venta actual?")) {
    ventaActual = [];
    renderVentaActual();
  }
}

(function () {
  function setupCobrarButton() {
    const btnCobrar = document.getElementById("btnCobrar");
    if (!btnCobrar) {
      console.error("❌ Botón Cobrar no encontrado");
      return;
    }

    // Crear un nuevo botón para evitar eventos duplicados
    const newBtn = document.createElement("button");
    newBtn.className = btnCobrar.className;
    newBtn.id = "btnCobrar";
    newBtn.type = "button";
    newBtn.innerHTML = btnCobrar.innerHTML;

    btnCobrar.parentNode.replaceChild(newBtn, btnCobrar);

    newBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🟢 Botón Cobrar click (nuevo)");
      handleCobrar();
    });

    newBtn.addEventListener("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🟢 Botón Cobrar touchstart");
      handleCobrar();
    });

    console.log("✅ Botón Cobrar configurado correctamente");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCobrarButton);
  } else {
    setupCobrarButton();
  }
})();

document.addEventListener("DOMContentLoaded", async () => {
  if (!token) {
    alert("Sesión no válida. Redirigiendo al login.");
    window.location.href = "login.html";
    return;
  }

  loadState();

  const nombreEmpresa = localStorage.getItem("nombre_empresa") || "TU EMPRESA";
  document.getElementById("empresa-nombre").textContent = nombreEmpresa;

  try {
    const folioRes = await fetch(`${API_URL}/admin/ventas/folio_actual`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const folioData = await folioRes.json();
    document.getElementById("folio-number").textContent = folioData.success
      ? folioData.folio
      : "1";
  } catch (e) {
    console.error("Error al cargar folio:", e);
    document.getElementById("folio-number").textContent = "1";
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);
  renderVentaActual();

  document
    .querySelector(".btn-search")
    .addEventListener("click", openMovimientoVentasModal);

  document
    .getElementById("barcode-input")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        openMovimientoVentasModal();
      }
    });

  await loadCategoriasAndInitBusqueda();
});

document.addEventListener("keydown", function (event) {
  const tagName = event.target.tagName.toLowerCase();
  const isInput = tagName === "input" || tagName === "textarea";

  if (event.code === "F2" && !isInput) {
    event.preventDefault();
    openWindow("vendedores.html");
  } else if (event.code === "F3" && !isInput) {
    event.preventDefault();
    openWindow("clientes.html");
  } else if (event.code === "F6" && !isInput) {
    event.preventDefault();
    handleCorteCaja();
  } else if (event.code === "F7" && !isInput && ventaActual.length > 0) {
    event.preventDefault();
    clearSale();
  } else if (event.code === "F8" && !isInput) {
    event.preventDefault();
    handleCobrar();
  } else if (event.code === "F9" && !isInput) {
    event.preventDefault();
    handleCancelarNV();
  } else if (event.key === "Delete" && !isInput) {
    event.preventDefault();
    removeItemFromSale();
  } else if (event.code === "Enter" && event.target.id === "barcode-input") {
    event.preventDefault();
    openMovimientoVentasModal();
  }
});
