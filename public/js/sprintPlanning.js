if (typeof window.requisitos === 'undefined') window.requisitos = [];

const proyectoGuardadoSession = JSON.parse(sessionStorage.getItem('proyectoActivo'));
const urlParamsGlobal = new URLSearchParams(window.location.search);
const ID_TIPO_DAILY = 1;
const ID_TIPO_PLANNING = 2;
const ID_TIPO_RETROSPECTIVA = 3;
const ID_TIPO_REVIEW = 4;

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
      const inpFechaInicio = document.getElementById("inpFechaInicio");
      const inpFechaFin = document.getElementById("inpFechaFin");

      const historiasAsignadas = (window.requisitos || [])
        .filter(h => h.asignado_a || h.id_desarrollador)
        .map(h => {
          const horas = Number(h.horas_estimadas ?? h.puntos_de_historia ?? 5);
          const factor = Number(h.factor_complejidad ?? 0);
          return {
            idHistoria: Number(h.id),
            idDesarrollador: Number(h.id_desarrollador) || null,
            nombreDesarrollador: h.asignado_a,
            horasEstimadas: horas,
            factorComplejidad: factor,
            esfuerzoEstimado: Math.round(horas * (1 + factor)),
            estado: "por-empezar"
          };
        });

      const resp = await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sprint: window.ID_SPRINT,
          proyectoId: window.ID_PROYECTO,
          fechaInicio: inpFechaInicio ? inpFechaInicio.value : null,
          fechaFin: inpFechaFin ? inpFechaFin.value : null,
          asignaciones: historiasAsignadas
        })
      });

      if (!resp.ok) {
        throw new Error(`Error HTTP ${resp.status}`);
      }

      if (socketAsignacion) {
        socketAsignacion.emit("disparar-confirmar-sprint", {
          sprintId: window.ID_SPRINT,
          reunionId: window.ID_REUNION,
          proyectoId: window.ID_PROYECTO
        });
      }

      alert("¡Sprint Backlog confirmado con éxito! La reunión ha finalizado.");
      sessionStorage.setItem("ULTIMA_REUNION_CONFIRMADA", String(window.ID_REUNION));
      sessionStorage.removeItem("ID_REUNION_ACTIVA");
      sessionStorage.removeItem("TIPO_REUNION_ACTIVA");
      await navegarASprintBacklog(window.ID_SPRINT, window.ID_PROYECTO);
    } catch (err) {
      console.error("Error al confirmar el sprint:", err);
      alert("Ocurrió un error al finalizar la reunión.");
    }
  };
}

  if (window.ID_TIPO_REUNION === ID_TIPO_DAILY) {
    if (rol === 'cliente') {
      alert("La Daily Scrum es exclusiva del equipo Scrum.");
      document.getElementById("vista-sprintPlanning").style.display = "none";
      document.getElementById("modal-reuniones").style.display = "block";
      if (typeof cargarReuniones === "function") cargarReuniones();
      return;
    }
    mostrarVista("vista-dailyScrum");
    inicializarDailyScrum();
  } else if (window.ID_TIPO_REUNION === ID_TIPO_REVIEW) {
    mostrarVista("vista-sprintReview");
  } else if (window.ID_TIPO_REUNION === ID_TIPO_RETROSPECTIVA) {
    mostrarVista("vista-retrospectiva");
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
      window.requisitos = Array.isArray(datos.data)
        ? datos.data.map(h => ({ ...h, id: Number(h.id ?? h.historia_id) }))
        : [];

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

    socketPP.on("chat-message", (data) => {
      contenedor?.planningPokerFacilitador?.mostrarMensaje(data.emisor, data.mensaje, false);
    });

    // opcional (historial)
    socketPP.on("chat-history", (mensajes) => {
      mensajes.forEach(m =>
        contenedor?.planningPokerFacilitador?.mostrarMensaje(
          m.emisor, m.mensaje, m.userId === usuarioActual.id
        )
      );
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
        } else if (accion === "enviar-mensaje") {
          socketPP.emit("send-chat-message", { sprintId, mensaje: datos.mensaje });
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

    if (socketAsignacion) {
      socketAsignacion.emit("registrar-rol-reunion", { rol: obtenerRolActual() });
      socketAsignacion.emit("join-asignacion-sprint", { sprintId });
    }

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

    socketPP.on("chat-message", (data) => {
      contenedor?.planningPokerDesarrollador?.mostrarMensaje(data.emisor, data.mensaje, false);
    });

    // opcional (historial)
    socketPP.on("chat-history", (mensajes) => {
      mensajes.forEach(m =>
        contenedor?.planningPokerDesarrollador?.mostrarMensaje(
          m.emisor, m.mensaje, m.userId === usuarioActual.id
        )
      );
    });

    if (contenedor) {
      contenedor.addEventListener("planning-poker:accion", (evento) => {
        const { accion, ...datos } = evento.detail;

        if (accion === "enviar-voto") {
          socketPP.emit("submit-vote", { sprintId, userId: usuarioActual.id, voteValue: datos.valor });
        } else if (accion === "enviar-mensaje") {
          socketPP.emit("send-chat-message", { sprintId, mensaje: datos.mensaje });
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
  ["historiasSprint", "historiasResumen", "historiasAsignacion", "historiasRevision", "historiasDaily", "historiasRetrospectiva"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("oculto");
  });
}

const TITULOS_CABECERA_REUNION = {
  historiasSprint: {
    titulo: "Planificación de la iteración",
    subtitulo: "Fase 1: definición de requisitos priorizados y estimación."
  },
  historiasResumen: {
    titulo: "Tareas a realizar en la iteración",
    subtitulo: "Duración, estimaciones y esfuerzo calculado del sprint."
  },
  historiasAsignacion: {
    titulo: "Asignación de historias",
    subtitulo: "Fase 2: distribución de historias y solicitudes del equipo."
  },
  historiasRevision: {
    titulo: "Revisión de entregables del Sprint",
    subtitulo: "Evaluación de historias terminadas, criterios y observaciones."
  },
  historiasDaily: {
    titulo: "Daily Scrum - Sincronización Diaria",
    subtitulo: "Seguimiento diario de avances, plan del día e impedimentos."
  },
  historiasRetrospectiva: {
    titulo: "Sprint Retrospective - Retrospectiva del Sprint",
    subtitulo: "Reflexión sobre qué salió bien, qué mejorar y acciones."
  }
};

let cabeceraReunionOriginal = null;

function sincronizarCabeceraPanelSuperior(idCabeceraReunion) {
  const cabeceraPanel = document.querySelector("#contenedor-cabeceras .cabecera-default.activa")
    || document.getElementById("cabecera-springPlanning");
  if (!cabeceraPanel) return;

  const h2 = cabeceraPanel.querySelector(".info-cabecera h2");
  const p = cabeceraPanel.querySelector(".info-cabecera p");
  if (!h2 || !p) return;

  if (!cabeceraReunionOriginal) {
    cabeceraReunionOriginal = { titulo: h2.textContent, subtitulo: p.textContent };
  }

  const info = TITULOS_CABECERA_REUNION[idCabeceraReunion];
  if (info) {
    h2.textContent = info.titulo;
    p.textContent = info.subtitulo;
  }

  // Oculta la barra duplicada interna de sprintPlanning cuando ya está dentro del panel
  const planningSuperior = document.getElementById("planningSuperior");
  if (planningSuperior) {
    planningSuperior.style.display = "none";
  }
}

function restaurarCabeceraReuniones() {
  const cabeceraReunion = document.getElementById("cabecera-springPlanning");
  if (cabeceraReunion && cabeceraReunionOriginal) {
    const h2 = cabeceraReunion.querySelector(".info-cabecera h2");
    const p = cabeceraReunion.querySelector(".info-cabecera p");
    if (h2) h2.textContent = cabeceraReunionOriginal.titulo;
    if (p) p.textContent = cabeceraReunionOriginal.subtitulo;
  }
}

function mostrarCabeceraR(id) {
  ocultarTodasCabeceras();
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("oculto");
  }
  sincronizarCabeceraPanelSuperior(id);
}

function mostrarVista(idVista) {
  if (obtenerRolActual() === 'cliente') {
    if (idVista === 'vista-fase2' || idVista === 'vistaDetalles') {
      ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview", "vista-dailyScrum", "vista-retrospectiva"].forEach(vId => {
        const vista = document.getElementById(vId);
        if (vista) {
          vista.style.setProperty("display", "none", "important");
          vista.classList.add("oculto");
        }
      });
      mostrarCabeceraR("historiasSprint");
      mostrarAvisoFase2Cliente(true);
      return;
    }
    mostrarAvisoFase2Cliente(false);
  }

  ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview", "vista-dailyScrum", "vista-retrospectiva"].forEach(vId => {
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
    case "vista-dailyScrum":
      mostrarCabeceraR("historiasDaily");
      break;
    case "vista-retrospectiva":
      mostrarCabeceraR("historiasRetrospectiva");
      inicializarRetrospectiva();
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
            <option value="1" ${factorSeleccionado === 1 ? 'selected' : ''}>100% Alto</option>
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
  const horasCalculadas = Math.round(horas * (1 + factor));

  const historia = window.requisitos.find(h => Number(h.id) === Number(idHistoria));
  if (historia) {
    historia.horas_estimadas = horas;
    historia.factor_complejidad = factor;
    historia.horas_calculadas = horasCalculadas;
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
async function cargarAsignacionFase2() {
  const cuerpoAsignacion = document.getElementById("cuerpoAsignacion");
  if (!cuerpoAsignacion) return;
  if (obtenerRolActual() === 'cliente') return;

  if (!Array.isArray(window.requisitos) || window.requisitos.length === 0) {
    await cargarHistoriasSprint();
  }

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

// función que ejecuta el desarrollador al hacer clic en "Solicitar"
window.solicitarHistoria = (idHistoria) => {
  if (!socketAsignacion) return;
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Desarrollador" };
  const hist = (window.requisitos || []).find(h => Number(h.id) === Number(idHistoria));
  const numeroHistoria = hist?.numeroDeHistoria ?? hist?.numero_de_historia ?? idHistoria;

  socketAsignacion.emit("solicitar-historia", {
    sprintId: window.ID_SPRINT,
    idHistoria: idHistoria,
    numeroHistoria: numeroHistoria,
    nombreHistoria: hist?.nombre || `PB-${numeroHistoria}`,
    idDesarrollador: usuarioActual.id,
    nombreDesarrollador: usuarioActual.nombre || usuarioActual.name
  });
};

function limpiarParametrosReunionActiva() {
  sessionStorage.removeItem("ID_REUNION_ACTIVA");
  sessionStorage.removeItem("TIPO_REUNION_ACTIVA");

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("seccion");
    url.searchParams.delete("vista");
    url.searchParams.delete("reunion");
    window.history.replaceState({}, "", url.toString());
  } catch (e) {}
}

async function navegarASprintBacklog(sprintId, proyectoId) {
  limpiarParametrosReunionActiva();
  if (sprintId) {
    sessionStorage.setItem("ID_SPRINT_ACTIVO", String(sprintId));
  }

  const vistaPlanning = document.getElementById("vista-sprintPlanning");
  if (vistaPlanning) {
    vistaPlanning.style.display = "none";
  }

  ["vista-fase1", "vistaDetalles", "vista-fase2", "vista-sprintReview", "vista-dailyScrum", "vista-retrospectiva"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.setProperty("display", "none", "important");
      el.classList.add("oculto");
    }
  });

  if (typeof asegurarModalSprintCargado === "function") {
    await asegurarModalSprintCargado();
  }

  if (typeof mostrarSeccion === "function") {
    mostrarSeccion("sprint-backlog");
  } else {
    const seccionBacklog =
      document.getElementById("sprint-backlog") ||
      document.getElementById("modal-sprint-backlog") ||
      document.getElementById("vista-sprintBacklog") ||
      document.getElementById("seccion-sprint-backlog");

    if (seccionBacklog) {
      document.querySelectorAll(".modal-class").forEach(m => {
        m.style.display = "none";
      });
      seccionBacklog.classList.remove("oculto");
      seccionBacklog.style.display = "block";
    }
  }

  if (typeof inicializarSelectorIteraciones === "function") {
    await inicializarSelectorIteraciones();
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

  contenedorSolicitudes.innerHTML = solicitudesPendientes.map(solicitud => {
    const numMostrar = solicitud.numeroHistoria ?? solicitud.idHistoria;
    return `
      <div style="background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
        <p style="margin: 0 0 6px 0;"><strong>${solicitud.nombreDesarrollador}</strong> solicita <strong>PB-${numMostrar}</strong></p>
        <div style="display: flex; gap: 8px;">
          <button onclick="responderSolicitud(${solicitud.idHistoria}, ${solicitud.idDesarrollador}, true, '${solicitud.nombreDesarrollador}')" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Aceptar</button>
          <button onclick="responderSolicitud(${solicitud.idHistoria}, ${solicitud.idDesarrollador}, false, '')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Rechazar</button>
        </div>
      </div>
    `;
  }).join('');
}

// función que ejecuta el facilitador al dar "Aceptar" o "Rechazar" cuando un desarrollador pide una historia
window.responderSolicitud = (idHistoria, idDesarrollador, aceptada, nombreDesarrollador) => {
  if (!socketAsignacion) return;
  const hist = (window.requisitos || []).find(h => Number(h.id) === Number(idHistoria));
  const numMostrar = hist?.numeroDeHistoria ?? hist?.numero_de_historia ?? idHistoria;
  const etiquetaHistoria = hist ? `PB-${numMostrar} - ${hist.nombre}` : `PB-${numMostrar}`;

  socketAsignacion.emit("gestionar-solicitud", {
    sprintId: window.ID_SPRINT,
    idHistoria,
    idDesarrollador,
    aceptada,
    nombreDesarrollador,
    nombreHistoria: etiquetaHistoria
  });
};

let socketAsignacion = null;

function inicializarSocketsAsignacion(idSprint) {
  if (!socketAsignacion) {
    socketAsignacion = io();

    socketAsignacion.on("connect", () => {
      console.log("Socket conectado:", socketAsignacion.id, "| sprint:", window.ID_SPRINT);
      socketAsignacion.emit("registrar-rol-reunion", { rol: obtenerRolActual() });
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
      const params = new URLSearchParams(window.location.search);

      if (rolActual === 'desarrollador' && params.get("vista") !== "detalles") {
        window.location.href = `PanelDesarrollador.html?sprint=${window.ID_SPRINT}&reunion=${window.ID_REUNION}&proyecto=${window.ID_PROYECTO}&seccion=reuniones&vista=detalles`;
      }
    });

    socketAsignacion.on("cambio-factor-historia-cliente", (data) => {
      const horasCalculadas = Math.round(Number(data.horas || 0) * (1 + Number(data.factor || 0)));
      const historia = window.requisitos.find(h => Number(h.id) === Number(data.idHistoria));
      if (historia) {
        historia.horas_estimadas = data.horas;
        historia.factor_complejidad = data.factor;
        historia.horas_calculadas = horasCalculadas;
      }

      const fila = document.querySelector(`#cuerpoTabla tr[data-id="${data.idHistoria}"]`);
      if (fila) {
        const inpPuntos = fila.querySelector(".inp-puntos");
        const inpFactor = fila.querySelector(".inp-factor");
        const lblEsfuerzo = fila.querySelector(".lbl-esfuerzo");
        if (inpPuntos) inpPuntos.value = data.horas;
        if (inpFactor) inpFactor.value = String(Number(data.factor ?? 0));
        if (lblEsfuerzo) lblEsfuerzo.textContent = horasCalculadas;
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
      if (rolActual === 'cliente') return;

      alert("El facilitador ha confirmado el Sprint Backlog. La reunión ha finalizado.");
      navegarASprintBacklog(data?.sprintId || window.ID_SPRINT, data?.proyectoId || window.ID_PROYECTO);
    });

    socketAsignacion.on("actualizar-estado-asignacion", (data) => {
      const historia = window.requisitos.find(h => Number(h.id) === Number(data.idHistoria));
      if (historia) {
        historia.asignado_a = data.aceptada ? data.nombreDesarrollador : null;
        historia.id_desarrollador = data.aceptada ? Number(data.idDesarrollador) : null;
      }
      solicitudesPendientes = solicitudesPendientes.filter(s => Number(s.idHistoria) !== Number(data.idHistoria));

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

        // el cliente ya cerró el acta: sin esto, cargarHistoriasRevision vuelve a mostrar el banner
        window.ESTADO_REUNION = 'Finalizada';
        cargarHistoriasRevision();
      }
    });

    // alguien publicó su daily: refresca el muro si estoy viendo esa reunión
    socketAsignacion.on("daily-actualizada", (data) => {
      const vista = document.getElementById("vista-dailyScrum");
      if (vista && vista.style.display === "block" && Number(data.reunionId) === Number(dailyReunionVista)) {
        cargarMuroDaily(dailyReunionVista);
      }
    });

    // el facilitador finalizó la daily
    socketAsignacion.on("daily-finalizada-cliente", (data) => {
      if (obtenerRolActual() === 'facilitador') return;
      if (Number(data.reunionId) !== Number(window.ID_REUNION)) return;
      alert("El facilitador ha finalizado la Daily Scrum.");
      salirDeDaily();
    });

    // alguien agregó una nota, votó o marcó un compromiso en la retrospectiva
    socketAsignacion.on("retro-actualizada", (data) => {
      const vista = document.getElementById("vista-retrospectiva");
      if (vista && vista.style.display === "block" && Number(data.reunionId) === Number(window.ID_REUNION)) {
        cargarRetrospectiva();
      }
    });

    // el facilitador finalizó la retrospectiva
    socketAsignacion.on("retro-finalizada-cliente", (data) => {
      if (obtenerRolActual() === 'facilitador') return;
      if (Number(data.reunionId) !== Number(window.ID_REUNION)) return;
      alert("El facilitador ha finalizado la Retrospectiva.");
      salirDeRetrospectiva();
    });
  }

  socketAsignacion.emit("registrar-rol-reunion", { rol: obtenerRolActual() });
  socketAsignacion.emit("join-asignacion-sprint", { sprintId: idSprint });
}

function aplicarRestriccionesRevision(rol) {
  const rolActual = rol.toLowerCase();

  const elementosCliente = document.querySelectorAll('[data-rol*="cliente"]');
  const elementosFacilitadorDev = document.querySelectorAll('[data-rol*="facilitador"], [data-rol*="desarrollador"]');
  const panelResumen = document.getElementById('panelResumenRevision');
  const btnCerrarActa = document.getElementById('btnCerrarActaSprint');
  const btnRetrospectiva = document.getElementById('btnIrRetrospectiva');

  if (rolActual === 'cliente') {
    elementosCliente.forEach(el => el.style.display = 'flex');
    elementosFacilitadorDev.forEach(el => el.classList.add('oculto'));
    if (panelResumen) panelResumen.style.display = 'block';
    if (btnCerrarActa) {
      btnCerrarActa.style.display = 'block';
      btnCerrarActa.classList.remove('oculto');
    }
    if (btnRetrospectiva) {
      btnRetrospectiva.style.display = 'none';
      btnRetrospectiva.classList.add('oculto');
    }
  } else if (rolActual === 'facilitador') {
    elementosCliente.forEach(el => el.style.display = 'none');
    elementosFacilitadorDev.forEach(el => el.classList.remove('oculto'));
    if (panelResumen) panelResumen.style.display = 'none';
    if (btnCerrarActa) {
      btnCerrarActa.style.display = 'block';
      btnCerrarActa.classList.remove('oculto');
    }
    if (btnRetrospectiva) {
      btnRetrospectiva.style.display = 'block';
      btnRetrospectiva.classList.remove('oculto');
    }

    document.querySelectorAll('.txt-comentario-cliente').forEach(ta => ta.disabled = true);
  } else if (rolActual === 'desarrollador') {
    elementosCliente.forEach(el => el.style.display = 'none');
    elementosFacilitadorDev.forEach(el => el.classList.remove('oculto'));

    const btnDevolver = document.querySelectorAll('.btn-devolver-backlog');
    btnDevolver.forEach(b => b.style.display = 'none');

    if (panelResumen) panelResumen.style.display = 'none';
    if (btnCerrarActa) btnCerrarActa.style.display = 'none';
    if (btnRetrospectiva) {
      btnRetrospectiva.style.display = 'block';
      btnRetrospectiva.classList.remove('oculto');
    }

    document.querySelectorAll('.txt-comentario-cliente').forEach(ta => ta.disabled = true);
  }
}

// delegación de eventos: funciona aunque el botón se inserte/pinte después de cargar el script
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#btnCerrarActaSprint");
  if (!btn) return;

  const rolActual = obtenerRolActual();
  const esCliente = rolActual.includes('cliente');
  const esFacilitador = rolActual.includes('facilitador');

  if (!esCliente && !esFacilitador) {
    alert("Tu rol (" + rolActual + ") no puede cerrar el acta de revisión.");
    return;
  }

  const mensaje = esCliente
    ? "¿Estás seguro de finalizar la revisión? Al cerrar el acta, los resultados se enviarán al equipo."
    : "¿Estás seguro de cerrar la sesión de revisión y finalizar esta reunión?";
  if (!confirm(mensaje)) return;

  try {
    const respuesta = await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      alert("Error al finalizar la reunión: " + (resultado.error || respuesta.status));
      return;
    }

    if (esCliente && socketAsignacion) {
      socketAsignacion.emit("cliente-cerro-acta-revision", {
        sprintId: window.ID_SPRINT,
        reunionId: window.ID_REUNION
      });
    }

    alert(esCliente ? "¡Acta de revisión cerrada con éxito!" : "Reunión finalizada correctamente.");
    document.getElementById("vista-sprintPlanning").style.display = "none";
    document.getElementById("modal-reuniones").style.display = "block";
    if (typeof cargarReuniones === "function") cargarReuniones();
  } catch (err) {
    console.error("Error al cerrar el acta:", err);
    alert("No se pudo finalizar la reunión. Revisa la consola (F12) y la pestaña Network.");
  }
});

