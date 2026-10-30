//Botones de apertura de modales
const btnAgregarHistoria = document.getElementById("btnAgregarHistoria");
const btnModHistoria = document.getElementById("btnModHistoria");
//Modales Agregar y Modificar
const modalAgregarHistoria = document.getElementById("modalAgregarHistoria");
const modalModificarHistoria = document.getElementById("modalModificarHistoria");
//Seccion de historias
const divHistoria = document.getElementById("DivHistoria");
// Elementos del modal agregar
const inpAddTitulo = document.getElementById("inpAddTitulo");
const inpAddDescripccion = document.getElementById("inpAddDescripccion");
const inpAddValor = document.getElementById("inpAddValor");
const btnGuardarHistoria = document.getElementById("btnGuardarModalAdd");
const btnCerrarModalAdd = document.getElementById("btnCerrarModalAdd");
// Campos criterios de aceptacion
const containerAdd = document.getElementById("contenedorAdd");
const btnArribaAdd = document.getElementById("btnArribaAdd");
const btnAbajoAdd = document.getElementById("btnAbajoAdd");
const indicadorAdd = document.getElementById("criterioIndicadorAdd");
const btnAgregarCriterioAdd = document.getElementById("btnAgregarCriterioAdd");
const btnEliminarCriterioAdd = document.getElementById("btnEliminarCriterioAdd"); // <-- Nuevo

// Elementos inputs del modal modificar
const inpModTitulo = document.getElementById("inpModTitulo");
const inpModDescripcion = document.getElementById("inpModDescripcion");
const inpModCriterios = document.getElementById("inpModCriterios");
const inpModValor = document.getElementById("inpModValor");
const btnModificarHistoria = document.getElementById("btnGuardarModalMod");
const btnCerrarModalMod = document.getElementById("btnCerrarModalMod");

// Campos criterios de aceptacion
const containerMod = document.getElementById("contenedorMod");
const btnArribaMod = document.getElementById("btnArribaMod");
const btnAbajoMod = document.getElementById("btnAbajoMod");
const indicadorMod = document.getElementById("criterioIndicadorMod");
const btnAgregarCriterioMod = document.getElementById("btnAgregarCriterioMod");
const btnEliminarCriterioMod = document.getElementById("btnEliminarCriterioMod"); // <-- Nuevo

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];
 // Índice actabasado en 0
let currentIndexAdd = 0;
let currentIndexMod = 0;
/**
 * Función para renderizar dinámicamente las historias de usuario en el DOM
 */
