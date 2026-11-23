if (typeof window.requisitos === 'undefined') window.requisitos = [];

const proyectoGuardadoSession = JSON.parse(sessionStorage.getItem('proyectoActivo'));
const urlParamsGlobal = new URLSearchParams(window.location.search);

if (typeof window.ID_PROYECTO === 'undefined') {
  window.ID_PROYECTO = proyectoGuardadoSession?.id || Number(urlParamsGlobal.get("proyecto")) || 1;
}
if (typeof window.ID_SPRINT === 'undefined') window.ID_SPRINT = 1;
if (typeof window.ID_REUNION === 'undefined') window.ID_REUNION = 1;

// funcion de rol
function obtenerRolActual() {
  const urlParams = new URLSearchParams(window.location.search);
  const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
  const esClientePorRuta = window.location.pathname.toLowerCase().includes('cliente');

  let rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');

  if (!rolSesion) {
    try {
      const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));
      if (usuarioActivo && usuarioActivo.rol) {
        rolSesion = usuarioActivo.rol;
      }
    } catch (e) { }
  }

  const rolFinal = urlParams.get("usuario") || window.ROL_ACTUAL || rolSesion ||
    (esDevPorRuta ? 'desarrollador' : (esClientePorRuta ? 'cliente' : 'facilitador'));

  return rolFinal.toLowerCase();
}

function inicializarSprintPlanning(idSprintParam, idReunionParam, idProyectoParam, idTipoReunionParam) {
  const urlParams = new URLSearchParams(window.location.search);
  const rol = obtenerRolActual();

  window.ID_PROYECTO = Number(idProyectoParam) || Number(urlParams.get("proyecto")) || 1;
  window.ID_SPRINT = Number(idSprintParam) || Number(sessionStorage.getItem("ID_SPRINT_ACTIVO")) || 1;
  window.ID_REUNION = Number(idReunionParam) || Number(sessionStorage.getItem("ID_REUNION_ACTIVA")) || 1;
  window.ID_TIPO_REUNION = Number(idTipoReunionParam) || Number(sessionStorage.getItem("TIPO_REUNION_ACTIVA")) || 2;

  if (typeof inicializarSocketsAsignacion === 'function') {
    inicializarSocketsAsignacion(window.ID_SPRINT);
  }

  const btnContinuar = document.getElementById("btnContinuar");
  const btnContinuarFase2 = document.getElementById("btnContinuarFase2");
  const btnVolverFase1 = document.getElementById("btnVolverFase1");
  const btnConfirmarSprint = document.getElementById("btnConfirmarSprint");
  const btnSalir = document.getElementById("btnSalir");
  const inpFechaInicio = document.getElementById("inpFechaInicio");
  const inpFechaFin = document.getElementById("inpFechaFin");

  if (rol === 'desarrollador') {
    if (btnContinuar) btnContinuar.style.display = "none";
    if (btnContinuarFase2) btnContinuarFase2.style.display = "none";
    if (btnVolverFase1) btnVolverFase1.style.display = "none";
    if (btnConfirmarSprint) btnConfirmarSprint.style.display = "none";

    if (inpFechaInicio) inpFechaInicio.disabled = true;
    if (inpFechaFin) inpFechaFin.disabled = true;
  }

  if (rol === 'cliente') {
    [btnContinuar, btnContinuarFase2, btnVolverFase1, btnConfirmarSprint].forEach(b => {
      if (b) b.style.display = "none";
    });
    if (inpFechaInicio) inpFechaInicio.disabled = true;
    if (inpFechaFin) inpFechaFin.disabled = true;
  }

  if (inpFechaInicio) {
    inpFechaInicio.onchange = () => {
      calcularRestante();
      if (obtenerRolActual() === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-cambio-fechas", {
          sprintId: window.ID_SPRINT,
          fechaInicio: inpFechaInicio.value,
          fechaFin: inpFechaFin ? inpFechaFin.value : ''
        });
      }
    };
  }

  if (inpFechaFin) {
    inpFechaFin.onchange = () => {
      calcularRestante();
      if (obtenerRolActual() === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-cambio-fechas", {
          sprintId: window.ID_SPRINT,
          fechaInicio: inpFechaInicio ? inpFechaInicio.value : '',
          fechaFin: inpFechaFin.value
        });
      }
    };
  }

  if (btnContinuar) {
    btnContinuar.addEventListener("click", async () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'cliente') return;

      if (rolActual === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-planning-poker", { sprintId: window.ID_SPRINT });
      }

      cargarVistaPlanningPoker(rolActual);
    });
  }

  if (btnContinuarFase2) {
    btnContinuarFase2.onclick = () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-fase-2", { sprintId: window.ID_SPRINT });
      }
      mostrarVista("vista-fase2");
    };
  }

  if (btnVolverFase1) {
    btnVolverFase1.onclick = () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-fase-1", { sprintId: window.ID_SPRINT });
      }
      mostrarVista("vista-fase1");
    };
  }

  if (btnSalir) {
    btnSalir.onclick = () => {
      if (!confirm("¿Salir de la reunión?")) return;
      mostrarAvisoFase2Cliente(false);
      document.getElementById("vista-sprintPlanning").style.display = "none";
      document.getElementById("modal-reuniones").style.display = "block";
    };
  }

  if (btnConfirmarSprint) {
    btnConfirmarSprint.onclick = async () => {
      try {
        await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sprint: window.ID_SPRINT })
        });

        if (socketAsignacion) {
          socketAsignacion.emit("disparar-confirmar-sprint", {
            sprintId: window.ID_SPRINT,
            reunionId: window.ID_REUNION,
            proyectoId: window.ID_PROYECTO
          });
        }

        alert("¡Sprint Backlog confirmado con éxito! La reunión ha finalizado.");
        document.getElementById("vista-sprintPlanning").style.display = "none";
        document.getElementById("modal-reuniones").style.display = "block";
      } catch (err) {
        console.error("Error al confirmar el sprint:", err);
        alert("Ocurrió un error al finalizar la reunión.");
      }
    };
  }

  if (window.ID_TIPO_REUNION === 4) {
    mostrarVista("vista-sprintReview");
  } else {
    cargarHistoriasSprint();
    const vistaParam = urlParams.get("vista");
    if (vistaParam === "detalles") {
      mostrarVista("vistaDetalles");
    } else {
      mostrarVista("vista-fase1");
    }
  }
}

