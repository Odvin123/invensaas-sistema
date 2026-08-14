// js/reporte_inventario.js
// ============================================
// CONFIGURACIÓN
// ============================================
const token = localStorage.getItem('token');
const API_URL = window.API_URL || 'https://invensaas-backend.onrender.com/api';
let movimientosCache = [];

// ============================================
// ELEMENTOS DOM
// ============================================
const tbody = document.getElementById('movimientos-tbody');
const totalEntradasEl = document.getElementById('total-entradas');
const totalSalidasEl = document.getElementById('total-salidas');
const balanceNetoEl = document.getElementById('balance-neto');

// ============================================
// FUNCIONES DE FORMATO
// ============================================
function formatNumber(value) {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return dateStr;
    }
}

// ============================================
// CARGAR MOVIMIENTOS
// ============================================
async function loadMovimientos() {
    tbody.innerHTML = '<tr><td colspan="8" class="empty"><i class="fas fa-spinner fa-spin"></i> Cargando movimientos...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/admin/inventario/movimientos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Sesión expirada. Redirigiendo...');
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        if (data.success) {
            movimientosCache = data.movimientos || [];
            console.log('📦 Movimientos cargados:', movimientosCache.length);
            renderMovimientos(movimientosCache);
            updateSummary(movimientosCache);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">❌ Error al cargar movimientos.</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="empty">❌ Error de conexión.</td></tr>';
    }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderMovimientos(movimientos) {
    tbody.innerHTML = '';

    if (!movimientos || movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">📭 No hay movimientos registrados.</td></tr>';
        return;
    }

    movimientos.forEach(m => {
        const tr = document.createElement('tr');
        const tipo = m.tipo || 'DESCONOCIDO';
        const cantidad = parseFloat(m.cantidad) || 0;
        const stockAntes = parseFloat(m.stock_antes) || 0;
        const stockDespues = parseFloat(m.stock_despues) || 0;

        let tipoColor = '';
        let tipoIcon = '';
        if (tipo === 'ENTRADA') {
            tipoColor = '#22c55e';
            tipoIcon = '📥';
        } else if (tipo === 'SALIDA') {
            tipoColor = '#ef4444';
            tipoIcon = '📤';
        } else {
            tipoColor = '#f59e0b';
            tipoIcon = '⚡';
        }

        tr.innerHTML = `
            <td>${formatDate(m.fecha)}</td>
            <td><strong>${m.producto_nombre || 'Desconocido'}</strong></td>
            <td style="color:${tipoColor}; font-weight:600;">${tipoIcon} ${tipo}</td>
            <td style="text-align:center; font-weight:600;">${formatNumber(cantidad)}</td>
            <td style="text-align:center;">${formatNumber(stockAntes)}</td>
            <td style="text-align:center;">${formatNumber(stockDespues)}</td>
            <td>${m.usuario_nombre || 'Sistema'}</td>
            <td>${m.referencia || '—'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================
// ACTUALIZAR RESUMEN CON DIAGNÓSTICO
// ============================================
function updateSummary(movimientos) {
    console.log('📊 ===== INICIO DEL RESUMEN =====');
    console.log('📦 Total de movimientos:', movimientos.length);
    
    // 🔥 Mostrar los primeros 3 movimientos para diagnosticar
    if (movimientos.length > 0) {
        console.log('📋 Primer movimiento:', movimientos[0]);
        console.log('   - cantidad:', movimientos[0].cantidad);
        console.log('   - tipo:', movimientos[0].tipo);
        console.log('   - tipo de cantidad:', typeof movimientos[0].cantidad);
    }

    let totalEntradas = 0;
    let totalSalidas = 0;

    movimientos.forEach((m, index) => {
        // 🔥 CONVERTIR A NÚMERO DE FORMA SEGURA
        let cantidad = 0;
        const raw = m.cantidad;
        
        if (raw !== undefined && raw !== null) {
            // Si es string, limpiar y convertir
            if (typeof raw === 'string') {
                const limpia = raw.replace(/,/g, '.').trim();
                cantidad = parseFloat(limpia);
            } else {
                cantidad = Number(raw);
            }
        }
        
        // Si no es número válido, usar 0
        if (isNaN(cantidad)) cantidad = 0;

        const tipo = m.tipo || '';

        // 🔥 LOG POR MOVIMIENTO (solo los primeros 5 para no llenar la consola)
        if (index < 5) {
            console.log(`   ${index + 1}. ${tipo}: ${cantidad} (original: "${raw}")`);
        }

        if (tipo === 'ENTRADA') {
            totalEntradas += cantidad;
        } else if (tipo === 'SALIDA') {
            totalSalidas += cantidad;
        }
    });

    const balance = totalEntradas - totalSalidas;

    console.log('📊 TOTALES CALCULADOS:');
    console.log(`   ✅ Entradas: ${totalEntradas}`);
    console.log(`   ❌ Salidas: ${totalSalidas}`);
    console.log(`   ⚖️ Balance: ${balance}`);
    console.log('📊 ===== FIN DEL RESUMEN =====');

    // Mostrar en pantalla
    totalEntradasEl.textContent = totalEntradas.toFixed(2);
    totalSalidasEl.textContent = totalSalidas.toFixed(2);
    balanceNetoEl.textContent = balance.toFixed(2);

    // 🔥 Color del balance
    if (balance > 0) {
        balanceNetoEl.style.color = '#22c55e';
    } else if (balance < 0) {
        balanceNetoEl.style.color = '#ef4444';
    } else {
        balanceNetoEl.style.color = '#64748b';
    }
}

// ============================================
// FILTRAR
// ============================================
function aplicarFiltros() {
    const tipo = document.getElementById('tipo-movimiento').value;
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;

    let filtrados = movimientosCache;

    if (tipo !== 'TODOS') {
        filtrados = filtrados.filter(m => m.tipo === tipo);
    }

    if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        filtrados = filtrados.filter(m => new Date(m.fecha) >= inicio);
    }

    if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59);
        filtrados = filtrados.filter(m => new Date(m.fecha) <= fin);
    }

    renderMovimientos(filtrados);
    updateSummary(filtrados);
}

// ============================================
// EXPORTAR CSV
// ============================================
function exportCSV() {
    if (movimientosCache.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    let csv = 'Fecha,Hora,Producto,Tipo,Cantidad,Stock Antes,Stock Después,Usuario,Referencia\n';
    
    movimientosCache.forEach(m => {
        const fecha = new Date(m.fecha);
        csv += `"${fecha.toLocaleDateString('es-ES')}","${fecha.toLocaleTimeString('es-ES')}","${m.producto_nombre || ''}","${m.tipo || ''}","${parseFloat(m.cantidad) || 0}","${parseFloat(m.stock_antes) || 0}","${parseFloat(m.stock_despues) || 0}","${m.usuario_nombre || ''}","${m.referencia || ''}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos_inventario_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// EVENTOS
// ============================================
document.getElementById('btn-ejecutar').addEventListener('click', aplicarFiltros);
document.getElementById('btn-recargar').addEventListener('click', () => {
    document.getElementById('tipo-movimiento').value = 'TODOS';
    document.getElementById('fecha-inicio').value = '';
    document.getElementById('fecha-fin').value = '';
    loadMovimientos();
});
document.getElementById('btn-exportar').addEventListener('click', exportCSV);

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        alert('Sesión no válida. Redirigiendo...');
        window.location.href = 'login.html';
        return;
    }
    loadMovimientos();
});