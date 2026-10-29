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
const inpAddDescripcion = document.getElementById("inpAddDescripccion");
const inpAddCriterios = document.getElementById("inpAddCriterios");
const inpAddValor = document.getElementById("inpAddValor");
const inpAddSprintAsig = document.getElementById("inpAddSprintAsig");
// Elementos inputs del modal modificar
const inpModTitulo = document.getElementById("inpModTitulo");
const inpModDescripcion = document.getElementById("inpModDescripccion");
const inpModCriterios = document.getElementById("inpModCriterios");
const inpModValor = document.getElementById("inpModValor");
const inpModSprintAsig = document.getElementById("inpModSprintAsig");

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Elementos bandera
let enModificacion = null; // null = oculto, true/false = visible
let modificando = false;
// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];
//Elementos input add
const elementosDomAdd = [inpAddTitulo, inpAddDescripcion, inpAddCriterios, inpAddValor, inpAddSprintAsig];
//Elementos input mod
const elementosDomMod = [inpModTitulo, inpModDescripcion, inpModCriterios, inpModValor, inpModSprintAsig];

//Variable que almacena el id de la ultima historia seleccionada
let idUltimoPanelSeleccionado = null;
//Variable para obtener la posicion de historias de usuario (Se utiliza en una parte muy especifica del programa)
let posicion = null;

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
        filaHtml.onclick = () => iluminarHistoria(historia.id);
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
function limpiarCamposHistoria(grupoInputs) {
    grupoInputs.forEach(elemento=>{
        elemento.value=""
    });
}

// Listener para el botón "+ Añadir nueva historia"
btnAgregarHistoria.addEventListener("click", function () {
    modalAgregarHistoria.classList.add('activo');// Muestra el modal
});

// Listener para el botón "# Modificar historia"
btnModHistoria.addEventListener("click", function () {
    if(modificando){
        //Cargamos el contenido a modificar en los inputs del modal
        recuperarContenido(descomponerId(idUltimoPanelSeleccionado))
        modalModificarHistoria.classList.add('activo');// Muestra el modal
    }else{
        alert("No has seleccionado ninguna historia de usuario")
    }
});

// Listener para cerrar el modal
btnCerrarModalAdd.addEventListener('click', () => {
    modalAgregarHistoria.classList.remove('activo');// Muestra el modal
    limpiarCamposHistoria(elementosDomAdd);
});

// Listener para cerrar el modal
btnCerrarModalMod.addEventListener('click', () => {
    modalModificarHistoria.classList.remove('activo');// Muestra el modal
    limpiarCamposHistoria(elementosDomMod);
});

// Listener para guardar historia en el modal
btnGuardarHistoria.addEventListener('click', () => {
    agregarHistoriaUsuario();
});

// Listener para modificar historia en el modal
btnModificarHistoria.addEventListener('click', () => {
    agregarHistoriaUsuario();
});


// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === modalAgregarHistoria) {
        modalAgregarHistoria.classList.remove('activo');// Se oculta el modal
        limpiarCamposHistoria(elementosDomAdd);
    }
});

// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === modalModificarHistoria) {
        modalModificarHistoria.classList.remove('activo');// Muestra el modal
        limpiarCamposHistoria(elementosDomMod);
    }
});