let promesaHistoriasSprint = null;

// se cargan las historias del sprint
async function cargarHistoriasSprint() {
  promesaHistoriasSprint = (async () => {
    try {
      const respuesta = await fetch(`/reuniones/sprint/${window.ID_SPRINT}/historias`, {
        headers: { "Accept": "application/json" }
      });
      const datos = await respuesta.json();
      window.requisitos = Array.isArray(datos.data) ? datos.data : [];

      const cuerpoHistorias = document.getElementById('cuerpoHistorias');
      if (cuerpoHistorias) {
        cuerpoHistorias.innerHTML = window.requisitos.length > 0
          ? window.requisitos.map(h => `
              <tr>
                <td><strong>${h.nombre}</strong><br><small>${h.descripcion || ''}</small></td>
                <td>${h.valor || 0}</td>
              </tr>
            `).join('')
          : '<tr><td colspan="2" style="text-align: center;">No hay historias asignadas a este sprint.</td></tr>';
      }
      poblarTablaDetalles();
      return window.requisitos;
    } catch (err) {
      console.error('Error al cargar historias:', err);
      window.requisitos = [];
      return [];
    }
  })();

  return promesaHistoriasSprint;
}

function mapearHistoriasPlanningPoker(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return null;

  return lista.map((h, idx) => ({
    id: h.id ?? idx + 1,
    titulo: h.nombre || h.titulo || `Historia ${idx + 1}`,
    descripcion: h.descripcion || ""
  }));
}

async function obtenerHistoriasParaPlanningPoker(sprintId) {
  if (promesaHistoriasSprint) {
    await promesaHistoriasSprint;
  }

  if (!Array.isArray(window.requisitos) || window.requisitos.length === 0) {
    try {
      const resp = await fetch(`/reuniones/sprint/${sprintId}/historias`, {
        headers: { "Accept": "application/json" }
      });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          window.requisitos = json.data;
        }
      }
    } catch (err) {
      console.warn("No se pudieron cargar historias frescas para Planning Poker:", err);
    }
  }

  return mapearHistoriasPlanningPoker(window.requisitos);
}

// =====================================================================
// PLANNING POKER (INTEGRACIÓN CON ROL Y VARIABLES GLOBALES DE REUNIÓN)
// =====================================================================
let ppCargando = false;
let ppScriptFacilitadorPromise = null;
let ppScriptDesarrolladorPromise = null;

function asegurarEstilosPlanningPoker(rol) {
  const cssRuta = rol === 'desarrollador'
    ? '../css/planningPokerDesarrollador.css'
    : '../css/planningPokerFacilitador.css';

  let linkCss = document.getElementById('dinamic-planning-css');
  if (!linkCss) {
    linkCss = document.createElement('link');
    linkCss.id = 'dinamic-planning-css';
    linkCss.rel = 'stylesheet';
    document.head.appendChild(linkCss);
  }
  linkCss.href = cssRuta;
}

