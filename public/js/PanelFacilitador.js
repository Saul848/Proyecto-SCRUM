


function mostrarModal(idModal, idCabecera) {

     // Actualizar la cabecera correspondiente
    mostrarCabecera(idCabecera);

    // Ocultar las secciones
    document.querySelectorAll(".modal-class").forEach(modal => {
        modal.style.display = "none";
    });

    // Mostrar la sección seleccionada
    const modalSeleccionado = document.getElementById(idModal);

    if (modalSeleccionado) {
        modalSeleccionado.style.display = "block";
    }

   

    const tituloCentral = document.getElementById("tituloSeccionCentral");

    // Botón de la cabecera superior
    const btnIniciar = document.getElementById(
        "btnIniciarConversacionCabecera"
    );

    if (idModal === "modal-mensajes") {

        if (tituloCentral) {
            tituloCentral.textContent = "Mensajes";
            tituloCentral.style.display = "block";
        }

        // El botón de iniciar conversación del chat ya funciona por separado.
        //Mantenemos oculto el duplicado de la cabecera.
        if (btnIniciar) {
            btnIniciar.style.display = "none";
        }

    } else {

        if (tituloCentral) {
            tituloCentral.style.display = "none";
        }

        if (btnIniciar) {
            btnIniciar.style.display = "none";
        }
    }

    // Actualizar la opción activa del menú lateral
    const botonesMenu = document.querySelectorAll(
        "section#panelLateral button"
    );

    botonesMenu.forEach(boton => {
        boton.classList.remove("active");

        const onclick = boton.getAttribute("onclick") || "";

        if (onclick.includes("'" + idModal + "'") ||
            onclick.includes('"' + idModal + '"')) {

            boton.classList.add("active");
        }
    });

    // Funcionalidad de reuniones
    if (idModal === "modal-reuniones") {
        if (typeof cargarReuniones === "function") {
            cargarReuniones();
        }
    }
}

// Función específica que usa tu compañero para el Sprint
async function mostrarModalSprint(idModal, idCabecera) {

    await asegurarModalSprintCargado();

    // Ocultar los modales
    document.querySelectorAll(".modal-class").forEach(modal => {
        modal.style.display = "none";
    });

    // Mostrar el modal seleccionado
    const modalSeleccionado = document.getElementById(idModal);

    if (modalSeleccionado) {
        modalSeleccionado.style.display = "block";
    } else {
        console.error("No se encontró el modal:", idModal);
        return;
    }

    // Actualizar cabecera
    mostrarCabecera(idCabecera);

    // Actualizar menú lateral
    const botonesMenu = document.querySelectorAll(
        "section#panelLateral button"
    );

    botonesMenu.forEach(boton => {
        boton.classList.remove("active");

        const onclick = boton.getAttribute("onclick") || "";

        if (onclick.includes(idModal)) {
            boton.classList.add("active");
        }
    });

    // Cargar Kanban
    if (typeof cargarKanvan === "function") {
        cargarKanvan();
    }

    if (typeof aplicarPermisosInterfaz === "function") {
        aplicarPermisosInterfaz();
    }
}

function mostrarCabecera(idCabecera) {

    const cabeceras = document.querySelectorAll(
        "#contenedor-cabeceras .cabecera-default"
    );

    // Quitar la clase activa de todas las cabeceras
    cabeceras.forEach(cabecera => {
        cabecera.classList.remove("activa");
    });

    console.log("Cabeceras después de quitar activa:");

    cabeceras.forEach(cabecera => {
        console.log(cabecera.id, cabecera.className);
    });

    // Buscar la cabecera seleccionada
    const cabeceraSeleccionada = document.getElementById(idCabecera);

    if (cabeceraSeleccionada) {
        cabeceraSeleccionada.classList.add("activa");
        console.log("Cabecera seleccionada:", cabeceraSeleccionada.id);
    } else {
        console.error("No se encontró la cabecera:", idCabecera);
    }

    console.log("Resultado final:");

    cabeceras.forEach(cabecera => {
        console.log(
            cabecera.id,
            "Clase:", cabecera.className,
            "Display:", getComputedStyle(cabecera).display
        );
    });
}

function salirDelProyecto() {
    console.log("Saliendo del proyecto actual...");
    
    // Si guardas el ID del proyecto activo, puedes removerlo:
    sessionStorage.removeItem('proyectoActivo');
    
    // Redirigir a tu vista principal donde se listan los proyectos (ajusta la ruta según corresponda)
    window.location.href = '/html/panelPrincipal.html'; 
}

function consoleSessionStorage() {
    console.log("recuperando sessionStorage")
    console.log("USUARIO------------")
    console.log(sessionStorage.getItem('usuarioActivo'));
    console.log("USUARIO------------")
    console.log("------------")
    console.log("Proyecto------------")
    console.log(sessionStorage.getItem('proyectoActivo'));
    console.log("Proyecto------------")
    console.log("------------")

    const nombreProyecto = JSON.parse(sessionStorage.getItem('proyectoActivo')).nombre;
    console.log("nombre recuperado: " + nombreProyecto)
}


//En construccion el script para las tarjetas de usuarios dentro de un proyecto
/**
 * Función para recuperar los usuarios desde el controlador
 * @returns 
 */
