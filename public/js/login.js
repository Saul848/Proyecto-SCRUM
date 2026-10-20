document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('contenedor');
  const btnIrRegistro = document.getElementById('btn-ir-registro');
  const btnIrLogin = document.getElementById('btn-ir-login');

  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');

  // --- Transición Visual entre Login y Registro ---
  btnIrRegistro.addEventListener('click', () => {
    contenedor.classList.add('panel-activo');
  });

  btnIrLogin.addEventListener('click', () => {
    contenedor.classList.remove('panel-activo');
  });

  // --- Envío del Login ---
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const passwd = document.getElementById('login-passwd').value;

    try {
      const respuesta = await fetch('/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwd })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        alert(resultado.error || 'Credenciales incorrectas');
        return;
      }

      // Guardar usuario en sesión y redirigir
      sessionStorage.setItem('usuarioActivo', JSON.stringify(resultado.data));
      window.location.href = '/html/PanelPrincipal.html';
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  // --- Envío del Registro de Cuenta ---
  // --- Envío del Registro de Cuenta ---
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('reg-nombre').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const passwd = document.getElementById('reg-passwd').value;

    try {
      const respuesta = await fetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, username, email, passwd })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.error || 'Error al registrar usuario');
        return;
      }

      alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
      formRegistro.reset();

      // Regresa automáticamente la tarjeta al lado de login y coloca el correo
      contenedor.classList.remove('panel-activo');
      document.getElementById('login-email').value = email;
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('No se pudo conectar con el servidor para registrar la cuenta.');
    }
  });
});