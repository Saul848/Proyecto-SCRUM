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

    const respuestaModuloActual = await fetch(`/modulos/${moduloActualId}`);

    if (!respuestaModuloActual.ok) {
      throw new Error("No se pudo consultar el módulo actual.");
    }

    const moduloActual = await respuestaModuloActual.json();

    const ordenActual = Number(moduloActual.numero_modulo);
    const ordenSeleccionado = Number(modulo.numero_modulo);

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
      } else if (ordenSeleccionado < ordenActual) {
        estado = "hecho";
      } else if (moduloSeleccionadoId === moduloActualId) {
        if (!seccionActualEnModulo) {
          throw new Error(
            "El progreso es inconsistente: la sección actual no pertenece al módulo."
          );
        }

        if (Number(seccion.id) === seccionActualId) {
          estado = "iniciar";
        } else if (
          Number(seccion.numero_seccion) <
          Number(seccionActualEnModulo.numero_seccion)
        ) {
          estado = "hecho";
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
        if (Number(modulo.numero_modulo) === 1) {
          abrirSeccionIntroScrum(modulo, seccion);
        } else if (Number(modulo.numero_modulo) === 2) {
          abrirSeccionHerramientas(modulo, seccion);
        } else if (Number(modulo.numero_modulo) === 3) {
          abrirSeccionReuniones(modulo, seccion);
        } else if ((Number(modulo.numero_modulo) === 4)){
          abrirSeccionPanelPrincipal(modulo, seccion)
        } else if (Number(modulo.numero_modulo) === 5) {
          abrirSeccionModulo5(modulo, seccion);
        } else if (Number(modulo.numero_modulo) === 6) {
          abrirSeccionModulo6(modulo, seccion);
        } else if (Number(modulo.numero_modulo) === 7) {
          abrirSeccionModulo7(modulo, seccion);
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


async function abrirSeccionPanelPrincipal(modulo, seccion) {
  const plantillasModulo4 = {
    1: "guia-pantalla-principal",
  };

  const idPlantilla = plantillasModulo4[Number(seccion.numero_seccion)];
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
      dialogId: "lector-modulo-4",
      tituloId: "lector-modulo-4-titulo",
      paginaId: "pagina-modulo-4",
      contadorId: "contador-paginas-modulo-4",
      anteriorId: "pagina-anterior-modulo-4",
      siguienteId: "pagina-siguiente-modulo-4",
      cerrarId: "cerrar-lector-modulo-4",
      terminarId: "terminar-seccion-modulo-4"
    }
  });
}


