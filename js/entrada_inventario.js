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

// Cargar productos (para el modal)
async function loadProductos() {
    try {
        const response = await fetch(`${API_URL}/admin/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            productosCache = data.productos;
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Abrir modal de búsqueda
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

// ✅ SELECCIONAR PRODUCTO → AÑADE FILA CON DECIMALES
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
            🔥 INPUT CON DECIMALES
            <input type="number" name="cantidad" value="1" min="0.01" step="any" class="cantidad-input" 
                   oninput="validateCantidad(this)">
        </td>
        <td>
            <button type="button" class="btn-delete" onclick="removeRow(this)">🗑️</button>
        </td>
    `;
    tbody.appendChild(tr);
    closeBusquedaModal();
}

// ✅ VALIDAR CANTIDAD CON DECIMALES
function validateCantidad(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || val < 0.01) {
        input.value = 1;
    }
    // Limitar a 2 decimales
    if (input.value.includes('.')) {
        const partes = input.value.split('.');
        if (partes[1] && partes[1].length > 2) {
            input.value = parseFloat(input.value).toFixed(2);
        }
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
        const cantidad = parseFloat(row.querySelector('[name="cantidad"]').value);
        if (isNaN(cantidad) || cantidad <= 0) {
            alert('⚠️ La cantidad debe ser mayor a 0.');
            return;
        }
        productos.push({ producto_id: parseInt(id), cantidad: cantidad });
    }

    const referencia = document.getElementById('referencia').value.trim();
    const motivo = document.getElementById('motivo').value.trim();

    const data = { productos, referencia, motivo };
    console.log('📦 Datos a enviar:', data);

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
            // Limpiar formulario
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