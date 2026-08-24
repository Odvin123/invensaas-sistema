        const API_URL_LOGIN = API_URL + '/login';
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const messageEl = document.getElementById('message');
        const lockoutMessage = document.getElementById('lockoutMessage');
        const countdownSpan = document.getElementById('countdown');
        const passwordInput = document.getElementById('password');
        const togglePasswordButton = document.getElementById('togglePassword');

        let failCount = 0;
        const MAX_ATTEMPTS = 3;
        const LOCKOUT_DURATION_MS = 10000;
        let isLocked = false;
        let lockoutTimer = null;

       
        togglePasswordButton.addEventListener('click', function () {
            const icon = this.querySelector('i');
            const isPassword = passwordInput.getAttribute('type') === 'password';

            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
            this.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });

       
        function setLockout(duration) {
            isLocked = true;
            failCount = 0;

            document.getElementById('tenantId').disabled = true;
            document.getElementById('email').disabled = true;
            passwordInput.disabled = true;
            loginButton.disabled = true;
            togglePasswordButton.disabled = true;

            lockoutMessage.style.display = 'block';
            let countdown = duration / 1000;
            countdownSpan.textContent = countdown;

            if (lockoutTimer) clearInterval(lockoutTimer);
            lockoutTimer = setInterval(() => {
                countdown--;
                countdownSpan.textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(lockoutTimer);
                    unlockForm();
                }
            }, 1000);
        }

        function unlockForm() {
            isLocked = false;
            document.getElementById('tenantId').disabled = false;
            document.getElementById('email').disabled = false;
            passwordInput.disabled = false;
            loginButton.disabled = false;
            togglePasswordButton.disabled = false;
            lockoutMessage.style.display = 'none';
        }

        
        function showMessage(text, type = 'error') {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
        }

        function hideMessage() {
            messageEl.style.display = 'none';
        }

       
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage();

            if (isLocked) {
                showMessage('El formulario está bloqueado. Espera unos segundos.', 'error');
                return;
            }

            const tenant_id = document.getElementById('tenantId').value.trim();
            const correo_electronico = document.getElementById('email').value.trim();
            const password = passwordInput.value;

            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

            try {
                const response = await fetch(API_URL_LOGIN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenant_id, correo_electronico, password })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    failCount = 0;

                    sessionStorage.setItem('authToken', result.token);
                    sessionStorage.setItem('userRol', result.rol);
                    sessionStorage.setItem('tenantId', result.tenant_id);

                    localStorage.setItem('token', result.token);
                    localStorage.setItem('rol', result.rol);
                    localStorage.setItem('tenant_id', result.tenant_id);

                    if (result.necesitaCambioPw) {
                        showMessage('🔐 Por seguridad, debes cambiar tu contraseña.', 'success');
                        setTimeout(() => {
                            window.location.href = `cambio_pw.html?tenant=${result.tenant_id}&email=${correo_electronico}`;
                        }, 1500);
                    } else {
                        if (result.rol === 'super_admin') {
                            window.location.href = 'superadmin_dashboard.html';
                        } else {
                            window.location.href = 'inventario_dashboard.html';
                        }
                    }
                } else {
                    failCount++;
                    showMessage(result.message || 'Credenciales inválidas.', 'error');

                    const remaining = MAX_ATTEMPTS - failCount;
                    if (remaining > 0 && failCount >= MAX_ATTEMPTS) {
                        showMessage(`🔒 Demasiados intentos. Bloqueo temporal de 10 segundos.`, 'error');
                        setLockout(LOCKOUT_DURATION_MS);
                    }
                }
            } catch (error) {
                showMessage('Error de conexión con el servidor.', 'error');
            } finally {
                loginButton.disabled = isLocked;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            }
        });

      
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const tenant = urlParams.get('tenant');
            if (tenant) {
                document.getElementById('tenantId').value = tenant;
            }
        });
  