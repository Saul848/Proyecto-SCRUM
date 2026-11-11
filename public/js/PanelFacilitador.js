function mostrarModal(idModal, idCabecera) {
    document.querySelectorAll(".modal-class").forEach(modal => {
      modal.style.display = "none";
    });

    const modalSeleccionado = document.getElementById(idModal);
    if (modalSeleccionado) {
        modalSeleccionado.style.display = "block";
    }

    const headerNormal = document.getElementById("BloqueSuperior");
    const headerSprint = document.getElementById("cabecera-sprint");
    const tituloCentral = document.getElementById("tituloSeccionCentral");
    const btnIniciar = document.getElementById("btnIniciarConversacion");
    mostrarCabecera(idCabecera);

    if (idModal === 'modal-mensajes') {
        if (tituloCentral) {
        tituloCentral.textContent = "Mensajes";
        tituloCentral.style.display = "block";
    }
    if (btnIniciar) btnIniciar.style.display = "block";
    } else {
        if (tituloCentral) tituloCentral.style.display = "none";
        if (btnIniciar) btnIniciar.style.display = "none";
    }

    if (idModal === 'modal-reuniones') {
        if (typeof cargarReuniones === 'function') {
            cargarReuniones();
        }
    }
}

// Función específica que usa tu compañero para el Sprint
async function mostrarModalSprint(idModal, idCabecera) {
  // 1. Aquí dentro SÍ puedes usar await sin problemas
  await asegurarModalSprintCargado();

  // 2. Ocultar todos los modales principales
  document.querySelectorAll(".modal-class").forEach(modal => {
      modal.style.display = "none";
  });

  // 3. Mostrar el modal correspondiente
  const modalSeleccionado = document.getElementById(idModal);
  if (modalSeleccionado) {
      modalSeleccionado.style.display = "block";
  }

  // 4. Mostrar la cabecera
  mostrarCabecera(idCabecera);

  // 5. Cargar el Kanban
  if (typeof cargarKanvan === "function") {
      cargarKanvan();
  }

  if (typeof aplicarPermisosInterfaz === "function") {
    aplicarPermisosInterfaz();
    }
}

function mostrarCabecera(idCabecera){
    document.querySelectorAll(".cabecera-default").forEach(modal => {
        modal.style.display = "none";
    });
    const cabeceraSeleccionada = document.getElementById(idCabecera);
    if(cabeceraSeleccionada){
        cabeceraSeleccionada.style.display = "flex";
    }
}

function consoleSessionStorage(){
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
document.addEventListener("DOMContentLoaded", async ()=>{
    //Lógica para solo listar los usuarios del panel Facilitador
    const contFacilitador = document.getElementById("modal-usuariosF");
    console.log('revisando lista del equipo')
    if (!contFacilitador) return; // esta página no tiene la tabla, no hacemos nada

    console.log('Listando miembros del equipo')
    const idP = JSON.parse(sessionStorage.getItem('proyectoActivo')).id;
    //Logica para mostrar el menú al seleccionar la opción
    const usuarios= await obtenerUsuariosPorEquipo(idP);
    const contenedorUsuarios = document.getElementById("contenedor-usuariosF");

    console.log("Longitud de usuarios: "+ usuarios.length)
    if(usuarios.length === 0) {
        contenedorUsuarios.innerHTML = "<p>No hay usuarios para mostrar</p>";
        return;
    }
    console.log(usuarios)
    const tarjetas = usuarios.map(usuario =>`
    <button class="tarjeta-usuario" data-id="${usuario.id}">
        <span>${usuario.id}</span>
        <span>${usuario.u_nombre}</span>
    </button>
    `).join("");
    
    contenedorUsuarios.innerHTML = tarjetas;

    contenedorUsuarios.addEventListener('click', (evento)=>{
        const tarjeta= evento.target.closest('.tarjeta-usuario');

        if(!tarjeta) return;

        const idUsuario = tarjeta.dataset.id;
        console.log("Click en el usuario con id: ", idUsuario);
    })
})