//Funcion para verificar el contenido de los campos de acuerdo al los patrones
function verificarCampos(grupoInputs){
    let verificado = true;
    
    grupoInputs.forEach(elemento => {
        if(elemento.value.trim() === ""){
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if(elemento === inpAddTitulo||inpModTitulo){
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
            if(elemento === inpAddDescripcion||inpModDescripcion){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddCriterios||inpModCriterios){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese criterios adecuados";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddValor||inpModValor){
                if(!patronRangoValor.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddSprintAsig||inpModSprintAsig){
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

//Metodo para recuperar el contenido de la historia de usuario.
function recuperarContenido(id){
    //Se define una variable para guardar la posicion de la historia en el Arreglo
    posicion;
    for(let m=0; m<datosHistorias.length; m++){
        if(datosHistorias[m].id === id){
            posicion = m;
        }
    }
    //Si la posicion de la historia de usuario seleccionada fue encontrada
    if(posicion!==null){
        //Se vacian los inputs del modal Modificar
        elementosDomMod.forEach(elemento =>{
            elemento.textContent="";
        })
        //Se recupera la informacion correspondiente
        inpModTitulo.value=datosHistorias[posicion].nombre
        inpModDescripcion.value=datosHistorias[posicion].descripcion
        inpModCriterios.value=datosHistorias[posicion].criterios_de_aceptacion
        inpModValor.value=datosHistorias[posicion].valor
        inpModSprintAsig.value=datosHistorias[posicion].asignado_al_sprint
    }else{
        alert("No se pudo recuperar la informacion de la historia de usuario")
        return
    }
}

//Funcion que verifica que el contenido de los nuevos campos no sea igual al anterior 
function validarContenidoIdentico(){
    let refDatos = [nombre, descripcion, criterios_de_aceptacion, valor, asignado_al_sprint]
    for(let l=0; l<refDatos; l++){
        if(datosHistorias[posicion]+'.${refDatos[l]}'=== elementosDomMod[l].value){
            elementosDomMod[l].value="";
            elementosDomMod[l].placeholder="El valor es igual al valor antiguo";
            elementosDomMod[l].style.border = "2px solid red";
        }else{
            elementosDomMod[l].style.border = "2px solid blue";
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
    let historiaValida=verificarCampos(elementosDomAdd);
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
    let descripcion = inpAddDescripcion.value.trim();
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
        limpiarCamposHistoria(elementosDomAdd);
        modalAgregarHistoria.classList.remove('activo');// Oculta el modal
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

/**
 * Funcion que construye los datos de la historia y realiza la peticion POST
 */
async function modificarHistoriaUsuario(id) {
    // Primero verificamos que los campos cumplan las reglas
    if (!verificarCampos(elementosDomMod)) {
        return;
    }

    let nombre = inpModTitulo.value.trim();
    let descripcion = inpModDescripcion.value.trim();
    let criterios = inpModCriterios.value.trim();
    let valor = inpModValor.value.trim();
    let sprint = inpModSprintAsig.value.trim();

    const respuesta = await fetch("/historias", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id,
            nombre: nombre,
            descripcion: descripcion,
            criterios: criterios,
            valor: valor,
            sprint: sprint
        })
    });

    const resultado = await respuesta.json();
    
    if(resultado.ok || respuesta.status === 201){
        alert(resultado.mensaje || "Historia modificada correctamente");
        
        // Actualizamos la lista de historias dinámicamente llamando a nuestra función
        await renderizarHistorias();
        
        // Se limpian los campos de la sección modificar
        limpiarCamposHistoria(elementosDomMod);
        modalModificarHistoria.classList.remove('activo');// Oculta el modal
    } else {
        alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
    }
}

/**
 * Listener que detecta los clicks en pantalla para realizar acciones
 * y que devuelve los estados de los inputs a la normalidad cuando se da click sobre ellos.
 * 
 */
document.addEventListener("click", function(event){
    let historiaSeleccionada= event.target.closest('.DivFilaHistoria')
    if(historiaSeleccionada){
        //Si el click fue en un boton del la historia no hagas nada 
        if(event.target.closest('DivBtnComentar') || event.target.closest('DivBtnEliminar')){
            return
        }
        return
    //Si el click se hizo fuera del panel panelEmpleado
    }else{
        //Se limpia el ultimo panel de empleado seleccionado
        let ultimoPanel=document.getElementById(idUltimoPanelSeleccionado)
        if(ultimoPanel!==null){
            ultimoPanel.style.backgroundColor="";
        }
        modificando=false;
    }
});

/*
 * Funcion para iluminar al empleado seleccionado
 * @param {Number} El id del empleado
 * @returns {void} Se utiliza un return para cortar la ejecucion del metodo
 */
function iluminarHistoria(id){
    //Si hay un panel de empleado seleccionado anteriormente se devuelve a la normalidad
        if(idUltimoPanelSeleccionado!==null){
            document.getElementById(idUltimoPanelSeleccionado).style.backgroundColor="";   
        }
        //Construimos el id del ultimo panel seleccionado y lo guardamos en una variable
        idUltimoPanelSeleccionado=("DivFilaHistoria_"+id);
        //Iluminamos el panel actual
        document.getElementById(idUltimoPanelSeleccionado).style.setProperty('background-color', 'blue', 'important');
        //Se levanta una bandera
        modificando=true;
}

function descomponerId(panelDivFilaHistoria){
    return (Number(panelDivFilaHistoria.replace("DivFilaHistoria_", "")))
}
