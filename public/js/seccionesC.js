// secciones.js
async function cargarSeccionesCapacitacion(modulo, contenedor) {
  const lista = document.createElement("div");
  lista.textContent = "Cargando secciones…";
  contenedor.append(lista);

  try {
    const progreso = await consultarProgresoCapacitacion();
    console.log("Progreso del usuario activo:", progreso);

    const respuesta = await fetch(`/secciones/modulo/${modulo.id}`);
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

    const moduloActualId = Number(progreso.modulo_actual);
    const seccionActualId = Number(progreso.seccion_actual);
    const moduloSeleccionadoId = Number(modulo.id);

    // Buscar si la sección actual está dentro de este módulo
    const seccionActualEnModulo = secciones.find(
      (elem) => Number(elem.id) === seccionActualId
    );

    for (const seccion of secciones) {
      const tarjeta = document.createElement("div");
      tarjeta.className = "seccion-card";

      const informacion = document.createElement("div");
      informacion.className = "seccion-info";

      const titulo = document.createElement("h3");
      titulo.textContent = `Sección ${seccion.numero_seccion}: ${seccion.nombre}`;

      const paginas = document.createElement("small");
      paginas.textContent = `Duración: ${seccion.numero_paginas} páginas`;

      informacion.append(titulo, paginas);

      const boton = document.createElement("button");
      boton.type = "button";

      let estado = "pendiente";

      if (progreso.guia_terminada === true) {
        estado = "hecho";
      } else if (moduloSeleccionadoId < moduloActualId) {
        // Si el usuario ya avanzó a un módulo posterior, las secciones de módulos anteriores están hechas
        estado = "hecho";
      } else if (moduloSeleccionadoId === moduloActualId) {
        const seccionId = Number(seccion.id);

        if (seccionId === seccionActualId) {
          estado = "iniciar";
        } else if (seccionActualEnModulo) {
          // Si encontramos la sección actual en este módulo, las anteriores por numero_seccion están hechas
          if (Number(seccion.numero_seccion) < Number(seccionActualEnModulo.numero_seccion)) {
            estado = "hecho";
          } else {
            estado = "pendiente";
          }
        } else {
          // Respaldo por ID si seccion_actual no coincidió por numero_seccion
          if (seccionId < seccionActualId) {
            estado = "hecho";
          } else {
            estado = "pendiente";
          }
        }
      } else {
        // Módulo futuro respecto a modulo_actual
        estado = "pendiente";
      }

      boton.className = `estado-btn ${estado}`;
      boton.disabled = estado === "pendiente";

      boton.textContent = {
        hecho: "✓ Hecho",
        iniciar: "▶ Iniciar",
        pendiente: "☷ Pendiente"
      }[estado];

      boton.addEventListener("click", () => {
        if (Number(modulo.numero_modulo) === 1) {
          abrirSeccionIntroScrum(modulo, seccion);
        } else if (Number(modulo.numero_modulo) === 2) {
          abrirSeccionHerramientas(modulo, seccion);
        } else {
          alert("El lector de este módulo aún no está configurado en la interfaz.");
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
  const plantillas = {
    1: "herramientas-tareas",
    2: "herramientas-dod",
    3: "herramientas-estimacion"
  };

  const idPlantilla = plantillas[Number(seccion.numero_seccion)];
  const plantilla = idPlantilla ? document.getElementById(idPlantilla) : null;

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
  const terminar = document.getElementById("terminar-seccion-herramientas");

  if (!terminar) {
    console.error("Falta el botón Terminar en el HTML.");
    return;
  }

  terminar.hidden = true;
  terminar.disabled = false;

  if (!lector || !titulo || !contenido || !contador || !anterior || !siguiente || !cerrar) {
    console.error("Faltan elementos HTML del lector de capacitación.");
    return;
  }

  const paginas = Array.from(plantilla.content.querySelectorAll(".pagina-capacitacion"));
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

  const puedeTerminar =
    !progresoActual.guia_terminada &&
    Number(progresoActual.modulo_actual) === Number(modulo.id) &&
    Number(progresoActual.seccion_actual) === Number(seccion.id);

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
        throw new Error(resultado.error || "No se pudo guardar el progreso.");
      }

      lector.close();

      const botonModulo = document.querySelector("#contenedor-modulos .modulo-btn.activo");
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
  const usuario = JSON.parse(sessionStorage.getItem("usuarioActivo"));
  const idUsuario = Number(usuario?.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new Error("No se encontró un usuario activo válido.");
  }

  const respuesta = await fetch(`/usuarios/progresoCapa/${idUsuario}`);
  const resultado = await respuesta.json();

  if (!respuesta.ok || !resultado.ok) {
    throw new Error(resultado.error || "No se pudo consultar el progreso.");
  }

  return resultado.data;
}

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

  if (!lector || !titulo || !contenido || !contador || !anterior || !siguiente || !cerrar) {
    console.error("Faltan elementos HTML del lector de capacitación.");
    return;
  }

  const paginas = Array.from(plantilla.content.querySelectorAll(".pagina-capacitacion"));
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
        throw new Error(resultado.error || "No se pudo guardar el progreso.");
      }

      lector.close();

      const botonModulo = document.querySelector("#contenedor-modulos .modulo-btn.activo");
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