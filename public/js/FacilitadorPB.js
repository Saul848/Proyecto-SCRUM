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
const inpAddDescripcion = document.getElementById("inpAddDescripccion");
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

//Grupo de elementos Dom con inputs del modal Agregar historia
const inpModalAdd = [inpAddTitulo, inpAddDescripcion, inpAddValor];

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

//Grupo de elementos Dom con inputs del modal Agregar historia
const inpModalMod = [inpModTitulo, inpModDescripcion, inpModValor];

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];
 // Índice actabasado en 0
let currentIndexAdd = 0;
let currentIndexMod = 0;
//funcion prueba ale 
window.cargarGrafica = async function (tipo) {
 if (tipo === "sprint") {
  await cargarBurndownSprint();
  return;
}

if (tipo !== "product-backlog") return;

  const contenedor =
    document.getElementById("contenedor-grafica-activa");
  const titulo =
    document.getElementById("titulo-grafica-activa");
  const areaDatos =
    document.getElementById("area-tabla-datos");
  const canvas =
    document.getElementById("chartBurndownCanvas");

  if (!contenedor || !titulo || !areaDatos || !canvas) {
    console.error("Faltan elementos HTML de la gráfica.");
    return;
  }

  contenedor.style.display = "block";
  titulo.textContent = "Burndown del Product Backlog";
  areaDatos.textContent = "Cargando…";

  try {
    if (typeof Chart === "undefined") {
      throw new Error("Chart.js no está cargado.");
    }

    Chart.getChart(canvas)?.destroy();

    const proyecto = JSON.parse(
      sessionStorage.getItem("proyectoActivo")
    );

    const idProyecto = Number(proyecto?.id);

    if (!Number.isInteger(idProyecto) || idProyecto <= 0) {
      throw new Error("No se encontró un proyecto activo válido.");
    }

    const respuesta = await fetch(
      `/proyectos/product-backlog-por-sprint/${idProyecto}`
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (!resultado.ok || !Array.isArray(resultado.datos)) {
      throw new Error("Respuesta del servidor inválida.");
    }

    const sprints = resultado.datos;

    if (sprints.length === 0) {
      areaDatos.textContent = "Este proyecto todavía no tiene sprints.";
      return;
    }

    const totalInicial = sprints.reduce(
      (suma, sprint) => suma + Number(sprint.total_horas),
      0
    );

    const etiquetas = [
      "Inicio",
      ...sprints.map(s => `Sprint ${s.no_iteracion}`)
    ];

    // Descenso ideal uniforme por sprint.
    const ideales = etiquetas.map((_, indice) =>
      Number(
        (totalInicial * (1 - indice / sprints.length)).toFixed(2)
      )
    );

    /*
     * Inicio: esfuerzo planificado inicial.
     * Los cierres reales quedan vacíos hasta registrar su avance.
     * null significa "sin medición", NO cero horas.
     */
    
   /* const restantes = [
      totalInicial,
      ...sprints.map(() => null)
    ];
    */

    // PRUEBA: horas avanzadas durante cada sprint.
        // Ejemplo: avanzamos 6 horas en el primero y 9 en el segundo.
        const avancesPrueba = [6, 9];

        let pendientes = totalInicial;

        const restantes = [
        totalInicial,
        ...sprints.map((sprint, indice) => {
            const avance = avancesPrueba[indice] ?? 0;

            pendientes = Math.max(0, pendientes - avance);

            return Number(pendientes.toFixed(2));
        })
        ];

    const planificadas = [
      0,
      ...sprints.map(s => Number(s.historias_planificadas))
    ];

    const terminadas = [
      0,
      ...sprints.map(() => null)
    ];

    // Tabla junto a la gráfica.
    const tabla = document.createElement("table");
    tabla.style.width = "100%";
    tabla.style.borderCollapse = "collapse";

    const encabezado = tabla.createTHead().insertRow();

    [
      "Sprint",
      "Horas restantes",
      "Historias terminadas",
      "Historias planificadas",
      "Ideal"
    ].forEach(texto => {
      const th = document.createElement("th");
      th.textContent = texto;
      encabezado.append(th);
    });

    const cuerpo = tabla.createTBody();

    etiquetas.forEach((etiqueta, indice) => {
      const fila = cuerpo.insertRow();

      [
        etiqueta,
        restantes[indice],
        terminadas[indice],
        planificadas[indice],
        ideales[indice]
      ].forEach(valor => {
        const celda = fila.insertCell();

        celda.textContent = valor === null
          ? "Sin registro"
          : typeof valor === "number"
            ? valor.toLocaleString("es-MX", {
                maximumFractionDigits: 2
              })
            : valor;
      });
    });

    tabla.querySelectorAll("th, td").forEach(celda => {
      celda.style.padding = "8px";
      celda.style.borderBottom = "1px solid #dbe4ed";
      celda.style.textAlign = "left";
    });

    const aviso = document.createElement("p");
    aviso.textContent =
  "Simulación: se descuentan avances de prueba de 6 y 9 horas. " +
  "No representan avances reales registrados.";
    areaDatos.replaceChildren(tabla, aviso);

    new Chart(canvas, {
      type: "bar",

      data: {
        labels: etiquetas,

        datasets: [
          {
            type: "line",
            label: "Horas restantes",
            data: restantes,
            borderColor: "#22c55e",
            backgroundColor: "#22c55e",
            pointRadius: 4,
            tension: 0,
            spanGaps: false,
            yAxisID: "horas",
            order: 0
          },
          {
            type: "line",
            label: "Ideal",
            data: ideales,
            borderColor: "#0284c7",
            backgroundColor: "#0284c7",
            pointRadius: 4,
            tension: 0,
            yAxisID: "horas",
            order: 0
          },
          {
            type: "bar",
            label: "Historias planificadas",
            data: planificadas,
            backgroundColor: "#38bdf8",
            yAxisID: "historias",
            order: 1
          },
          {
            type: "bar",
            label: "Historias terminadas",
            data: terminadas,
            backgroundColor: "#86efac",
            yAxisID: "historias",
            order: 1
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          title: {
            display: true,
            text: "BURNDOWN"
          },
          legend: {
            position: "bottom"
          }
        },

        scales: {
          x: {
            title: {
              display: true,
              text: "Sprint"
            }
          },

          horas: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: {
              display: true,
              text: "Horas calculadas"
            }
          },

          historias: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: "Cantidad de historias"
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error cargando burndown:", error);
    areaDatos.textContent = error.message;
  }
};
async function cargarBurndownSprint() {
  const contenedor =
    document.getElementById("contenedor-grafica-activa");
  const titulo =
    document.getElementById("titulo-grafica-activa");
  const areaDatos =
    document.getElementById("area-tabla-datos");
  const canvas =
    document.getElementById("chartBurndownCanvas");

  if (!contenedor || !titulo || !areaDatos || !canvas) {
    console.error("Faltan elementos HTML de la gráfica.");
    return;
  }

  contenedor.style.display = "block";
  titulo.textContent = "Burndown del Sprint";
  areaDatos.textContent = "Cargando sprints…";

  try {
    if (typeof Chart === "undefined") {
      throw new Error("Chart.js no está cargado.");
    }

    Chart.getChart(canvas)?.destroy();

    const proyecto = JSON.parse(
      sessionStorage.getItem("proyectoActivo")
    );

    const idProyecto = Number(proyecto?.id);

    if (!Number.isInteger(idProyecto) || idProyecto <= 0) {
      throw new Error("No se encontró un proyecto activo válido.");
    }

    const respuesta = await fetch(
      `/proyectos/product-backlog-por-sprint/${idProyecto}`
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (!resultado.ok || !Array.isArray(resultado.datos)) {
      throw new Error("Respuesta del servidor inválida.");
    }

    const sprints = resultado.datos;

    if (!sprints.length) {
      areaDatos.textContent = "Este proyecto no tiene sprints.";
      return;
    }

    // Selector de sprint.
    const etiquetaSelector = document.createElement("label");
    etiquetaSelector.textContent = "Selecciona un sprint: ";

    const selector = document.createElement("select");
    selector.style.padding = "8px";
    selector.style.marginBottom = "12px";

    sprints.forEach(sprint => {
      const opcion = document.createElement("option");
      opcion.value = String(sprint.id_sprint);
      opcion.textContent = `Sprint ${sprint.no_iteracion}`;
      selector.append(opcion);
    });

    etiquetaSelector.append(selector);

    const detalle = document.createElement("p");
    const zonaTabla = document.createElement("div");
    zonaTabla.style.maxHeight = "280px";
    zonaTabla.style.overflowY = "auto";

    const aviso = document.createElement("p");
    aviso.textContent =
      "Simulación: las fechas y las horas iniciales vienen de la BD. " +
      "Los avances diarios son datos de prueba.";

    areaDatos.replaceChildren(
      etiquetaSelector,
      detalle,
      zonaTabla,
      aviso
    );

    function pintarSprint() {
      Chart.getChart(canvas)?.destroy();

      try {
        const sprint = sprints.find(
          s => String(s.id_sprint) === selector.value
        );

        if (!sprint) {
          throw new Error("No se encontró el sprint seleccionado.");
        }

        const totalInicial = Number(sprint.total_horas);

        if (!Number.isFinite(totalInicial) || totalInicial < 0) {
          throw new Error("Las horas del sprint no son válidas.");
        }

        // Fechas UTC para evitar cambios por zona horaria.
        function convertirFecha(valor) {
          if (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
          ) {
            return NaN;
          }

          return Date.parse(`${valor}T00:00:00Z`);
        }

        const inicio = convertirFecha(sprint.fecha_inicio);
        const fin = convertirFecha(sprint.fecha_fin);

        if (!Number.isFinite(inicio) || !Number.isFinite(fin)) {
          throw new Error("El sprint necesita fechas de inicio y fin válidas.");
        }

        if (fin < inicio) {
          throw new Error("La fecha final es anterior a la inicial.");
        }

        const milisegundosDia = 86400000;

        // Se incluyen ambos extremos y todos los días calendario.
        const cantidadDias =
          Math.round((fin - inicio) / milisegundosDia) + 1;

        const etiquetas = ["Inicio"];
        const fechas = ["Antes del primer día"];

        for (let indice = 0; indice < cantidadDias; indice++) {
          const fecha = new Date(
            inicio + indice * milisegundosDia
          );

          etiquetas.push(`Día ${indice + 1}`);

          fechas.push(
            fecha.toLocaleDateString("es-MX", {
              timeZone: "UTC"
            })
          );
        }

        // Ideal: reducción uniforme al cierre de cada día.
       // Ideal: redondeado al entero más cercano.
const ideales = etiquetas.map((_, indice) =>
  Math.round(totalInicial * (1 - indice / cantidadDias))
);

        /*
         * AVANCES DE PRUEBA POR DÍA.
         * Día 1: 1 hora; día 2: 0.5; día 3: 0...
         * Puedes cambiar estos valores.
         * Los días sin valor se simulan con avance cero.
         */
       const avancesPrueba = [1, 1, 0, 2, 1, 0, 1];

        let pendientes = totalInicial;

        const restantes = [totalInicial];
        const avancesAplicados = [0];

        for (let indice = 0; indice < cantidadDias; indice++) {
          const solicitado = avancesPrueba[indice] ?? 0;

          // No descontar más horas de las que quedan.
          const aplicado = Math.min(
            pendientes,
            Math.max(0, solicitado)
          );

          pendientes = Number(
            (pendientes - aplicado).toFixed(2)
          );

          avancesAplicados.push(aplicado);
          restantes.push(pendientes);
        }

        titulo.textContent =
          `Burndown del Sprint ${sprint.no_iteracion}`;

        detalle.textContent =
          `Horas iniciales: ${totalInicial}. ` +
          `Duración: ${cantidadDias} días calendario. ` +
          `Del ${fechas[1]} al ${fechas[fechas.length - 1]}.`;

        const tabla = document.createElement("table");
        tabla.style.width = "100%";
        tabla.style.borderCollapse = "collapse";

        const encabezado = tabla.createTHead().insertRow();

        [
          "Día",
          "Fecha",
          "Avance simulado (h)",
          "Horas restantes",
          "Ideal"
        ].forEach(texto => {
          const th = document.createElement("th");
          th.textContent = texto;
          encabezado.append(th);
        });

        const cuerpo = tabla.createTBody();

        etiquetas.forEach((etiqueta, indice) => {
          const fila = cuerpo.insertRow();

          [
            etiqueta,
            fechas[indice],
            avancesAplicados[indice],
            restantes[indice],
            ideales[indice]
          ].forEach(valor => {
            const celda = fila.insertCell();

            celda.textContent =
              typeof valor === "number"
                ? valor.toLocaleString("es-MX", {
                    maximumFractionDigits: 2
                  })
                : valor;
          });
        });

        tabla.querySelectorAll("th, td").forEach(celda => {
          celda.style.padding = "8px";
          celda.style.borderBottom = "1px solid #dbe4ed";
          celda.style.textAlign = "left";
        });

        zonaTabla.replaceChildren(tabla);

        new Chart(canvas, {
          type: "line",

          data: {
            labels: etiquetas,
            datasets: [
              {
                label: "Horas restantes (simulación)",
                data: restantes,
                borderColor: "#22c55e",
                backgroundColor: "#22c55e",
                pointRadius: 3,
                tension: 0,
                fill: false
              },
              {
                label: "Ideal",
                data: ideales,
                borderColor: "#0284c7",
                backgroundColor: "#0284c7",
                pointRadius: 3,
                tension: 0,
                fill: false
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
              title: {
                display: true,
                text: `BURNDOWN — SPRINT ${sprint.no_iteracion}`
              },
              legend: {
                position: "bottom"
              }
            },

            scales: {
              x: {
                title: {
                  display: true,
                  text: "Días del sprint"
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Horas pendientes"
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Error dibujando sprint:", error);
        detalle.textContent = error.message;
        zonaTabla.replaceChildren();
      }
    }

    selector.addEventListener("change", pintarSprint);
    pintarSprint();

  } catch (error) {
    console.error("Error cargando sprint:", error);
    areaDatos.textContent = error.message;
  }
}
/**
 * Función para renderizar dinámicamente las historias de usuario en el DOM
 */
async function renderizarHistorias() {
    // 1. Solicitamos los datos al servidor y los guardamos en la variable
    datosHistorias = await obtenerHistorias(parseInt(1,10));

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

        // Obtenemos los criterios de la historia o colocamos un mensaje por defecto si está vacío
        const criterios = historia.criterios && historia.criterios.length > 0 
            ? historia.criterios 
            : [{ criterio: "Sin criterios de aceptación" }];

        let criteriosTextAreasHTML = "";
        criterios.forEach((crit, index) => {
            const claseActiva = index === 0 ? "active" : "";
            // Usamos un textarea con la clase específica y readonly para visualización en tabla
            criteriosTextAreasHTML += `<textarea class="criterio-input-fila ${claseActiva}" readonly placeholder="Criterio...">${crit.criterio || ""}</textarea>`;
        });

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            
            <!-- Contenedor con botones laterales para los Criterios de Aceptación -->
            <div class="criterio-fila-wrapper" data-index="0">
                <button type="button" class="btn-fila-lateral btn-fila-izq" onclick="cambiarCriterioFila(${historia.id}, -1)" title="Anterior">◀</button>
                <div class="criterios-fila-columna" id="criteriosContainer_${historia.id}">
                    ${criteriosTextAreasHTML}
                </div>
                <button type="button" class="btn-fila-lateral btn-fila-der" onclick="cambiarCriterioFila(${historia.id}, 1)" title="Siguiente">▶</button>
            </div>

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
 * Función para navegar entre los criterios de aceptación directamente en la tabla de filas
 * @param {number} historiaId ID de la historia de usuario
 * @param {number} direccion Dirección del movimiento (-1 para izquierda, 1 para derecha)
 */
function cambiarCriterioFila(historiaId, direccion) {
    const wrapper = document.querySelector(`#DivFilaHistoria_${historiaId} .criterio-fila-wrapper`);
    const container = document.getElementById(`criteriosContainer_${historiaId}`);
    if (!container || !wrapper) return;

    const textareas = container.querySelectorAll("textarea");
    if (textareas.length <= 1) return;

    // Obtenemos el índice actual guardado en el atributo data-index
    let currentIndex = parseInt(wrapper.getAttribute("data-index") || "0", 10);
    
    // Calculamos el nuevo índice
    currentIndex += direccion;

    // Control de límites para que no rebase el número de criterios existentes
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= textareas.length) currentIndex = textareas.length - 1;

    // Guardamos el nuevo índice
    wrapper.setAttribute("data-index", currentIndex);

    // Activamos únicamente el textarea correspondiente y ocultamos los demás
    textareas.forEach((ta, idx) => {
        if (idx === currentIndex) {
            ta.classList.add("active");
        } else {
            ta.classList.remove("active");
        }
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
    inpAddDescripcion.value = "";
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
    agregarNuevaHistoria();
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

//Funcion para verificar el contenido de los campos de acuerdo al los patrones
function verificarCampos(grupoInputs){
    let verificado = true;
    
    grupoInputs.forEach(elemento => {
        if(elemento.value.trim() === ""){
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if(elemento === inpAddTitulo || elemento === inpModTitulo){
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
            if(elemento === inpAddDescripcion || elemento === inpModDescripcion){
                if(!patronNombre.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if(elemento === inpAddValor || elemento ===inpModValor){
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

//Metodo que verifica la seccion de criterios de aceptacion.
function verificarCriterios(contenedorCriteriosModal) {
    let verificado = true;
    //Se obtienen todos los textarea del contenedor elegido
    let criterios = contenedorCriteriosModal.querySelectorAll('textarea')
    //Se recorren y se verifican si estan vacios
    criterios.forEach((elemento, index) => {
        if (elemento.value.trim() === "") {
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            alert("Tu criterio de aceptacion numero"+(index+1)+"esta vacio")
            verificado = false;   
        } else {
            if (!patronNombre.test(elemento.value.trim())) {
                elemento.style.border = "2px solid red";
                elemento.value = "";
                elemento.placeholder = "El criterio no debe llevar caracteres especiales";
                alert("Tu criterio de aceptacion numero"+(index+1)+"esta mal redactado")
                verificado = false;
            }
        }             
    })
    return verificado;
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
async function obtenerHistorias(idProyecto) {
    const respuesta = await fetch(`/historias/historiasPB/${idProyecto}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
        alert(datos.mensaje);
        return [];
    }
    
    const historias = datos.data || [];
    return historias;
}


function agregarNuevaHistoria() {
    //Se da de alta una bandera, si llega al final del metodo y pasa las verificaciones el empleado es valido.
    let historiaValida = verificarCampos(inpModalAdd);
    //Mismo caso que arriba
    let criteriosValidos = verificarCriterios(containerAdd)
    //Se verifican la informacion ingresada en los campos
    if (historiaValida && criteriosValidos) {
        agregarHistoriaUsuario(1)
    }
}

/**
 * Valida los campos del formulario, envía una petición POST al servidor para registrar
 * una nueva historia de usuario, limpia los filtros actuales, recarga la lista maestra de historias,
 * y oculta el modal de creación si el registro es exitoso.
 * @async
 * @function agregarHistoriaUsuario
 * @param {idProyecto} Integer El id del proyecto donde se agregara la nueva hsitoria de usuario.
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa el proceso de guardado y actualización.
 */
async function agregarHistoriaUsuario(idProyecto) {
    let nombre = inpAddTitulo.value.trim();
    let descripcion = inpAddDescripcion.value.trim();
    let criteriosDom = containerAdd.querySelectorAll('textarea')
    let criteriosArray= []
    criteriosDom.forEach((element) =>{
        criteriosArray.push({criterio:element.value.trim()})
    });
    let valor = parseInt(inpAddValor.value.trim(), 10);
    const respuesta = await fetch("/historias/historiasPB", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion,
            criterios: criteriosArray,
            valor: valor,
            idProyecto: idProyecto
        })
    });

    const resultado = await respuesta.json();

    if (resultado.success || respuesta.status === 201) {
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
    inicializarBuscadorKanban();
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

/**
 * Inicializa el comportamiento de búsqueda en tiempo real para el tablero Kanban.
 * Escucha los eventos de entrada del usuario en el input de búsqueda y filtra
 * de forma dinámica las tarjetas visibles según el título o contenido coincidente.
 * 
 * @function inicializarBuscadorKanban
 * @returns {void} No retorna ningún valor.
 */
function inicializarBuscadorKanban() {
    const inputBusqueda = document.getElementById("inputBusquedaKanban");
    
    if (!inputBusqueda) return;

    inputBusqueda.addEventListener("input", (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();
        const tarjetas = document.querySelectorAll(".tarjeta-historia");

        tarjetas.forEach(tarjeta => {
            const tituloElemento = tarjeta.querySelector(".historia-titulo");
            const textoTitulo = tituloElemento ? tituloElemento.textContent.toLowerCase() : "";
            const contenidoCompleto = tarjeta.textContent.toLowerCase();

            // Si el título o el contenido incluyen lo que escribió el usuario, se muestra; si no, se oculta
            if (textoTitulo.includes(textoBusqueda) || contenidoCompleto.includes(textoBusqueda)) {
                tarjeta.style.display = ""; 
            } else {
                tarjeta.style.display = "none"; 
            }
        });
    });
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
    todasLasHistorias = await obtenerHistorias(1);
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

        // Obtenemos los criterios de la historia o colocamos un mensaje por defecto si está vacío
        const criterios = historia.criterios && historia.criterios.length > 0 
            ? historia.criterios 
            : [{ criterio: "Sin criterios de aceptación" }];

        let criteriosTextAreasHTML = "";
        criterios.forEach((crit, index) => {
            const claseActiva = index === 0 ? "active" : "";
            // Usamos un textarea con la clase específica y readonly para visualización en tabla
            criteriosTextAreasHTML += `<textarea class="criterio-input-fila ${claseActiva}" readonly placeholder="Criterio...">${crit.criterio || ""}</textarea>`;
        });

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            
            <!-- Contenedor con botones laterales para los Criterios de Aceptación -->
            <div class="criterio-fila-wrapper" data-index="0">
                <button type="button" class="btn-fila-lateral btn-fila-izq" onclick="cambiarCriterioFila(${historia.id}, -1)" title="Anterior">◀</button>
                <div class="criterios-fila-columna" id="criteriosContainer_${historia.id}">
                    ${criteriosTextAreasHTML}
                </div>
                <button type="button" class="btn-fila-lateral btn-fila-der" onclick="cambiarCriterioFila(${historia.id}, 1)" title="Siguiente">▶</button>
            </div>

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

//////////////////////////////////////////////////////////////
// Carga dinámica del modal de planning poker para facilitador
//////////////////////////////////////////////////////////////

let planningPokerCargando = false;
let planningPokerJS = null;

async function abrirPlanningPokerParaFacilitador() {
    const sprintId = 1;
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, name: "Facilitador Pruebas" };
    const listaHistoriasDesdeVista = null;
    const role = 'facilitador'; 

    const zonaDeTrabajo = document.getElementById("zonaDeTrabajo");
    if (!zonaDeTrabajo) return;

    if (planningPokerCargando) return;
    planningPokerCargando = true;

    try {
        // 1. Cargar HTML del modal si no existe
        if (!document.getElementById("modal-planning-poker-facilitador")) {
            const respuesta = await fetch("./planningPokerFacilitador.html");
            const html = await respuesta.text();
            zonaDeTrabajo.insertAdjacentHTML("beforeend", html);
        }

        // 2. Cargar el JS del facilitador si no existe
        if (!planningPokerJS) {
            planningPokerJS = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "../js/planningPokerFacilitador.js";
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }

        await planningPokerJS;

        // 3. Inicializar componentes visuales
        const contenedor = document.getElementById("cont-planning-poker");
        window.inicializarPlanningPokerFacilitador(contenedor);
        mostrarModal("modal-planning-poker-facilitador");

        // 4. INICIALIZAR SOCKET.IO
        const socket = io(); 

        const historiasDePrueba = [
            { id: 1, titulo: "Autenticación", descripcion: "Permitir iniciar sesión" },
            { id: 2, titulo: "Splash Screen", descripcion: "Mostrar pantalla de carga" },
            { id: 3, titulo: "Exportar PDF", descripcion: "Exportar datos a formato PDF" },
            { id: 4, titulo: "Generar PB", descripcion: "LOREM" },
            { id: 5, titulo: "Colocar Musica a la aplicacion", descripcion: "Musica relajante para el cliente" },
            { id: 6, titulo: "Prueba", descripcion: "Lorem" },
            { id: 7, titulo: "Registro de Usuarios", descripcion: "Permitir registrar nuevos usuarios en el sistema" }
        ];

        socket.emit("join-planning-session", {
            sprintId: sprintId ?? 1,
            user: usuarioActual,
            role: role ?? "facilitador",
            stories: listaHistoriasDesdeVista ?? historiasDePrueba
        });

        // 5. Escuchar eventos del servidor
        socket.on("sync-session-state", (data) => {
            actualizarUIHistoria(contenedor, data);
            contenedor.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
        });

        socket.on("load-next-story", (data) => {
            actualizarUIHistoria(contenedor, data);
            contenedor.planningPokerFacilitador?.reiniciarVistaVotacion();
            if (data.participants && data.votes) {
                contenedor.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
            }
        });

        // Escuchar reseteo al repetir votación
        socket.on("vote-reset", (data) => {
            contenedor.planningPokerFacilitador?.reiniciarVistaVotacion();
            if (data.participants && data.votes) {
                contenedor.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
            }
        });

        socket.on("vote-progress", (data) => {
            contenedor.planningPokerFacilitador?.actualizarEstadoVotacion({
                votados: data.totalVoted,
                total: data.totalParticipants,
                titulo: "¡Votando!"
            });
            contenedor.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
        });

        socket.on("cards-revealed", (data) => {
            contenedor.planningPokerFacilitador?.renderizarResultados(data);
        });

        // Redireccion a reuniones al finalizar la sesion, o carga de modal, ETC.
        socket.on("session-finished", () => {
            alert("¡Se han terminado todas las historias del Planning Poker!");
            const modal = document.getElementById("modal-planning-poker-facilitador");
            if (modal) modal.style.display = "none";
            socket.disconnect();
            
            // REDIRECCIÓN A TU PANTALLA DE REUNIONES O VISTA PRINCIPAL O MODAL
            window.location.href = "./reuniones.html"; // Cambia la ruta según proyecto
        });

        // 6. Enviar acciones del facilitador al servidor
        contenedor.addEventListener("planning-poker:accion", (evento) => {
            const { accion, ...datos } = evento.detail;

            if (accion === "revelar-cartas") {
                socket.emit("reveal-cards", { sprintId });
            } else if (accion === "repetir-votacion") {
                socket.emit("repeat-vote", { sprintId });
            } else if (accion === "saltar-historia") {
                socket.emit("skip-story", { sprintId });
            } else if (accion === "confirmar-estimacion") {
                socket.emit("next-story", { sprintId, finalPoints: datos.estimacion });
            }
        });

    } catch (error) {
        console.error("Error al iniciar Planning Poker:", error);
        planningPokerJS = null;
    } finally {
        planningPokerCargando = false;
    }
}

function actualizarUIHistoria(contenedor, data) {
    if (contenedor && contenedor.planningPokerFacilitador) {
        contenedor.planningPokerFacilitador.actualizarHistoria({
            titulo: data.currentStory.titulo,
            descripcion: data.currentStory.descripcion,
            numero: data.storyIndex + 1,
            total: data.totalStories,
            sprint: "Sprint Actual"
        });
    }
}
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", ()=>{
    cargarDefinicionDeHecho(JSON.parse(sessionStorage.getItem('usuarioActivo').id));
})

document.getElementById("btn-storage").addEventListener('click', ()=>{
    console.log("presionado" + sessionStorage.getItem('usuarioActivo'))
})