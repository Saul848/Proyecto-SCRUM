document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('correo').value.trim();
    const passwd = document.getElementById('passwd').value;

    try {
      const respuesta = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: correo, passwd })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        alert(resultado.error || 'Credenciales incorrectas');
        return;
      }

      // Guardar información del usuario autenticado en sesión local
      sessionStorage.setItem('usuarioActivo', JSON.stringify(resultado.data));

      // Redirigir al panel principal de proyectos
      window.location.href = '/html/proyectos.html'; // Ajusta al HTML principal de tu equipo
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  // Notificación temporal si presionan el botón del compañero
  document.getElementById('btn-registrarse').addEventListener('click', () => {
    alert('El módulo de registro de usuario está en desarrollo.');
  });
});