async function renderizarHistorias() {
    // 1. Solicitamos los datos al servidor y los guardamos en la variable
    datosHistorias = await obtenerHistorias();

    // 2. Limpiamos el contenedor antes de inyectar los elementos
    divHistoria.innerHTML = "";

    // 3. Validamos si hay elementos para mostrar
    if (datosHistorias.length === 0) {
        divHistoria.innerHTML = `<p style="text-align: center; padding: 20px;">No hay historias de usuario registradas.</p>`;
        return;
    }

    // 4. Recorremos el arreglo y construimos dinámicamente cada fila con innerHTML
    datosHistorias.forEach((historia) => {
        const filaHtml = document.createElement("div");
        filaHtml.id = `DivFilaHistoria_${historia.id}`;
        filaHtml.className = "DivFilaHistoria";

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            <label class="LabelCriterios">${historia.criterios || historia.criterios_de_aceptacion || "#"}</label>
            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelSprintAsginado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
            
            <div class="DivBtnComentar">
                <button class="btnVerComentarios" data-id="${historia.id}">Ver comentarios</button>
            </div>
            <div class="DivBtnEliminar">
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}">🗑️</button>
            </div>
        `;

        divHistoria.appendChild(filaHtml);
    });
}

// Evento DOMContentLoaded para cargar los datos y renderizarlos al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
    await renderizarHistorias();
});

/**
 * Función para limpiar los campos del modal añadir historia
 */
function limpiarCamposModalAdd() {
    inpAddTitulo.value = "";
    inpAddDescripccion.value = "";
    reiniciarCriteriosAceptacion(containerAdd, indicadorAdd, currentIndexAdd);
    inpAddValor.value = "";
}

/**
 * Función para limpiar los campos del modal modificar historia
 */
function limpiarCamposModalMod() {
    inpModTitulo.value = "";
    inpModDescripcion.value = "";
    reiniciarCriteriosAceptacion(containerMod, indicadorMod, currentIndexMod);
    inpModValor.value = "";
}

/**
 * Funcion que reinicia los criterios de aceptacion a un solo textarea limpio
 * @param {*} containerModal Contenedor de los textarea para criterios en el modal
 * @param {*} indicadorModal Indicador de criterios en el panel modal
 * @param {} indiceModal Indice global del modal
 */
function reiniciarCriteriosAceptacion(containerModal, indicadorModal, indiceModal){
    //Reiniciamos la variable global a 0;
    indiceModal=0;
    //Obtenemos una lista con todos los textarea en el contenedor del Modal
    let inpCriterios = containerModal.querySelectorAll("textarea");
    //Se itera en la lista y se eliminan todos excepto el primero.
    inpCriterios.forEach((element, index) => {
        if(index !== 0){
            element.remove();
        }
    });
    //Se limpia el textArea en la posicion 0 (el primero) y se muestra en pantalla
    inpCriterios[0].value="";
    inpCriterios[0].classList.add("active");
    //Dejamos el indicador de criterio en posicion 1/1
    indicadorModal.innerText="1/1"
}

// Listener para el botón "+ Añadir nueva historia"
btnAgregarHistoria.addEventListener("click", function () {
    modalAgregarHistoria.classList.add('activo');// Muestra el modal
});

// Listener para el botón "# Modificar historia"
btnModHistoria.addEventListener("click", function () {
    modalModificarHistoria.classList.add('activo');// Muestra el modal
});

// Listener para cerrar el modal "Agregar historia"
btnCerrarModalAdd.addEventListener("click", function () {
    limpiarCamposModalAdd();
    modalAgregarHistoria.classList.remove('activo');// Oculta el modal
});

// Listener para cerrar el modal "Modificar historia"
btnCerrarModalMod.addEventListener("click", function () {
    limpiarCamposModalMod();
    modalModificarHistoria.classList.remove('activo');// Oculta el modal
});

// Listener para guardar una nueva historia de usuario desde el modal
btnGuardarHistoria.addEventListener("click", function () {
    agregarHistoriaUsuario();
});

//Funcion que actualiza los elementos para mostrar los criterios de aceptacion en los modales
/**
 * Funcion que me permite trabajar con los criterios de evaluacion de un panel modal especificado
 * @param {DOM} criteriosAcepModal contenedor de criterios de aceptacion de un modal
 * @param {DOM} indicadorModal indicador del navbar de un panel modal (Para los criterios de aceptacion)
 * @returns 
 */
function actualizarVista(criteriosAcepModal, indicadorModal, indiceModal) {
    const inputsTA = criteriosAcepModal.querySelectorAll("textarea");
    if (inputsTA.length === 0) return;

    // Asegurar que el índice esté en rangos válidos
    if (indiceModal < 0) indiceModal = 0;
    if (indiceModal >= inputsTA.length) indiceModal = inputsTA.length - 1;

    // Mostrar/ocultar inputs con la clase 'active'
    inputsTA.forEach((input, index) => {
        if (index === indiceModal) {
            input.classList.add("active");
        } else {
            input.classList.remove("active");
        }
    });
    // Actualizar indicador (ej: 1/3)
    indicadorModal.textContent = `${indiceModal + 1}/${inputsTA.length}`;
}

const parArriba = [btnArribaAdd, btnArribaMod];

// Recorrido que asigna el listener que permite navegar con (flecha arriba) en la seccion de criterios de aceptacion.
parArriba.forEach(element=>{
    element.addEventListener("click", (e) => {
        if(e.currentTarget===btnArribaAdd){
            if (currentIndexAdd > 0) {
                currentIndexAdd --;
                actualizarVista(containerAdd, indicadorAdd, currentIndexAdd)
                const activeInput = containerAdd.querySelector("textarea.active");
                if (activeInput) activeInput.focus();
            }
        }
        else if(e.currentTarget===btnArribaMod){
            if (currentIndexMod > 0) {
                currentIndexMod --;
                actualizarVista(containerMod, indicadorMod, currentIndexMod)
                const activeInput = containerMod.querySelector("textarea.active");
                if (activeInput) activeInput.focus();
            }
        }
    });
});

const parAbajo = [btnAbajoAdd, btnAbajoMod];

// Recorrido que asigna el listener que permite navegar con (flecha arriba) en la seccion de criterios de aceptacion.
parAbajo.forEach(element=>{
    element.addEventListener("click", (e) => {
        if(e.currentTarget===btnAbajoAdd){
            const inputs = containerAdd.querySelectorAll("textarea");
            if (currentIndexAdd < inputs.length - 1) {
                currentIndexAdd++;
                actualizarVista(containerAdd, indicadorAdd, currentIndexAdd);
                const activeInput = containerAdd.querySelector("textarea.active");
            if (activeInput) activeInput.focus();
            }
        }
        else if(e.currentTarget===btnAbajoMod){
            const inputs = containerMod.querySelectorAll("textarea");
            if (currentIndexMod < inputs.length - 1) {
                currentIndexMod++;
                actualizarVista(containerMod, indicadorMod, currentIndexMod);
                const activeInput = containerMod.querySelector("textarea.active");
            if (activeInput) activeInput.focus();
            }
        }
    });
});

const parAgregarCriterio = [btnAgregarCriterioAdd, btnAgregarCriterioMod];

// Recorrido que asigna el listener que permite navegar con (flecha arriba) en la seccion de criterios de aceptacion.
parAgregarCriterio.forEach(element=>{
    element.addEventListener("click", (e) => {
        if(e.currentTarget===btnAgregarCriterioAdd){
            const totalInputs = containerAdd.querySelectorAll("textarea").length;
            const nuevoId = `criterioAdd_${totalInputs + 1}`;
            const nuevoTextA = document.createElement("textarea");
            nuevoTextA.id = nuevoId;
            nuevoTextA.placeholder = `Escribe el criterio ${totalInputs + 1}...`;
            containerAdd.appendChild(nuevoTextA);
            // Movernos automáticamente al nuevo input recién creado
            currentIndexAdd = totalInputs;
            actualizarVista(containerAdd, indicadorAdd, currentIndexAdd);
            nuevoTextA.focus();
        }
        else if(e.currentTarget===btnAgregarCriterioMod){
            const totalInputs = containerMod.querySelectorAll("textarea").length;
            const nuevoId = `criterioMod_${totalInputs + 1}`;
            const nuevoTextA = document.createElement("textarea");
            nuevoTextA.id = nuevoId;
            nuevoTextA.placeholder = `Escribe el criterio ${totalInputs + 1}...`;
            containerMod.appendChild(nuevoTextA);
            // Movernos automáticamente al nuevo input recién creado
            currentIndexMod = totalInputs;
            actualizarVista(containerMod, indicadorMod, currentIndexMod);
            nuevoTextA.focus();
        }
    });
});

const parEliminarCriterio = [btnEliminarCriterioAdd, btnEliminarCriterioMod];

// Recorrido que asigna el listener que permite eliminar un criterio de aceptacion en la seccion de criterios de aceptacion.
parEliminarCriterio.forEach(element=>{
    element.addEventListener("click", (e) => {
        if(e.currentTarget===btnEliminarCriterioAdd){
            const inputs = containerAdd.querySelectorAll("textArea");
            // Opcional: Evitamos eliminar el input si solo queda 1
            if (inputs.length === 1) {
            inputs[0].style.border = "2px solid red";
            return;
            }   
            // Eliminar el input activo actual del DOM
            const inputAEliminar = inputs[currentIndexAdd];
            inputAEliminar.remove();

            // Reasignar IDs y placeholders a los inputs restantes para mantener orden (criterio_1, criterio_2...)
            const inputsRestantes = containerAdd.querySelectorAll("textArea");
            inputsRestantes.forEach((input, index) => {
            input.id = `criterioAdd_${index + 1}`;
            input.placeholder = `Escribe el criterio ${index + 1}...`;
            });

            // Ajustar el índice si estábamos en el último elemento
            if (currentIndexAdd >= inputsRestantes.length) {
            currentIndexAdd = inputsRestantes.length - 1;
            }

            actualizarVista(containerAdd, indicadorAdd, currentIndexAdd);
            const activeInput = containerAdd.querySelector("textarea.active");
            if (activeInput) activeInput.focus();
        }else if(e.currentTarget===btnEliminarCriterioMod){
            const inputs = containerMod.querySelectorAll("textArea");
            // Opcional: Evitamos eliminar el input si solo queda 1
            if (inputs.length === 1) {
                inputs[0].style.border = "2px solid red";
            return;
            }   
            // Eliminar el input activo actual del DOM
            const inputAEliminar = inputs[currentIndexMod];
            inputAEliminar.remove();

            // Reasignar IDs y placeholders a los inputs restantes para mantener orden (criterio_1, criterio_2...)
            const inputsRestantes = containerMod.querySelectorAll("textArea");
            inputsRestantes.forEach((input, index) => {
            input.id = `criterioMod_${index + 1}`;
            input.placeholder = `Escribe el criterio ${index + 1}...`;
            });

            // Ajustar el índice si estábamos en el último elemento
            if (currentIndexMod >= inputsRestantes.length) {
                currentIndexMod = inputsRestantes.length - 1;
            }
            actualizarVista(containerMod, indicadorMod, currentIndexMod);
            const activeInput = containerMod.querySelector("textarea.active");
            if (activeInput) activeInput.focus();
        }
    });
});


// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === modalAgregarHistoria) {
        modalAgregarHistoria.classList.remove('activo');// Oculta el modal
        limpiarCamposModalAdd();
    }
    else if(e.target === modalModificarHistoria){
        modalModificarHistoria.classList.remove('activo');
        limpiarCamposModalMod();
    }
});

function verificarCamposAdd() {
    let verificado = true;
    let elementosDom = [inpAddTitulo, inpAddDescripccion, inpAddValor];
    elementosDom.forEach(elemento => {
        if (elemento.value.trim() === "") {
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if (elemento === inpAddTitulo) {
                if (!patronNombre.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "El nombre no debe llevar numeros o simbolos";
                    verificado = false;
                } else {
                    if (verificarTituloUnico(elemento)) {
                        elemento.style.border = "2px solid blue";
                    } else {
                        verificado = false;
                    }
                }
            }
            if (elemento === inpAddDescripccion) {
                if (!patronNombre.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if (elemento === inpAddValor) {
                if (!patronRangoValor.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
        }
    });
    return verificado;
}

//Metodo que verifica la seccion de criterios de aceptacion.
function verificarCriteriosAdd() {
    let verificado = true;
    let elementosDom = containerAdd.querySelectorAll('input')
    elementosDom.forEach((elemento, index) => {
        if (elemento.value.trim() === "") {
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            alert("Tu criterio de aceptacion numero"+(index+1)+"esta vacio")
            verificado = false;
        } else {
            if (!patronNombre.test(elemento.value.trim())) {
                elemento.style.border = "2px solid red";
                elemento.value = "";
                elemento.placeholder = "El nombre no debe llevar numeros o simbolos";
                verificado = false;
            } else {
                if (verificarTituloUnico(elemento)) {
                    elemento.style.border = "2px solid blue";
                } else {
                    verificado = false;
                }
            }             
        }
    });
    return verificado;
}

/**
 * Funcion para calcular el id
 */
function calcularId() {
    if (!datosHistorias || datosHistorias.length === 0) {
        return 1;
    } else {
        let valorMayor = datosHistorias[0].id;
        for (let n = 1; n < datosHistorias.length; n++) {
            let sigValor = datosHistorias[n].id;
            if (valorMayor < sigValor) {
                valorMayor = sigValor;
            }
        }
        return (valorMayor + 1);
    }
}

/**
 * Funcion que verifica si existe una historia con un titulo igual
 */
function verificarTituloUnico(inputDom) {
    if (!datosHistorias) {
        return true;
    } else {
        for (let n = 0; n < datosHistorias.length; n++) {
            if (datosHistorias[n].titulo === inputDom.value.trim() || datosHistorias[n].nombre === inputDom.value.trim()) {
                inputDom.style.border = "2px solid red";
                inputDom.value = "";
                inputDom.placeholder = "La historia ya existe en el sistema";
                return false;
            }
        }
        return true;
    }
}

/**
 * Obtiene un arreglo de historias desde el servidor
 */
async function obtenerHistorias() {
    const respuesta = await fetch(`/historias`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });
    if (!respuesta.ok) {
        alert("Ocurrió un error, datos no obtenidos");
        return [];
    }
    const datos = await respuesta.json();
    const historias = datos.data || [];
    return historias;
}


function agregarNuevaHistoria() {
    //Se da de alta una bandera, si llega al final del metodo y pasa las verificaciones el empleado es valido.
    let historiaValida = verificarCamposAdd();
    //Se verifican la informacion ingresada en los campos
    if (historiaValida) {
        agregarHistoriaUsuario()
    }
}

/**
 * Valida los campos del formulario, envía una petición POST al servidor para registrar
 * una nueva historia de usuario, limpia los filtros actuales, recarga la lista maestra de historias,
 * y oculta el modal de creación si el registro es exitoso.
 * @async
 * @function agregarHistoriaUsuario
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa el proceso de guardado y actualización.
 */
async function agregarHistoriaUsuario() {
    // Primero verificamos que los campos cumplan las reglas
    if (!verificarCamposAdd()) {
        return;
    }

    let nombre = inpAddTitulo.value.trim();
    let descripcion = inpAddDescripccion.value.trim();
    let criterios = inpCriterios.value.trim();
    let valor = inpAddValor.value.trim();
    let sprint = inpSprintAsig.value.trim();

    const respuesta = await fetch("/historias", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion,
            criterios: criterios,
            valor: valor,
            sprint: sprint
        })
    });

    const resultado = await respuesta.json();

    if (resultado.ok || respuesta.status === 201) {
        alert(resultado.mensaje || "Historia agregada correctamente");
        
        // Limpiamos los campos de los filtros para que la nueva historia se vea inmediatamente
        inputFiltroId.value = "";
        inputFiltroNombre.value = "";
        inputFiltroValor.value = "";
        inputFiltroSprint.value = "";

        // Volvemos a inicializar el backlog para actualizar la lista, incluyendo la nueva historia
        await inicializarBacklog();
        
        // Se limpian los campos de la sección agregar
        limpiarCamposModalAdd();
        // Se oculta el modal
        modalAgregarHistoria.classList.remove('activo');// Oculta el modal
    } else {
        alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
    }
}

function cargar_cabecera_inicial() {
    document.getElementById("cabecera-mensajes").style.display = "block";
}
///////////////////////////
///////////////////////////
// TABLERO KANVAN

/**
 * Realiza una petición GET al servidor para obtener todas las historias de usuario 
 * del sprint actual correspondientes al proyecto (facilitador/cliente)
 * 
 * @async
 * @function obtenerHistoriasKanvan
 * @param {number} idProyecto - Identificador único del proyecto.
 * @param {number} idSprint - Identificador único del sprint actual.
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
 *                                   las historias del sprint, o un arreglo vacío si ocurre un error.
 */
async function obtenerHistoriasKanvan(idProyecto, idSprint) {
    try {
        const respuesta = await fetch(`/historias/historiasSprint/${idProyecto}/${idSprint}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!respuesta.ok) {
            alert("Ocurrió un error al obtener las historias del sprint.");
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

/**
 * Realiza una petición GET al servidor para obtener únicamente las historias 
 * asignadas a un desarrollador específico dentro del proyecto y sprint actual.
 * 
 * @async
 * @function obtenerHistoriasKanvanDesarrollador
 * @param {number} idProyecto - Identificador único del proyecto.
 * @param {number} idSprint - Identificador único del sprint actual.
 * @param {number} idDesarrollador - Identificador único del usuario (desarrollador).
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
 *                                   las historias asignadas al desarrollador, o un arreglo vacío si falla.
 */
async function obtenerHistoriasKanvanDesarrollador(idProyecto, idSprint, idDesarrollador) {
    try {
        const respuesta = await fetch(`/historias/historiasSprintDev/${idProyecto}/${idSprint}/${idDesarrollador}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!respuesta.ok) {
            alert("Ocurrió un error al obtener las historias del desarrollador.");
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

// Rol del usuario actual logueado (puedes cambiarlo a "desarrollador", "facilitador" o "cliente")
const ROL_ACTUAL = "desarrollador"; //CAMBIAR POR LOCAL_STORAGE
let historiasDelSprint = [];

async function cargarKanvan(){
    if (ROL_ACTUAL === "facilitador"  || ROL_ACTUAL === "cliente") {
        // CAMBIAR A SPRINT Y PROYECTO ACTUALES
        historiasDelSprint = await obtenerHistoriasKanvan(1, 1);
        if(historiasDelSprint.length === 0){
            alert("El Sprint esta vacio");
        }
    } else if (ROL_ACTUAL === "desarrollador") {
        // CAMBIAR A SPRINT Y PROYECTO ACTUALES Y ID DESARROLLADOR
        historiasDelSprint = await obtenerHistoriasKanvanDesarrollador(1, 1, 1);
        if(historiasDelSprint.length === 0){
            alert("El Sprint esta vacio");
        }
    } else {
        alert("ROL no especificado o no valido")
    }

    inicializarTablero();
}

let tarjetaArrastrada = null;
let estadoOrigen = null;

function inicializarTablero() {
    const columnas = document.querySelectorAll(".columna-kanban");

    columnas.forEach(columna => {
        columna.innerHTML = "";

        columna.addEventListener("dragover", (e) => {
            e.preventDefault();
            columna.classList.add("drag-over");
        });

        columna.addEventListener("dragleave", () => {
            columna.classList.remove("drag-over");
        });

        columna.addEventListener("drop", manejarDrop);
    });

    historiasDelSprint.forEach(historia => {
        const tarjeta = crearTarjeta(historia);

        // Admite los nombres de propiedades que devuelve tu procedimiento
        const estado = historia.estado_actual ?? historia.estado;

        const columnaDestino = document.querySelector(
            `.columna-kanban[data-estado="${estado}"]`
        );

        if (columnaDestino) {
            // LÓGICA DE ORDENAMIENTO:
            // Si es prioritaria, va hasta arriba. Si no, se coloca al final (debajo de las prioritarias).
            if (historia.prioridad) {
                // Inserta la tarjeta antes de la primera tarjeta existente en la columna
                const primeraTarjeta = columnaDestino.querySelector(".tarjeta-historia");
                if (primeraTarjeta) {
                    columnaDestino.insertBefore(tarjeta, primeraTarjeta);
                } else {
                    columnaDestino.appendChild(tarjeta);
                }
            } else {
                // Las no prioritarias se van al final de la columna (debajo de las prioritarias)
                columnaDestino.appendChild(tarjeta);
            }
        }
    });
}

function crearTarjeta(historia) {
    const card = document.createElement("div");

    // El procedimiento almacenado devuelve historia_id
    const historiaId = historia.historia_id ?? historia.id;
    const titulo = historia.titulo ?? historia.descripcion ?? "Historia sin título";
    console.log(historia);

    // Asignación de clase según si es prioritaria (boolean)
    if (historia.prioridad) {
        card.classList.add("prioritaria");
    } else {
        card.classList.add("no-prioritaria");
    }
    
    card.classList.add("tarjeta-historia");
    card.setAttribute("draggable", "true");
    card.dataset.id = historiaId;

    card.innerHTML = `
        <h4 class="historia-titulo">${titulo}</h4>
        <div class="tarjeta-footer">
            <button class="btn-detalles"
                onclick="verDetallesHistoriaKanban(${historiaId})">
                Ver detalles &rarr;
            </button>
        </div>
    `;

    card.addEventListener("dragstart", (e) => {
         console.log(historiasDelSprint);

        document.getElementById("responsableHistoria").value = historia.nombre_responsable;
        tarjetaArrastrada = card;
        estadoOrigen = card.parentElement.dataset.estado;

        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", historiaId);
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        tarjetaArrastrada = null;
        estadoOrigen = null;
    });

    return card;
}

async function manejarDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    if (!tarjetaArrastrada) return;

    const tarjeta = tarjetaArrastrada;
    const estadoAnterior = estadoOrigen;
    const columnaOrigen = tarjeta.parentElement;
    const columnaDestino = this;

    const estadoDestino = columnaDestino.dataset.estado;

    if (estadoDestino === estadoAnterior) return;

    // Reglas para el facilitador
    if (ROL_ACTUAL === "facilitador") {
        const esOrigenValido = estadoAnterior === "en-revision";
        const esDestinoValido =
            estadoDestino === "terminado" ||
            estadoDestino === "en-progreso";

        if (!esOrigenValido || !esDestinoValido) {
            alert(
                "Solo puedes mover historias desde 'En revisión' " +
                "hacia 'Terminado' o regresar a 'En progreso'."
            );
            return;
        }
    }
    // Reglas para el desarrollador
    else if (ROL_ACTUAL === "desarrollador") {
        const esOrigenValido =
            estadoAnterior === "por-empezar" ||
            estadoAnterior === "en-progreso";

        const esDestinoValido =
            estadoDestino === "en-progreso" ||
            estadoDestino === "en-revision";

        if (!esOrigenValido || !esDestinoValido) {
            alert(
                "Solo puedes mover historias desde 'Por empezar' " +
                "o 'En progreso' hacia 'En progreso' o 'En revisión'."
            );
            return;
        }
    } else {
        alert("Acción denegada");
        return;
    }

    const historiaId = Number(tarjeta.dataset.id);

    // Movimiento visual provisional respetando la prioridad al soltar
    const esPrioritaria = tarjeta.classList.contains("prioritaria");
    if (esPrioritaria) {
        const primeraTarjeta = columnaDestino.querySelector(".tarjeta-historia");
        if (primeraTarjeta) {
            columnaDestino.insertBefore(tarjeta, primeraTarjeta);
        } else {
            columnaDestino.appendChild(tarjeta);
        }
    } else {
        columnaDestino.appendChild(tarjeta);
    }

    tarjeta.setAttribute("draggable", "false");

    try {
        const guardado = await actualizarEstadoHistoria(historiaId, 1, estadoDestino);

        if (!guardado) {
            // Revertir posición si falla la BD
            if (esPrioritaria) {
                const primeraTarjetaOrigen = columnaOrigen.querySelector(".tarjeta-historia");
                if (primeraTarjetaOrigen) {
                    columnaOrigen.insertBefore(tarjeta, primeraTarjetaOrigen);
                } else {
                    columnaOrigen.appendChild(tarjeta);
                }
            } else {
                columnaOrigen.appendChild(tarjeta);
            }
            return;
        }

        const historiaEncontrada = historiasDelSprint.find(
            historia =>
                Number(historia.historia_id ?? historia.id) === historiaId
        );

        if (historiaEncontrada) {
            if ("estado_actual" in historiaEncontrada) {
                historiaEncontrada.estado_actual = estadoDestino;
            } else {
                historiaEncontrada.estado = estadoDestino;
            }
        }

        console.log(
            `BD actualizada: historia ${historiaId}, estado ${estadoDestino}`
        );
    } catch (error) {
        console.error("No se pudo guardar el cambio:", error);
        if (esPrioritaria) {
            const primeraTarjetaOrigen = columnaOrigen.querySelector(".tarjeta-historia");
            if (primeraTarjetaOrigen) {
                columnaOrigen.insertBefore(tarjeta, primeraTarjetaOrigen);
            } else {
                columnaOrigen.appendChild(tarjeta);
            }
        } else {
            columnaOrigen.appendChild(tarjeta);
        }
        alert("Ocurrió un error. La tarjeta regresará a su columna original.");
    } finally {
        tarjeta.setAttribute("draggable", "true");
    }
}

async function actualizarEstadoHistoria(idHistoria, idProyecto, nuevoEstado) {
    try {
        const respuesta = await fetch(`/historias/estado/${idHistoria}/${idProyecto}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                nuevoEstado
            })
        });

        // Evita fallos si el servidor no devuelve JSON válido.
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.success === false) {
            alert(
                resultado.mensaje ||
                resultado.message ||
                "Error al actualizar el estado."
            );

            return false;
        }

        alert("Estado actualizado correctamente");
        return true;

    } catch (error) {
        console.error("Error al guardar modificaciones:", error);
        alert("Error de conexión al guardar los cambios.");
        return false;
    }
}

// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", cargarKanvan);

// TERMINO TABLERO KANVAN
////////////////////////////////
////////////////////////////////


cargar_cabecera_inicial();

// Variables globales adicionales para filtros
let todasLasHistorias = [];

// Captura de elementos de filtro del DOM
const inputFiltroId = document.getElementById("inputFiltroId");
const inputFiltroNombre = document.getElementById("inputFiltroNombre");
const inputFiltroValor = document.getElementById("inputFiltroValor");
const inputFiltroSprint = document.getElementById("inputFiltroSprint");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

/**
 * Inicializa el Product Backlog obteniendo la lista completa de historias desde el servidor,
 * almacenándolas en la variable maestra global e invocando el sistema de filtrado inicial.
 * @async
 * @function inicializarBacklog
 * @returns {Promise<void>} Promesa que se resuelve cuando se han cargado y filtrado las historias.
 */
async function inicializarBacklog() {
    todasLasHistorias = await obtenerHistorias();
    aplicarFiltros();
}

/**
 * Filtra el arreglo maestro de historias en tiempo real basándose en los valores actuales
 * ingresados en los campos de búsqueda (ID, nombre, valor y sprint asignado).
 * Posteriormente, delega el resultado a la función de renderizado.
 * @function aplicarFiltros
 * @returns {void}
 */
