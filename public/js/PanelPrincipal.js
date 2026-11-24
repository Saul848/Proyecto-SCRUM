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

const btnLogo = document.getElementById("btn-logo");

btnLogo.addEventListener("click", () => {
    // Animación: se reinicia aunque se haga clic rápido
    cambiarFuenteTitulo();
    btnLogo.classList.remove("animando");
    void btnLogo.offsetWidth;          // fuerza el reinicio de la animación
    btnLogo.classList.add("animando");

    // Confeti saliendo desde la posición del logo
    const rect = btnLogo.getBoundingClientRect();
    confetti({
        particleCount: 50,
        spread: 60,
        startVelocity: 30,
        origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight
        },
        colors: ["#29b6f6", "#0b5fc4", "#34c759", "#ff9a3c", "#f24f5c"]
    });
});

btnLogo.addEventListener("animationend", () => btnLogo.classList.remove("animando"));

const tituloApp = document.getElementById("titulo-app");

const fuentesTitulo = [
    "'Pacifico', cursive",
    "'Lobster', cursive",
    "'Press Start 2P', monospace",
    "'Bangers', cursive",
    "'Permanent Marker', cursive",
    "'Orbitron', sans-serif",
    "'Playfair Display', serif",
    "'Caveat', cursive",
    "'Righteous', sans-serif",
    "'Special Elite', monospace",
    "'Monoton', cursive"
];

let indiceFuente = -1;

function cambiarFuenteTitulo() {
    // Elige una fuente distinta a la actual
    let nuevo;
    do {
        nuevo = Math.floor(Math.random() * fuentesTitulo.length);
    } while (nuevo === indiceFuente);

    indiceFuente = nuevo;
    tituloApp.style.fontFamily = fuentesTitulo[indiceFuente];
}