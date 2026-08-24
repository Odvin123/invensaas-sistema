(function() {
        console.log('🚀 EJECUCIÓN INMEDIATA - Historial de Facturas');
        
        const token = localStorage.getItem('token');
        const API_URL = window.API_URL || 'https://invensaas-backend.onrender.com/api';
        
        console.log('🔑 Token:', token ? '✅ Existe' : '❌ No existe');
        
        if (!token) {
            document.getElementById('historial-tbody').innerHTML = 
                '<tr><td colspan="7" class="empty">❌ Sesión no válida. <a href="login.html">Iniciar sesión</a></td></tr>';
            return;
        }

        // ============================================
        // VARIABLES GLOBALES
        // ============================================
        window.ventasCache = [];

        // ============================================
        // FUNCIÓN PARA RENDERIZAR
        // ============================================
        function renderizarFacturas(ventas) {
            const tbody = document.getElementById('historial-tbody');
            
            // Si no se pasan ventas, usar la caché
            if (!ventas) {
                ventas = window.ventasCache;
            }

            if (!ventas || ventas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty">📭 No hay facturas registradas.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            
            ventas.forEach(v => {
                const fecha = new Date(v.fecha_venta);
                const total = Number(v.total) || 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>#${v.folio}</strong></td>
                    <td>${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}</td>
                    <td>${v.cliente_nombre || 'Público General'}</td>
                    <td>${v.vendedor_nombre || 'Mostrador'}</td>
                    <td style="text-align:right; font-weight:600; color:#6366f1;">C$${total.toFixed(2)}</td>
                    <td><span class="status-badge completed">Completada</span></td>
                    <td style="text-align:center; white-space:nowrap;">
                        <button onclick="verDetalle(${v.id})" class="btn-sm btn-view" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="reimprimirPorId(${v.id})" class="btn-sm btn-print" title="Reimprimir">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Actualizar resumen
            document.getElementById('total-ventas-count').textContent = ventas.length;
            let totalMonto = 0;
            ventas.forEach(v => {
                totalMonto += Number(v.total) || 0;
            });
            document.getElementById('total-monto').textContent = `C$${totalMonto.toFixed(2)}`;
            
            console.log(`✅ ${ventas.length} facturas renderizadas`);
        }

        // ============================================
        // CARGAR FACTURAS
        // ============================================
        async function cargarFacturas() {
            const tbody = document.getElementById('historial-tbody');
            tbody.innerHTML = '<tr><td colspan="7" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando facturas...</td></tr>';

            try {
                const response = await fetch(`${API_URL}/admin/ventas/reportes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                console.log('📦 Datos:', data);

                if (data.success && data.ventas && data.ventas.length > 0) {
                    window.ventasCache = data.ventas;
                    renderizarFacturas(window.ventasCache);
                } else {
                    tbody.innerHTML = '<tr><td colspan="7" class="empty">📭 No hay facturas registradas.</td></tr>';
                }
            } catch (error) {
                console.error('❌ Error:', error);
                tbody.innerHTML = `<tr><td colspan="7" class="empty">❌ Error: ${error.message}</td></tr>`;
            }
        }

        // ============================================
        // FILTROS DINÁMICOS
        // ============================================
        window.aplicarFiltros = function() {
            const folio = document.getElementById('filtro-folio').value.trim();
            const cliente = document.getElementById('filtro-cliente').value.toLowerCase().trim();
            const inicio = document.getElementById('filtro-inicio').value;
            const fin = document.getElementById('filtro-fin').value;

            if (!window.ventasCache || window.ventasCache.length === 0) {
                return;
            }

            let filtrados = window.ventasCache;

            if (folio) {
                filtrados = filtrados.filter(v => v.folio.toString().includes(folio));
            }

            if (cliente) {
                filtrados = filtrados.filter(v => 
                    (v.cliente_nombre || '').toLowerCase().includes(cliente)
                );
            }

            if (inicio) {
                const inicioDate = new Date(inicio);
                inicioDate.setHours(0, 0, 0, 0);
                filtrados = filtrados.filter(v => new Date(v.fecha_venta) >= inicioDate);
            }

            if (fin) {
                const finDate = new Date(fin);
                finDate.setHours(23, 59, 59, 999);
                filtrados = filtrados.filter(v => new Date(v.fecha_venta) <= finDate);
            }

            renderizarFacturas(filtrados);
        };

        // ============================================
        // RECARGAR
        // ============================================
        window.recargar = function() {
            document.getElementById('filtro-folio').value = '';
            document.getElementById('filtro-cliente').value = '';
            document.getElementById('filtro-inicio').value = '';
            document.getElementById('filtro-fin').value = '';
            renderizarFacturas(window.ventasCache);
        };

        // ============================================
        // FUNCIONES DE DETALLE Y REIMPRESIÓN
        // ============================================
        window.verDetalle = async function(id) {
            try {
                const response = await fetch(`${API_URL}/admin/ventas/reportes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    const venta = data.ventas.find(v => v.id === id);
                    if (!venta) return alert('Venta no encontrada.');
                    
                    window.ventaSeleccionada = venta;
                    document.getElementById('detalle-folio').textContent = venta.folio;
                    document.getElementById('detalle-fecha').textContent = new Date(venta.fecha_venta).toLocaleString('es-ES');
                    document.getElementById('detalle-cliente').textContent = venta.cliente_nombre || 'Público General';
                    document.getElementById('detalle-vendedor').textContent = venta.vendedor_nombre || 'Mostrador';
                    document.getElementById('detalle-total').textContent = `C$${Number(venta.total).toFixed(2)}`;
                    
                    const tbody = document.getElementById('detalle-productos-tbody');
                    tbody.innerHTML = '';
                    if (venta.detalles && venta.detalles.length > 0) {
                        venta.detalles.forEach(d => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${d.descripcion || 'Producto'}</td>
                                <td style="text-align:center;">${d.cantidad || 0}</td>
                                <td style="text-align:right;">C$${Number(d.precio_unitario).toFixed(2)}</td>
                                <td style="text-align:right;">C$${Number(d.subtotal).toFixed(2)}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4" class="empty">Sin productos</td></tr>';
                    }
                    document.getElementById('detalleModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar el detalle.');
            }
        };

        window.closeDetalleModal = function() {
            document.getElementById('detalleModal').style.display = 'none';
            window.ventaSeleccionada = null;
        };

        window.reimprimirFactura = function() {
    if (!window.ventaSeleccionada) {
        alert('No hay factura seleccionada.');
        return;
    }
    
    const v = window.ventaSeleccionada;
    
    const productos = v.detalles || [];
    const total = Number(v.total) || 0;
    const clienteNombre = v.cliente_nombre || 'PUBLICO EN GENERAL';
    const vendedorNombre = v.vendedor_nombre || 'MOSTRADOR';
    const nombreEmpresa = localStorage.getItem('nombre_empresa') || 'TU EMPRESA';
    
    const efectivo = Number(v.efectivo) || total;
    
    const ticketData = {
        folio: v.folio || 0,
        fechaHora: v.fecha_venta ? new Date(v.fecha_venta).toLocaleString('es-NI') : new Date().toLocaleString('es-NI'),
        clienteNombre: clienteNombre,
        vendedorNombre: vendedorNombre,
        productos: productos.map(d => ({
            id: d.producto_id || d.id || 'N/A',
            descripcion: d.descripcion || 'Sin descripción',
            cantidad: Number(d.cantidad) || 1,
            precio: Number(d.precio_unitario) || 0,
            importe: Number(d.subtotal) || (Number(d.cantidad) * Number(d.precio_unitario)) || 0
        })),
        total: total,
        cambio: 0,
        efectivo: efectivo,
        nombreEmpresa: nombreEmpresa
    };
    
    console.log('📄 Datos para reimpresión:', ticketData);
    
    localStorage.setItem('ticketData', JSON.stringify(ticketData));
    
    window.open('ticket.html', '_blank', 'width=400,height=700,resizable,scrollbars');
    
    closeDetalleModal();
};
window.reimprimirPorId = function(id) {
    const venta = window.ventasCache.find(v => v.id === id);
    if (!venta) {
        alert('Venta no encontrada.');
        return;
    }
    
    window.ventaSeleccionada = venta;
    
    reimprimirFactura();
};

        // ============================================
        // CERRAR MODAL CON CLICK FUERA
        // ============================================
        window.onclick = function(event) {
            if (event.target.id === 'detalleModal') {
                closeDetalleModal();
            }
        };

     
        cargarFacturas();

    })();
