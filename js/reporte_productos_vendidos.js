(function () {
    console.log("🚀 ===== REPORTE DE PRODUCTOS VENDIDOS INICIADO =====");

    const token = localStorage.getItem("token");
    const API_URL = window.API_URL || "https://invensaas-backend.onrender.com/api";
    
    let todosLosProductos = [];
    let productosFiltradosPorFecha = [];
    let busquedaActual = "";
    let filtroFechaActivo = false; // 🆕 NUEVO: Controla si el filtro de fecha está aplicado

    console.log("🔑 Token:", token ? "✅ Sí" : "❌ No");
    console.log("🌐 API_URL:", API_URL);

    if (!token) {
        const tbody = document.getElementById("productos-tbody");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty">❌ Sesión no válida. <a href="login.html">Iniciar sesión</a></td></tr>';
        }
        return;
    }

    const tbody = document.getElementById("productos-tbody");
    const totalProductosEl = document.getElementById("total-productos");
    const totalVentasEl = document.getElementById("total-ventas");
    const totalGananciaEl = document.getElementById("total-ganancia");
    const searchInput = document.getElementById("search-producto");
    const clearSearchBtn = document.getElementById("clear-search");

    // ===== FUNCIONES DE UTILIDAD =====
    function formatNumber(value) {
        const num = Number(value);
        return isNaN(num) ? "0.00" : num.toFixed(2);
    }

    function formatCurrency(value) {
        return `C$${formatNumber(value)}`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("es-NI", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    }

    // ===== RESALTAR COINCIDENCIAS (Mejorado con estilos en línea por si falta el CSS) =====
    function highlightText(text, query) {
        if (!query || !text) return text || "";
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return String(text).replace(regex, '<span class="highlight" style="background-color: #ffeb3b; color: #000; font-weight: bold; border-radius: 2px; padding: 0 2px;">$1</span>');
    }

    // ===== RENDERIZAR TABLA =====
    function renderizarTabla(productos, searchQuery = "") {
        if (!tbody) return;
        
        console.log("📊 Renderizando tabla con", productos ? productos.length : 0, "productos");
        console.log("🔍 Búsqueda:", searchQuery);

        if (!productos || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty">📭 No hay productos vendidos en este período.</td></tr>';
            if (totalProductosEl) totalProductosEl.textContent = "0";
            if (totalVentasEl) totalVentasEl.textContent = "C$0.00";
            if (totalGananciaEl) totalGananciaEl.textContent = "C$0.00";
            return;
        }

        // APLICAR FILTRO DE BÚSQUEDA EN TIEMPO REAL
        let datosMostrar = productos;
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            datosMostrar = productos.filter(p => {
                const desc = (p.descripcion || "").toLowerCase();
                const clave = (p.clave || "").toLowerCase();
                // Puedes agregar más campos aquí si lo necesitas, ej: (p.fecha_venta || "").toLowerCase()
                return desc.includes(query) || clave.includes(query);
            });
            console.log("🔍 Productos filtrados por búsqueda:", datosMostrar.length);
        }

        if (datosMostrar.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty">🔍 No se encontraron productos que coincidan con "<strong>${searchQuery}</strong>".</td></tr>`;
            if (totalProductosEl) totalProductosEl.textContent = "0";
            if (totalVentasEl) totalVentasEl.textContent = "C$0.00";
            if (totalGananciaEl) totalGananciaEl.textContent = "C$0.00";
            return;
        }

        let html = "";
        let totalVentas = 0;
        let totalGanancia = 0;
        let totalUnidades = 0;

        datosMostrar.forEach((p) => {
            const cantidad = Number(p.cantidad) || 0;
            const venta = Number(p.venta) || 0;
            const costo = Number(p.costo) || 0;
            const ganancia = Number(p.ganancia) || 0;
            const descuento = Number(p.descuento) || 0;

            totalVentas += venta;
            totalGanancia += ganancia;
            totalUnidades += cantidad;

            const gananciaColor = ganancia >= 0 ? "var(--success, green)" : "var(--danger, red)";

            let descuentoTexto = "";
            if (descuento > 0) {
                descuentoTexto = ` <small style="color:var(--text-light, #666);">(Desc: C$${descuento.toFixed(2)})</small>`;
            }

            const descripcion = p.descripcion || "Producto";
            const descripcionResaltada = searchQuery && searchQuery.trim() ?
                highlightText(descripcion, searchQuery.trim()) : descripcion;

            html += `
                <tr>
                    <td>${formatDate(p.fecha_venta)}</td>
                    <td style="text-align:center; font-weight:600;">${p.clave || "—"}</td>
                    <td>${descripcionResaltada}${descuentoTexto}</td>
                    <td style="text-align:center; font-weight:600;">${formatNumber(cantidad)}</td>
                    <td style="text-align:right; font-weight:600; color:var(--primary, blue);">${formatCurrency(venta)}</td>
                    <td style="text-align:right;">${formatCurrency(p.precio_unitario)}</td>
                    <td style="text-align:right;">${formatCurrency(costo)}</td>
                    <td style="text-align:right;">${formatCurrency(costo)}</td>
                    <td style="text-align:right; font-weight:700; color:${gananciaColor};">${formatCurrency(ganancia)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        if (totalProductosEl) totalProductosEl.textContent = formatNumber(totalUnidades);
        if (totalVentasEl) totalVentasEl.textContent = formatCurrency(totalVentas);
        if (totalGananciaEl) {
            totalGananciaEl.textContent = formatCurrency(totalGanancia);
            totalGananciaEl.style.color = totalGanancia < 0 ? "var(--danger, red)" : "var(--success, green)";
        }

        console.log("✅ Tabla renderizada con", datosMostrar.length, "productos");
    }

    // ===== ACTUALIZAR BOTÓN LIMPIAR =====
    function actualizarBotonLimpiar(query) {
        if (!clearSearchBtn) return;
        if (query && query.trim()) {
            clearSearchBtn.classList.add("visible");
        } else {
            clearSearchBtn.classList.remove("visible");
        }
    }

    // ===== EXPORTAR CSV =====
    const btnExportar = document.getElementById("btn-exportar");
    if (btnExportar) {
        btnExportar.addEventListener("click", function () {
            const rows = tbody.querySelectorAll("tr");
            if (rows.length === 0 || rows[0].classList.contains("empty")) {
                alert("⚠️ No hay datos para exportar.");
                return;
            }

            const data = [];
            const headers = ["Fecha", "Clave", "Descripción", "Cantidad", "Venta", "Precio", "Costo", "Recuperación", "Ganancia"];
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
                    if (rowData.length === 9) data.push(rowData);
                }
            });

            let csvContent = "";
            data.forEach((row) => {
                const escapedRow = row.map((cell) => {
                    if (typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                });
                csvContent += escapedRow.join(",") + "\n";
            });

            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);

            const fechaStr = new Date().toISOString().slice(0, 10);
            link.setAttribute("download", `productos_vendidos_${fechaStr}.csv`);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log("✅ CSV exportado correctamente");
        });
    }

    // ===== FUNCIÓN PRINCIPAL PARA OBTENER DATOS =====
    async function obtenerProductos(filtros = {}) {
        console.log("🔄 Obteniendo productos...");
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

        try {
            let url = `${API_URL}/admin/ventas/productos-vendidos`;
            const params = new URLSearchParams();

            if (filtros.inicio) params.append("inicio", filtros.inicio);
            if (filtros.fin) params.append("fin", filtros.fin);

            if (params.toString()) url += "?" + params.toString();

            console.log("📡 URL:", url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td></tr>';
                return;
            }

            const data = await response.json();
            console.log("📦 Datos recibidos:", data);

            if (!data.success || !data.productos) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty">❌ Error al cargar productos vendidos.</td></tr>';
                return;
            }

            // 🆕 GUARDAR PRODUCTOS Y ACTUALIZAR ESTADO DEL FILTRO
            if (filtros.inicio && filtros.fin) {
                productosFiltradosPorFecha = data.productos || [];
                filtroFechaActivo = true; // Marcamos que el filtro de fecha está activo
                renderizarTabla(productosFiltradosPorFecha, searchInput ? searchInput.value : "");
            } else {
                todosLosProductos = data.productos || [];
                filtroFechaActivo = false; // Marcamos que NO hay filtro de fecha
                renderizarTabla(todosLosProductos, searchInput ? searchInput.value : "");
            }

        } catch (error) {
            console.error("❌ Error:", error);
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="empty">❌ Error de conexión: ${error.message}</td></tr>`;
        }
    }

    // ===== 🆕 EVENTO DE BÚSQUEDA EN TIEMPO REAL OPTIMIZADO =====
    let timeoutId = null;
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value;
            busquedaActual = query;
            actualizarBotonLimpiar(query);

            console.log("⌨️ Escribiendo:", query);

            // 🆕 Debounce reducido a 200ms para una sensación más "instantánea" letra por letra
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // 🆕 Lógica corregida: Siempre respeta el contexto activo (fecha o todos)
                if (filtroFechaActivo) {
                    renderizarTabla(productosFiltradosPorFecha, query);
                } else {
                    renderizarTabla(todosLosProductos, query);
                }
            }, 200);
        });
    }

    // ===== LIMPIAR BÚSQUEDA =====
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener("click", function () {
            searchInput.value = "";
            busquedaActual = "";
            actualizarBotonLimpiar("");
            
            if (filtroFechaActivo) {
                renderizarTabla(productosFiltradosPorFecha, "");
            } else {
                renderizarTabla(todosLosProductos, "");
            }
            searchInput.focus();
        });
    }

    // ===== BOTÓN MOSTRAR (CON FILTRO DE FECHA) =====
    const btnMostrar = document.getElementById("btn-mostrar");
    if (btnMostrar) {
        btnMostrar.addEventListener("click", async () => {
            const inicio = document.getElementById("fecha-inicio")?.value;
            const fin = document.getElementById("fecha-fin")?.value;

            if (!inicio || !fin) {
                alert("⚠️ Selecciona ambas fechas (inicial y final) para filtrar.");
                return;
            }
            await obtenerProductos({ inicio, fin });
        });
    }

    // ===== BOTÓN REFRESCAR =====
    const btnRefrescar = document.getElementById("btn-refrescar");
    if (btnRefrescar) {
        btnRefrescar.addEventListener("click", async () => {
            const fechaInicio = document.getElementById("fecha-inicio");
            const fechaFin = document.getElementById("fecha-fin");
            
            if (fechaInicio) fechaInicio.value = "";
            if (fechaFin) fechaFin.value = "";
            
            if (searchInput) searchInput.value = "";
            busquedaActual = "";
            actualizarBotonLimpiar("");
            
            productosFiltradosPorFecha = [];
            filtroFechaActivo = false; // 🆕 Resetear el estado del filtro
            
            await obtenerProductos({});
        });
    }

    // ===== INICIALIZAR =====
    async function init() {
        console.log("🚀 Inicializando...");
        await obtenerProductos({});
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();