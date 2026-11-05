if (typeof window.requisitos === 'undefined') window.requisitos = [];
if (typeof window.ID_PROYECTO === 'undefined') window.ID_PROYECTO = 1;
if (typeof window.ID_SPRINT === 'undefined') window.ID_SPRINT = 1;
if (typeof window.ID_REUNION === 'undefined') window.ID_REUNION = 1;

function inicializarSprintPlanning(idSprintParam, idReunionParam, idProyectoParam) {
  const urlParams = new URLSearchParams(window.location.search);
  const rol = (urlParams.get("usuario") || "facilitador").toLowerCase();

  window.ID_PROYECTO = Number(idProyectoParam) || Number(urlParams.get("proyecto")) || 1;
  window.ID_SPRINT = Number(idSprintParam) || Number(sessionStorage.getItem("ID_SPRINT_ACTIVO")) || 1;
  window.ID_REUNION = Number(idReunionParam) || Number(sessionStorage.getItem("ID_REUNION_ACTIVA")) || 1;
  
  const btnContinuar = document.getElementById("btnContinuar");
  const btnContinuarFase2 = document.getElementById("btnContinuarFase2");
  const btnVolverFase1 = document.getElementById("btnVolverFase1");
  const btnConfirmarSprint = document.getElementById("btnConfirmarSprint");
  const btnSalir = document.getElementById("btnSalir");
  const inpFechaInicio = document.getElementById("inpFechaInicio");
  const inpFechaFin = document.getElementById("inpFechaFin");

  if (btnContinuar) {
    btnContinuar.addEventListener("click", async () => {
      try {
        //se carga el html planningPokerFacilitador
        const respuesta = await fetch('planningPokerFacilitador.html');
        if (!respuesta.ok) throw new Error("No se pudo cargar planningPokerFacilitador.html");

        const htmlPlanning = await respuesta.text();

        //se muestra la interfaz en el área de trabajo 
        const areaTrabajo = document.querySelector("#area-trabajo");
        if (areaTrabajo) {
          areaTrabajo.innerHTML = htmlPlanning;

          const modalPP = document.getElementById("modal-planning-poker-facilitador");
          if (modalPP) {
            modalPP.style.display = "block";
          }

          //boton para dirigirnos a la vista de detalles
          const btnVolverSprint = document.getElementById("btn-pp-volverSprint");
          if (btnVolverSprint) {
            btnVolverSprint.addEventListener("click", () => {
              window.location.href = `panelFacilitador.html?sprint=${ID_SPRINT}&reunion=${ID_REUNION}&proyecto=${ID_PROYECTO}&seccion=reuniones&vista=detalles`;
            });
          }

          const btnPracticaDetalles = document.getElementById("btn-pp-practicaDetalles");
          if (btnPracticaDetalles) {
            btnPracticaDetalles.addEventListener("click", () => {
              window.location.href = `panelFacilitador.html?sprint=${ID_SPRINT}&reunion=${ID_REUNION}&proyecto=${ID_PROYECTO}&seccion=reuniones&vista=detalles`;
            });
          }
        }
      } catch (err) {
        console.error("Error al cargar el Planning Poker:", err);
        mostrarVista("vistaDetalles");
      }
    });
  }
  if (btnContinuarFase2) {
    btnContinuarFase2.onclick = () => mostrarVista("vista-fase2");
  }

  if (btnVolverFase1) {
    btnVolverFase1.onclick = () => mostrarVista("vista-fase1");
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
      break;
  }
}

//tabla de detalles y calculo de esfuerzo
function poblarTablaDetalles() {
  const cuerpoTabla = document.getElementById("cuerpoTabla");
  if (!cuerpoTabla) return;

  cuerpoTabla.innerHTML = requisitos.map(h => {
    const puntosIniciales = h.puntos_de_historia || 5; 
    const factorComplejidad = h.factor_complejidad || "";
    
    return `
      <tr data-id="${h.id}">
        <td>PB-${h.id}</td>
        <td>${h.nombre}</td>
        <td><input type="number" class="inp-puntos" value="${puntosIniciales}" style="width: 60px;" onchange="calcularEsfuerzoTotal()"></td>
        <td><input type="number" step="0.1" class="inp-factor" value="${factorComplejidad}" placeholder="Ej. 0.2" style="width: 70px;" onchange="calcularEsfuerzoTotal()"></td>
        <td class="lbl-esfuerzo">${puntosIniciales}</td>
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

//fase 2 - asignación de historias
function cargarAsignacionFase2() {
  const cuerpoAsignacion = document.getElementById("cuerpoAsignacion");
  if (!cuerpoAsignacion) return;

  cuerpoAsignacion.innerHTML = requisitos.map(h => `
    <tr>
      <td>${h.nombre}</td>
      <td>Calculado</td>
      <td>
        <select class="select-desarrollador" data-id="${h.id}">
          <option value="">-- Seleccionar --</option>
          <option value="Desarrollador 1">Desarrollador 1</option>
          <option value="Desarrollador 2">Desarrollador 2</option>
          <option value="Desarrollador 3">Desarrollador 3</option>
        </select>
      </td>
    </tr>
  `).join('');
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