document.addEventListener("DOMContentLoaded", () => {
    const botonesPanel = document.querySelectorAll("#panelLateral button");

    // Opcional: Dejar resaltado "Mis proyectos" por defecto al cargar la página
    const btnProyectos = document.getElementById("btn-proyectos");
    if (btnProyectos) {
        btnProyectos.classList.add("activo");
    }

    // Agregar el evento clic a cada botón del menú lateral
    botonesPanel.forEach(boton => {
        boton.addEventListener("click", () => {
            // 1. Quitar la clase 'activo' de todos los botones
            botonesPanel.forEach(btn => btn.classList.remove("activo"));
            
            // 2. Agregar la clase 'activo' únicamente al botón presionado
            boton.classList.add("activo");
        });
    });
});

// Carga Bienvenida
document.addEventListener("DOMContentLoaded", () => {
    const spanUsername = document.getElementById("span-username");
    
    // 1. Obtenemos el string de sessionStorage
    const usuarioGuardado = sessionStorage.getItem("usuarioActivo");
    
    if (usuarioGuardado) {
        // 2. Convertimos el string JSON a un objeto con JSON.parse()
        const usuario = JSON.parse(usuarioGuardado);

        
        
        // 3. Asignamos el nombre al span
        spanUsername.textContent = usuario.nombre;
    } else {
        // Opcional: Redirigir al login si no hay sesión activa
        window.location.replace('/html/login.html');
    }
});

// Cerrar Sesión
function cerrarSesion() {
    console.log("Cerrando sesión...");
    
    // 1. Elimina todos los datos guardados en el sessionStorage
    sessionStorage.clear();
    
    // 2. Redirige reemplazando la página actual en el historial del navegador
    window.location.replace('/html/login.html');
}