function aplicarFiltros() {
    const filtroId = inputFiltroId.value.trim().toLowerCase();
    const filtroNombre = inputFiltroNombre.value.trim().toLowerCase();
    const filtroValor = inputFiltroValor.value.trim().toLowerCase();
    const filtroSprint = inputFiltroSprint.value.trim().toLowerCase();

    const historiasFiltradas = todasLasHistorias.filter((historia) => {
        const idStr = String(historia.id).toLowerCase();
        const nombreStr = String(historia.nombre || historia.titulo || "").toLowerCase();
        const valorStr = String(historia.valor || "").toLowerCase();
        const sprintStr = String(historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "").toLowerCase();

        const matchId = filtroId === "" || idStr.includes(filtroId);
        const matchNombre = filtroNombre === "" || nombreStr.includes(filtroNombre);
        const matchValor = filtroValor === "" || valorStr.includes(filtroValor);
        const matchSprint = filtroSprint === "" || sprintStr.includes(filtroSprint);

        return matchId && matchNombre && matchValor && matchSprint;
    });

    renderizarTablaFiltrada(historiasFiltradas);
}

/**
 * Recorre un arreglo de historias de usuario y construye dinámicamente las filas HTML
 * correspondientes, inyectándolas en el contenedor principal de la vista del Product Backlog.
 * Muestra un mensaje informativo si no hay coincidencias.
 * @function renderizarTablaFiltrada
 * @param {Array<Object>} historias - Arreglo de objetos que representan las historias de usuario a mostrar.
 * @returns {void}
 */