async function cargarHistoriasRevision() {
  try {
    // se obtienen las historias terminadas del sprint actual
    const respuesta = await fetch(`/reuniones/sprint/${window.ID_SPRINT}/historias-revision?idProyecto=${window.ID_PROYECTO}`, {
      headers: { "Accept": "application/json" }
    });
    const resultado = await respuesta.json();
    const historias = resultado.data || [];

    const contenedor = document.getElementById('contenedorTarjetasReview');
    if (!contenedor) return;

    if (historias.length === 0) {
      contenedor.innerHTML = `<p style="text-align: center; color: #64748b; grid-column: span 3;">No hay historias terminadas registradas para revisar en este sprint.</p>`;
      return;
    }

    // se obtiene el rol actual para mostrar lo correspondiente
    const rolActual = obtenerRolActual();
    aplicarRestriccionesRevision(rolActual);

    // si la reunión esta finalizada se oculta el banner
    const bannerEspera = document.getElementById("bannerEsperaCliente");
    if (bannerEspera) {
      if (rolActual === 'cliente' || window.ESTADO_REUNION === 'Finalizada') {
        bannerEspera.classList.add("oculto");
      } else {
        bannerEspera.classList.remove("oculto");
      }
    }

    // cada tarjeta con sus criterios
    contenedor.innerHTML = historias.map(h => {
      const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
      const estadoRevision = h.estado_revision || 'PENDIENTE';
      const claseEstado = estadoRevision === 'ACEPTADO' ? 'estado-aceptado' : (estadoRevision === 'RECHAZADO' ? 'estado-rechazado' : 'estado-pendiente');

      const listaCriteriosHTML = h.criterios && h.criterios.length > 0
        ? h.criterios.map((c, index) => `
            <li>
              <label>
                <input type="checkbox" class="chk-criterio" ${c.cumplido ? 'checked' : ''} ${rolActual !== 'cliente' ? 'disabled' : ''}>
                <span>Criterio ${index + 1}: ${c.descripcion || c}</span>
              </label>
            </li>
          `).join('')
        : '<li><small style="color: #64748b;">Sin criterios definidos</small></li>';

      return `
        <article class="tarjeta-historia-review" id="tarjeta-historia-${h.id}" data-historia-id="${h.id}">
          <div class="tarjeta-header-blanco">
            <strong class="historia-codigo">SB-${numMostrar}:</strong>
            <p class="historia-descripcion">${h.descripcion || h.nombre}</p>
          </div>

          <div class="tarjeta-criterios">
            <div class="criterios-cabecera-accion">
              <h4>Criterios de Aceptación</h4>
              <button type="button" class="btn-azul btn-devolver-backlog ${rolActual === 'facilitador' && estadoRevision === 'RECHAZADO' ? '' : 'oculto'}" onclick="devolverAProductBacklog(${h.id})">
                Devolver al product backlog
              </button>
            </div>
            <ul class="lista-criterios">
              ${listaCriteriosHTML}
            </ul>
          </div>

          <div class="tarjeta-comentario">
            <label for="comentario-${h.id}">Comentario:</label>
            <textarea id="comentario-${h.id}" class="txt-comentario-review" rows="3" placeholder="Escribe observaciones..." ${rolActual !== 'cliente' || estadoRevision !== 'PENDIENTE' ? 'disabled' : ''}>${h.comentario || ''}</textarea>
          </div>

          <div class="tarjeta-footer-estado">
            <div class="grupo-botones-cliente ${rolActual === 'cliente' && estadoRevision === 'PENDIENTE' ? '' : 'oculto'}">
              <button type="button" class="btn-verde" onclick="guardarRevisionHistoria(${h.id}, 'ACEPTADO')">Aprobar</button>
              <button type="button" class="btn-rojo" onclick="guardarRevisionHistoria(${h.id}, 'RECHAZADO')">Rechazar</button>
            </div>

            <div class="grupo-estado-final ${rolActual !== 'cliente' || estadoRevision !== 'PENDIENTE' ? '' : 'oculto'}">
              <span class="badge-estado ${claseEstado}">
                ${estadoRevision === 'ACEPTADO' ? '✓ Aprobado' : (estadoRevision === 'RECHAZADO' ? '✕ Rechazado' : 'Pendiente')}
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    actualizarContadoresResumen();
  } catch (err) {
    console.error('Error al cargar las historias de revisión:', err);
  }
}

function aplicarRestriccionesPorRol() {
  const rol = obtenerRolActual();
  document.querySelectorAll('[data-rol]').forEach(el => {
    const permitidos = el.dataset.rol.split(',').map(r => r.trim().toLowerCase());
    el.style.display = permitidos.includes(rol) ? '' : 'none';
  });
}

// función que muestra cuando una notificación cuando se le ha asignado una historia a un desarrollador
function mostrarModalNotificacion(mensaje) {
  const modalExistente = document.getElementById("overlayNotificacionCustom");
  if (modalExistente) modalExistente.remove();

  const overlay = document.createElement("div");
  overlay.id = "overlayNotificacionCustom";
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; animation: fadeIn 0.2s ease;";

  const cajaModal = document.createElement("div");
  cajaModal.style.cssText = "background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); width: 400px; text-align: center; font-family: inherit;";

  cajaModal.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 12px;">🔔</div>
    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; font-weight: 600;">Notificación de Asignación</h3>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">${mensaje}</p>
    <button id="btnAceptarNoti" style="background: #2563eb; color: white; border: none; padding: 8px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; transition: background 0.2s;">Aceptar</button>
  `;

  overlay.appendChild(cajaModal);
  document.body.appendChild(overlay);

  document.getElementById("btnAceptarNoti").onclick = () => {
    overlay.remove();
  };
}

// función que devuelve la historia al product backlog
window.devolverAProductBacklog = async (idHistoria) => {
  if (!confirm("¿Estás seguro de devolver esta historia al Product Backlog? Se marcará como pendiente para el siguiente sprint.")) {
    return;
  }

  try {
    const respuesta = await fetch(`/reuniones/historia/${idHistoria}/devolver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const resultado = await respuesta.json();

    if (resultado.ok) {
      alert("¡Historia devuelta al Product Backlog exitosamente!");
      cargarHistoriasRevision();
    } else {
      alert("Error al procesar la solicitud.");
    }
  } catch (err) {
    console.error("Error en la petición de devolución:", err);
  }
};

// función que ejecuta el cliente al hacer clic en "Aprobar" o "Rechazar"
window.guardarRevisionHistoria = async (idHistoria, estado) => {
  try {
    const textareaComentario = document.getElementById(`comentario-${idHistoria}`);
    const comentario = textareaComentario ? textareaComentario.value : '';

    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1 };

    let idProyecto = window.ID_PROYECTO;
    if (!idProyecto) {
      try {
        const proyectoActivo = JSON.parse(sessionStorage.getItem("proyectoActivo"));
        idProyecto = proyectoActivo ? proyectoActivo.id : null;
      } catch (e) {
        idProyecto = null;
      }
    }

    const respuesta = await fetch(`/reuniones/historia/${idHistoria}/revisar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: estado,
        comentario: comentario,
        idEmisor: usuarioActual.id,
        idReunion: window.ID_REUNION,
        idProyecto: idProyecto
      })
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      const tarjeta = document.getElementById(`tarjeta-historia-${idHistoria}`);
      if (tarjeta) {
        if (textareaComentario) textareaComentario.disabled = true;

        const contenedorBotones = tarjeta.querySelector('.grupo-botones-cliente');
        if (contenedorBotones) {
          const claseBadge = estado === 'ACEPTADO' ? 'estado-aceptado' : 'estado-rechazado';
          const textoBadge = estado === 'ACEPTADO' ? '✓ Aprobado' : '✕ Rechazado';

          contenedorBotones.innerHTML = `<span class="badge-estado ${claseBadge}">${textoBadge}</span>`;
        }
      }
      if (typeof actualizarContadoresResumen === 'function') {
        actualizarContadoresResumen();
      }
    } else {
      alert("Error al guardar la revisión: " + (resultado.error || "Desconocido"));
    }
  } catch (err) {
    console.error("Error en la petición de revisión:", err);
    alert("Ocurrió un error al procesar la revisión.");
  }
};

// ================= DAILY SCRUM =================

let dailyReunionVista = null;
let dailyHistorial = [];
let dailyLectura = false;

function salirDeDaily() {
  document.getElementById("vista-sprintPlanning").style.display = "none";
  document.getElementById("modal-reuniones").style.display = "block";
  if (typeof cargarReuniones === 'function') cargarReuniones();
}

function formatearFechaDaily(iso) {
  if (!iso) return "--";
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

async function inicializarDailyScrum() {
  const rol = obtenerRolActual();
  const usuario = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Usuario" };
  dailyReunionVista = window.ID_REUNION;

  document.getElementById("txtDailySprint").textContent = window.ID_SPRINT;
  document.getElementById("txtNombreDevDaily").textContent = usuario.nombre || usuario.name || "--";

  document.querySelectorAll('#vista-dailyScrum [data-rol]').forEach(el => {
    const permitidos = el.dataset.rol.split(',').map(r => r.trim().toLowerCase());
    el.style.display = permitidos.includes(rol) ? '' : 'none';
  });
  if (rol !== 'desarrollador') {
    document.querySelector('#vista-dailyScrum .contenido-daily').style.gridTemplateColumns = '1fr';
  }

  const chk = document.getElementById("chkImpedimento");
  const inpImp = document.getElementById("inpDailyImpedimento");
  const selHist = document.getElementById("selDailyHistoria");

  let historiasAsignadasDev = [];
  if (rol === 'desarrollador' && usuario?.id) {
    try {
      const respHistDev = await fetch(
        `/reuniones/sprint/${window.ID_SPRINT}/historias?idDesarrollador=${encodeURIComponent(usuario.id)}`,
        { headers: { "Accept": "application/json" } }
      );
      const jsonHistDev = await respHistDev.json();
      historiasAsignadasDev = Array.isArray(jsonHistDev.data) ? jsonHistDev.data : [];
    } catch (err) {
      console.error("Error al cargar historias asignadas del desarrollador:", err);
    }
  } else {
    await cargarHistoriasSprint();
    historiasAsignadasDev = Array.isArray(window.requisitos) ? window.requisitos : [];
  }

  const historiasEnCurso = historiasAsignadasDev.filter(h => {
    const estado = String(h.estado_actual ?? h.estado ?? "").trim().toLowerCase();
    return estado === "en-progreso" || estado === "en-revision";
  });

  const tieneHistoriasElegibles = historiasEnCurso.length > 0;

  if (!tieneHistoriasElegibles) {
    selHist.innerHTML = '<option value="">No tienes historias en progreso o revisión</option>';
    selHist.disabled = true;
  } else {
    selHist.innerHTML = '<option value="">Historia afectada...</option>' +
      historiasEnCurso.map(h => {
        const num = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
        return `<option value="${h.id}">PB-${num} ${escaparHTMLDaily(h.nombre)}</option>`;
      }).join('');
  }

  chk.onchange = () => {
    inpImp.disabled = !chk.checked;
    selHist.disabled = !chk.checked || !tieneHistoriasElegibles;
    if (!chk.checked) {
      inpImp.value = '';
      selHist.value = '';
      window._impDailyEnviadoEnReporte = false;
    }
  };

  document.getElementById("btnPublicarDaily").onclick = async () => {
    if (dailyLectura) {
      cambiarModoFormularioDaily(false);
      return;
    }

    const ayer = document.getElementById("inpDailyAyer").value.trim();
    const hoy = document.getElementById("inpDailyHoy").value.trim();
    const impedimento = inpImp.value.trim();
    const idHistoria = selHist.value;

    if (!ayer || !hoy) return alert("Completa lo que hiciste ayer y lo que harás hoy.");
    if (chk.checked && (!impedimento || !idHistoria)) {
      return alert("Describe el impedimento y elige la historia afectada.");
    }

    try {
      const resp = await fetch(`/reuniones/${window.ID_REUNION}/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: usuario.id, ayer, hoy,
          tieneImpedimento: chk.checked, impedimento, idHistoria
        })
      });
      const res = await resp.json();
      if (!res.ok) return alert(res.error || "No se pudo publicar.");

      if (chk.checked && impedimento && idHistoria && !window._impDailyEnviadoEnReporte) {
        try {
          const respImp = await fetch("/impedimentos/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idProyecto: window.ID_PROYECTO,
              idSprint: Number(window.ID_SPRINT),
              idHistoria: Number(idHistoria),
              idUsuarioReporta: usuario.id,
              descripcion: impedimento
            })
          });
          const resImp = await respImp.json();
          if (respImp.ok && resImp.success) {
            window._impDailyEnviadoEnReporte = true;
          }
        } catch (errImp) {
          console.error("No se pudo sincronizar el impedimento con Sprint Backlog:", errImp);
        }
      }

      await cargarMuroDaily(window.ID_REUNION);
      if (socketAsignacion) {
        socketAsignacion.emit("publicar-daily", { sprintId: window.ID_SPRINT, reunionId: window.ID_REUNION });
      }
    } catch (err) {
      console.error("Error al publicar la daily:", err);
      alert("Ocurrió un error al publicar.");
    }
  };

  const moverDaily = (delta) => {
    const i = dailyHistorial.findIndex(d => Number(d.id) === Number(dailyReunionVista));
    const destino = dailyHistorial[i + delta];
    if (destino) cargarMuroDaily(destino.id);
  };
  document.getElementById("btnDailyAnterior").onclick = () => moverDaily(-1);
  document.getElementById("btnDailySiguiente").onclick = () => moverDaily(1);

  document.getElementById("btnFinalizarDaily").onclick = async () => {
    if (!confirm("¿Finalizar la Daily Scrum?")) return;
    try {
      await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (socketAsignacion) {
        socketAsignacion.emit("disparar-finalizar-daily", { sprintId: window.ID_SPRINT, reunionId: window.ID_REUNION });
      }
      salirDeDaily();
    } catch (err) {
      console.error("Error al finalizar la daily:", err);
    }
  };

  cargarMuroDaily(window.ID_REUNION);
}

function escaparHTMLDaily(t) {
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}

function cambiarModoFormularioDaily(lectura) {
  dailyLectura = lectura;
  const chk = document.getElementById("chkImpedimento");
  ["inpDailyAyer", "inpDailyHoy"].forEach(id => document.getElementById(id).disabled = lectura);
  chk.disabled = lectura;
  document.getElementById("inpDailyImpedimento").disabled = lectura || !chk.checked;
  document.getElementById("selDailyHistoria").disabled = lectura || !chk.checked;
  document.getElementById("btnPublicarDaily").textContent =
    lectura ? "Editar mi reporte de hoy" : "Publicar actualización";
}

async function cargarMuroDaily(idReunion) {
  const muro = document.getElementById("muroDaily");
  const tpl = document.getElementById("tplTarjetaDaily");
  if (!muro || !tpl) return;

  try {
    const resp = await fetch(`/reuniones/${idReunion}/daily`, { headers: { "Accept": "application/json" } });
    const res = await resp.json();
    if (!res.ok) return console.error(res.error);

    const { reunion, respuestas, totalDesarrolladores, historial } = res.data;
    dailyReunionVista = reunion.id;
    dailyHistorial = historial;

    document.getElementById("txtDailyFecha").textContent = formatearFechaDaily(reunion.fecha);
    const i = historial.findIndex(d => Number(d.id) === Number(reunion.id));
    document.getElementById("btnDailyAnterior").disabled = i <= 0;
    document.getElementById("btnDailySiguiente").disabled = i < 0 || i >= historial.length - 1;

    const conImpedimento = respuestas.filter(r => r.tieneImpedimento).length;
    document.getElementById("resumenDaily").textContent =
      `${respuestas.length} de ${totalDesarrolladores} desarrolladores reportaron | ` +
      `${conImpedimento} impedimento${conImpedimento === 1 ? '' : 's'} activo${conImpedimento === 1 ? '' : 's'}`;

    muro.innerHTML = '';
    document.getElementById("msjMuroVacio").classList.toggle("oculto", respuestas.length > 0);

    respuestas.forEach(r => {
      const nodo = tpl.content.cloneNode(true);
      nodo.querySelector(".daily-autor").textContent = r.rol ? `${r.autor} - ${r.rol}` : r.autor;
      nodo.querySelector(".daily-hora").textContent =
        new Date(r.publicadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      nodo.querySelector(".daily-ayer").textContent = r.ayer;
      nodo.querySelector(".daily-hoy").textContent = r.hoy;

      const estado = nodo.querySelector(".daily-estado");
      if (r.tieneImpedimento) {
        estado.classList.add("con-impedimento");
        estado.textContent = `Impedimento activo: ${r.impedimento}`;
      } else {
        estado.classList.add("sin-impedimentos");
        estado.textContent = "Sin impedimentos";
      }
      muro.appendChild(nodo);
    });

    const panel = document.getElementById("panelReporteDaily");
    const esDev = obtenerRolActual() === 'desarrollador';
    const esLaMia = Number(reunion.id) === Number(window.ID_REUNION);
    const finalizada = String(reunion.estado).toLowerCase() === 'finalizada';
    const mostrarForm = esDev && esLaMia && !finalizada;

    if (panel) panel.style.display = mostrarForm ? '' : 'none';
    document.querySelector('#vista-dailyScrum .contenido-daily').style.gridTemplateColumns =
      mostrarForm ? '' : '1fr';

    if (mostrarForm) {
      const usuario = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1 };
      const mia = respuestas.find(r => Number(r.idUsuario) === Number(usuario.id));
      if (mia) {
        document.getElementById("inpDailyAyer").value = mia.ayer;
        document.getElementById("inpDailyHoy").value = mia.hoy;
        document.getElementById("chkImpedimento").checked = !!mia.tieneImpedimento;
        document.getElementById("inpDailyImpedimento").value = mia.impedimento || '';
        document.getElementById("selDailyHistoria").value = mia.idHistoria || '';
        cambiarModoFormularioDaily(true);
      } else {
        cambiarModoFormularioDaily(false);
      }
    }
  } catch (err) {
    console.error("Error al cargar el muro de la daily:", err);
  }
}

// ================= SPRINT RETROSPECTIVE =================

let notasRetro = [];
let retroFinalizada = false;

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnIrRetrospectiva") {
    document.getElementById("vista-sprintPlanning").style.display = "none";
    document.getElementById("modal-reuniones").style.display = "block";
    if (typeof cargarReuniones === "function") {
      cargarReuniones();
    }
  }
});

function salirDeRetrospectiva() {
  document.getElementById("vista-sprintPlanning").style.display = "none";
  document.getElementById("modal-reuniones").style.display = "block";
  if (typeof cargarReuniones === "function") cargarReuniones();
}

function obtenerUsuarioRetro() {
  return JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Integrante" };
}

// avisa al resto del equipo para que recargue el tablero
function avisarRetroActualizada() {
  if (socketAsignacion) {
    socketAsignacion.emit("publicar-retro", { sprintId: window.ID_SPRINT, reunionId: window.ID_REUNION });
  }
}

// helper para las llamadas de la retrospectiva
async function llamarRetro(url, metodo, cuerpo) {
  const resp = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const res = await resp.json();
  if (!resp.ok || !res.ok) throw new Error(res.error || `Error ${resp.status}`);
  return res;
}

// trae las notas de todo el equipo desde la base de datos
async function cargarRetrospectiva() {
  const usuario = obtenerUsuarioRetro();
  try {
    const resp = await fetch(`/reuniones/${window.ID_REUNION}/retrospectiva?idUsuario=${usuario.id}`, {
      headers: { "Accept": "application/json" }
    });
    const res = await resp.json();
    if (!res.ok) return console.error(res.error);

    notasRetro = res.data.notas;
    retroFinalizada = String(res.data.reunion.estado).toLowerCase() === 'finalizada';
    renderizarTableroRetrospectiva();
  } catch (err) {
    console.error("Error al cargar la retrospectiva:", err);
  }
}

function inicializarRetrospectiva() {
  const rol = obtenerRolActual();

  if (rol === 'cliente') {
    alert("La reunión de Retrospectiva es exclusiva del equipo Scrum.");
    salirDeRetrospectiva();
    return;
  }

  const txtSprint = document.getElementById("txtRetroSprint");
  if (txtSprint) txtSprint.textContent = window.ID_SPRINT;

  document.querySelectorAll(".btn-agregar-nota").forEach(btn => {
    btn.onclick = async () => {
      if (retroFinalizada) return alert("La retrospectiva ya fue finalizada.");

      const categoria = btn.dataset.target;
      const mapaInputs = {
        bien: "inpNotaBien",
        mejorar: "inpNotaMejorar",
        acciones: "inpNotaAcciones"
      };

      const textarea = document.getElementById(mapaInputs[categoria]);
      const texto = textarea ? textarea.value.trim() : "";
      if (!texto) return alert("Escribe una nota antes de agregarla.");

      try {
        await llamarRetro(`/reuniones/${window.ID_REUNION}/retrospectiva/notas`, 'POST', {
          idUsuario: obtenerUsuarioRetro().id,
          categoria,
          texto
        });
        textarea.value = "";
        await cargarRetrospectiva();
        avisarRetroActualizada();
      } catch (err) {
        alert("No se pudo guardar la nota: " + err.message);
      }
    };
  });

  const btnCerrar = document.getElementById("btnCerrarRetrospectiva");
  if (btnCerrar) {
    btnCerrar.style.display = (rol === 'facilitador') ? '' : 'none';
    btnCerrar.onclick = async () => {
      if (!confirm("¿Guardar acuerdos y cerrar la retrospectiva?")) return;
      try {
        await llamarRetro(`/reuniones/${window.ID_REUNION}/finalizar`, 'PUT');
        if (socketAsignacion) {
          socketAsignacion.emit("disparar-finalizar-retro", { sprintId: window.ID_SPRINT, reunionId: window.ID_REUNION });
        }
        alert("Retrospectiva guardada correctamente.");
        salirDeRetrospectiva();
      } catch (err) {
        console.error("Error al cerrar la retrospectiva:", err);
        alert("Ocurrió un error al cerrar la retrospectiva: " + err.message);
      }
    };
  }

  cargarRetrospectiva();
}

function renderizarTableroRetrospectiva() {
  const contenedores = {
    bien: document.getElementById("listaNotasBien"),
    mejorar: document.getElementById("listaNotasMejorar"),
    acciones: document.getElementById("listaNotasAcciones")
  };
  const tpl = document.getElementById("tplNotaRetro");
  if (!tpl) return;

  const esFacilitador = obtenerRolActual() === 'facilitador';
  const usuario = obtenerUsuarioRetro();
  const urlNota = (nota, accion) =>
    `/reuniones/${window.ID_REUNION}/retrospectiva/notas/${encodeURIComponent(nota.id)}/${accion}`;

  Object.values(contenedores).forEach(c => { if (c) c.innerHTML = ""; });

  notasRetro.forEach(nota => {
    const contenedor = contenedores[nota.categoria];
    if (!contenedor) return;

    const nodo = tpl.content.cloneNode(true);
    nodo.querySelector(".retro-texto").textContent = nota.texto;
    nodo.querySelector(".retro-autor").textContent = `Por: ${nota.autor}`;
    nodo.querySelector(".retro-votos").textContent = nota.votos;

    if (nota.categoria === "acciones") {
      const lblCompromiso = nodo.querySelector(".lbl-compromiso");
      const chkCompromiso = nodo.querySelector(".chk-compromiso");
      lblCompromiso.classList.remove("oculto");
      chkCompromiso.checked = nota.compromiso;
      chkCompromiso.disabled = !esFacilitador || retroFinalizada;
      chkCompromiso.onchange = async () => {
        try {
          await llamarRetro(urlNota(nota, 'compromiso'), 'PUT', { idUsuario: usuario.id });
          await cargarRetrospectiva();
          avisarRetroActualizada();
        } catch (err) {
          alert("No se pudo actualizar el compromiso: " + err.message);
          chkCompromiso.checked = nota.compromiso;
        }
      };
    }

    const btnVotar = nodo.querySelector(".btn-votar-retro");
    btnVotar.disabled = retroFinalizada;
    btnVotar.onclick = async () => {
      try {
        await llamarRetro(urlNota(nota, 'voto'), 'PUT', { idUsuario: usuario.id });
        await cargarRetrospectiva();
        avisarRetroActualizada();
      } catch (err) {
        alert("No se pudo registrar el voto: " + err.message);
      }
    };

    contenedor.appendChild(nodo);
  });
}

window.actualizarContadoresResumen = () => {
  const tarjetas = document.querySelectorAll('.tarjeta-historia-review');
  let revisadas = 0;
  let aprobadas = 0;
  let rechazadas = 0;
  let comentariosTotal = 0;

  tarjetas.forEach(t => {
    const badge = t.querySelector('.badge-estado');
    const textarea = t.querySelector('.txt-comentario-review');

    if (badge && !badge.textContent.includes('Pendiente')) {
      revisadas++;
      if (badge.classList.contains('estado-aceptado')) aprobadas++;
      if (badge.classList.contains('estado-rechazado')) rechazadas++;
    }

    if (textarea && textarea.value.trim() !== '') {
      comentariosTotal++;
    }
  });

  const lblRevisadas = document.getElementById('resRevisadas');
  const lblAprobadas = document.getElementById('resAprobadas');
  const lblRechazadas = document.getElementById('resRechazadas');
  const lblComentarios = document.getElementById('resComentarios');

  if (lblRevisadas) lblRevisadas.textContent = revisadas;
  if (lblAprobadas) lblAprobadas.textContent = aprobadas;
  if (lblRechazadas) lblRechazadas.textContent = rechazadas;
  if (lblComentarios) lblComentarios.textContent = comentariosTotal;
};