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
const inpAddHoras = document.getElementById("inpAddHoras");
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
const inpModalAdd = [inpAddTitulo, inpAddDescripcion, inpAddValor, inpAddHoras];

// Elementos inputs del modal modificar
const inpModTitulo = document.getElementById("inpModTitulo");
const inpModDescripcion = document.getElementById("inpModDescripcion");
const inpModCriterios = document.getElementById("inpModCriterios");
const inpModValor = document.getElementById("inpModValor");
const inpModHoras = document.getElementById("inpModHoras");
const btnModificarHistoria = document.getElementById("btnGuardarModalMod");
const btnCerrarModalMod = document.getElementById("btnCerrarModalMod");

// Campos criterios de aceptacion
const containerMod = document.getElementById("contenedorMod");
const btnArribaMod = document.getElementById("btnArribaMod");
const btnAbajoMod = document.getElementById("btnAbajoMod");
const indicadorMod = document.getElementById("criterioIndicadorMod");
const btnAgregarCriterioMod = document.getElementById("btnAgregarCriterioMod");
const btnEliminarCriterioMod = document.getElementById("btnEliminarCriterioMod"); // <-- Nuevo

// Captura de elementos de filtro del DOM
const inputFiltroId = document.getElementById("inputFiltroId");
const inputFiltroNombre = document.getElementById("inputFiltroNombre");
const inputFiltroValor = document.getElementById("inputFiltroValor");
const inputFiltroSprint = document.getElementById("inputFiltroSprint");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

// Variables globales adicionales para filtros
let todasLasHistorias = [];

//Grupo de elementos Dom con inputs del modal Agregar historia
const inpModalMod = [inpModTitulo, inpModDescripcion, inpModValor, inpModHoras];

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000
let patronRangoHoras = /^(?:[0-9]{1,2}|100)$/; //Patron que me permite valores desde el 0 al 100 para las horas estimadas
// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];
 // Índice actabasado en 0
let currentIndexAdd = 0;
let currentIndexMod = 0;

// Banderas y variables de control para modificación
let modificando = false;
let idUltimoPanelSeleccionado = null;
let posicion = null;


