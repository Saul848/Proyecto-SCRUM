//Aquí irá la lógica de las secciones recuperadas (frontend)
//Parte de Rubí

//Parte de Ale
async function cargarSeccionesCapacitacion(modulo, contenedor) {
  const lista = document.createElement("div");
  lista.textContent = "Cargando secciones…";
  contenedor.append(lista);

  try {
    const progreso = await consultarProgresoCapacitacion();

    console.log("Progreso del usuario activo:", progreso);
    const respuesta = await fetch(
      `/secciones/modulo/${modulo.id}`
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const secciones = await respuesta.json();

    if (!Array.isArray(secciones)) {
      throw new Error("La respuesta de secciones no es válida.");
    }

    lista.replaceChildren();

    if (secciones.length === 0) {
      lista.textContent = "Este módulo todavía no tiene secciones.";
      return;
    }

    for (const seccion of secciones) {
      const tarjeta = document.createElement("div");
      tarjeta.className = "seccion-card";

      const informacion = document.createElement("div");
      informacion.className = "seccion-info";

      const titulo = document.createElement("h3");
      titulo.textContent =
        `Sección ${seccion.numero_seccion}: ${seccion.nombre}`;

      const paginas = document.createElement("small");
      paginas.textContent = `Duración: ${seccion.numero_paginas} páginas`;

      informacion.append(titulo, paginas);
                const boton = document.createElement("button");
            boton.type = "button";

            // Encontrar la sección actual por su ID, no por su número.
            const seccionActual = secciones.find(
            elemento => Number(elemento.id) === Number(progreso.seccion_actual)
            );

            let estado = "pendiente";

            if (progreso.guia_terminada === true) {
            estado = "hecho";
            } else if (Number(progreso.modulo_actual) === Number(modulo.id)) {
            if (seccionActual) {
                const numeroActual = Number(seccionActual.numero_seccion);
                const numeroTarjeta = Number(seccion.numero_seccion);

                if (numeroTarjeta < numeroActual) {
                estado = "hecho";
                } else if (Number(seccion.id) === Number(seccionActual.id)) {
                estado = "iniciar";
                }
            } else {
                console.warn("La sección actual no pertenece al módulo seleccionado.");
            }
            }

            boton.className = `estado-btn ${estado}`;
            boton.disabled = estado === "pendiente";

            boton.textContent = {
            hecho: "✓ Hecho",
            iniciar: "▶ Iniciar",
            pendiente: "☷ Pendiente"
            }[estado];

            boton.addEventListener("click", () => {
              //abrir módulo 1
              if(Number(modulo.numero_modulo) === 1){
                abrirSeccionIntroScrum(modulo, seccion);
              } else {
                abrirSeccionHerramientas(modulo, seccion);
              }
            });

      

      tarjeta.append(informacion, boton);
      lista.append(tarjeta);
    }
  } catch (error) {
    console.error("Error cargando secciones:", error);
    lista.textContent = "No se pudieron cargar las secciones.";
  }
}

async function abrirSeccionHerramientas(modulo, seccion) {
  // Por ahora solo tenemos el contenido de Tareas.
  const plantillas = {
    1: "herramientas-tareas",
    2: "herramientas-dod",
    3: "herramientas-estimacion"
  };

  const idPlantilla = plantillas[Number(seccion.numero_seccion)];
  const plantilla = idPlantilla
    ? document.getElementById(idPlantilla)
    : null;

  if (!plantilla) {
    alert("El contenido de esta sección todavía está pendiente.");
    return;
  }

  const lector = document.getElementById("lector-herramientas");
  const titulo = document.getElementById("lector-herramientas-titulo");
  const contenido = document.getElementById("pagina-herramientas");
  const contador = document.getElementById("contador-paginas-herramientas");
  const anterior = document.getElementById("pagina-anterior-herramientas");
  const siguiente = document.getElementById("pagina-siguiente-herramientas");
  const cerrar = document.getElementById("cerrar-lector-herramientas");
  const terminar = document.getElementById(
  "terminar-seccion-herramientas"
);

if (!terminar) {
  console.error("Falta el botón Terminar en el HTML.");
  return;
}

terminar.hidden = true;
terminar.disabled = false;

  if (
    !lector || !titulo || !contenido || !contador ||
    !anterior || !siguiente || !cerrar
  ) {
    console.error("Faltan elementos HTML del lector de capacitación.");
    return;
  }

  const paginas = Array.from(
    plantilla.content.querySelectorAll(".pagina-capacitacion")
  );

  if (paginas.length === 0) {
    console.error("La sección no tiene páginas HTML.");
    return;
  }

  if (paginas.length !== Number(seccion.numero_paginas)) {
    console.warn("La cantidad de páginas HTML no coincide con la BD.");
  }
  let progresoActual;

try {
  progresoActual = await consultarProgresoCapacitacion();
} catch (error) {
  alert(error.message);
  return;
}

// Solo la sección actual se puede marcar como terminada.
// Las anteriores pueden releerse sin modificar el progreso.
const puedeTerminar =
  !progresoActual.guia_terminada &&
  Number(progresoActual.modulo_actual) === Number(modulo.id) &&
  Number(progresoActual.seccion_actual) === Number(seccion.id);

  let indice = 0;

  titulo.textContent =
    `Sección ${seccion.numero_seccion}: ${seccion.nombre}`;

  function mostrarPagina() {
    contenido.replaceChildren(paginas[indice].cloneNode(true));

    contador.textContent = `${indice + 1} / ${paginas.length}`;

    anterior.disabled = indice === 0;
    siguiente.disabled = indice === paginas.length - 1;
    terminar.hidden =
  !puedeTerminar || indice !== paginas.length - 1;

    lector.scrollTop = 0;
  }

  anterior.onclick = () => {
    if (indice > 0) {
      indice--;
      mostrarPagina();
    }
  };

  siguiente.onclick = () => {
    if (indice < paginas.length - 1) {
      indice++;
      mostrarPagina();
    }
  };

  cerrar.onclick = () => lector.close();
  terminar.onclick = async () => {
  if (!puedeTerminar || terminar.disabled) return;

  terminar.disabled = true;
  terminar.textContent = "Guardando…";

  try {
    const respuesta = await fetch(
      `/usuarios/progreso/terminar/${progresoActual.id_usuario}/${seccion.id}`,
      { method: "POST" }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      throw new Error(
        resultado.error || "No se pudo guardar el progreso."
      );
    }

    lector.close();

    // Volver a cargar el módulo seleccionado y sus estados.
    const botonModulo = document.querySelector(
      "#contenedor-modulos .modulo-btn.activo"
    );

    if (botonModulo) {
      botonModulo.click();
    }
  } catch (error) {
    console.error("Error guardando progreso:", error);
    alert(error.message);
  } finally {
    terminar.disabled = false;
    terminar.textContent = "✓ Terminar";
  }
};

  mostrarPagina();

  if (!lector.open) {
    lector.showModal();
  }
}
async function consultarProgresoCapacitacion() {
  const usuario = JSON.parse(
    sessionStorage.getItem("usuarioActivo")
  );

  const idUsuario = Number(usuario?.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new Error("No se encontró un usuario activo válido.");
  }

  const respuesta = await fetch(
    `/usuarios/progresoCapa/${idUsuario}`
  );

  const resultado = await respuesta.json();

  if (!respuesta.ok || !resultado.ok) {
    throw new Error(
      resultado.error || "No se pudo consultar el progreso."
    );
  }

  return resultado.data;
}
//Parte de Tania

/**
 * Abre el modal lector del Módulo 1 (¿Qué es Scrum?) y carga la plantilla
 * correspondiente a la sección seleccionada.
 *
 * @async
 * @function abrirSeccionIntroScrum
 * @param {Object} modulo - Objeto del módulo de capacitación.
 * @param {number|string} modulo.id - Identificador del módulo en la base de datos.
 * @param {number|string} modulo.numero_modulo - Número del módulo.
 * @param {Object} seccion - Objeto de la sección seleccionada.
 * @param {number|string} seccion.id - Identificador de la sección.
 * @param {number|string} seccion.numero_seccion - Número de la sección (1 o 2).
 * @param {string} seccion.nombre - Nombre de la sección.
 * @param {number|string} seccion.numero_paginas - Número de páginas configurado en BD.
 * @returns {Promise<void>}
 */
async function abrirSeccionIntroScrum(modulo, seccion) {
  const plantillasModulo1 = {
    1: "intro-scrum-concepto",
    2: "intro-scrum-roles"
  };

  const idPlantilla = plantillasModulo1[Number(seccion.numero_seccion)];
  const plantilla = idPlantilla ? document.getElementById(idPlantilla) : null;

  if (!plantilla) {
    alert("El contenido de esta sección todavía está pendiente.");
    return;
  }

  let progresoActual;

  try {
    progresoActual = await consultarProgresoCapacitacion();
  } catch (error) {
    alert(error.message);
    return;
  }

  const puedeTerminar =
    !progresoActual.guia_terminada &&
    Number(progresoActual.modulo_actual) === Number(modulo.id) &&
    Number(progresoActual.seccion_actual) === Number(seccion.id);

  paginarPlantillaCapacitacion({
    modulo,
    seccion,
    plantilla,
    progresoActual,
    puedeTerminar,
    ids: {
      dialogId: "lector-intro-scrum",
      tituloId: "lector-intro-scrum-titulo",
      paginaId: "pagina-intro-scrum",
      contadorId: "contador-paginas-intro-scrum",
      anteriorId: "pagina-anterior-intro-scrum",
      siguienteId: "pagina-siguiente-intro-scrum",
      cerrarId: "cerrar-lector-intro-scrum",
      terminarId: "terminar-seccion-intro-scrum"
    }
  });
}

/**
 * Controla la navegación entre páginas de un `<template>` de capacitación
 * dentro de un elemento `<dialog>` y guarda el avance al pulsar Terminar.
 *
 * @function paginarPlantillaCapacitacion
 * @param {Object} opciones - Configuración y datos de la sesión de lectura.
 * @param {Object} opciones.modulo - Módulo activo.
 * @param {Object} opciones.seccion - Sección activa.
 * @param {HTMLTemplateElement} opciones.plantilla - Plantilla con `.pagina-capacitacion`.
 * @param {Object} opciones.progresoActual - Progreso actual del usuario.
 * @param {boolean} opciones.puedeTerminar - Indica si puede marcar la sección como terminada.
 * @param {Object} opciones.ids - IDs de los elementos del `<dialog>` en el DOM.
 * @returns {void}
 */
function paginarPlantillaCapacitacion({
  modulo,
  seccion,
  plantilla,
  progresoActual,
  puedeTerminar,
  ids
}) {
  const lector = document.getElementById(ids.dialogId);
  const titulo = document.getElementById(ids.tituloId);
  const contenido = document.getElementById(ids.paginaId);
  const contador = document.getElementById(ids.contadorId);
  const anterior = document.getElementById(ids.anteriorId);
  const siguiente = document.getElementById(ids.siguienteId);
  const cerrar = document.getElementById(ids.cerrarId);
  const terminar = document.getElementById(ids.terminarId);

  if (!terminar) {
    console.error("Falta el botón Terminar en el HTML.");
    return;
  }

  terminar.hidden = true;
  terminar.disabled = false;

  if (
    !lector || !titulo || !contenido || !contador ||
    !anterior || !siguiente || !cerrar
  ) {
    console.error("Faltan elementos HTML del lector de capacitación.");
    return;
  }

  const paginas = Array.from(
    plantilla.content.querySelectorAll(".pagina-capacitacion")
  );

  if (paginas.length === 0) {
    console.error("La sección no tiene páginas HTML.");
    return;
  }

  if (paginas.length !== Number(seccion.numero_paginas)) {
    console.warn("La cantidad de páginas HTML no coincide con la BD.");
  }

  let indice = 0;
  titulo.textContent = `Sección ${seccion.numero_seccion}: ${seccion.nombre}`;

  function mostrarPagina() {
    contenido.replaceChildren(paginas[indice].cloneNode(true));
    contador.textContent = `${indice + 1} / ${paginas.length}`;

    anterior.disabled = indice === 0;
    siguiente.disabled = indice === paginas.length - 1;
    terminar.hidden = !puedeTerminar || indice !== paginas.length - 1;

    lector.scrollTop = 0;
  }

  anterior.onclick = () => {
    if (indice > 0) {
      indice--;
      mostrarPagina();
    }
  };

  siguiente.onclick = () => {
    if (indice < paginas.length - 1) {
      indice++;
      mostrarPagina();
    }
  };

  cerrar.onclick = () => lector.close();

  terminar.onclick = async () => {
    if (!puedeTerminar || terminar.disabled) return;

    terminar.disabled = true;
    terminar.textContent = "Guardando…";

    try {
      const respuesta = await fetch(
        `/usuarios/progreso/terminar/${progresoActual.id_usuario}/${seccion.id}`,
        { method: "POST" }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        throw new Error(
          resultado.error || "No se pudo guardar el progreso."
        );
      }

      lector.close();

      const botonModulo = document.querySelector(
        "#contenedor-modulos .modulo-btn.activo"
      );

      if (botonModulo) {
        botonModulo.click();
      }
    } catch (error) {
      console.error("Error guardando progreso:", error);
      alert(error.message);
    } finally {
      terminar.disabled = false;
      terminar.textContent = "✓ Terminar";
    }
  };

  mostrarPagina();

  if (!lector.open) {
    lector.showModal();
  }
}

//Parte de saul