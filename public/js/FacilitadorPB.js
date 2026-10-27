const btnAgregarHistoria = document.getElementById("btnAgregarHistoria");
const btnModHistoria = document.getElementById("btnModHistoria");
const modalAgregarHistoria = document.getElementById("modalAgregarHistoria");
const modalModificarHistoria = document.getElementById("modalModificarHistoria");
const divHistoria = document.getElementById("DivHistoria");
const btnCerrarModalAdd = document.getElementById("btnCerrarModal+");
const btnCerrarModalMod = document.getElementById("btnCerrarModal#");
const btnGuardarHistoria = document.getElementById("btnGuardarModal+");
const btnModificarHistoria = document.getElementById("btnGuardarModal#");
// Elementos inputs del modal agregar
const inpAddTitulo = document.getElementById("inpAddTitulo");
const inpAddDescripccion = document.getElementById("inpAddDescripccion");
const inpAddCriterios = document.getElementById("inpAddCriterios");
const inpAddValor = document.getElementById("inpAddValor");
const inpAddSprintAsig = document.getElementById("inpAddSprintAsig");
// Elementos inputs del modal modificar
const inpModTitulo = document.getElementById("inpModTitulo");
const inpModDescripccion = document.getElementById("inpModDescripccion");
const inpModCriterios = document.getElementById("inpModCriterios");
const inpModValor = document.getElementById("inpModValor");
const inpModSprintAsig = document.getElementById("inpModSprintAsig");

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Elementos bandera
let enModificacion = null; // null = oculto, true/false = visible

// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];
//Elementos input add
const elementosDomAdd = [inpAddTitulo, inpAddDescripccion, inpAddCriterios, inpAddValor, inpAddSprintAsig];
//Elementos input mod
const elementosDomMod = [inpModTitulo, inpModDescripccion, inpModCriterios, inpModValor, inpModSprintAsig];
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
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}" onclick="eliminarHistoriaUsuario(${historia.id})">🗑️</button>
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
    inpAddTitulo.value = "";
    inpAddDescripccion.value = "";
    inpAddCriterios.value = "";
    inpAddValor.value = "";
    inpAddSprintAsig.value = "";
}

// Listener para el botón "+ Añadir nueva historia"
btnAgregarHistoria.addEventListener("click", function () {
    modalAgregarHistoria.classList.add('activo');// Muestra el modal
});

// Listener para el botón "# Modificar historia"
btnModHistoria.addEventListener("click", function () {
    modalModificarHistoria.classList.add('activo');// Muestra el modal
});

// Listener para cerrar el modal
btnCerrarModalAdd.addEventListener('click', () => {
    modalAgregarHistoria.classList.remove('activo');// Muestra el modal
    limpiarCamposHistoria();
});

// Listener para cerrar el modal
btnCerrarModalMod.addEventListener('click', () => {
    modalModificarHistoria.classList.remove('activo');// Muestra el modal
    limpiarCamposHistoria();
});

// Listener para guardar el modal
btnGuardarHistoria.addEventListener('click', () => {
    agregarHistoriaUsuario();
});


// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === modalAgregarHistoria) {
        modalAgregarHistoria.classList.remove('activo');// Muestra el modal
        limpiarCamposHistoria();
    }
});

// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === modalModificarHistoria) {
        modalModificarHistoria.classList.remove('activo');// Muestra el modal
        limpiarCamposHistoria();
    }
});

function verificarCamposAdd(){
    let verificado = true;
    
    elementosDomAdd.forEach(elemento => {
        if(elemento.value.trim() === ""){
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if(elemento === inpAddTitulo){
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
            if(elemento === inpAddDescripccion){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddCriterios){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese criterios adecuados";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddValor){
                if(!patronRangoValor.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddSprintAsig){
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

function verificarCamposMod(){
    let verificado = true;
    elementosDomMod;
    
    elementosDomMod.forEach(elemento => {
        if(elemento.value.trim() === ""){
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if(elemento === inpModTitulo){
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
            if(elemento === inpModDescripccion){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpModCriterios){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese criterios adecuados";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpModValor){
                if(!patronRangoValor.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpModSprintAsig){
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

function recuperarContenido(id){
    let posicion;
    for(let m=0; m<datosHistorias.length; m++){
        if(datosHistorias[m].id === id){
            posicion = m;
        }
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
 * Funcion que construye los datos de la historia y realiza la peticion POST
 */
async function agregarHistoriaUsuario() {
    // Primero verificamos que los campos cumplan las reglas
    if (!verificarCamposAdd()) {
        return;
    }

    let nombre = inpAddTitulo.value.trim();
    let descripcion = inpAddDescripccion.value.trim();
    let criterios = inpAddCriterios.value.trim();
    let valor = inpAddValor.value.trim();
    let sprint = inpAddSprintAsig.value.trim();

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
        
        // Actualizamos la lista de historias dinámicamente llamando a nuestra función
        await renderizarHistorias();
        
        // Se limpian los campos de la sección agregar
        limpiarCamposHistoria();
        // Se oculta el modal
        setEnModificacion(null);
    } else {
        alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
    }
}

/**
 * Funcion que realiza la solicitud delete para eliminar una historia
 */
async function eliminarHistoriaUsuario(id) {
    const respuesta = await fetch("/historias", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idHistoria: id
        })
    });

    const resultado = await respuesta.json();
    
    if(resultado.ok || respuesta.status === 201){
        alert(resultado.mensaje || "Historia eliminada correctamente");
        // Actualizamos la lista de historias dinámicamente llamando a nuestra función
        await renderizarHistorias();
        // Se oculta el modal
        setEnModificacion(null);
    } else {
        alert(resultado.mensaje || resultado.error || "Error al eliminar la historia");
    }
}