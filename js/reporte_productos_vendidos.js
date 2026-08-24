(function () {
    console.log("🚀 ===== REPORTE DE PRODUCTOS VENDIDOS INICIADO =====");

    const token = localStorage.getItem("token");
    const API_URL = window.API_URL || "https://invensaas-backend.onrender.com/api";
    
    // ===== VARIABLES GLOBALES =====
    let todosLosProductos = []; // TODOS los productos (sin filtro de fecha)
    let productosFiltradosPorFecha = []; // Productos con filtro de fecha
    let productosActuales = []; // Productos que se están mostrando actualmente

    console.log("🔑 Token:", token ? "✅ Sí" : "❌ No");
    console.log("🌐 API_URL:", API_URL);

    if (!token) {
        document.getElementById("productos-tbody").innerHTML =
            '<tr><td colspan="9" class="empty">❌ Sesión no válida. <a href="login.html">Iniciar sesión</a></td></tr>';
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

    function highlightText(text, query) {
        if (!query || !text) return text || "";
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
    }

    // ===== RENDERIZAR TABLA CON FILTRO EN TIEMPO REAL =====
    function renderizarTabla(searchQuery = "") {
        console.log("📊 Renderizando. Búsqueda:", searchQuery || "(vacío)");
        console.log("📊 Productos disponibles:", productosActuales.length);

        // Si no hay productos, mostrar mensaje
        if (!productosActuales || productosActuales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty">📭 No hay productos vendidos disponibles.</td>
                </tr>`;
            totalProductosEl.textContent = "0";
            totalVentasEl.textContent = "C$0.00";
            totalGananciaEl.textContent = "C$0.00";
            return;
        }

        // ===== APLICAR FILTRO DE BÚSQUEDA EN TIEMPO REAL =====
        let datosMostrar = productosActuales;
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            datosMostrar = productosActuales.filter(p => {
                const desc = (p.descripcion || "").toLowerCase();
                const clave = (p.clave || "").toLowerCase();
                return desc.includes(query) || clave.includes(query);
            });
            console.log("🔍 Filtrados a", datosMostrar.length, "productos (de", productosActuales.length, ")");
        }

        // Si no hay coincidencias
        if (datosMostrar.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty">🔍 No se encontraron productos que coincidan con "<strong>${searchQuery}</strong>"</td>
                </tr>`;
            totalProductosEl.textContent = "0";
            totalVentasEl.textContent = "C$0.00";
            totalGananciaEl.textContent = "C$0.00";
            return;
        }

        // Generar HTML de la tabla
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

            const gananciaColor = ganancia >= 0 ? "var(--success)" : "var(--danger)";

            let descuentoTexto = "";
            if (descuento > 0) {
                descuentoTexto = ` <small style="color:var(--text-light);">(Desc: C$${descuento.toFixed(2)})</small>`;
            }

            const descripcion = p.descripcion || "Producto";
            const descripcionResaltada = searchQuery && searchQuery.trim() ?
                highlightText(descripcion, searchQuery.trim()) :
                descripcion;

            html += `
                <tr>
                    <td>${formatDate(p.fecha_venta)}</td>
                    <td style="text-align:center; font-weight:600;">${p.clave || "—"}</td>
                    <td>${descripcionResaltada} ${descuentoTexto}</td>
                    <td style="text-align:center; font-weight:600;">${formatNumber(cantidad)}</td>
                    <td style="text-align:right; font-weight:600; color:var(--primary);">${formatCurrency(venta)}</td>
                    <td style="text-align:right;">${formatCurrency(p.precio_unitario)}</td>
                    <td style="text-align:right;">${formatCurrency(costo)}</td>
                    <td style="text-align:right;">${formatCurrency(costo)}</td>
                    <td style="text-align:right; font-weight:700; color:${gananciaColor};">${formatCurrency(ganancia)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        totalProductosEl.textContent = formatNumber(totalUnidades);
        totalVentasEl.textContent = formatCurrency(totalVentas);
        totalGananciaEl.textContent = formatCurrency(totalGanancia);

        if (totalGanancia < 0) {
            totalGananciaEl.style.color = "var(--danger)";
        } else {
            totalGananciaEl.style.color = "var(--success)";
        }
    }

    // ===== ACTUALIZAR BOTÓN LIMPIAR =====
    function actualizarBotonLimpiar(query) {
        if (query && query.trim()) {
            clearSearchBtn.classList.add("visible");
        } else {
            clearSearchBtn.classList.remove("visible");
        }
    }

    // ===== CARGAR TODOS LOS PRODUCTOS (SIN FILTRO DE FECHA) =====
    async function cargarTodosLosProductos() {
        console.log("🔄 Cargando TODOS los productos (sin filtro de fecha)...");
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td>
            </tr>`;

        try {
            const url = `${API_URL}/admin/ventas/productos-vendidos`;
            console.log("📡 URL:", url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td>
                    </tr>`;
                return;
            }

            const data = await response.json();
            console.log("📦 Datos recibidos:", data);

            if (!data.success || !data.productos) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty">❌ Error al cargar productos vendidos.</td>
                    </tr>`;
                return;
            }

            // ===== GUARDAR PRODUCTOS =====
            todosLosProductos = data.productos;
            productosActuales = data.productos; // Los productos actuales son todos
            productosFiltradosPorFecha = []; // Limpiar filtro de fecha

            console.log("📊 Productos cargados:", todosLosProductos.length);

            // ===== APLICAR BÚSQUEDA ACTUAL =====
            const searchQuery = searchInput.value || "";
            renderizarTabla(searchQuery);

        } catch (error) {
            console.error("❌ Error:", error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty">❌ Error de conexión: ${error.message}</td>
                </tr>`;
        }
    }

    // ===== CARGAR PRODUCTOS CON FILTRO DE FECHA =====
    async function cargarProductosConFecha(inicio, fin) {
        console.log("🔄 Cargando productos con filtro de fecha:", inicio, "a", fin);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td>
            </tr>`;

        try {
            const url = `${API_URL}/admin/ventas/productos-vendidos?inicio=${inicio}&fin=${fin}`;
            console.log("📡 URL:", url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td>
                    </tr>`;
                return;
            }

            const data = await response.json();
            console.log("📦 Datos con filtro:", data);

            if (!data.success || !data.productos) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty">❌ Error al cargar productos vendidos.</td>
                    </tr>`;
                return;
            }

            // ===== GUARDAR PRODUCTOS FILTRADOS =====
            productosFiltradosPorFecha = data.productos;
            productosActuales = data.productos; // Los productos actuales son los filtrados

            console.log("📊 Productos con filtro:", productosActuales.length);

            // ===== APLICAR BÚSQUEDA ACTUAL =====
            const searchQuery = searchInput.value || "";
            renderizarTabla(searchQuery);

        } catch (error) {
            console.error("❌ Error:", error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty">❌ Error de conexión: ${error.message}</td>
                </tr>`;
        }
    }

    // ===== EXPORTAR CSV =====
    document.getElementById("btn-exportar").addEventListener("click", function () {
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
                if (rowData.length === 9) {
                    data.push(rowData);
                }
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

        const now = new Date();
        const fechaStr = now.toISOString().slice(0, 10);
        link.setAttribute("download", `productos_vendidos_${fechaStr}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("✅ CSV exportado correctamente");
    });

    // ===== EVENTO DE BÚSQUEDA EN TIEMPO REAL =====
    let timeoutId = null;
    searchInput.addEventListener("input", function () {
        const query = this.value;
        console.log("✏️ Input detectado:", query || "(vacío)");
        
        actualizarBotonLimpiar(query);

        // Debounce para mejor rendimiento
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            // ===== FILTRAR EN TIEMPO REAL =====
            renderizarTabla(query);
        }, 300);
    });

    // ===== LIMPIAR BÚSQUEDA =====
    clearSearchBtn.addEventListener("click", function () {
        console.log("🧹 Limpiando búsqueda");
        searchInput.value = "";
        actualizarBotonLimpiar("");
        renderizarTabla("");
        searchInput.focus();
    });

    // ===== BOTÓN MOSTRAR (CON FILTRO DE FECHA) =====
    document.getElementById("btn-mostrar").addEventListener("click", async () => {
        const inicio = document.getElementById("fecha-inicio").value;
        const fin = document.getElementById("fecha-fin").value;

        if (!inicio || !fin) {
            alert("⚠️ Selecciona ambas fechas (inicial y final) para filtrar.");
            return;
        }

        console.log("📅 Aplicando filtro de fecha:", inicio, "a", fin);
        
        // Cargar productos con el filtro de fecha
        await cargarProductosConFecha(inicio, fin);
    });

    // ===== BOTÓN REFRESCAR =====
    document.getElementById("btn-refrescar").addEventListener("click", async () => {
        console.log("🔄 Refrescando...");
        
        // Limpiar fechas
        document.getElementById("fecha-inicio").value = "";
        document.getElementById("fecha-fin").value = "";
        
        // Limpiar búsqueda
        searchInput.value = "";
        actualizarBotonLimpiar("");
        
        // Cargar todos los productos (sin filtro de fecha)
        await cargarTodosLosProductos();
    });

    // ===== INICIALIZAR =====
    async function init() {
        console.log("🚀 Inicializando...");
        // Cargar todos los productos al inicio (sin filtro de fecha)
        await cargarTodosLosProductos();
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();