function asegurarScriptPlanningPoker(rol) {
  if (rol === 'desarrollador') {
    if (!ppScriptDesarrolladorPromise) {
      ppScriptDesarrolladorPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "../js/planningPokerDesarrollador.js";
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    return ppScriptDesarrolladorPromise;
  }

  if (!ppScriptFacilitadorPromise) {
    ppScriptFacilitadorPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "../js/planningPokerFacilitador.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return ppScriptFacilitadorPromise;
}

function obtenerZonaTrabajoPlanningPoker() {
  return (
    document.getElementById("zonaDeTrabajo") ||
    document.querySelector("#area-trabajo .area-fondo") ||
    document.getElementById("area-trabajo") ||
    document.getElementById("vista-sprintPlanning")
  );
}

function mostrarModalPlanningPoker(idModal) {
  if (typeof mostrarModal === "function") {
    mostrarModal(idModal);
  } else {
    const modal = document.getElementById(idModal);
    if (modal) modal.style.display = "block";
  }
}

async function abrirPlanningPokerParaFacilitador() {
  const sprintId = Number(window.ID_SPRINT) || 1;
  const reunionId = Number(window.ID_REUNION) || 1;
  const proyectoId = Number(window.ID_PROYECTO) || 1;
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, name: "Facilitador Pruebas" };
  const role = 'facilitador';

  const zonaDeTrabajo = obtenerZonaTrabajoPlanningPoker();
  if (!zonaDeTrabajo || ppCargando) return;
  ppCargando = true;

  try {
    asegurarEstilosPlanningPoker(role);

    if (!document.getElementById("modal-planning-poker-facilitador")) {
      const respuesta = await fetch("./planningPokerFacilitador.html");
      const html = await respuesta.text();
      zonaDeTrabajo.insertAdjacentHTML("beforeend", html);
    }

    await asegurarScriptPlanningPoker(role);

    const contenedor = document.getElementById("cont-planning-poker");
    if (window.inicializarPlanningPokerFacilitador) {
      window.inicializarPlanningPokerFacilitador(contenedor);
    }
    mostrarModalPlanningPoker("modal-planning-poker-facilitador");

    const socketPP = io();

    const historiasDesdeSprint = await obtenerHistoriasParaPlanningPoker(sprintId);

    const historiasDePrueba = [
      { id: 1, titulo: "Autenticación", descripcion: "Permitir iniciar sesión" },
      { id: 2, titulo: "Splash Screen", descripcion: "Mostrar pantalla de carga" },
      { id: 3, titulo: "Exportar PDF", descripcion: "Exportar datos a formato PDF" },
      { id: 4, titulo: "Generar PB", descripcion: "LOREM" },
      { id: 5, titulo: "Colocar Musica a la aplicacion", descripcion: "Musica relajante para el cliente" },
      { id: 6, titulo: "Prueba", descripcion: "Lorem" },
      { id: 7, titulo: "Registro de Usuarios", descripcion: "Permitir registrar nuevos usuarios en el sistema" }
    ];

    const historiasFinales = Array.isArray(historiasDesdeSprint) && historiasDesdeSprint.length > 0
      ? historiasDesdeSprint
      : historiasDePrueba;

    socketPP.emit("join-planning-session", {
      sprintId,
      user: usuarioActual,
      role,
      stories: historiasFinales
    });

    socketPP.on("sync-session-state", (data) => {
      actualizarUIHistoriaFacilitador(contenedor, data);
      contenedor?.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
    });

    socketPP.on("load-next-story", (data) => {
      actualizarUIHistoriaFacilitador(contenedor, data);
      contenedor?.planningPokerFacilitador?.reiniciarVistaVotacion();
      if (data.participants && data.votes) {
        contenedor?.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
      }
    });

    socketPP.on("vote-reset", (data) => {
      contenedor?.planningPokerFacilitador?.reiniciarVistaVotacion();
      if (data.participants && data.votes) {
        contenedor?.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
      }
    });

    socketPP.on("vote-progress", (data) => {
      contenedor?.planningPokerFacilitador?.actualizarEstadoVotacion({
        votados: data.totalVoted,
        total: data.totalParticipants,
        titulo: "¡Votando!"
      });
      contenedor?.planningPokerFacilitador?.renderizarTarjetasVotando(data.participants, data.votes);
    });

    socketPP.on("cards-revealed", (data) => {
      contenedor?.planningPokerFacilitador?.renderizarResultados(data);
    });

    socketPP.on("session-finished", () => {
      alert("¡Se han terminado todas las historias del Planning Poker!");
      const modal = document.getElementById("modal-planning-poker-facilitador");
      if (modal) modal.style.display = "none";
      socketPP.disconnect();

      window.location.href = `panelFacilitador.html?sprint=${sprintId}&reunion=${reunionId}&proyecto=${proyectoId}&seccion=reuniones&vista=detalles`;
    });

    if (contenedor) {
      contenedor.addEventListener("planning-poker:accion", (evento) => {
        const { accion, ...datos } = evento.detail;

        if (accion === "revelar-cartas") {
          socketPP.emit("reveal-cards", { sprintId });
        } else if (accion === "repetir-votacion") {
          socketPP.emit("repeat-vote", { sprintId });
        } else if (accion === "saltar-historia") {
          socketPP.emit("skip-story", { sprintId });
        } else if (accion === "confirmar-estimacion") {
          socketPP.emit("next-story", {
            sprintId,
            finalStoryPoints: datos.puntos,
            finalHours: datos.horas
          });
        }
      });
    }

    const btnPracticaDetalles = document.getElementById("btn-pp-practicaDetalles");
    if (btnPracticaDetalles) {
      btnPracticaDetalles.addEventListener("click", () => {
        if (socketAsignacion) {
          socketAsignacion.emit("disparar-volver-detalles", {
            sprintId,
            reunionId,
            proyectoId
          });
        }
        window.location.href = `panelFacilitador.html?sprint=${sprintId}&reunion=${reunionId}&proyecto=${proyectoId}&seccion=reuniones&vista=detalles`;
      });
    }
  } catch (error) {
    console.error("Error al iniciar Planning Poker:", error);
    ppScriptFacilitadorPromise = null;
  } finally {
    ppCargando = false;
  }
}

function actualizarUIHistoriaFacilitador(contenedor, data) {
  if (contenedor && contenedor.planningPokerFacilitador && data?.currentStory) {
    contenedor.planningPokerFacilitador.actualizarHistoria({
      titulo: data.currentStory.titulo,
      descripcion: data.currentStory.descripcion,
      numero: data.storyIndex + 1,
      total: data.totalStories,
      sprint: "Sprint Actual"
    });
  }
}

async function abrirPlanningPokerParaDesarrollador() {
  const sprintId = Number(window.ID_SPRINT) || 1;
  const reunionId = Number(window.ID_REUNION) || 1;
  const proyectoId = Number(window.ID_PROYECTO) || 1;
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Desarrollador" };
  const role = "desarrollador";

  const zonaDeTrabajo = obtenerZonaTrabajoPlanningPoker();
  if (!zonaDeTrabajo || ppCargando) return;
  ppCargando = true;

  try {
    asegurarEstilosPlanningPoker(role);

    if (!document.getElementById("modal-planning-poker-desarrollador")) {
      const respuesta = await fetch("./planningPokerDesarrollador.html");
      const html = await respuesta.text();
      zonaDeTrabajo.insertAdjacentHTML("beforeend", html);
    }

    await asegurarScriptPlanningPoker(role);

    const contenedor = document.getElementById("cont-planning-poker");
    if (window.inicializarPlanningPokerDesarrollador) {
      window.inicializarPlanningPokerDesarrollador(contenedor);
    } else {
      console.warn("No se encontró window.inicializarPlanningPokerDesarrollador en planningPokerDesarrollador.js");
    }
    mostrarModalPlanningPoker("modal-planning-poker-desarrollador");

    const socketPP = io();

    socketPP.emit("join-planning-session", {
      sprintId,
      user: usuarioActual,
      role
    });

    socketPP.on("session-not-found", (mensaje) => {
      alert(mensaje || "Aún no hay una sesión de Planning Poker activa. Espera a que el facilitador la inicie.");
      const modal = document.getElementById("modal-planning-poker-desarrollador");
      if (modal) modal.style.display = "none";
      socketPP.disconnect();
    });

    socketPP.on("sync-session-state", (data) => {
      actualizarUIHistoriaDesarrollador(contenedor, data);
      contenedor?.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
    });

    socketPP.on("load-next-story", (data) => {
      actualizarUIHistoriaDesarrollador(contenedor, data);
      contenedor?.planningPokerDesarrollador?.reiniciarVistaVotacion();
      if (data.participants && data.votes) {
        contenedor?.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
      }
    });

    socketPP.on("vote-reset", (data) => {
      contenedor?.planningPokerDesarrollador?.reiniciarVistaVotacion();
      if (data.participants && data.votes) {
        contenedor?.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
      }
    });

    socketPP.on("vote-progress", (data) => {
      contenedor?.planningPokerDesarrollador?.actualizarEstadoVotacion(
        `${data.totalVoted} de ${data.totalParticipants} desarrolladores ya votaron`
      );
      contenedor?.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
    });

    socketPP.on("cards-revealed", (data) => {
      contenedor?.planningPokerDesarrollador?.renderizarResultados(data);
    });

    socketPP.on("session-finished", () => {
      alert("El facilitador ha finalizado la sesión de Planning Poker.");
      const modal = document.getElementById("modal-planning-poker-desarrollador");
      if (modal) modal.style.display = "none";
      socketPP.disconnect();

      window.location.href = `PanelDesarrollador.html?sprint=${sprintId}&reunion=${reunionId}&proyecto=${proyectoId}&seccion=reuniones&vista=detalles`;
    });

    if (contenedor) {
      contenedor.addEventListener("planning-poker:accion", (evento) => {
        const { accion, ...datos } = evento.detail;

        if (accion === "enviar-voto") {
          socketPP.emit("submit-vote", {
            sprintId,
            userId: usuarioActual.id,
            voteValue: datos.valor
          });
        }
      });
    }
  } catch (error) {
    console.error("Error al iniciar Planning Poker para desarrollador:", error);
    ppScriptDesarrolladorPromise = null;
  } finally {
    ppCargando = false;
  }
}

function actualizarUIHistoriaDesarrollador(contenedor, data) {
  if (contenedor && contenedor.planningPokerDesarrollador && data?.currentStory) {
    contenedor.planningPokerDesarrollador.actualizarHistoria(
      data.currentStory.titulo,
      data.currentStory.descripcion
    );

    const infoSesion = contenedor.querySelector("#text-info-pp-title");
    if (infoSesion) {
      infoSesion.textContent = `Historia ${data.storyIndex + 1} de ${data.totalStories} · Sesión de estimación`;
    }
  }
}

async function cargarVistaPlanningPoker(rol) {
  if (rol === 'desarrollador') {
    await abrirPlanningPokerParaDesarrollador();
  } else if (rol === 'facilitador') {
    await abrirPlanningPokerParaFacilitador();
  }
}

window.abrirPlanningPokerParaFacilitador = abrirPlanningPokerParaFacilitador;
window.abrirPlanningPokerParaDesarrollador = abrirPlanningPokerParaDesarrollador;

// cabeceras
function ocultarTodasCabeceras() {
  ["historiasSprint", "historiasResumen", "historiasAsignacion", "historiasRevision"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("oculto");
    }
  });
}

