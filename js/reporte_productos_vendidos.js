(function () {
    console.log("🚀 INICIADO");

    const token = localStorage.getItem("token");
    const API_URL = window.API_URL || "https://invensaas-backend.onrender.com/api";
    
    let todosLosProductos = [];

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

    // ===== FUNCIONES =====
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

    // ===== FUNCIÓN PRINCIPAL: RENDERIZAR TABLA =====
    function renderizarTabla(productos, searchQuery = "") {
        console.log("📊 Renderizando. Productos:", productos ? productos.length : 0, "Búsqueda:", searchQuery);

        if (!productos || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty">📭 No hay productos</td></tr>';
            totalProductosEl.textContent = "0";
            totalVentasEl.textContent = "C$0.00";
            totalGananciaEl.textContent = "C$0.00";
            return;
        }

        // === FILTRAR POR BÚSQUEDA ===
        let datosFiltrados = productos;
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            datosFiltrados = productos.filter(p => {
                const desc = (p.descripcion || "").toLowerCase();
                const clave = (p.clave || "").toLowerCase();
                return desc.includes(query) || clave.includes(query);
            });
            console.log("🔍 Filtrados:", datosFiltrados.length, "de", productos.length);
        }

        if (datosFiltrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty">🔍 No se encontró "<strong>${searchQuery}</strong>"</td></tr>`;
            totalProductosEl.textContent = "0";
            totalVentasEl.textContent = "C$0.00";
            totalGananciaEl.textContent = "C$0.00";
            return;
        }

        let html = "";
        let totalVentas = 0;
        let totalGanancia = 0;
        let totalUnidades = 0;

        datosFiltrados.forEach((p) => {
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

    // ===== CARGAR PRODUCTOS =====
    async function cargarProductos(inicio = null, fin = null) {
        console.log("🔄 Cargando...");
        tbody.innerHTML = '<tr><td colspan="9" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

        try {
            let url = `${API_URL}/admin/ventas/productos-vendidos`;
            const params = new URLSearchParams();

            if (inicio && fin) {
                params.append("inicio", inicio);
                params.append("fin", fin);
            }

            if (params.toString()) {
                url += "?" + params.toString();
            }

            console.log("📡 URL:", url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td></tr>';
                return;
            }

            const data = await response.json();
            console.log("📦 Datos:", data);

            if (!data.success || !data.productos) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty">❌ Error al cargar</td></tr>';
                return;
            }

            todosLosProductos = data.productos;
            console.log("📊 Productos:", todosLosProductos.length);

            // Renderizar con la búsqueda actual
            const searchQuery = searchInput.value || "";
            renderizarTabla(todosLosProductos, searchQuery);

        } catch (error) {
            console.error("❌ Error:", error);
            tbody.innerHTML = `<tr><td colspan="9" class="empty">❌ Error: ${error.message}</td></tr>`;
        }
    }

    // ===== MANEJAR BÚSQUEDA =====
    function handleSearch() {
        const query = searchInput.value;
        console.log("✏️ BUSCANDO:", query || "(vacío)");
        
        // Mostrar/ocultar botón limpiar
        if (query && query.trim()) {
            clearSearchBtn.classList.add("visible");
        } else {
            clearSearchBtn.classList.remove("visible");
        }

        // Filtrar en tiempo real
        if (todosLosProductos.length > 0) {
            renderizarTabla(todosLosProductos, query);
        } else {
            console.log("⚠️ No hay productos para filtrar");
        }
    }

    // ===== EVENTOS =====
    // Evento de búsqueda en tiempo real
    searchInput.addEventListener("input", handleSearch);

    // Limpiar búsqueda
    clearSearchBtn.addEventListener("click", function () {
        searchInput.value = "";
        clearSearchBtn.classList.remove("visible");
        renderizarTabla(todosLosProductos, "");
        searchInput.focus();
    });

    // Botón Mostrar (con fecha)
    document.getElementById("btn-mostrar").addEventListener("click", async () => {
        const inicio = document.getElementById("fecha-inicio").value;
        const fin = document.getElementById("fecha-fin").value;

        if (!inicio || !fin) {
            alert("⚠️ Selecciona ambas fechas.");
            return;
        }

        await cargarProductos(inicio, fin);
    });

    // Botón Refrescar
    document.getElementById("btn-refrescar").addEventListener("click", async () => {
        document.getElementById("fecha-inicio").value = "";
        document.getElementById("fecha-fin").value = "";
        searchInput.value = "";
        clearSearchBtn.classList.remove("visible");
        await cargarProductos();
    });

    // Exportar CSV
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
    });

    // ===== INICIALIZAR =====
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => cargarProductos());
    } else {
        cargarProductos();
    }
})();