document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Buscando datos en localStorage...');

    const ticketDataRaw = localStorage.getItem('ticketData');
    console.log('🔍 ticketData raw:', ticketDataRaw);

    let ticketData = null;

    if (ticketDataRaw) {
        try {
            ticketData = JSON.parse(ticketDataRaw);
            console.log('✅ Datos cargados correctamente:', ticketData);
        } catch (e) {
            console.error('❌ Error al parsear:', e);
        }
    }

    if (!ticketData || !ticketData.productos || ticketData.productos.length === 0) {
        document.body.innerHTML = `
            <div style="text-align:center;padding:40px;font-family:Inter,sans-serif;max-width:400px;margin:0 auto;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ef4444;"></i>
                <h2 style="margin:16px 0;color:#0f172a;">Factura no disponible</h2>
                <p style="color:#64748b;">No hay datos de la venta.</p>
                <p style="color:#94a3b8;font-size:13px;">Asegúrate de haber registrado una venta desde el POS.</p>
                <button onclick="window.close()" style="margin-top:12px;padding:8px 16px;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
                <a href="inventario_dashboard.html" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#6366f1;color:white;border-radius:10px;text-decoration:none;font-weight:600;">
                    <i class="fas fa-arrow-left"></i> Volver
                </a>
            </div>
        `;
        return;
    }


    console.log('📄 Renderizando factura con datos:', ticketData);

    document.getElementById('ticket-company').textContent = ticketData.nombreEmpresa || 'TU EMPRESA';

    document.getElementById('ticket-folio').textContent = '#' + (ticketData.folio || '--');

    let fechaDisplay = '--';
    if (ticketData.fechaHora) {
        try {
            const fecha = new Date(ticketData.fechaHora);
            if (!isNaN(fecha.getTime())) {
                fechaDisplay = fecha.toLocaleString('es-NI', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                fechaDisplay = new Date().toLocaleString('es-NI', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (e) {
            fechaDisplay = new Date().toLocaleString('es-NI', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } else {
        fechaDisplay = new Date().toLocaleString('es-NI', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    document.getElementById('ticket-fecha').textContent = fechaDisplay;

    
    document.getElementById('ticket-cliente').textContent = ticketData.clienteNombre || 'PUBLICO EN GENERAL';

    
    document.getElementById('ticket-vendedor').textContent = ticketData.vendedorNombre || 'MOSTRADOR';

    document.getElementById('ticket-efectivo').textContent = 'C$' + (ticketData.efectivo || ticketData.total || 0).toFixed(2);

    
    const tbody = document.getElementById('ticket-items');
    tbody.innerHTML = '';

    if (ticketData.productos && ticketData.productos.length > 0) {
        let subtotal = 0;

        ticketData.productos.forEach((p) => {
            const cantidad = p.cantidad || 1;
            const precio = p.precio || 0;
            const importe = cantidad * precio;
            subtotal += importe;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cantidad}</td>
                <td>
                    <div class="product-name">${p.descripcion || 'Sin descripción'}</div>
                    <div class="product-detail">C$${precio.toFixed(2)} c/u</div>
                </td>
                <td style="text-align:right;">C$${importe.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('ticket-subtotal').textContent = 'C$' + subtotal.toFixed(2);
        document.getElementById('ticket-total').textContent = 'C$' + (ticketData.total || subtotal).toFixed(2);

    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;color:#94a3b8;padding:20px;">
                    <i class="fas fa-box-open"></i> Sin productos
                </td>
            </tr>
        `;
        document.getElementById('ticket-subtotal').textContent = 'C$0.00';
        document.getElementById('ticket-total').textContent = 'C$0.00';
    }

    // Cambio
    const cambio = (ticketData.efectivo || 0) - (ticketData.total || 0);
    document.getElementById('ticket-cambio').textContent = 'C$' + (cambio >= 0 ? cambio.toFixed(2) : '0.00');

    console.log('✅ Factura renderizada correctamente');
});


function downloadTicket() {
    // Obtener los datos
    const ticketData = JSON.parse(localStorage.getItem('ticketData'));
    if (!ticketData) {
        alert('No hay datos de la factura.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');


    const pageWidth = 210;
    const margin = 20;
    let y = 20;

    // --- TÍTULO ---
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#6366f1');
    doc.text('InvenSaaS', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#0f172a');
    doc.text('Sistema de Gestión de Inventario', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- INFORMACIÓN ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b');

    const infoData = [
        ['Folio:', '#' + (ticketData.folio || '--')],
        ['Fecha:', ticketData.fechaHora || new Date().toLocaleString('es-NI')],
        ['Cliente:', ticketData.clienteNombre || 'PUBLICO EN GENERAL'],
        ['Vendedor:', ticketData.vendedorNombre || 'MOSTRADOR'],
        ['Pago:', 'Efectivo']
    ];

    infoData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0f172a');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#1e293b');
        doc.text(value, margin + 50, y);
        y += 7;
    });

    y += 4;

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- TABLA DE PRODUCTOS ---
    // Encabezados
    const col1 = margin;
    const col2 = margin + 30;
    const col3 = margin + 90;
    const col4 = pageWidth - margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#64748b');
    doc.text('CANT.', col1, y);
    doc.text('DESCRIPCIÓN', col2, y);
    doc.text('TOTAL', col4, y, { align: 'right' });

    y += 2;
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Productos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#0f172a');
    let subtotal = 0;

    if (ticketData.productos && ticketData.productos.length > 0) {
        ticketData.productos.forEach((p) => {
            const cantidad = p.cantidad || 1;
            const precio = p.precio || 0;
            const importe = cantidad * precio;
            subtotal += importe;

            doc.text(cantidad.toString(), col1, y);
            doc.text(p.descripcion || 'Sin descripción', col2, y);
            doc.text('C$' + importe.toFixed(2), col4, y, { align: 'right' });
            y += 6;

            // Si la descripción es larga, ajustar
            if (p.descripcion && p.descripcion.length > 30) {
                y += 4;
            }

            // Si la página se llena, agregar nueva página
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });
    } else {
        doc.text('Sin productos', col2, y);
        y += 6;
    }

    y += 4;

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // --- TOTALES ---
    const total = ticketData.total || subtotal;
    const cambio = (ticketData.efectivo || 0) - total;

    const totals = [
        ['Subtotal', 'C$' + subtotal.toFixed(2)],
        ['IVA (0%)', 'C$0.00'],
        ['Descuento', 'C$0.00'],
        ['TOTAL', 'C$' + total.toFixed(2)]
    ];

    totals.forEach(([label, value]) => {
        doc.setFont('helvetica', label === 'TOTAL' ? 'bold' : 'normal');
        doc.setTextColor(label === 'TOTAL' ? '#6366f1' : '#0f172a');
        doc.text(label, pageWidth - 70, y);
        doc.text(value, pageWidth - margin, y, { align: 'right' });
        y += 6;
    });

    y += 4;

    // --- PAGOS ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0f172a');
    doc.text('Pagos', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b');
    doc.text('Efectivo recibido', margin, y);
    doc.text('C$' + (ticketData.efectivo || 0).toFixed(2), pageWidth - margin, y, { align: 'right' });
    y += 6;

    doc.setTextColor(cambio >= 0 ? '#22c55e' : '#ef4444');
    doc.setFont('helvetica', 'bold');
    doc.text('Cambio', margin, y);
    doc.text('C$' + (cambio >= 0 ? cambio.toFixed(2) : '0.00'), pageWidth - margin, y, { align: 'right' });
    y += 10;

    // --- FOOTER ---
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0f172a');
    doc.text('¡Gracias por su compra!', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#94a3b8');
    doc.text('Este documento es un comprobante de pago válido.', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setTextColor('#6366f1');
    doc.text('InvenSaaS - Facturación Electrónica', pageWidth / 2, y, { align: 'center' });

    // --- DESCARGAR PDF ---
    doc.save('factura_' + (ticketData.folio || '0') + '.pdf');
}