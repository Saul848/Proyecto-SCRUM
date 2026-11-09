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

