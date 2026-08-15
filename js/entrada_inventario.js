// js/entrada_inventario.js
let token = localStorage.getItem('token');
let productosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        alert('⚠️ Sesión no válida. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }
    loadProductos();
});

async function loadProductos() {
    try {
        const response = await fetch(`${API_URL}/admin/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            productosCache = data.productos;
            console.log('✅ Productos cargados:', productosCache.length);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function addProductoRow() {
    openBusquedaModal();
}

function openBusquedaModal() {
    document.getElementById('busquedaModal').style.display = 'block';
    renderBusquedaProductos(productosCache);
    document.getElementById('filtro-producto').value = '';
    document.getElementById('filtro-producto').focus();
}

function closeBusquedaModal() {
    document.getElementById('busquedaModal').style.display = 'none';
}

function filterProductos() {
    const filtro = document.getElementById('filtro-producto').value.toLowerCase();
    const productosFiltrados = productosCache.filter(p =>
        p.descripcion.toLowerCase().includes(filtro) ||
        p.id.toString().includes(filtro)
    );
    renderBusquedaProductos(productosFiltrados);
}

function renderBusquedaProductos(productos) {
    const tbody = document.getElementById('busqueda-tbody');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron productos.</td></tr>';
        return;
    }

    productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.descripcion}</td>
            <td>${Number(p.stock).toFixed(2)}</td>
            <td>
                <button class="btn-select" onclick="selectProducto(${p.id}, '${p.descripcion.replace(/'/g, "\\'")}')">
                    Seleccionar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 🔥 SELECT PRODUCTO - INPUT TIPO TEXTO CON DECIMALES
function selectProducto(id, descripcion) {
    const tbody = document.getElementById('productos-tbody');
    const emptyRow = tbody.querySelector('tr td[colspan]');
    if (emptyRow) tbody.innerHTML = '';

    const tr = document.createElement('tr');
    tr.dataset.productoId = id;
    tr.innerHTML = `
        <td>
            <input type="hidden" name="producto_id" value="${id}">
            ${descripcion}
        </td>
        <td>
            <input type="text" name="cantidad" value="1.00" class="cantidad-input" 
                   inputmode="decimal"
                   placeholder="Ej: 22.5" 
                   style="width:100%; padding:8px; border:2px solid #e2e8f0; border-radius:6px; text-align:center; font-size:14px;"
                   onfocus="this.select()" 
                   oninput="validarCantidadInput(this)">
        </td>
        <td>
            <button type="button" class="btn-delete" onclick="removeRow(this)">🗑️</button>
        </td>
    `;
    tbody.appendChild(tr);
    closeBusquedaModal();
}

// 🔥 VALIDAR CANTIDAD (solo números y punto decimal)
function validarCantidadInput(input) {
    // Reemplazar comas por puntos
    let value = input.value.replace(/,/g, '.');
    
    // Solo permitir números y un punto
    value = value.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos
    const partes = value.split('.');
    if (partes.length > 2) {
        value = partes[0] + '.' + partes.slice(1).join('');
    }
    
    // Limitar a 2 decimales
    if (partes.length === 2 && partes[1].length > 2) {
        value = partes[0] + '.' + partes[1].substring(0, 2);
    }
    
    // Si el valor está vacío o es solo un punto, poner 1.00
    if (value === '' || value === '.') {
        value = '1.00';
    }
    
    input.value = value;
    
    // Validar que sea un número válido
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
        input.value = '1.00';
    }
    if (num === 0) {
        input.value = '1.00';
    }
}

function removeRow(button) {
    const row = button.closest('tr');
    row.remove();

    const tbody = document.getElementById('productos-tbody');
    if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Haz clic en "➕ Añadir Producto"</td></tr>';
    }
}

// ✅ ENVIAR ENTRADA
document.getElementById('btn-guardar').addEventListener('click', async () => {
    const tbody = document.getElementById('productos-tbody');
    const rows = tbody.querySelectorAll('tr:not(:has(td[colspan]))');

    if (rows.length === 0) {
        alert('⚠️ Debe añadir al menos un producto.');
        return;
    }

    const productos = [];
    for (const row of rows) {
        const id = row.querySelector('[name="producto_id"]').value;
        const cantidadInput = row.querySelector('[name="cantidad"]');
        const cantidad = parseFloat(cantidadInput.value) || 0;
        
        if (cantidad <= 0) {
            alert(`⚠️ La cantidad "${cantidadInput.value}" no es válida.`);
            cantidadInput.focus();
            return;
        }
        productos.push({ producto_id: parseInt(id), cantidad: cantidad });
    }

    const referencia = document.getElementById('referencia').value.trim();
    const motivo = document.getElementById('motivo').value.trim();

    const data = { productos, referencia, motivo };
    console.log('📦 Datos a enviar:', JSON.stringify(data));

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.textContent = '⏳ Registrando...';

    try {
        const response = await fetch(`${API_URL}/admin/inventario/entradas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`✅ Entrada registrada exitosamente con ${productos.length} producto(s).`);
            document.getElementById('referencia').value = '';
            document.getElementById('motivo').value = '';
            document.getElementById('productos-tbody').innerHTML = 
                '<tr><td colspan="3" style="text-align: center;">Haz clic en "➕ Añadir Producto"</td></tr>';
        } else {
            alert('❌ Error: ' + (result.message || 'Falló el registro.'));
        }
    } catch (error) {
        alert('❌ Error de conexión con el servidor.');
        console.error('Error:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Registrar Entrada';
    }
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target.id === 'busquedaModal') {
        closeBusquedaModal();
    }
};