function mostrarCabeceraR(id) {
  ocultarTodasCabeceras();
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("oculto");
  }
}

function mostrarVista(idVista) {
  if (obtenerRolActual() === 'cliente') {
    if (idVista === 'vista-fase2' || idVista === 'vistaDetalles') {
      ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview"].forEach(vId => {
        const v = document.getElementById(vId);
        if (v) {
          v.style.setProperty("display", "none", "important");
          v.classList.add("oculto");
        }
      });
      mostrarCabeceraR("historiasSprint");
      mostrarAvisoFase2Cliente(true);
      return;
    }
    mostrarAvisoFase2Cliente(false);
  }

  ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview"].forEach(vId => {
    const vista = document.getElementById(vId);
    if (vista) {
      vista.style.setProperty("display", "none", "important");
      vista.classList.add("oculto");
    }
  });

  const vistaActiva = document.getElementById(idVista);
  if (vistaActiva) {
    vistaActiva.style.setProperty("display", "block", "important");
    vistaActiva.classList.remove("oculto");
  }

  switch (idVista) {
    case "vista-fase1":
      mostrarCabeceraR("historiasSprint");
      break;
    case "vistaDetalles":
      mostrarCabeceraR("historiasResumen");
      break;
    case "vista-fase2":
      mostrarCabeceraR("historiasAsignacion");
      cargarAsignacionFase2();
      break;
    case "vista-sprintReview":
      mostrarCabeceraR("historiasRevision");
      cargarHistoriasRevision();
      break;
  }
}