async function obtenerUsuariosPorEquipo(id_proyecto) {
    console.log("sessionStorage proyectoActivo:", sessionStorage.getItem('proyectoActivo'));
    console.log("id enviado:", id_proyecto);
    try {
        const respuesta = await fetch(`/usuarios/scrumbird/${id_proyecto}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        // Obtenemos los datos del JSON
        const datos = await respuesta.json();
        // Convertido a un array de usuarios
        const usuarios = datos.data || [];

        // Regresa el arreglo con los datos
        //console.log(usuarios)
        console.log("respuesta cruda:", datos);
        return usuarios;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

/**
 * Construcción de la lista de usuarios en el panel de miembros
 */
document.addEventListener("DOMContentLoaded", async () => {
    //Cargar la definicion de hecho
    cargarDefinicionDeHecho(JSON.parse(sessionStorage.getItem('proyectoActivo')).id);
    //Lógica para solo listar los usuarios del panel Facilitador
    const contFacilitador = document.getElementById("modal-usuariosF");
    if (!contFacilitador) return; // esta página no tiene la tabla, no hacemos nada

    const idP = JSON.parse(sessionStorage.getItem('proyectoActivo')).id;
    //Logica para mostrar el menú al seleccionar la opción
    const usuarios = await obtenerUsuariosPorEquipo(idP);
    const contenedorUsuarios = document.getElementById("contenedor-usuariosF");

    if (usuarios.length === 0) {
        contenedorUsuarios.innerHTML = "<p>No hay usuarios para mostrar</p>";
        return;
    }

    const tarjetas = usuarios.map(usuario => `
    <button class="tarjeta-usuario" data-id="${usuario.id}">
        <span>${usuario.id}</span>
        <span>${usuario.u_nombre}</span>
    </button>
    `).join("");

    contenedorUsuarios.innerHTML = tarjetas;

    contenedorUsuarios.addEventListener('click', (evento) => {
        const tarjeta = evento.target.closest('.tarjeta-usuario');

        if (!tarjeta) return;

        const idUsuario = tarjeta.dataset.id;
        console.log("Click en el usuario con id: ", idUsuario);
    })
})


document.getElementById("btnEliminarProyecto").addEventListener("click", async () => {
    console.log("ELIMINADOOOOOOOOOO")
    const proyecto = JSON.parse(sessionStorage.getItem('proyectoActivo'));

    if (!proyecto) {
        alert("No hay un proyecto activo.");
        return;
    }

    const confirmar = confirm(
        `¿Seguro que deseas eliminar el proyecto "${proyecto.nombre}"?`
    );
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`/proyectos/eliminar/${proyecto.id}`, {
            method: "PUT",
            headers: { "Accept": "application/json" }
        });
        const resultado = await respuesta.json();


        if (!respuesta.ok || !resultado.ok) {
            alert(resultado.mensaje || "No se pudo eliminar el proyecto.");
            return;
        }

        sessionStorage.removeItem('proyectoActivo');
        window.location.href = '/html/PanelPrincipal.html';
    } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        alert("Ocurrió un error de conexión.");
    }
});


async function obtenerDOD(idProyecto) {
    try {
        const respuesta = await fetch(`/proyectos/listarDODProyectos/${idProyecto}`,{
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        // Obtenemos los datos del JSON
        const datos = await respuesta.json();
        
        return datos.dod;
    } catch (error) {
        console.error("Error al obtener el DOD: ", error)
        return null;
    }
}

async function cargarDefinicionDeHecho(idProyecto){
    const dod = await obtenerDOD(idProyecto);
    
    const labelDOD = document.getElementById("dodTexto");

    
    if (dod) {
        labelDOD.textContent = dod;
        labelDOD.dataset.vacio = "false";
    } else {
        labelDOD.textContent = "No hay una definición de hecho registrada.";
        labelDOD.dataset.vacio = "true";
    }
}

const dodTexto = document.getElementById("dodTexto");
const dodEditor = document.getElementById("dodEditor");
const btnEditDOD = document.getElementById("editDOD");
const btnGuardarDOD = document.getElementById("guardarDOD");
const btnCancelarDOD = document.getElementById("cancelarDOD");

function modoEdicionDOD(activo) {
    dodTexto.style.display = activo ? "none" : "block";
    dodEditor.style.display = activo ? "block" : "none";
    btnEditDOD.style.display = activo ? "none" : "inline-block";
    btnGuardarDOD.style.display = activo ? "inline-block" : "none";
    btnCancelarDOD.style.display = activo ? "inline-block" : "none";
}

btnEditDOD.addEventListener("click", () => {
    const actual = dodTexto.dataset.vacio === "true" ? "" : dodTexto.textContent;
    dodEditor.value = actual;
    modoEdicionDOD(true);
    dodEditor.focus();
});

btnCancelarDOD.addEventListener("click", () => modoEdicionDOD(false));

btnGuardarDOD.addEventListener("click", async () => {
    const nuevoDod = dodEditor.value.trim();
    if (!nuevoDod) {
        alert("La definición de hecho no puede estar vacía.");
        return;
    }

    const proyecto = JSON.parse(sessionStorage.getItem('proyectoActivo'));

    try {
        const respuesta = await fetch(`/proyectos/dod/${proyecto.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ dod: nuevoDod })
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.ok) {
            alert(resultado.mensaje || "No se pudo guardar el DOD.");
            return;
        }

        dodTexto.textContent = resultado.data.dod;
        dodTexto.dataset.vacio = "false";
        modoEdicionDOD(false);
    } catch (error) {
        console.error("Error al guardar el DOD:", error);
        alert("Ocurrió un error de conexión.");
    }
});