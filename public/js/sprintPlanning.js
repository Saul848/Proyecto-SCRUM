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

//funcion de rol
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
    } catch (e) {}
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
    //se ocultan todos los botones de control exclusivo del facilitador
    if (btnContinuar) btnContinuar.style.display = "none";
    if (btnContinuarFase2) btnContinuarFase2.style.display = "none";
    if (btnVolverFase1) btnVolverFase1.style.display = "none";
    if (btnConfirmarSprint) btnConfirmarSprint.style.display = "none";
    
    //Restricción: Solo el facilitador puede poner/modificar las fechas
    if (inpFechaInicio) inpFechaInicio.disabled = true;
    if (inpFechaFin) inpFechaFin.disabled = true;
  }

  if (rol === 'cliente') {
    // El cliente solo observa: no controla el avance de la reunión
    [btnContinuar, btnContinuarFase2, btnVolverFase1, btnConfirmarSprint].forEach(b => {
      if (b) b.style.display = "none";
    });
    if (inpFechaInicio) inpFechaInicio.disabled = true;
    if (inpFechaFin) inpFechaFin.disabled = true;
  }

  //Sincronización y control de fechas en tiempo real (Facilitador -> Desarrollador)
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
      const rolActual = rol;
      if (rolActual === 'cliente') return;

      if (rolActual === 'facilitador' && socketAsignacion) {
        socketAsignacion.emit("disparar-planning-poker", { sprintId: window.ID_SPRINT });
      }

      cargarVistaPlanningPoker(rolActual);
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
      mostrarAvisoFase2Cliente(false); // por si el cliente tenía el aviso en pantalla
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
  ["historiasSprint", "historiasResumen", "historiasAsignacion", "historiasRevision", "historiasDaily", "historiasRetrospectiva"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("oculto");
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
  // El cliente no participa en la Fase 2: se le muestra un aviso en lugar de la asignación
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
      return; // nunca carga la asignación para el cliente
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

//tabla de detalles y calculo de esfuerzo con factores fijos
function poblarTablaDetalles() {
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  if (!cuerpoTabla) return;

  cuerpoTabla.innerHTML = requisitos.map(h => {
    const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
    const horasEstimadas = h.horas_estimadas ?? h.puntos_de_historia ?? 5;
    
    // Obtenemos el factor guardado o por defecto 0 (0% Ninguno)
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

//funcion que notifica los cambios de factor u horas a los demás en tiempo real
window.notificarCambioEstimacion = (idHistoria, elemento) => {
  const fila = elemento.closest("tr");
  const inpPuntos = fila.querySelector(".inp-puntos");
  const inpFactor = fila.querySelector(".inp-factor");

  const horas = Number(inpPuntos.value) || 0;
  const factor = Number(inpFactor.value) || 0;

  //actualizar objeto en arreglo local
  const historia = requisitos.find(h => h.id === idHistoria);
  if (historia) {
    historia.horas_estimadas = horas;
    historia.factor_complejidad = factor;
  }

  //recalcular localmente
  calcularEsfuerzoTotal();

  //emitir por WebSocket para sincronizar a todos los participantes
  if (socketAsignacion) {
    socketAsignacion.emit("actualizar-factor-historia", {
      sprintId: window.ID_SPRINT,
      idHistoria: idHistoria,
      horas: horas,
      factor: factor
    });
  }
};

//calculo: Horas estimadas * (1 + Factor de complejidad) con redondeo a entero
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

      //multiplicación de horas por el factor fijo con redondeo estándar (.5 o superior sube al siguiente entero)
      const esfuerzoAjustado = Math.round(horas * (1 + factor));
      
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
  if (obtenerRolActual() === 'cliente') return;

  const rol = obtenerRolActual();
  const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Usuario" };

  const panelSolicitudes = document.querySelector(".panel-solicitudes");
  if (panelSolicitudes) {
    panelSolicitudes.style.display = (rol === 'facilitador') ? "block" : "none";
  }

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

    // Cada vez que el socket se conecte o RECONECTE, volver a unirse a la sala
    socketAsignacion.on("connect", () => {
      console.log("Socket conectado:", socketAsignacion.id, "| sprint:", window.ID_SPRINT);
      socketAsignacion.emit("join-asignacion-sprint", { sprintId: window.ID_SPRINT });
    });

    socketAsignacion.on("abrir-planning-poker-cliente", () => {
      const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
      const rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');
      const rolActual = obtenerRolActual();

      if (rolActual === 'desarrollador') {
        cargarVistaPlanningPoker('desarrollador');
      } else if (rolActual === 'cliente') {
        //al entra en Planning Poker, el cliente debe ver el aviso de espera
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

    //escucha la señal para regresar a la sección de reuniones
    socketAsignacion.on("volver-detalles-cliente", () => {
      const esDevPorRuta = window.location.pathname.toLowerCase().includes('desarrollador');
      const rolSesion = sessionStorage.getItem('rol') || sessionStorage.getItem('rolActual');
      const rolActual = (window.ROL_ACTUAL || rolSesion || (esDevPorRuta ? 'desarrollador' : 'facilitador')).toLowerCase();

      if (rolActual === 'desarrollador') {
        // Redirigir al desarrollador a su panel en la sección de reuniones y vista de detalles
        window.location.href = `PanelDesarrollador.html?sprint=${window.ID_SPRINT}&reunion=${window.ID_REUNION}&proyecto=${window.ID_PROYECTO}&seccion=reuniones&vista=detalles`;
      }
    });

    //escuchar cuando alguien cambia horas o factor de complejidad en tiempo real
    socketAsignacion.on("cambio-factor-historia-cliente", (data) => {
      const historia = requisitos.find(h => h.id === data.idHistoria);
      if (historia) {
        historia.horas_estimadas = data.horas;
        historia.factor_complejidad = data.factor;
      }

      // Actualizar los inputs en la tabla si se encuentran en pantalla
      const fila = document.querySelector(`#cuerpoTabla tr[data-id="${data.idHistoria}"]`);
      if (fila) {
        const inpPuntos = fila.querySelector(".inp-puntos");
        const inpFactor = fila.querySelector(".inp-factor");
        if (inpPuntos) inpPuntos.value = data.horas;
        if (inpFactor) inpFactor.value = data.factor;
      }

      calcularEsfuerzoTotal();
    });

    //escuchar cuando el facilitador actualiza las fechas en tiempo real
    socketAsignacion.on("cambio-fechas-cliente", (data) => {
      const inpFechaInicio = document.getElementById("inpFechaInicio");
      const inpFechaFin = document.getElementById("inpFechaFin");

      if (inpFechaInicio && data.fechaInicio) inpFechaInicio.value = data.fechaInicio;
      if (inpFechaFin && data.fechaFin) inpFechaFin.value = data.fechaFin;

      calcularRestante();
    });

    //escuchar si alguien solicita una historia (Facilitador)
    socketAsignacion.on("notificar-solicitud", (data) => {
      //evitamos duplicados si ya existe en la lista local
      const existe = solicitudesPendientes.some(s => s.idHistoria === data.idHistoria && s.idDesarrollador === data.idDesarrollador);
      if (!existe) {
        solicitudesPendientes.push(data);
        renderizarPanelSolicitudes();
        if (document.getElementById("vista-fase2")?.style.display === "block") {
          cargarAsignacionFase2();
        }
      }
    });

    //escucha cuando el facilitador pasa a la Fase 2
    socketAsignacion.on("fase-2-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador') {
        mostrarVista("vista-fase2"); // para el cliente muestra el aviso
      } else if (rolActual === 'cliente') {
        //ocultar la Fase 1 y mostrar el banner de espera de Fase 2
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

    //escucha cuando el facilitador vuelve a la Fase 1
    socketAsignacion.on("fase-1-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'desarrollador' || rolActual === 'cliente') {
        mostrarAvisoFase2Cliente(false); //se oculta el banner de espera
        mostrarVista("vista-fase1");      // Volver a mostrar la Fase 1
      }
    });

    //escucha cuando el facilitador confirma y finaliza el Sprint Backlog
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

    //escuchar cuando al desarrollador se le asigna una tarea
    socketAsignacion.on("notificacion-asignacion-exitosa", (data) => {
      const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1 };
      const rolActual = obtenerRolActual();

      // Si el rol es desarrollador y coincide el ID del usuario al que le aceptaron la tarea
      if (rolActual === 'desarrollador' && Number(usuarioActual.id) === Number(data.idDesarrollador)) {
        mostrarModalNotificacion(`Se te ha asignado la tarea "${data.nombreHistoria}" con éxito. Revisa tus responsabilidades.`);
      }
    });

    //escuchar cuando el cliente termina la revisión de las historias
    socketAsignacion.on("acta-revision-cerrada-cliente", () => {
      const rolActual = obtenerRolActual();
      if (rolActual === 'facilitador' || rolActual === 'desarrollador') {
          //se oculta el aviso de espera
          const bannerEspera = document.getElementById("bannerEsperaCliente");
          if (bannerEspera) bannerEspera.classList.add("oculto");

          //se recargan las tarjetas para mostrar los estados ACEPTADO/RECHAZADO y botones correspondientes
          cargarHistoriasRevision();
      }
    });

    //alguien publicó su daily: refresca el muro si estoy viendo esa reunión
    socketAsignacion.on("daily-actualizada", (data) => {
      const vista = document.getElementById("vista-dailyScrum");
      if (vista && vista.style.display === "block" && Number(data.reunionId) === Number(dailyReunionVista)) {
        cargarMuroDaily(dailyReunionVista);
      }
    });

    //el facilitador finalizó la daily
    socketAsignacion.on("daily-finalizada-cliente", (data) => {
      if (obtenerRolActual() === 'facilitador') return;
      if (Number(data.reunionId) !== Number(window.ID_REUNION)) return;
      alert("El facilitador ha finalizado la Daily Scrum.");
      salirDeDaily();
    });
  }
  socketAsignacion.emit("join-asignacion-sprint", { sprintId: idSprint });
}

//funcion que evalua el rol para cargar la vista de revisión y aplicar las restricciones correspondientes
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

const btnCerrarActaSprint = document.getElementById("btnCerrarActaSprint");
  if (btnCerrarActaSprint) {
    btnCerrarActaSprint.onclick = async () => {
      const rolActual = obtenerRolActual();

      if (rolActual === 'cliente') {
        if (!confirm("¿Estás seguro de finalizar la revisión? Al cerrar el acta, los resultados se enviarán al equipo.")) return;

        try {
          const respuesta = await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          const resultado = await respuesta.json();

          if (resultado.ok) {
            if (socketAsignacion) {
              socketAsignacion.emit("cliente-cerro-acta-revision", {
                sprintId: window.ID_SPRINT,
                reunionId: window.ID_REUNION
              });
            }

            alert("¡Acta de revisión cerrada con éxito!");
            document.getElementById("vista-sprintPlanning").style.display = "none";
            document.getElementById("modal-reuniones").style.display = "block";
            if (typeof cargarReuniones === "function") cargarReuniones();
          } else {
            alert("Error al finalizar la reunión.");
          }
        } catch (err) {
          console.error("Error al cerrar el acta:", err);
        }
      } else if (rolActual === 'facilitador') {
        if (!confirm("¿Estás seguro de cerrar la sesión de revisión y finalizar esta reunión?")) return;

        try {
          const respuesta = await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          const resultado = await respuesta.json();

          if (resultado.ok) {
            alert("Reunión finalizada correctamente.");
            document.getElementById("vista-sprintPlanning").style.display = "none";
            document.getElementById("modal-reuniones").style.display = "block";
            if (typeof cargarReuniones === "function") cargarReuniones();
          } else {
            alert("Error al finalizar la reunión.");
          }
        } catch (err) {
          console.error("Error al finalizar la reunión:", err);
        }
      }
    };
  }

  async function cargarHistoriasRevision() {
    try {
        //se obtienen las historias terminadas del sprint actual
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

        //se obtiene el rol actual para mostrar lo correspondiente
        const rolActual = obtenerRolActual();
        aplicarRestriccionesRevision(rolActual);

        //si la reunión esta finalizada se oculta el banner
        const bannerEspera = document.getElementById("bannerEsperaCliente");
        if (bannerEspera) {
          if (rolActual === 'cliente' || window.ESTADO_REUNION === 'Finalizada') {
            bannerEspera.classList.add("oculto");
          } else {
            bannerEspera.classList.remove("oculto");
          }
        }

        //cada tarjeta con sus criterios
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

  //función que muestra cuando una notificación cuando se le ha asignado una historia a un desarrollador
  function mostrarModalNotificacion(mensaje) {
    //evitar duplicados si ya hay una abierta
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

    //botón para cerrar la ventana emergente
    document.getElementById("btnAceptarNoti").onclick = () => {
      overlay.remove();
    };
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

//función que ejecuta el facilitador al dar "Aceptar" o "Rechazar" cuando un desarrollador pide una historia
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

//función que devuelve la historia al product backlog
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
          cargarHistoriasRevision(); // Recargar la vista para reflejar los cambios
      } else {
          alert("Error al procesar la solicitud.");
      }
  } catch (err) {
      console.error("Error en la petición de devolución:", err);
  }
};

//función que ejecuta el cliente al hacer clic en "Aprobar" o "Rechazar"
window.guardarRevisionHistoria = async (idHistoria, estado) => {
  try {
    //obtenemos el comentario escrito en el textarea de esta historia específica
    const textareaComentario = document.getElementById(`comentario-${idHistoria}`);
    const comentario = textareaComentario ? textareaComentario.value : '';

    //obtenemos el ID del usuario actual desde la sesión
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
        estado: estado,              // 'ACEPTADO' o 'RECHAZADO'
        comentario: comentario,      // El texto del textarea
        idEmisor: usuarioActual.id,  // Quién realiza la revisión
        idReunion: window.ID_REUNION, // ID de la reunión activa
        idProyecto: idProyecto //se envia el id del proyecto
      })
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      //cambio directo en la tarjeta
      const tarjeta = document.getElementById(`tarjeta-historia-${idHistoria}`);
      if (tarjeta) {
        //se deshabilita en textarea de comentarios
        if (textareaComentario) textareaComentario.disabled = true;

        //se busca el contenedor de botones de decisión y se reemplaza por el badge de estado
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

let dailyReunionVista = null;   //la daily que se está mostrando (puede ser una anterior)
let dailyHistorial = [];        //dailies del sprint, para navegar por fechas
let dailyLectura = false;       //el formulario está en modo lectura (ya publicó)

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

  //permisos por rol, solo dentro de la vista de la daily
  document.querySelectorAll('#vista-dailyScrum [data-rol]').forEach(el => {
    const permitidos = el.dataset.rol.split(',').map(r => r.trim().toLowerCase());
    el.style.display = permitidos.includes(rol) ? '' : 'none';
  });
  //facilitador y cliente: el muro ocupa todo el ancho
  if (rol !== 'desarrollador') {
    document.querySelector('#vista-dailyScrum .contenido-daily').style.gridTemplateColumns = '1fr';
  }

  const chk = document.getElementById("chkImpedimento");
  const inpImp = document.getElementById("inpDailyImpedimento");
  const selHist = document.getElementById("selDailyHistoria");

  chk.onchange = () => {
    inpImp.disabled = !chk.checked;
    selHist.disabled = !chk.checked;
    if (!chk.checked) {
      inpImp.value = '';
      selHist.value = '';
      window._impDailyEnviadoEnReporte = false;
    }
  };

  //las historias del sprint llenan el selector de impedimento
  await cargarHistoriasSprint();
  selHist.innerHTML = '<option value="">Historia afectada...</option>' +
    requisitos.map(h => {
      const num = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
      return `<option value="${h.id}">PB-${num} ${escaparHTMLDaily(h.nombre)}</option>`;
    }).join('');

  //publicar / editar
  document.getElementById("btnPublicarDaily").onclick = async () => {
    if (dailyLectura) { //"Editar mi reporte de hoy"
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

      // Si marcó que tiene impedimento y aún no se ha enviado en esta sesión/reporte de hoy:
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

  //navegación por fechas
  const moverDaily = (delta) => {
    const i = dailyHistorial.findIndex(d => Number(d.id) === Number(dailyReunionVista));
    const destino = dailyHistorial[i + delta];
    if (destino) cargarMuroDaily(destino.id);
  };
  document.getElementById("btnDailyAnterior").onclick = () => moverDaily(-1);
  document.getElementById("btnDailySiguiente").onclick = () => moverDaily(1);

  //finalizar (facilitador)
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

//formulario en modo lectura (ya publicó) o edición
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

//carga el muro de una daily (la actual o una anterior)
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

    //fecha y flechas
    document.getElementById("txtDailyFecha").textContent = formatearFechaDaily(reunion.fecha);
    const i = historial.findIndex(d => Number(d.id) === Number(reunion.id));
    document.getElementById("btnDailyAnterior").disabled = i <= 0;
    document.getElementById("btnDailySiguiente").disabled = i < 0 || i >= historial.length - 1;

    //resumen
    const conImpedimento = respuestas.filter(r => r.tieneImpedimento).length;
    document.getElementById("resumenDaily").textContent =
      `${respuestas.length} de ${totalDesarrolladores} desarrolladores reportaron | ` +
      `${conImpedimento} impedimento${conImpedimento === 1 ? '' : 's'} activo${conImpedimento === 1 ? '' : 's'}`;

    //tarjetas (textContent: lo que escriben los usuarios nunca se interpreta como HTML)
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

    //formulario: solo editable en la daily a la que entré
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

let notasRetroLocal = []; // Arreglo temporal en memoria mientras conectas tu API

// Al pulsar "Continuar a reuniones (Retrospectiva)" en Sprint Review, regresa al módulo de Reuniones
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnIrRetrospectiva") {
    document.getElementById("vista-sprintPlanning").style.display = "none";
    document.getElementById("modal-reuniones").style.display = "block";
    if (typeof cargarReuniones === "function") {
      cargarReuniones();
    }
  }
});

function inicializarRetrospectiva() {
  const rol = obtenerRolActual();

  // El cliente no participa en la Retrospectiva
  if (rol === 'cliente') {
    alert("La reunión de Retrospectiva es exclusiva del equipo Scrum.");
    document.getElementById("vista-sprintPlanning").style.display = "none";
    document.getElementById("modal-reuniones").style.display = "block";
    if (typeof cargarReuniones === "function") cargarReuniones();
    return;
  }

  const txtSprint = document.getElementById("txtRetroSprint");
  if (txtSprint) txtSprint.textContent = window.ID_SPRINT;

  const usuario = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 1, nombre: "Integrante" };

  // Tanto facilitador como desarrolladores pueden agregar notas
  document.querySelectorAll(".btn-agregar-nota").forEach(btn => {
    btn.onclick = () => {
      const categoria = btn.dataset.target; // 'bien' | 'mejorar' | 'acciones'
      const mapaInputs = {
        bien: "inpNotaBien",
        mejorar: "inpNotaMejorar",
        acciones: "inpNotaAcciones"
      };

      const textarea = document.getElementById(mapaInputs[categoria]);
      const texto = textarea ? textarea.value.trim() : "";
      if (!texto) return alert("Escribe una nota antes de agregarla.");

      notasRetroLocal.push({
        id: Date.now(),
        categoria,
        texto,
        autor: usuario.nombre || usuario.name || "Usuario",
        votos: 0,
        votadoPorMi: false,
        compromiso: false
      });

      textarea.value = "";
      renderizarTableroRetrospectiva();
    };
  });

  // Solo el facilitador puede guardar y cerrar oficialmente la retrospectiva
  const btnCerrar = document.getElementById("btnCerrarRetrospectiva");
  if (btnCerrar) {
    btnCerrar.style.display = (rol === 'facilitador') ? '' : 'none';
    btnCerrar.onclick = async () => {
      if (!confirm("¿Guardar acuerdos y cerrar la retrospectiva?")) return;
      try {
        await fetch(`/reuniones/${window.ID_REUNION}/finalizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        alert("Retrospectiva guardada correctamente.");
        document.getElementById("vista-sprintPlanning").style.display = "none";
        document.getElementById("modal-reuniones").style.display = "block";
        if (typeof cargarReuniones === "function") cargarReuniones();
      } catch (err) {
        console.error("Error al cerrar la retrospectiva:", err);
        alert("Ocurrió un error al cerrar la retrospectiva.");
      }
    };
  }

  renderizarTableroRetrospectiva();
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

  Object.values(contenedores).forEach(c => { if (c) c.innerHTML = ""; });

  notasRetroLocal.forEach(nota => {
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
      chkCompromiso.disabled = !esFacilitador;
      chkCompromiso.onchange = () => {
        nota.compromiso = chkCompromiso.checked;
      };
    }

    const btnVotar = nodo.querySelector(".btn-votar-retro");
    btnVotar.onclick = () => {
      nota.votadoPorMi = !nota.votadoPorMi;
      nota.votos += nota.votadoPorMi ? 1 : -1;
      renderizarTableroRetrospectiva();
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