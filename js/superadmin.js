const API_URL_EMPRESAS = API_URL + "/admin/empresas";
const API_URL_REGISTER = API_URL + "/register";
const API_URL_ADMIN_RESET = API_URL + "/admin/reset-pw";
const API_URL_CHECK_TENANT = API_URL + "/check-tenant/";
let token = localStorage.getItem("token");
let empresasCache = [];

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function logout() {
  if (confirm("¿Cerrar sesión?")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  }
}
async function loadEmpresas() {
  const tbody = document.getElementById("empresas-tbody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="loading"><i class="fas fa-spinner"></i> Cargando empresas...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/admin/empresas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      alert("Sesión expirada. Redirigiendo...");
      logout();
      return;
    }

    const data = await response.json();

    if (data.success) {
      empresasCache = data.empresas;
      renderEmpresas(data.empresas);
      updateStats(data.empresas);
    } else {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error al cargar empresas.</td></tr>';
    }
  } catch (error) {
    console.error("Error:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error de conexión.</td></tr>';
  }
}

function renderEmpresas(empresas) {
  const tbody = document.getElementById("empresas-tbody");
  tbody.innerHTML = "";

  if (empresas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; color:var(--text-light);">No hay empresas registradas.</td></tr>';
    return;
  }

  empresas.forEach((e) => {
    const isSuperAdmin = e.tenant_id === "super_admin";
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td><strong>${e.id}</strong></td>
                    <td><code style="background:var(--light); padding:2px 8px; border-radius:4px;">${e.tenant_id}</code></td>
                    <td>${e.nombre_empresa}</td>
                    <td>${e.admin_email || "N/A"}</td>
                    <td>
                        <span class="status-badge ${e.activo ? "active" : "inactive"}">
                            ${e.activo ? "Activo" : "Inactivo"}
                        </span>
                    </td>
                    <td style="font-size:13px; color:var(--text-light);">${new Date(e.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn-sm btn-reset" onclick="resetPassword('${e.tenant_id}', '${e.admin_email}')" ${isSuperAdmin ? 'disabled style="opacity:0.4;"' : ""}>
                                <i class="fas fa-key"></i> Reset
                            </button>
                            <button class="btn-sm btn-delete" onclick="deleteEmpresa('${e.tenant_id}', '${e.nombre_empresa}')" ${isSuperAdmin ? 'disabled style="opacity:0.4;"' : ""}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}

function updateStats(empresas) {
  const total = empresas.length;
  const activas = empresas.filter((e) => e.activo).length;
  const inactivas = total - activas;
  const admins = empresas.filter((e) => e.admin_email).length;

  document.getElementById("total-empresas").textContent = total;
  document.getElementById("total-admins").textContent = admins;
  document.getElementById("empresas-activas").textContent = activas;
  document.getElementById("empresas-inactivas").textContent = inactivas;
}

function filterEmpresas() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filtered = empresasCache.filter(
    (e) =>
      e.nombre_empresa.toLowerCase().includes(search) ||
      e.tenant_id.toLowerCase().includes(search) ||
      (e.admin_email && e.admin_email.toLowerCase().includes(search)),
  );
  renderEmpresas(filtered);
}

// ============================================
// GENERAR ENLACE DE INVITACIÓN
// ============================================

function generarEnlaceInvitacion() {
  // Obtener la URL base (local o producción)
  const baseUrl = window.location.origin;
  const enlace = `${baseUrl}/registro_empresa.html`;

  document.getElementById("inviteLink").value = enlace;

  // Mostrar mensaje
  alert(
    "✅ Enlace generado correctamente.\n\nCopialo y envíalo a la empresa que quieras invitar.",
  );
}

function copiarEnlace() {
  const input = document.getElementById("inviteLink");
  if (!input.value) {
    alert("⚠️ Primero genera el enlace.");
    return;
  }

  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard
    .writeText(input.value)
    .then(() => {
      alert("✅ Enlace copiado al portapapeles.");
    })
    .catch(() => {
      document.execCommand("copy");
      alert("✅ Enlace copiado al portapapeles.");
    });
}
function showCreateForm() {
  document.getElementById("createModal").style.display = "block";
  document.getElementById("createForm").reset();
}

function closeCreateModal() {
  document.getElementById("createModal").style.display = "none";
}

document
  .getElementById("createForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
      tenant_id: document.getElementById("tenant_id").value.trim(),
      nombre_empresa: document.getElementById("nombre_empresa").value.trim(),
      nombre_admin: document.getElementById("nombre_admin").value.trim(),
      correo_electronico: document.getElementById("correo_admin").value.trim(),
      password: document.getElementById("password_admin").value,
      forzar_cambio_pw: true,
    };

    // Validaciones básicas
    if (data.tenant_id.toLowerCase() === "super_admin") {
      alert('❌ El Tenant ID "super_admin" está reservado.');
      return;
    }

    if (data.password.length < 6) {
      alert("❌ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Empresa "${data.nombre_empresa}" creada exitosamente.`);
        closeCreateModal();
        loadEmpresas();
      } else {
        alert("❌ Error: " + (result.message || "Error desconocido."));
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  });

// ============================================
// RESET PASSWORD
// ============================================

async function resetPassword(tenantId, adminEmail) {
  if (!adminEmail || adminEmail === "N/A") {
    alert("❌ No se encontró el correo del administrador.");
    return;
  }

  const choice = prompt(
    `🔄 Restablecer contraseña para:\n\nEmpresa: ${tenantId}\nAdmin: ${adminEmail}\n\n1️⃣ Generar aleatoria\n2️⃣ Ingresar manual`,
  );

  if (!choice) return;

  let password;
  if (choice === "1") {
    password = "GENERAR_ALEATORIA";
  } else if (choice === "2") {
    password = prompt(
      "Ingresa la nueva contraseña temporal (mínimo 6 caracteres):",
    );
    if (!password || password.length < 6) {
      alert("❌ Contraseña inválida.");
      return;
    }
  } else {
    alert("❌ Opción inválida.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/reset-pw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        correo_electronico: adminEmail,
        new_password: password,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(
        `✅ Contraseña restablecida. Se ha enviado un correo al administrador.`,
      );
    } else {
      alert("❌ Error: " + (result.message || "Error desconocido."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

// ============================================
// DELETE EMPRESA
// ============================================

async function deleteEmpresa(tenantId, nombreEmpresa) {
  if (tenantId === "super_admin") {
    alert("❌ No se puede eliminar la empresa central.");
    return;
  }

  if (
    !confirm(
      `⚠️ ¿Estás seguro de ELIMINAR "${nombreEmpresa}" (${tenantId}) y TODOS sus datos?\n\nEsta acción es irreversible.`,
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/empresa/${tenantId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`✅ Empresa "${nombreEmpresa}" eliminada.`);
      loadEmpresas();
    } else {
      alert("❌ Error: " + (result.message || "Error desconocido."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    alert("Sesión no válida. Redirigiendo...");
    localStorage.clear();
    window.location.href = "login.html";
    return;
  }
  loadEmpresas();
  cargarInvitaciones();
});

// Cerrar modal al hacer click fuera
window.onclick = function (event) {
  if (event.target.id === "createModal") {
    closeCreateModal();
  }
};

async function generarInvitacion() {
  const dias = document.getElementById("dias-validez")?.value || 7;

  try {
    const response = await fetch(`${API_URL}/invitaciones/generar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dias_validez: parseInt(dias) }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      document.getElementById("inviteLink").value = result.enlace;
      alert(
        `✅ Enlace generado correctamente.\n\nExpira en ${dias} días.\n\nComparte este enlace con la empresa que quieras invitar.`,
      );
      cargarInvitaciones();
    } else {
      alert("❌ Error: " + (result.message || "Error desconocido."));
    }
  } catch (error) {
    alert("❌ Error de conexión.");
    console.error("Error:", error);
  }
}

async function cargarInvitaciones() {
  try {
    const response = await fetch(`${API_URL}/invitaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    const container = document.getElementById("invitaciones-lista");
    if (!container) return;

    if (data.success && data.invitaciones && data.invitaciones.length > 0) {
      let html = `<table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="padding:6px 8px; text-align:left;">Token</th>
                        <th style="padding:6px 8px; text-align:left;">Creado</th>
                        <th style="padding:6px 8px; text-align:left;">Expira</th>
                        <th style="padding:6px 8px; text-align:center;">Estado</th>
                    </tr>
                </thead>
                <tbody>`;

      data.invitaciones.slice(0, 10).forEach((inv) => {
        const expirado = new Date(inv.fecha_expiracion) < new Date();
        const estado = inv.usado
          ? "✅ Usado"
          : expirado
            ? "❌ Expirado"
            : "🟢 Activo";
        const color = inv.usado ? "#22c55e" : expirado ? "#ef4444" : "#3b82f6";
        html += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:6px 8px; font-family:monospace; font-size:10px; color:#6366f1;">${inv.token.substring(0, 12)}...</td>
                        <td style="padding:6px 8px; font-size:12px;">${new Date(inv.fecha_creacion).toLocaleDateString()}</td>
                        <td style="padding:6px 8px; font-size:12px;">${new Date(inv.fecha_expiracion).toLocaleDateString()}</td>
                        <td style="padding:6px 8px; text-align:center; color:${color}; font-weight:600; font-size:11px;">${estado}</td>
                    </tr>
                `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;
    } else {
      container.innerHTML =
        '<p style="color:#94a3b8; font-size:13px; padding:8px 0;">📭 No hay invitaciones generadas.</p>';
    }
  } catch (error) {
    console.error("Error al cargar invitaciones:", error);
  }
}