const idProyectoActivo = JSON.parse(sessionStorage.getItem('proyectoActivo')).id;
if (idProyectoActivo){
  console.log("Te confirmo que el proyecto actual es: "+idProyectoActivo+ " de tipo "+(typeof idProyectoActivo))
}else{
    console.log('No hay ningún proyecto activo en la sesión.');
}

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
    const totalPuntosInicial = sprints.reduce(
      (suma, sprint) => suma + Number(sprint.total_puntos),
      0
    );

    const puntosIdeales = etiquetas.map((_, indice) =>
      Number(
        (totalPuntosInicial * (1 - indice / sprints.length)).toFixed(2)
      )
    );

    const puntosRestantes = [
      totalPuntosInicial,
      ...sprints.map(sprint =>
        sprint.puntos_restantes == null
          ? null
          : Number(sprint.puntos_restantes)
      )
    ];

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

  const restantes = [
  totalInicial,
  ...sprints.map(sprint =>
    sprint.horas_restantes == null
      ? null
      : Math.round(Number(sprint.horas_restantes))
  )
];

    const planificadas = [
      0,
      ...sprints.map(s => Number(s.historias_planificadas))
    ];

   const terminadas = [
  0,
  ...sprints.map(sprint =>
    sprint.historias_terminadas == null
      ? null
      : Number(sprint.historias_terminadas)
  )
];

    // Tabla junto a la gráfica.
    const tabla = document.createElement("table");
    tabla.style.width = "100%";
    tabla.style.borderCollapse = "collapse";

    const encabezado = tabla.createTHead().insertRow();

    [
    "Sprint",
    "Horas restantes",
    "Horas ideales",
    "Puntos restantes",
    "Puntos ideales",
    "Historias terminadas",
    "Historias planificadas"
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
        ideales[indice],
        puntosRestantes[indice],
        puntosIdeales[indice],
        terminadas[indice],
        planificadas[indice]
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
    aviso.textContent = sprints.some(sprint => sprint.es_prueba)
  ? "Mediciones consultadas desde la BD. Incluye datos de prueba."
  : "Mediciones consultadas desde la BD.";
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
            label: "Horas Ideales",
            data: ideales,
            borderColor: "#0284c7",
            backgroundColor: "#0284c7",
            pointRadius: 4,
            tension: 0,
            yAxisID: "horas",
            order: 0
          },
          {
            type: "line",
            label: "Puntos restantes",
            data: puntosRestantes,
            borderColor: "#9333ea",
            backgroundColor: "#9333ea",
            pointStyle: "rectRot",
            pointRadius: 5,
            tension: 0,
            spanGaps: false,
            yAxisID: "puntos",
            order: 0
          },
          {
            type: "line",
            label: "Puntos ideales",
            data: puntosIdeales,
            borderColor: "#f97316",
            backgroundColor: "#f97316",
            borderDash: [6, 4],
            pointRadius: 3,
            tension: 0,
            yAxisID: "puntos",
            order: 0
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
              text: "Horas pendientes"
            }
          },

          puntos: {
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
              text: "Puntos de historia pendientes"
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
    zonaTabla.style.overflowX = "auto";

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

    async function pintarSprint() {
      Chart.getChart(canvas)?.destroy();

      try {
        const sprint = sprints.find(
          s => String(s.id_sprint) === selector.value
        );

        if (!sprint) {
          throw new Error("No se encontró el sprint seleccionado.");
        }

        const totalInicial = Number(sprint.total_horas);
        const totalPuntosInicial = Number(sprint.total_puntos);

          if (!Number.isFinite(totalPuntosInicial) || totalPuntosInicial < 0) {
            throw new Error("Los puntos del sprint no son válidos.");
          }
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
const puntosIdeales = etiquetas.map((_, indice) =>
  Number(
    (totalPuntosInicial * (1 - indice / cantidadDias)).toFixed(2)
  )
);


        /*
         * AVANCES DE PRUEBA POR DÍA.   
         * Los días sin valor se simulan con avance cero.
         */
       const respuestaMediciones = await fetch(
  `/proyectos/burndown-diario/${idProyecto}/${sprint.id_sprint}`
);

if (!respuestaMediciones.ok) {
  throw new Error(
    `Error HTTP ${respuestaMediciones.status} al consultar mediciones`
  );
}

const resultadoMediciones = await respuestaMediciones.json();

if (
  !resultadoMediciones.ok ||
  !Array.isArray(resultadoMediciones.datos)
) {
  throw new Error("Las mediciones diarias no tienen el formato esperado.");
}

// Si se cambió el selector mientras cargaba, ignorar esta respuesta.
if (selector.value !== String(sprint.id_sprint)) return;

const mediciones = resultadoMediciones.datos;

const porFecha = new Map(
  mediciones.map(medicion => [
    medicion.fecha,
    Number(medicion.horas_restantes)
  ])
);
const puntosPorFecha = new Map(
  mediciones.map(medicion => [
    medicion.fecha,
    medicion.puntos_restantes == null
      ? null
      : Number(medicion.puntos_restantes)
  ])
);

const puntosRestantes = [totalPuntosInicial];
const restantes = [totalInicial];
const avancesAplicados = [0];

for (let indice = 0; indice < cantidadDias; indice++) {
  const fechaISO = new Date(
    inicio + indice * milisegundosDia
  ).toISOString().slice(0, 10);

  const pendiente = porFecha.has(fechaISO)
    ? porFecha.get(fechaISO)
    : null;

  const anterior = restantes[restantes.length - 1];

  // Solo calcular la reducción si ambos puntos tienen medición.
  const reduccion =
    pendiente !== null && anterior !== null
      ? anterior - pendiente
      : null;

  restantes.push(pendiente);
  puntosRestantes.push(puntosPorFecha.get(fechaISO) ?? null);
  avancesAplicados.push(reduccion);
}

aviso.textContent = mediciones.some(m => m.es_prueba)
  ? "Mediciones diarias consultadas desde la BD. Incluye datos de prueba."
  : "Mediciones diarias consultadas desde la BD.";

        titulo.textContent =
          `Burndown del Sprint ${sprint.no_iteracion}`;

        detalle.textContent =
          `Horas iniciales: ${totalInicial}. ` +
          `Duración: ${cantidadDias} días calendario. ` +
          `Del ${fechas[1]} al ${fechas[fechas.length - 1]}.`;

        const tabla = document.createElement("table");
        tabla.style.width = "100%";
        tabla.style.borderCollapse = "collapse";
        tabla.style.fontSize = "13px";
        areaDatos.style.overflowX = "auto";

        const encabezado = tabla.createTHead().insertRow();

       [
        "Día",
        "Fecha",
        "Reducción de pendientes (h)",
        "Horas restantes",
        "Horas ideales",
        "Puntos restantes",
        "Puntos ideales"
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
          ideales[indice],
          puntosRestantes[indice],
          puntosIdeales[indice]
        ].forEach(valor => {
            const celda = fila.insertCell();

            celda.textContent =
                valor === null
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

        zonaTabla.replaceChildren(tabla);

        new Chart(canvas, {
          type: "line",

          data: {
            labels: etiquetas,
            datasets: [
             {
              label: "Horas restantes",
              data: restantes,
              borderColor: "#22c55e",
              backgroundColor: "#22c55e",
              pointRadius: 3,
              tension: 0,
              fill: false,
              spanGaps: false,
              yAxisID: "horas"
            },
            {
              label: "Horas ideales",
              data: ideales,
              borderColor: "#0284c7",
              backgroundColor: "#0284c7",
              pointRadius: 3,
              tension: 0,
              fill: false,
              yAxisID: "horas"
            },
            {
              label: "Puntos restantes",
              data: puntosRestantes,
              borderColor: "#9333ea",
              backgroundColor: "#9333ea",
              pointStyle: "rectRot",
              pointRadius: 5,
              tension: 0,
              fill: false,
              spanGaps: false,
              yAxisID: "puntos"
            },
            {
              label: "Puntos ideales",
              data: puntosIdeales,
              borderColor: "#f97316",
              backgroundColor: "#f97316",
              borderDash: [6, 4],
              pointRadius: 3,
              tension: 0,
              fill: false,
              yAxisID: "puntos"
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
              horas: {
                  type: "linear",
                  position: "left",
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Horas pendientes"
                  }
                },
                puntos: {
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
                    text: "Puntos de historia pendientes"
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


// Modificación del evento DOMContentLoaded para usar la carga inicial
document.addEventListener("DOMContentLoaded", async () => {
    await inicializarBacklog();
});

/**
 * Función para limpiar los campos del modal añadir historia
 */
function limpiarCamposModalAdd() {
    inpAddTitulo.value = "";
    inpAddDescripcion.value = "";
    reiniciarCriteriosAceptacion(containerAdd, indicadorAdd, currentIndexAdd);
    inpAddValor.value = "";
    inpAddHoras.value= "";
}

/**
 * Función para limpiar los campos del modal modificar historia
 */
function limpiarCamposModalMod() {
    inpModTitulo.value = "";
    inpModDescripcion.value = "";
    reiniciarCriteriosAceptacion(containerMod, indicadorMod, currentIndexMod);
    inpModValor.value = "";
    inpModHoras.value ="";
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

// Listener para el botón "# Modificar historia" (abre el modal si hay selección)
btnModHistoria.addEventListener("click", function () {
    if (modificando && idUltimoPanelSeleccionado !== null) {
        const idSeleccionado = descomponerId(idUltimoPanelSeleccionado);
        if (recuperarContenido(idSeleccionado)) {
            modalModificarHistoria.classList.add('activo');
        }
    } else {
        alert("Error: Debes seleccionar una historia de usuario antes de modificar.");
    }
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

// Listener para el botón "Guardar cambios" dentro del modal modificar
btnModificarHistoria.addEventListener("click", function () {
    guardarCambiosHistoria();
});

// Listener global para deseleccionar la historia si se hace clic fuera de ella
document.addEventListener("click", function (event) {
    // Si el modal de modificar está abierto, no deseleccionamos la historia mientras el usuario edita
    if (modalModificarHistoria.classList.contains('activo')) {
        return;
    }

    // Si se hizo clic sobre una fila de historia o sobre el botón "# Modificar historia", mantenemos la selección
    if (event.target.closest('.DivFilaHistoria') || event.target.closest('#btnModHistoria')) {
        return;
    }

    // Si se hizo clic en cualquier otro lugar, quitamos el resaltado y bajamos la bandera
    if (idUltimoPanelSeleccionado !== null) {
        const ultimoPanel = document.getElementById(idUltimoPanelSeleccionado);
        if (ultimoPanel !== null) {
            ultimoPanel.style.backgroundColor = "";
        }
        idUltimoPanelSeleccionado = null;
    }
    modificando = false;
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

// Recorrido que asigna el listener que permite navegar con (flecha abajo) en la seccion de criterios de aceptacion.
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

// Recorrido que asigna el listener que permite agregar nuevos criterios de aceptacion.
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
            if(elemento === inpAddHoras || elemento ===inpModHoras){
                if(!patronRangoHoras.test(elemento.value.trim())){
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese horas entre 0 y 100";
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
    }
    const idEnEdicion = (modificando && idUltimoPanelSeleccionado)
        ? descomponerId(idUltimoPanelSeleccionado)
        : null;

    for (let n = 0; n < datosHistorias.length; n++) {
        // Si estamos modificando esta misma historia, permitimos conservar su propio título
        if (idEnEdicion !== null && datosHistorias[n].id === idEnEdicion) {
            continue;
        }
        if (datosHistorias[n].titulo === inputDom.value.trim() || datosHistorias[n].nombre === inputDom.value.trim()) {
            inputDom.style.border = "2px solid red";
            inputDom.value = "";
            inputDom.placeholder = "La historia ya existe en el sistema";
            return false;
        }
    }
    return true;
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
        agregarHistoriaUsuario(idProyectoActivo)//----------------------------------------------------------------------------------------------------------------------------------------------------------
    }
}

/**
 * Ilumina en azul la fila de la historia seleccionada y activa la bandera
 */
function iluminarHistoria(id) {
    if (idUltimoPanelSeleccionado !== null) {
        const panelAnterior = document.getElementById(idUltimoPanelSeleccionado);
        if (panelAnterior) {
            panelAnterior.style.backgroundColor = "";
        }
    }
    idUltimoPanelSeleccionado = `DivFilaHistoria_${id}`;
    const panelActual = document.getElementById(idUltimoPanelSeleccionado);
    if (panelActual) {
        panelActual.style.setProperty('background-color', '#3b82f6', 'important'); // Azul resaltado
        modificando = true;
    }
}

/**
 * Extrae el ID numérico a partir del ID del elemento DOM
 */
function descomponerId(panelDivFilaHistoria) {
    return Number(panelDivFilaHistoria.replace("DivFilaHistoria_", ""));
}

/**
 * Carga los datos de la historia seleccionada en los inputs y textareas del modal Modificar
 */
function recuperarContenido(id) {
    posicion = null;
    for (let m = 0; m < datosHistorias.length; m++) {
        if (datosHistorias[m].id === id) {
            posicion = m;
            break;
        }
    }

    if (posicion === null) {
        alert("No se pudo recuperar la información de la historia de usuario.");
        return false;
    }

    const historia = datosHistorias[posicion];

    // Limpiamos estado previo del modal
    limpiarCamposModalMod();

    // Cargamos los campos principales
    inpModTitulo.value = historia.nombre || historia.titulo || "";
    inpModDescripcion.value = historia.descripcion || "";
    inpModValor.value = historia.valor ?? "";
    inpModHoras.value = historia.horas ?? "";

    // Cargamos dinámicamente los criterios de aceptación en containerMod
    const criterios = Array.isArray(historia.criterios) && historia.criterios.length > 0
        ? historia.criterios
        : [{ criterio: "" }];

    containerMod.innerHTML = "";
    criterios.forEach((crit, index) => {
        const ta = document.createElement("textarea");
        ta.id = `criterioMod_${index + 1}`;
        ta.placeholder = `Escribe el criterio ${index + 1}...`;
        ta.value = crit.criterio || "";
        if (index === 0) ta.classList.add("active");
        containerMod.appendChild(ta);
    });

    currentIndexMod = 0;
    indicadorMod.textContent = `1/${criterios.length}`;
    return true;
}

/**
 * Valida los campos y criterios del modal Modificar antes de enviar la petición
 */
function guardarCambiosHistoria() {
    if (!modificando || !idUltimoPanelSeleccionado) {
        alert("No hay ninguna historia seleccionada para modificar.");
        return;
    }

    const historiaValida = verificarCampos(inpModalMod);
    const criteriosValidos = verificarCriterios(containerMod);

    if (historiaValida && criteriosValidos) {
        const idHistoria = descomponerId(idUltimoPanelSeleccionado);
        modificarHistoriaUsuario(idHistoria, idProyectoActivo);
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
    let criteriosDom = containerAdd.querySelectorAll('textarea');
    let criteriosArray = [];
    criteriosDom.forEach((element) => {
        criteriosArray.push({ criterio: element.value.trim() });
    });
    let valor = parseInt(inpAddValor.value.trim(), 10);
    let horas = parseInt(inpAddHoras.value.trim(), 10);

    try {
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
                horas: horas,
                idProyecto: idProyecto
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && (resultado.ok || resultado.success || respuesta.status === 201)) {
            alert(resultado.mensaje || "Historia agregada correctamente");

            inputFiltroId.value = "";
            inputFiltroNombre.value = "";
            inputFiltroValor.value = "";
            inputFiltroSprint.value = "";

            await inicializarBacklog();

            limpiarCamposModalAdd();
            modalAgregarHistoria.classList.remove('activo');
        } else {
            alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
        }
    } catch (error) {
        console.error("Error en el fetch al agregar historia:", error);
        alert("No se pudo conectar con el servidor para agregar la historia.");
    }
}

/**
 * Funcion que realiza la solicitud delete para eliminar una historia
 */
async function eliminarHistoriaUsuario(idHistoria, idProyecto) {
    const respuesta = await fetch(`/historias/historiasPB/${idHistoria}/${idProyecto}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const resultado = await respuesta.json();
    
    if(resultado.ok || respuesta.status === 201){
        alert(resultado.mensaje || "Historia eliminada correctamente");

        // Volvemos a inicializar el backlog para actualizar la lista, incluyendo la nueva historia
        await inicializarBacklog();
    } else {
        alert(resultado.mensaje || resultado.error || "Error al eliminar la historia");
    }
}


/**
 * Envía la petición PUT al servidor para actualizar la historia de usuario
 */
async function modificarHistoriaUsuario(idHistoria, idProyecto) {
    const nombre = inpModTitulo.value.trim();
    const descripcion = inpModDescripcion.value.trim();
    const criteriosDom = containerMod.querySelectorAll('textarea');
    const criteriosArray = [];
    criteriosDom.forEach((element) => {
        criteriosArray.push({ criterio: element.value.trim() });
    });
    const valor = parseInt(inpModValor.value.trim(), 10);
    const horas = parseInt(inpModHoras.value.trim(), 10);

    try {
        const respuesta = await fetch(`/historias/historiasPB/${idHistoria}/${idProyecto}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: idHistoria,
                nombre: nombre,
                descripcion: descripcion,
                criterios: criteriosArray,
                valor: valor,
                horas: horas,
                idProyecto: idProyecto
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && (resultado.ok || resultado.success || respuesta.status === 200)) {
            alert(resultado.mensaje || "Historia modificada correctamente");

            // Recargamos la tabla y reseteamos la selección
            await inicializarBacklog();
            limpiarCamposModalMod();
            modalModificarHistoria.classList.remove('activo');
            modificando = false;
            idUltimoPanelSeleccionado = null;
        } else {
            alert(resultado.mensaje || resultado.error || "Error al modificar la historia");
        }
    } catch (error) {
        console.error("Error en el fetch al modificar historia:", error);
        alert("No se pudo conectar con el servidor para modificar la historia.");
    }
}

// function cargar_cabecera_inicial() {
//     document.getElementById("").style.display = "block";
// }

// cargar_cabecera_inicial();

/**
 * Inicializa el Product Backlog obteniendo la lista completa de historias desde el servidor,
 * almacenándolas en la variable maestra global e invocando el sistema de filtrado inicial.
 * @async
 * @function inicializarBacklog
 * @returns {Promise<void>} Promesa que se resuelve cuando se han cargado y filtrado las historias.
 */
async function inicializarBacklog() {
    todasLasHistorias = await obtenerHistorias(idProyectoActivo);
    datosHistorias = todasLasHistorias;
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
        // NUEVO: Seleccionar e iluminar la fila al hacer clic sobre ella
        filaHtml.onclick = (e) => {
            if (e.target.closest('.DivBtnEliminar') || e.target.closest('.btn-fila-lateral')) {
                return;
            }
            iluminarHistoria(historia.id);
        };

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
            <label class="LabelID">${historia.numeroDeHistoria || "#"}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || "#"}</label>
            
            <!-- Contenedor con botones laterales para los Criterios de Aceptación -->
            <div class="criterio-fila-wrapper" data-index="0">
                <button type="button" class="btn-fila-lateral btn-fila-izq" onclick="cambiarCriterioFila(${historia.id}, -1)" title="Anterior">◀</button>
                <div class="criterios-fila-columna" id="criteriosContainer_${historia.id}">
                    ${criteriosTextAreasHTML}
                </div>
                <button type="button" class="btn-fila-lateral btn-fila-der" onclick="cambiarCriterioFila(${historia.id}, 1)" title="Siguiente">▶</button>
            </div>

            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelValor">${historia.horas || "#"}</label>
            <label class="LabelSprintAsignado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
            
            <div class="DivBtnEliminar">
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}" onclick="eliminarHistoriaUsuario(${historia.id}, ${idProyectoActivo})">🗑️</button>
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
            window.location.href = `panelFacilitador.html?sprint=${sprintId}&reunion=${reunionId}&proyecto=${proyectoId}&seccion=reuniones&vista=detalles`;
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