async function abrirSeccionModulo5(modulo, seccion) {
  const plantillasModulo5 = {
    1: "guia-pantallas-y-secciones"
  };

  const idPlantilla = plantillasModulo5[Number(seccion.numero_seccion)];
  console.log(idPlantilla);
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
      dialogId: "lector-modulo-5",
      tituloId: "lector-modulo-5-titulo",
      paginaId: "pagina-modulo-5",
      contadorId: "contador-paginas-modulo-5",
      anteriorId: "pagina-anterior-modulo-5",
      siguienteId: "pagina-siguiente-modulo-5",
      cerrarId: "cerrar-lector-modulo-5",
      terminarId: "terminar-seccion-modulo-5"
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

async function abrirSeccionReuniones(modulo, seccion) {
  const plantillas = {
    1: "sprint-planning",
    2: "daily-meeting",
    3: "sprint-review",
    4: "retrospectiva"
  };

  const idPlantilla = plantillas[Number(seccion.numero_seccion)];
  const plantilla = idPlantilla
    ? document.getElementById(idPlantilla)
    : null;

  if (!plantilla) {
    alert("El contenido de esta sección todavía está pendiente.");
    return;
  }

  try {
    const progresoActual = await consultarProgresoCapacitacion();

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
        dialogId: "lector-reuniones",
        tituloId: "lector-reuniones-titulo",
        paginaId: "pagina-reuniones",
        contadorId: "contador-paginas-reuniones",
        anteriorId: "pagina-anterior-reuniones",
        siguienteId: "pagina-siguiente-reuniones",
        cerrarId: "cerrar-lector-reuniones-scrum",
        terminarId: "terminar-seccion-reuniones"
      }
    });
  } catch (error) {
    console.error("Error abriendo la sección de reuniones:", error);
    alert(error.message);
  }
}
async function calcularProgresoModulos(modulos) {
  const progreso = await consultarProgresoCapacitacion();

  const moduloActual = modulos.find(
    modulo => Number(modulo.id) === Number(progreso.modulo_actual)
  );

  if (!moduloActual) {
    throw new Error("No se encontró el módulo actual del usuario.");
  }

  const resultados = await Promise.all(
    modulos.map(async modulo => {
      const respuesta = await fetch(`/secciones/modulo/${modulo.id}`);

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar las secciones del módulo ${modulo.numero_modulo}.`
        );
      }

      const secciones = await respuesta.json();

      if (!Array.isArray(secciones)) {
        throw new Error("La respuesta de secciones no es válida.");
      }

      const total = secciones.length;
      let terminadas = 0;
      let estado = "Pendiente";

      if (total === 0) {
        return {
          id: Number(modulo.id),
          estado: "Sin contenido",
          porcentaje: null,
          terminadas: 0,
          total: 0
        };
      }

      if (
        progreso.guia_terminada === true ||
        Number(modulo.numero_modulo) <
          Number(moduloActual.numero_modulo)
      ) {
        terminadas = total;
        estado = "Concluido";
      } else if (
        Number(modulo.id) === Number(progreso.modulo_actual)
      ) {
        const seccionActual = secciones.find(
          seccion =>
            Number(seccion.id) === Number(progreso.seccion_actual)
        );

        if (!seccionActual) {
          throw new Error(
            "La sección actual no pertenece al módulo del usuario."
          );
        }

        terminadas = secciones.filter(
          seccion =>
            Number(seccion.numero_seccion) <
            Number(seccionActual.numero_seccion)
        ).length;

        estado = "En progreso";
      }

      return {
        id: Number(modulo.id),
        estado,
        porcentaje: Math.round((terminadas / total) * 100),
        terminadas,
        total
      };
    })
  );

  return resultados;
}

async function abrirSeccionModulo6(modulo, seccion) {
  // Nuestro módulo solamente tiene la sección 1: Tutorial.
  const plantillasModulo6 = {
    1: "tutorial-desarrollador"
  };

  const idPlantilla =
    plantillasModulo6[Number(seccion.numero_seccion)];

  const plantilla = idPlantilla
    ? document.getElementById(idPlantilla)
    : null;

  if (!plantilla) {
    alert("El contenido de esta sección todavía está pendiente.");
    return;
  }

  let progresoActual;

  try {
    progresoActual = await consultarProgresoCapacitacion();
  } catch (error) {
    console.error("Error consultando el progreso:", error);
    alert(error.message);
    return;
  }

  // Solamente se puede terminar la sección actual.
  const puedeTerminar =
    !progresoActual.guia_terminada &&
    Number(progresoActual.modulo_actual) === Number(modulo.id) &&
    Number(progresoActual.seccion_actual) === Number(seccion.id);

  // Reutilizamos el lector genérico de capacitación.
  paginarPlantillaCapacitacion({
    modulo,
    seccion,
    plantilla,
    progresoActual,
    puedeTerminar,
    ids: {
      dialogId: "lector-modulo-6",
      tituloId: "lector-modulo-6-titulo",
      paginaId: "pagina-modulo-6",
      contadorId: "contador-paginas-modulo-6",
      anteriorId: "pagina-anterior-modulo-6",
      siguienteId: "pagina-siguiente-modulo-6",
      cerrarId: "cerrar-lector-modulo-6",
      terminarId: "terminar-seccion-modulo-6"
    }
  });
}
async function abrirSeccionModulo7(modulo, seccion) {
  const plantillas = {
    1: "cliente-guia-panel"
  };

  const idPlantilla = plantillas[Number(seccion.numero_seccion)];
  const plantilla = idPlantilla
    ? document.getElementById(idPlantilla)
    : null;

  if (!plantilla) {
    alert("El contenido de esta sección todavía está pendiente.");
    return;
  }

  try {
    const progresoActual = await consultarProgresoCapacitacion();

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
        dialogId: "lector-modulo-7",
        tituloId: "lector-modulo-7-titulo",
        paginaId: "pagina-modulo-7",
        contadorId: "contador-paginas-modulo-7",
        anteriorId: "pagina-anterior-modulo-7",
        siguienteId: "pagina-siguiente-modulo-7",
        cerrarId: "cerrar-lector-modulo-7",
        terminarId: "terminar-seccion-modulo-7"
      }
    });
  } catch (error) {
    console.error("Error abriendo el tutorial del Cliente:", error);
    alert(error.message);
  }
}

