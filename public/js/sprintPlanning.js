if (typeof window.requisitos === 'undefined') window.requisitos = [];

const proyectoGuardadoSession = JSON.parse(sessionStorage.getItem('proyectoActivo'));
const urlParamsGlobal = new URLSearchParams(window.location.search);

if (typeof window.ID_PROYECTO === 'undefined') {
  window.ID_PROYECTO = proyectoGuardadoSession?.id || Number(urlParamsGlobal.get("proyecto")) || 1;
}
if (typeof window.ID_SPRINT === 'undefined') window.ID_SPRINT = 1;
if (typeof window.ID_REUNION === 'undefined') window.ID_REUNION = 1;

function inicializarSprintPlanning(idSprintParam, idReunionParam, idProyectoParam) {
  const urlParams = new URLSearchParams(window.location.search);
  
  const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
  const rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');
  const rol = (urlParams.get("usuario") || window.ROL_ACTUAL || rolSesion || (esDevPorRuta ? 'desarrollador' : 'facilitador')).toLowerCase();
  
  window.ID_PROYECTO = Number(idProyectoParam) || Number(urlParams.get("proyecto")) || 1;
  window.ID_SPRINT = Number(idSprintParam) || Number(sessionStorage.getItem("ID_SPRINT_ACTIVO")) || 1;
  window.ID_REUNION = Number(idReunionParam) || Number(sessionStorage.getItem("ID_REUNION_ACTIVA")) || 1;
  
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
    //se ocultan todos los botones de control exclusivo del facilitador
    if (btnContinuar) btnContinuar.style.display = "none";
    if (btnContinuarFase2) btnContinuarFase2.style.display = "none";
    if (btnVolverFase1) btnVolverFase1.style.display = "none";
    if (btnConfirmarSprint) btnConfirmarSprint.style.display = "none";
    if (btnSalir) btnSalir.style.display = "none";
  }

  if (btnContinuar) {
    btnContinuar.addEventListener("click", async () => {
      const rolActual = rol;

      if (rolActual === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-planning-poker", { sprintId: window.ID_SPRINT });
      }

      cargarVistaPlanningPoker(rolActual);
    });
  }

  if (socketAsignacion) {
    socketAsignacion.on("abrir-planning-poker-cliente", () => {
      const rolActual = (window.ROL_ACTUAL || "facilitador").toLowerCase();
      if (rolActual === 'desarrollador') {
        cargarVistaPlanningPoker('desarrollador');
      }
    });
  }

  if (btnContinuarFase2) {
    btnContinuarFase2.onclick = () =>{
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
      // Regresar al panel principal de reuniones sin recargar la página
      document.getElementById("vista-sprintPlanning").style.display = "none";
      document.getElementById("modal-reuniones").style.display = "block";
    };
  }

  if (btnConfirmarSprint) {
    btnConfirmarSprint.onclick = async () => {
      try {
        await fetch(`/reuniones/${ID_REUNION}/finalizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sprint: ID_SPRINT })
        });

        if (socketAsignacion) {
          socketAsignacion.emit("disparar-confirmar-sprint", { 
            sprintId: window.ID_SPRINT, 
            reunionId: ID_REUNION, 
            proyectoId: ID_PROYECTO 
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

  if (inpFechaInicio) inpFechaInicio.onchange = calcularRestante;
  if (inpFechaFin) inpFechaFin.onchange = calcularRestante;

  // Ejecutamos la carga inicial
  cargarHistoriasSprint();
  const vistaParam = urlParams.get("vista");
  if (vistaParam === "detalles") {
    mostrarVista("vistaDetalles");
  } else {
    mostrarVista("vista-fase1");
  }
}

//se cargan las historias del sprint
async function cargarHistoriasSprint() {
  try {
    const respuesta = await fetch(`/reuniones/sprint/${ID_SPRINT}/historias`, {
      headers: { "Accept": "application/json" }
    });
    const datos = await respuesta.json();
    requisitos = datos.data || [];

    //lista de requisitos
    const cuerpoHistorias = document.getElementById('cuerpoHistorias');
    if (cuerpoHistorias) {
      cuerpoHistorias.innerHTML = requisitos.length > 0
        ? requisitos.map(h => `
            <tr>
              <td><strong>${h.nombre}</strong><br><small>${h.descripcion || ''}</small></td>
              <td>${h.valor || 0}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="2" style="text-align: center;">No hay historias asignadas a este sprint.</td></tr>';
    }
    //se agrega también en la tabla de detalles
    poblarTablaDetalles();

  } catch (err) {
    console.error('Error al cargar historias:', err);
  }
}

//cabeceras
function ocultarTodasCabeceras() {
  ["historiasSprint", "historiasResumen", "historiasAsignacion"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("oculto");
    }
  });
}

