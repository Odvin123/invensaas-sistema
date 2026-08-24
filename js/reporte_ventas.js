        (function () {
            console.log('🚀 ===== REPORTE DE VENTAS INICIADO =====');

            const token = localStorage.getItem('token');
            const API_URL = window.API_URL || 'https://invensaas-backend.onrender.com/api';
            let todasLasVentas = [];

            console.log('🔑 Token:', token ? '✅ Sí' : '❌ No');
            console.log('🌐 API_URL:', API_URL);

            if (!token) {
                document.getElementById('ventas-tbody').innerHTML =
                    '<tr><td colspan="10" class="empty">❌ Sesión no válida. <a href="login.html">Iniciar sesión</a></td></tr>';
                return;
            }

            const tbody = document.getElementById('ventas-tbody');
            const totalAcumuladoEl = document.getElementById('total-acumulado');


            function formatNumber(value) {
                const num = Number(value);
                return isNaN(num) ? '0.00' : num.toFixed(2);
            }

            function formatCurrency(value) {
                return `C$${formatNumber(value)}`;
            }

            function formatDate(dateStr) {
                if (!dateStr) return '—';
                try {
                    const date = new Date(dateStr);
                    return date.toLocaleString('es-NI', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch {
                    return dateStr;
                }
            }

            function getStatusBadge(esFactura) {
                return esFactura
                    ? '<span class="status-badge yes">Sí</span>'
                    : '<span class="status-badge no">No</span>';
            }

            // PRODUCTOS: Solo "cantidad × producto"
            function renderProductos(detalles) {
                if (!detalles || detalles.length === 0) return '—';
                return detalles.map(p => {
                    const cantidad = Number(p.cantidad) || 0;
                    const nombre = p.descripcion || 'Producto';
                    return `${cantidad} × ${nombre}`;
                }).join(', ');
            }


            function renderVentas(ventas) {
                if (!ventas || ventas.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" class="empty">📭 No hay ventas registradas.</td></tr>';
                    totalAcumuladoEl.textContent = 'C$0.00';
                    return;
                }

                let html = '';
                let totalAcumulado = 0;

                ventas.forEach(v => {
                    const total = Number(v.total) || 0;
                    totalAcumulado += total;

                    html += `
                        <tr>
                            <td style="text-align:center; font-weight:700;">${v.folio || '—'}</td>
                            <td>${formatDate(v.fecha_venta)}</td>
                            <td>${v.cliente_nombre || 'Público General'}</td>
                            <td>${v.vendedor_nombre || 'Mostrador'}</td>
                            <td>${renderProductos(v.detalles)}</td>
                            <td style="text-align:right;">${formatCurrency(v.subtotal)}</td>
                            <td style="text-align:right;">${formatCurrency(v.impuesto)}</td>
                            <td style="text-align:right;">${formatCurrency(v.descuento)}</td>
                            <td style="text-align:right; font-weight:700; color:var(--primary);">${formatCurrency(v.total)}</td>
                            <td style="text-align:center;">${getStatusBadge(v.es_factura)}</td>
                        </tr>
                    `;
                });

                tbody.innerHTML = html;
                totalAcumuladoEl.textContent = formatCurrency(totalAcumulado);

                console.log('✅ Tabla renderizada con', ventas.length, 'ventas');
            }


            async function loadVentas(filtros = {}) {
                console.log('🔄 Cargando ventas...');
                tbody.innerHTML = '<tr><td colspan="10" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

                try {
                    let url = `${API_URL}/admin/ventas/reportes`;
                    const params = new URLSearchParams();

                    if (filtros.inicio) params.append('inicio', filtros.inicio);
                    if (filtros.fin) params.append('fin', filtros.fin);

                    if (params.toString()) {
                        url += '?' + params.toString();
                    }

                    console.log('📡 URL:', url);

                    const response = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    console.log('📡 Status:', response.status);

                    if (response.status === 401) {
                        tbody.innerHTML = '<tr><td colspan="10" class="empty">❌ Sesión expirada. <a href="login.html">Iniciar sesión</a></td></tr>';
                        return;
                    }

                    const data = await response.json();
                    console.log('📦 Datos recibidos:', data);

                    if (!data.success || !data.ventas) {
                        tbody.innerHTML = '<tr><td colspan="10" class="empty">❌ Error al cargar ventas.</td></tr>';
                        return;
                    }

                    todasLasVentas = data.ventas;
                    console.log('📊 Ventas encontradas:', todasLasVentas.length);

                    renderVentas(todasLasVentas);

                } catch (error) {
                    console.error('❌ Error:', error);
                    tbody.innerHTML = `<tr><td colspan="10" class="empty">❌ Error de conexión: ${error.message}</td></tr>`;
                }
            }



            document.getElementById('btn-mostrar').addEventListener('click', () => {
                const inicio = document.getElementById('fecha-inicio').value;
                const fin = document.getElementById('fecha-fin').value;

                if (!inicio || !fin) {
                    alert('⚠️ Selecciona ambas fechas (inicial y final) para filtrar.');
                    return;
                }

                loadVentas({ inicio, fin });
            });

            document.getElementById('btn-refrescar').addEventListener('click', () => {
                document.getElementById('fecha-inicio').value = '';
                document.getElementById('fecha-fin').value = '';
                loadVentas({});
            });


            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => loadVentas({}));
            } else {
                loadVentas({});
            }

        })();
    