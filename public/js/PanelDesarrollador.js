function mostrarModal(idModal, idCabecera) {

  // Ocultar todos los modales principales
  document.querySelectorAll(".modal-class").forEach(modal => {
    modal.style.display = "none";
  });

  // Mostrar el modal seleccionado
  const modalSeleccionado = document.getElementById(idModal);

  if (modalSeleccionado) {
    modalSeleccionado.style.display = "block";
  }

  // Mostrar la cabecera correspondiente
  mostrarCabecera(idCabecera);

  // Referencias de Mensajes
  const tituloCentral = document.getElementById("tituloSeccionCentral");
  const btnIniciar = document.getElementById("btnIniciarConversacion");

  if (idModal === "modal-mensajes") {

    if (tituloCentral) {
      tituloCentral.textContent = "Mensajes";
      tituloCentral.style.display = "block";
    }

    if (btnIniciar) {
      btnIniciar.style.display = "block";
    }

    if (typeof cargarCanales === "function") {
      cargarCanales();
    }

  } else {

    if (tituloCentral) {
      tituloCentral.style.display = "none";
    }

    if (btnIniciar) {
      btnIniciar.style.display = "none";
    }
  }

  // Cargar el Product Backlog al seleccionarlo
  if (idModal === "modal-product-backlog") {

    if (typeof cargarProductBacklog === "function") {
      cargarProductBacklog();
    }
  }

  // Cargar las reuniones al seleccionarlas
  if (idModal === "modal-reuniones") {

    if (typeof cargarReuniones === "function") {
      cargarReuniones();
    }
  }

  // Actualizar el botón activo del menú lateral
  const botonesMenu = document.querySelectorAll(
    "#listaPanelLateral button"
  );

  botonesMenu.forEach(boton => {
    boton.classList.remove("active");
  });

  const botonesPorModal = {
    "modal-mensajes": "linkMensajes",
    "modal-product-backlog": "linkProductBacklog",
    "modal-reuniones": "linkReunirse",
    "modal-graficas": "linkGraficas"
  };

  const botonActivo = document.getElementById(
    botonesPorModal[idModal]
  );

  if (botonActivo) {
    botonActivo.classList.add("active");
  }
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

        const encabezado = tabla.createTHead().insertRow();

        [
          "Día",
          "Fecha",
          "Reducción de pendientes (h)",
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
              valor === null
                ? "Sin registro"
                : typeof valor === "number"
                  ? valor.toLocaleString("es-MX", {
                    maximumFractionDigits: 0
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
                spanGaps: false
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

  // Actualizar el botón activo del panel lateral
  const botonesMenu = document.querySelectorAll("#listaPanelLateral button");

  botonesMenu.forEach(boton => {
    boton.classList.remove("active");
  });

  const botonActivo = document.getElementById("linkSprint");

  if (botonActivo) {
    botonActivo.classList.add("active");
  }

  // 5. Cargar el Kanban
  if (typeof cargarKanvan === "function") {
    cargarKanvan();
  }

  if (typeof aplicarPermisosInterfaz === "function") {
    aplicarPermisosInterfaz();
  }
}

function mostrarCabecera(idCabecera) {

  // Ocultar todas las cabeceras
  document.querySelectorAll(
    "#contenedor-cabeceras .cabecera-default"
  ).forEach(cabecera => {
    cabecera.classList.remove("activa");
  });

  // Mostrar únicamente la seleccionada
  const cabeceraSeleccionada = document.getElementById(idCabecera);

  if (cabeceraSeleccionada) {
    cabeceraSeleccionada.classList.add("activa");
  }
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
    //Lógica para solo listar los usuarios del panel Facilitador
    const contFacilitador = document.getElementById("modal-usuariosF");
    console.log('revisando lista del equipo')
    if (!contFacilitador) return; // esta página no tiene la tabla, no hacemos nada

    console.log('Listando miembros del equipo')
    const idP = JSON.parse(sessionStorage.getItem('proyectoActivo')).id;
    //Logica para mostrar el menú al seleccionar la opción
    const usuarios = await obtenerUsuariosPorEquipo(idP);
    const contenedorUsuarios = document.getElementById("contenedor-usuariosF");

    console.log("Longitud de usuarios: " + usuarios.length)
    if (usuarios.length === 0) {
        contenedorUsuarios.innerHTML = "<p>No hay usuarios para mostrar</p>";
        return;
    }
    console.log(usuarios)
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