function mostrarCabecera(id) {
  ocultarTodasCabeceras();
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("oculto");
  }
}

function mostrarVista(idVista) {
  ["vista-fase1", "vistaDetalles", "vista-fase2"].forEach(vId => {
    const vista = document.getElementById(vId);
    if (vista) {
      vista.style.setProperty("display", "none", "important");
    }
  });

  const vistaActiva = document.getElementById(idVista);
  if (vistaActiva) {
    vistaActiva.style.setProperty("display", "block", "important");
  }

  switch (idVista) {
    case "vista-fase1":
      mostrarCabecera("historiasSprint");
      break;
    case "vistaDetalles":
      mostrarCabecera("historiasResumen");
      break;
    case "vista-fase2":
      mostrarCabecera("historiasAsignacion");
      cargarAsignacionFase2();
      //llamamos el inicializador de sockets
      if (typeof inicializarSocketsAsignacion === 'function') {
        inicializarSocketsAsignacion(window.ID_SPRINT);
      }
      break;
  }
}

//cargar el HTML de Planning Poker según el rol
async function cargarVistaPlanningPoker(rol) {
  try {
    const archivoPlanning = rol === 'desarrollador' 
      ? 'planningPokerDesarrollador.html' 
      : 'planningPokerFacilitador.html';

    const respuesta = await fetch(archivoPlanning);
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${archivoPlanning}`);

    const htmlPlanning = await respuesta.text();
    const areaTrabajo = document.querySelector("#area-trabajo");
    
    if (areaTrabajo) {
      areaTrabajo.innerHTML = htmlPlanning;

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

      const jsRuta = rol === 'desarrollador' 
        ? '../js/planningPokerDesarrollador.js'
        : '../js/planningPokerFacilitador.js';

      let scriptTag = document.getElementById('dinamic-planning-js');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dinamic-planning-js';
        document.body.appendChild(scriptTag);
      }
      scriptTag.src = jsRuta;

      const idModalBusca = rol === 'desarrollador' 
        ? 'modal-planning-poker-desarrollador'
        : 'modal-planning-poker-facilitador';

      const modalPP = document.getElementById(idModalBusca);
      if (modalPP) {
        modalPP.style.display = "block";
      }

      // Botón de redirección a detalles (para el facilitador)
      const btnPracticaDetalles = document.getElementById("btn-pp-practicaDetalles");
      if (btnPracticaDetalles) {
        btnPracticaDetalles.addEventListener("click", () => {
          if (socketAsignacion) {
            socketAsignacion.emit("disparar-volver-detalles", {
              sprintId: window.ID_SPRINT,
              reunionId: window.ID_REUNION,
              proyectoId: window.ID_PROYECTO
            });
          }

          window.location.href = `panelFacilitador.html?sprint=${ID_SPRINT}&reunion=${ID_REUNION}&proyecto=${ID_PROYECTO}&seccion=reuniones&vista=detalles`;
        });
      }
    }
  } catch (err) {
    console.error("Error al cargar el Planning Poker:", err);
    mostrarVista("vistaDetalles");
  }
}

//tabla de detalles y calculo de esfuerzo
function poblarTablaDetalles() {
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  if (!cuerpoTabla) return;

  cuerpoTabla.innerHTML = requisitos.map(h => {
    const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
    const estimacionInicial = h.horas_estimadas ?? h.puntos_de_historia ?? 5;
    const factorComplejidad = h.factor_complejidad || "";
    
    return `
      <tr data-id="${h.id}">
        <td>PB-${numMostrar}</td>
        <td>${h.nombre}</td>
        <td><input type="number" class="inp-puntos" value="${estimacionInicial}" style="width: 60px;" onchange="calcularEsfuerzoTotal()"></td>
        <td><input type="number" step="0.1" class="inp-factor" value="${factorComplejidad}" placeholder="Ej. 0.2" style="width: 70px;" onchange="calcularEsfuerzoTotal()"></td>
        <td class="lbl-esfuerzo">${estimacionInicial}</td>
      </tr>
    `;
  }).join('');

  calcularEsfuerzoTotal();
}

//calculo - Estimación inicial * (1 + Factor)
function calcularEsfuerzoTotal() {
  const filas = document.querySelectorAll("#cuerpoTabla tr");
  let esfuerzoAcumulado = 0;

  filas.forEach(tr => {
    const inpPuntos = tr.querySelector(".inp-puntos");
    const inpFactor = tr.querySelector(".inp-factor");
    const lblEsfuerzo = tr.querySelector(".lbl-esfuerzo");

    if (inpPuntos && inpFactor && lblEsfuerzo) {
      const puntos = Number(inpPuntos.value) || 0;
      const factor = Number(inpFactor.value) || 0;

      //si hay factor, se ajusta; si no, pasa igual que la estimación inicial
      const esfuerzoAjustado = factor > 0 ? Math.round(puntos * (1 + factor)) : puntos;
      
      lblEsfuerzo.textContent = esfuerzoAjustado;
      esfuerzoAcumulado += esfuerzoAjustado;
    }
  });
}

let solicitudesPendientes = [];

//fase 2 - asignación de historias
function cargarAsignacionFase2() {
  const cuerpoAsignacion = document.getElementById("cuerpoAsignacion");
  if (!cuerpoAsignacion) return;

  const rol = (window.ROL_ACTUAL || "facilitador").toLowerCase();
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Usuario" };

  cuerpoAsignacion.innerHTML = requisitos.map(h => {
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
      //vista para facilitador
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

  //se renderiza el panel lateral de solicitudes
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
  //conectamos al servidor de Socket.IO si no está conectado
  if (!socketReunion) {
    socketReunion = io();

    //el desarrollador solicita una historia
    window.solicitarHistoria = (idHistoria) => {
      const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Desarrollador" };
      
      socketReunion.emit("solicitar-historia", {
        sprintId: idSprint,
        idHistoria: idHistoria,
        idDesarrollador: usuarioActual.id,
        nombreDesarrollador: usuarioActual.nombre || usuarioActual.name
      });
    };

    //entra una nueva solicitud
    socketReunion.on("notificar-solicitud", (data) => {
      solicitudesPendientes.push(data);
      renderizarPanelSolicitudes();
      //actualizamos la tabla si estamos en la fase 2
      if (document.getElementById("vista-fase2").style.display === "block") {
        cargarAsignacionFase2();
      }
    });

    //cuando el facilitador acepta o rechaza una solicitud
    socketReunion.on("actualizar-estado-asignacion", (data) => {
      //actualizamos el estado de la historia localmente en el arreglo 'requisitos'
      const historia = requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.asignado_a = data.aceptada ? data.nombreDesarrollador : null;
      }
      //removemos de pendientes
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

//función que ejecuta el facilitador al dar clic en Aceptar o Rechazar
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

    //nos unimos a la sala específica del sprint
    socketAsignacion.emit("join-asignacion-sprint", { sprintId: idSprint });

    socketAsignacion.on("abrir-planning-poker-cliente", () => {
      const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
      const rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');
      const rolActual = (window.ROL_ACTUAL || rolSesion || (esDevPorRuta ? 'desarrollador' : 'facilitador')).toLowerCase();

      if (rolActual === 'desarrollador') {
        cargarVistaPlanningPoker('desarrollador');
      }
    });

    //escucha la señal para regresar a la dección de reuniones
    socketAsignacion.on("volver-detalles-cliente", () => {
      const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
      const rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');
      const rolActual = (window.ROL_ACTUAL || rolSesion || (esDevPorRuta ? 'desarrollador' : 'facilitador')).toLowerCase();

      if (rolActual === 'desarrollador') {
        // Redirigir al desarrollador a su panel en la sección de reuniones y vista de detalles
        window.location.href = `PanelDesarrollador.html?sprint=${window.ID_SPRINT}&reunion=${window.ID_REUNION}&proyecto=${window.ID_PROYECTO}&seccion=reuniones&vista=detalles`;
      }
    });

    //escuchar si alguien solicita una historia (Facilitador)
    socketAsignacion.on("notificar-solicitud", (data) => {
      //evitamos duplicados si ya existe en la lista local
      const existe = solicitudesPendientes.some(s => s.idHistoria === data.idHistoria && s.idDesarrollador === data.idDesarrollador);
      if (!existe) {
        solicitudesPendientes.push(data);
        renderizarPanelSolicitudes();
        if (document.getElementById("vista-fase2").style.display === "block") {
          cargarAsignacionFase2();
        }
      }
    });

    //escucha cuando el facilitador pasa a la Fase 2
    socketAsignacion.on("fase-2-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        mostrarVista("vista-fase2");
      }
    });

    //escucha cuando el facilitador vuelve a la Fase 1
    socketAsignacion.on("fase-1-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        mostrarVista("vista-fase1");
      }
    });

    //escucha cuando el facilitador confirma y finaliza el Sprint Backlog
    socketAsignacion.on("confirmar-sprint-cliente", (data) => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        alert("El facilitador ha confirmado el Sprint Backlog. La reunión ha finalizado.");
        // Redirigir al panel de reuniones del desarrollador
        window.location.href = `PanelDesarrollador.html?sprint=${data.sprintId}&reunion=${data.reunionId}&proyecto=${data.proyectoId}&seccion=reuniones`;
      }
    });

    //escuchar cuando el facilitador acepta/rechaza (Desarrollador y Facilitador)
    socketAsignacion.on("actualizar-estado-asignacion", (data) => {
      const historia = requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.asignado_a = data.aceptada ? data.nombreDesarrollador : null;
      }
      solicitudesPendientes = solicitudesPendientes.filter(s => s.idHistoria !== data.idHistoria);
      
      renderizarPanelSolicitudes();
      cargarAsignacionFase2();
    });
  }
}

//función que ejecuta el desarrollador al hacer clic en "Solicitar"
window.solicitarHistoria = (idHistoria) => {
  if (socketAsignacion) {
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Desarrollador" };
    socketAsignacion.emit("solicitar-historia", {
      sprintId: window.ID_SPRINT,
      idHistoria: idHistoria,
      idDesarrollador: usuarioActual.id,
      nombreDesarrollador: usuarioActual.nombre || usuarioActual.name
    });
  }
};

//función que ejecuta el facilitador al dar "Aceptar" o "Rechazar"
window.responderSolicitud = (idHistoria, idDesarrollador, aceptada, nombreDesarrollador) => {
  if (socketAsignacion) {
    socketAsignacion.emit("gestionar-solicitud", {
      sprintId: window.ID_SPRINT,
      idHistoria,
      idDesarrollador,
      aceptada,
      nombreDesarrollador
    });
  }
};