function renderizarTablaFiltrada(historias) {
    divHistoria.innerHTML = "";

    if (historias.length === 0) {
        divHistoria.innerHTML = `<p style="text-align: center; padding: 20px; color: #64748b;">No se encontraron historias que coincidan con los filtros.</p>`;
        return;
    }

    historias.forEach((historia) => {
        const filaHtml = document.createElement("div");
        filaHtml.id = `DivFilaHistoria_${historia.id}`;
        filaHtml.className = "DivFilaHistoria";

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            <label class="LabelCriterios">${historia.criterios || historia.criterios_de_aceptacion || "#"}</label>
            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelSprintAsginado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
            
            <div class="DivBtnComentar">
                <button class="btnVerComentarios" data-id="${historia.id}">Ver comentarios</button>
            </div>
            <div class="DivBtnEliminar">
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}">🗑️</button>
            </div>
        `;

        divHistoria.appendChild(filaHtml);
    });
}


/**
 * Carga la vista de Sprint Planning dentro de FacilitadorPB
 * para mantener el panel lateral visible sin navegar a otra página.
 */
function abrirSprintPlanning() {
    // 1. Ocultar todos los modales
    document.querySelectorAll(".modal-class").forEach(modal => {
        modal.style.display = "none";
    });

    // 2. Ocultar la cabecera normal
    const headerNormal = document.getElementById("BloqueSuperior");
    if (headerNormal) headerNormal.style.display = "none";

    // 3. Cargar el contenido de sprintPlanning.html
    const contenedor = document.getElementById("vista-sprintPlanning");
    fetch('sprintPlanning.html')
        .then(r => r.text())
        .then(html => {
            // Extraer solo el contenido relevante (el .app)
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const app = temp.querySelector('.app');
            contenedor.innerHTML = app ? app.outerHTML : html;
            contenedor.style.display = "block";

            // 4. Cargar el script de sprintPlanning para su lógica
            cargarScriptSprint('../js/sprintPlanning.js');
        })
        .catch(err => console.error('Error cargando sprintPlanning:', err));
}

/**
 * Carga un script dinámicamente (para que funcione la lógica de la reunión)
 */
function cargarScriptSprint(src) {
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
}


// Event listeners para actualizar el filtrado en tiempo real al escribir
[inputFiltroId, inputFiltroNombre, inputFiltroValor, inputFiltroSprint].forEach(input => {
    input.addEventListener("input", aplicarFiltros);
});

// Botón para limpiar los filtros
btnLimpiarFiltros.addEventListener("click", () => {
    inputFiltroId.value = "";
    inputFiltroNombre.value = "";
    inputFiltroValor.value = "";
    inputFiltroSprint.value = "";
    aplicarFiltros();
});

// Modificación del evento DOMContentLoaded para usar la carga inicial
document.addEventListener("DOMContentLoaded", async () => {
    await inicializarBacklog();
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
    
    const labelDOD = document.getElementById("dodTexto")
    const btnAdd = document.getElementById("addDOD");
    const btnEdit = document.getElementById("editDOD");

    if (dod) {
        labelDOD.textContent = dod;
        btnAdd.style.display = "none";
        btnEdit.style.display = "inline-block";
    } else {
        labelDOD.textContent = "No hay una definición de hecho registrada.";
        btnAdd.style.display = "inline-block";
        btnEdit.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    cargarDefinicionDeHecho(JSON.parse(sessionStorage.getItem('usuarioActivo').id));
})

document.getElementById("btn-storage").addEventListener('click', ()=>{
    console.log("presionado" + sessionStorage.getItem('usuarioActivo'))
})