function mostrarAvisoFase2Cliente(mostrar) {
  let aviso = document.getElementById("avisoFase2Cliente");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "avisoFase2Cliente";
    aviso.style.cssText = "display:none; text-align:center; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:40px 30px; max-width:600px; margin:40px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);";
    aviso.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 15px;">📋</div>
      <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 10px;">Fase de Planificación en curso por el equipo</h3>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
        Como cliente, has validado y priorizado los requisitos de la iteración (Fase 1).
        Actualmente el equipo de desarrollo se encuentra realizando la estimación y asignación de tareas.
      </p>
      <span style="display: inline-block; background: #eff6ff; color: #2563eb; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
        Puedes salir de la reunión en cualquier momento usando el botón superior.
      </span>
    `;
    const contenedor = document.querySelector("#area-trabajo .area-fondo") || document.getElementById("area-trabajo");
    if (contenedor) contenedor.appendChild(aviso);
  }
  aviso.style.display = mostrar ? "block" : "none";
}

// tabla de detalles y calculo de esfuerzo con factores fijos
function poblarTablaDetalles() {
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  if (!cuerpoTabla) return;

  cuerpoTabla.innerHTML = window.requisitos.map(h => {
    const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
    const horasEstimadas = h.horas_estimadas ?? h.puntos_de_historia ?? 5;
    const factorSeleccionado = h.factor_complejidad !== undefined && h.factor_complejidad !== "" ? Number(h.factor_complejidad) : 0;

    return `
      <tr data-id="${h.id}">
        <td>PB-${numMostrar}</td>
        <td>${h.nombre}</td>
        <td>
          <input type="number" class="inp-puntos" value="${horasEstimadas}" style="width: 70px;" onchange="notificarCambioEstimacion(${h.id}, this)">
        </td>
        <td>
          <select class="inp-factor" onchange="notificarCambioEstimacion(${h.id}, this)" style="padding: 4px; border-radius: 4px;">
            <option value="0" ${factorSeleccionado === 0 ? 'selected' : ''}>0% Ninguno</option>
            <option value="0.25" ${factorSeleccionado === 0.25 ? 'selected' : ''}>25% Bajo</option>
            <option value="0.5" ${factorSeleccionado === 0.5 ? 'selected' : ''}>50% Medio</option>
            <option value="1.0" ${factorSeleccionado === 1.0 ? 'selected' : ''}>100% Alto</option>
          </select>
        </td>
        <td class="lbl-esfuerzo">${horasEstimadas}</td>
      </tr>
    `;
  }).join('');

  if (obtenerRolActual() === 'cliente') {
    cuerpoTabla.querySelectorAll("input, select").forEach(el => el.disabled = true);
  }

  calcularEsfuerzoTotal();
}

window.notificarCambioEstimacion = (idHistoria, elemento) => {
  const fila = elemento.closest("tr");
  const inpPuntos = fila.querySelector(".inp-puntos");
  const inpFactor = fila.querySelector(".inp-factor");

  const horas = Number(inpPuntos.value) || 0;
  const factor = Number(inpFactor.value) || 0;

  const historia = window.requisitos.find(h => h.id === idHistoria);
  if (historia) {
    historia.horas_estimadas = horas;
    historia.factor_complejidad = factor;
  }

  calcularEsfuerzoTotal();

  if (socketAsignacion) {
    socketAsignacion.emit("actualizar-factor-historia", {
      sprintId: window.ID_SPRINT,
      idHistoria: idHistoria,
      horas: horas,
      factor: factor
    });
  }
};

function calcularEsfuerzoTotal() {
  const filas = document.querySelectorAll("#cuerpoTabla tr");
  let esfuerzoAcumulado = 0;

  filas.forEach(tr => {
    const inpPuntos = tr.querySelector(".inp-puntos");
    const inpFactor = tr.querySelector(".inp-factor");
    const lblEsfuerzo = tr.querySelector(".lbl-esfuerzo");

    if (inpPuntos && inpFactor && lblEsfuerzo) {
      const horas = Number(inpPuntos.value) || 0;
      const factor = Number(inpFactor.value) || 0;
      const esfuerzoAjustado = Math.round(horas * (1 + factor));

      lblEsfuerzo.textContent = esfuerzoAjustado;
      esfuerzoAcumulado += esfuerzoAjustado;
    }
  });
}

let solicitudesPendientes = [];

// fase 2 - asignación de historias
function cargarAsignacionFase2() {
  const cuerpoAsignacion = document.getElementById("cuerpoAsignacion");
  if (!cuerpoAsignacion) return;
  if (obtenerRolActual() === 'cliente') return;

  const rol = obtenerRolActual();
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Usuario" };

  const panelSolicitudes = document.querySelector(".panel-solicitudes");
  if (panelSolicitudes) {
    panelSolicitudes.style.display = (rol === 'facilitador') ? "block" : "none";
  }

  cuerpoAsignacion.innerHTML = window.requisitos.map(h => {
    const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
    const esfuerzo = h.horas_calculadas || h.horas_estimadas || 5;

    const asignadoA = h.asignado_a || null;
    const estaEnEspera = solicitudesPendientes.find(s => s.idHistoria === h.id && s.idDesarrollador === usuarioActual.id);

    let htmlAccion = '';

    if (rol === 'desarrollador') {
      if (asignadoA) {
        htmlAccion = `<span style="color: #10b981; font-weight: 500;">✓ Asignada (${asignadoA})</span>`;
      } else if (estaEnEspera) {
        htmlAccion = `<span class="badge-espera" style="background: #94a3b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">En espera</span>`;
      } else {
        htmlAccion = `<button class="btn-solicitar" onclick="solicitarHistoria(${h.id})" style="background: #2563eb; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer;">Solicitar</button>`;
      }
    } else {
      htmlAccion = asignadoA
        ? `<span>${asignadoA}</span>`
        : `<span style="color: #64748b;">Sin asignar</span>`;
    }

    return `
      <tr data-id="${h.id}">
        <td><strong>PB-${numMostrar}</strong> ${h.nombre}</td>
        <td>${esfuerzo} hrs</td>
        <td>${htmlAccion}</td>
      </tr>
    `;
  }).join('');

  if (rol === 'facilitador') {
    renderizarPanelSolicitudes();
  }
}

function calcularRestante() {
  const inpFechaInicio = document.getElementById("inpFechaInicio");
  const inpFechaFin = document.getElementById("inpFechaFin");
  const txtRestante = document.getElementById("txtRestante");

  if (!inpFechaInicio || !inpFechaFin || !txtRestante) return;

  const ini = inpFechaInicio.value;
  const fin = inpFechaFin.value;

  if (!ini || !fin) {
    txtRestante.textContent = "Tiempo restante: -- días";
    return;
  }

  const dias = Math.ceil((new Date(fin) - new Date(ini)) / 86400000);
  txtRestante.textContent = dias < 0 ? "⚠ Fecha fin errónea" : `${dias} días`;
}

let socketReunion = null;

function inicializarSocketsReunion(idSprint) {
  if (!socketReunion) {
    socketReunion = io();

    window.solicitarHistoria = (idHistoria) => {
      const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Desarrollador" };

      socketReunion.emit("solicitar-historia", {
        sprintId: idSprint,
        idHistoria: idHistoria,
        idDesarrollador: usuarioActual.id,
        nombreDesarrollador: usuarioActual.nombre || usuarioActual.name
      });
    };

    socketReunion.on("notificar-solicitud", (data) => {
      solicitudesPendientes.push(data);
      renderizarPanelSolicitudes();
      if (document.getElementById("vista-fase2").style.display === "block") {
        cargarAsignacionFase2();
      }
    });

    socketReunion.on("actualizar-estado-asignacion", (data) => {
      const historia = window.requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.asignado_a = data.aceptada ? data.nombreDesarrollador : null;
      }
      solicitudesPendientes = solicitudesPendientes.filter(s => s.idHistoria !== data.idHistoria);

      cargarAsignacionFase2();
    });
  }
}

function renderizarPanelSolicitudes() {
  const contenedorSolicitudes = document.getElementById("listaSolicitudes");
  const contadorSolicitudes = document.getElementById("numSolicitudes");

  if (!contenedorSolicitudes) return;

  contadorSolicitudes.textContent = solicitudesPendientes.length;

  if (solicitudesPendientes.length === 0) {
    contenedorSolicitudes.innerHTML = `<p style="font-size: 13px; color: #64748b; text-align: center;">No hay solicitudes pendientes.</p>`;
    return;
  }

  contenedorSolicitudes.innerHTML = solicitudesPendientes.map(solicitud => `
    <div style="background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
      <p style="margin: 0 0 6px 0;"><strong>${solicitud.nombreDesarrollador}</strong> solicita <strong>PB-${solicitud.idHistoria}</strong></p>
      <div style="display: flex; gap: 8px;">
        <button onclick="responderSolicitud(${solicitud.idHistoria}, ${solicitud.idDesarrollador}, true, '${solicitud.nombreDesarrollador}')" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Aceptar</button>
        <button onclick="responderSolicitud(${solicitud.idHistoria}, ${solicitud.idDesarrollador}, false, '')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Rechazar</button>
      </div>
    </div>
  `).join('');
}

window.responderSolicitud = (idHistoria, idDesarrollador, aceptada, nombreDesarrollador) => {
  if (socketReunion) {
    socketReunion.emit("gestionar-solicitud", {
      sprintId: window.ID_SPRINT,
      idHistoria,
      idDesarrollador,
      aceptada,
      nombreDesarrollador
    });
  }
};

let socketAsignacion = null;

function inicializarSocketsAsignacion(idSprint) {
  if (!socketAsignacion) {
    socketAsignacion = io();

    socketAsignacion.on("connect", () => {
      console.log("Socket conectado:", socketAsignacion.id, "| sprint:", window.ID_SPRINT);
      socketAsignacion.emit("join-asignacion-sprint", { sprintId: window.ID_SPRINT });
    });

    socketAsignacion.on("abrir-planning-poker-cliente", () => {
      const rolActual = obtenerRolActual();

      if (rolActual === 'desarrollador') {
        cargarVistaPlanningPoker('desarrollador');
      } else if (rolActual === 'cliente') {
        ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview"].forEach(vId => {
          const v = document.getElementById(vId);
          if (v) {
            v.style.setProperty("display", "none", "important");
            v.classList.add("oculto");
          }
        });
        mostrarCabeceraR("historiasSprint");
        mostrarAvisoFase2Cliente(true);
      }
    });

    socketAsignacion.on("volver-detalles-cliente", () => {
      const rolActual = obtenerRolActual();

      if (rolActual === 'desarrollador') {
        window.location.href = `PanelDesarrollador.html?sprint=${window.ID_SPRINT}&reunion=${window.ID_REUNION}&proyecto=${window.ID_PROYECTO}&seccion=reuniones&vista=detalles`;
      }
    });

    socketAsignacion.on("cambio-factor-historia-cliente", (data) => {
      const historia = window.requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.horas_estimadas = data.horas;
        historia.factor_complejidad = data.factor;
      }

      const fila = document.querySelector(`#cuerpoTabla tr[data-id="${data.idHistoria}"]`);
      if (fila) {
        const inpPuntos = fila.querySelector(".inp-puntos");
        const inpFactor = fila.querySelector(".inp-factor");
        if (inpPuntos) inpPuntos.value = data.horas;
        if (inpFactor) inpFactor.value = data.factor;
      }

      calcularEsfuerzoTotal();
    });

    socketAsignacion.on("cambio-fechas-cliente", (data) => {
      const inpFechaInicio = document.getElementById("inpFechaInicio");
      const inpFechaFin = document.getElementById("inpFechaFin");

      if (inpFechaInicio && data.fechaInicio) inpFechaInicio.value = data.fechaInicio;
      if (inpFechaFin && data.fechaFin) inpFechaFin.value = data.fechaFin;

      calcularRestante();
    });

    socketAsignacion.on("notificar-solicitud", (data) => {
      const existe = solicitudesPendientes.some(s => s.idHistoria === data.idHistoria && s.idDesarrollador === data.idDesarrollador);
      if (!existe) {
        solicitudesPendientes.push(data);
        renderizarPanelSolicitudes();
        if (document.getElementById("vista-fase2")?.style.display === "block") {
          cargarAsignacionFase2();
        }
      }
    });

    socketAsignacion.on("fase-2-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        mostrarVista("vista-fase2");
      } else if (rolActual === 'cliente') {
        ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview"].forEach(vId => {
          const v = document.getElementById(vId);
          if (v) {
            v.style.setProperty("display", "none", "important");
            v.classList.add("oculto");
          }
        });
        mostrarCabeceraR("historiasSprint");
        mostrarAvisoFase2Cliente(true);
      }
    });

    socketAsignacion.on("fase-1-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador' || rolActual === 'cliente') {
        mostrarAvisoFase2Cliente(false);
        mostrarVista("vista-fase1");
      }
    });

    socketAsignacion.on("confirmar-sprint-cliente", (data) => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        alert("El facilitador ha confirmado el Sprint Backlog. La reunión ha finalizado.");
        window.location.href = `PanelDesarrollador.html?sprint=${data.sprintId}&reunion=${data.reunionId}&proyecto=${data.proyectoId}&seccion=reuniones`;
      } else if (rolActual === 'cliente') {
        mostrarAvisoFase2Cliente(false);
        alert("El facilitador ha confirmado el Sprint Backlog. La reunión ha finalizado.");
        document.getElementById("vista-sprintPlanning").style.display = "none";
        document.getElementById("modal-reuniones").style.display = "block";
      }
    });

    socketAsignacion.on("actualizar-estado-asignacion", (data) => {
      const historia = window.requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.asignado_a = data.aceptada ? data.nombreDesarrollador : null;
      }
      solicitudesPendientes = solicitudesPendientes.filter(s => s.idHistoria !== data.idHistoria);

      renderizarPanelSolicitudes();
      cargarAsignacionFase2();
    });

    socketAsignacion.on("notificacion-asignacion-exitosa", (data) => {
      const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1 };
      const rolActual = obtenerRolActual();

      if (rolActual === 'desarrollador' && Number(usuarioActual.id) === Number(data.idDesarrollador)) {
        mostrarModalNotificacion(`Se te ha asignado la tarea "${data.nombreHistoria}" con éxito. Revisa tus responsabilidades.`);
      }
    });

    socketAsignacion.on("acta-revision-cerrada-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'facilitador' || rolActual === 'desarrollador') {
        const bannerEspera = document.getElementById("bannerEsperaCliente");
        if (bannerEspera) bannerEspera.classList.add("oculto");

        cargarHistoriasRevision();
      }
    });
  }
  socketAsignacion.emit("join-asignacion-sprint", { sprintId: idSprint });
}

function aplicarRestriccionesRevision(rol) {
  const rolActual = rol.toLowerCase();

  const elementosCliente = document.querySelectorAll('[data-rol*="cliente"]');
  const elementosFacilitadorDev = document.querySelectorAll('[data-rol*="facilitador"], [data-rol*="desarrollador"]');
  const panelResumen = document.getElementById('panelResumenRevision');
  const btnCerrarActa = document.getElementById('btnCerrarActaSprint');
  const btnRetrospectiva = document.getElementById('btnIrRetrospectiva');
}