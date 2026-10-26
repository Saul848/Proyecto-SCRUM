const btnAgregarHistoria = document.getElementById("btnAgregarHistoria");
const btnModHistoria = document.getElementById("btnModHistoria");
const panelAgregarMod = document.getElementById("modalHistoria");
const divHistoria = document.getElementById("DivHistoria");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnGuardarHistoria = document.getElementById("btnGuardarModal");
// Elementos inputs del modal
const inpTitulo = document.getElementById("inpTitulo");
const inpDescripccion = document.getElementById("inpDescripccion");
const inpCriterios = document.getElementById("inpCriterios");
const inpValor = document.getElementById("inpValor");
const inpSprintAsig = document.getElementById("inpSprintAsig");

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Elementos bandera
let enModificacion = null; // null = oculto, true/false = visible

// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];

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
 * Función para limpiar los campos del modal
 */
function limpiarCamposHistoria() {
    inpTitulo.value = "";
    inpDescripccion.value = "";
    inpCriterios.value = "";
    inpValor.value = "";
    inpSprintAsig.value = "";
}

// Listener para el botón "+ Añadir nueva historia"
btnAgregarHistoria.addEventListener("click", function () {
    setEnModificacion(false);
});

// Listener para el botón "# Modificar historia"
btnModHistoria.addEventListener("click", function () {
    setEnModificacion(true);
});

// Listener para cerrar el modal
btnCerrarModal.addEventListener('click', () => {
    setEnModificacion(null);
    limpiarCamposHistoria();
});

// Listener para guardar el modal
btnGuardarHistoria.addEventListener('click', () => {
    agregarHistoriaUsuario();
});

// Listener para la bandera "enModificacion" oyendo al evento personalizado
window.addEventListener('modificandoDatos', (evento) => {
    const estadoActual = evento.detail.activo;
    if (estadoActual === null) {
        panelAgregarMod.classList.remove('activo'); // Oculta el modal
    } else {
        panelAgregarMod.classList.add('activo');    // Muestra el modal
    }
});

/**
 * Función que cambia la bandera y dispara el evento personalizado
 */
function setEnModificacion(nuevoValor) {
    if (enModificacion !== nuevoValor) {
        enModificacion = nuevoValor;

        const evento = new CustomEvent('modificandoDatos', {
            detail: { activo: enModificacion }
        });
        window.dispatchEvent(evento);
    }
}

// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === panelAgregarMod) {
        setEnModificacion(null);
        limpiarCamposHistoria();
    }
});

function verificarCamposAdd(){
    let verificado = true;
    let elementosDom = [inpTitulo, inpDescripccion, inpCriterios, inpValor, inpSprintAsig];
    
    elementosDom.forEach(elemento => {
        if(elemento.value.trim() === ""){
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if(elemento === inpTitulo){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "El nombre no debe llevar numeros o simbolos";
                    verificado = false;
                } else {
                    if(verificarTituloUnico(elemento)){
                        elemento.style.border = "2px solid blue";
                    } else {
                        verificado = false;
                    }
                }
            }
            if(elemento === inpDescripccion){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpCriterios){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese criterios adecuados";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpValor){
                if(!patronRangoValor.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpSprintAsig){
                if(!patronRangoValor.test(elemento.value.trim())){
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

/**
 * Funcion para calcular el id
 */
function calcularId(){
    if(!datosHistorias || datosHistorias.length === 0){
        return 1;
    } else {
        let valorMayor = datosHistorias[0].id;
        for(let n = 1; n < datosHistorias.length; n++){
            let sigValor = datosHistorias[n].id;
            if(valorMayor < sigValor){
                valorMayor = sigValor;
            }
        }
        return (valorMayor + 1);
    }
}

/**
 * Funcion que verifica si existe una historia con un titulo igual
 */
function verificarTituloUnico(inputDom){
    if(!datosHistorias){
        return true;
    } else {
        for(let n = 0; n < datosHistorias.length; n++){
            if(datosHistorias[n].titulo === inputDom.value.trim() || datosHistorias[n].nombre === inputDom.value.trim()){
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
async function obtenerHistorias(){
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


function agregarNuevaHistoria(){
    //Se da de alta una bandera, si llega al final del metodo y pasa las verificaciones el empleado es valido.
    let historiaValida=verificarCamposAdd();
    //Se verifican la informacion ingresada en los campos
    if(historiaValida){
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

    let nombre = inpTitulo.value.trim();
    let descripcion = inpDescripccion.value.trim();
    let criterios = inpCriterios.value.trim();
    let valor = inpValor.value.trim();
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
    
    if(resultado.ok || respuesta.status === 201){
        alert(resultado.mensaje || "Historia agregada correctamente");
        
        // Limpiamos los campos de los filtros para que la nueva historia se vea inmediatamente
        inputFiltroId.value = "";
        inputFiltroNombre.value = "";
        inputFiltroValor.value = "";
        inputFiltroSprint.value = "";

        // Volvemos a inicializar el backlog para actualizar la lista, incluyendo la nueva historia
        await inicializarBacklog();
        
        // Se limpian los campos de la sección agregar
        limpiarCamposHistoria();
        // Se oculta el modal
        setEnModificacion(null);
    } else {
        alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
    }
}

function cargar_cabecera_inicial(){
    document.getElementById("cabecera-mensajes").style.display = "block";
}

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
