const params = new URLSearchParams(window.location.search);
const proyectoGuardado = JSON.parse(sessionStorage.getItem('proyectoActivo'));

const ID_PROYECTO = proyectoGuardado?.id || Number(params.get("proyecto")) || 1;

let cacheReuniones = [];
let vistaActualReuniones = 'activas';

//se cargan reuniones segun el proyecto activo
async function cargarReuniones() {
  const contenedorReuniones = document.querySelector("#modal-reuniones .area-fondo");
  if (!contenedorReuniones) return;

  try {
    const respuesta = await fetch(`/reuniones/proyecto/${ID_PROYECTO}`, {
      headers: { "Accept": "application/json" }
    });
    const datos = await respuesta.json();
    cacheReuniones = datos.data || [];

    renderizarSeccionReuniones();

  } catch (err) {
    console.error('Error al cargar las reuniones:', err);
  }
}

//tarjetas de reuniones activa/finalizada
function renderizarSeccionReuniones() {
  const contenedorReuniones = document.querySelector("#modal-reuniones .area-fondo");
  if (!contenedorReuniones) return;

  //detecta si el usuario actual es desarrollador
  const esDesarrollador = (typeof ROL_ACTUAL !== 'undefined' && ROL_ACTUAL === 'desarrollador') || 
                          window.location.pathname.toLowerCase().includes('desarrollador') ||
                          sessionStorage.getItem('rol') === 'desarrollador';

  // Filtramos según el estado
  const actasFinalizadas = cacheReuniones.filter(r => r.estado && r.estado.toLowerCase() === 'finalizada');
  const actasActivas = cacheReuniones.filter(r => !r.estado || r.estado.toLowerCase() !== 'finalizada');

  const listaAMostrar = vistaActualReuniones === 'activas' ? actasActivas : actasFinalizadas;

  // Pestañas superiores para alternar
  const htmlPestanas = `
    <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
      <button onclick="cambiarVistaReuniones('activas')" class="btn-pill" style="cursor: pointer; padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background: ${vistaActualReuniones === 'activas' ? '#2563eb' : '#fff'}; color: ${vistaActualReuniones === 'activas' ? '#fff' : '#333'}">
        Reuniones Activas (${actasActivas.length})
      </button>
      <button onclick="cambiarVistaReuniones('finalizadas')" class="btn-pill" style="cursor: pointer; padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background: ${vistaActualReuniones === 'finalizadas' ? '#2563eb' : '#fff'}; color: ${vistaActualReuniones === 'finalizadas' ? '#fff' : '#333'}">
        Historial Finalizadas (${actasFinalizadas.length})
      </button>
    </div>
  `;

  //el boton se muestra si es facilitador
  const btnAgendarHTML = !esDesarrollador 
    ? `<button class="btn-agendar" id="btnAbrirModalAgendar" style="margin-top: 20px;">Agendar nueva reunión +</button>` 
    : '';

  if (listaAMostrar.length === 0) {
    contenedorReuniones.innerHTML = `
      ${htmlPestanas}
      <p style="text-align: center; color: #666; margin-top: 30px;">No hay reuniones ${vistaActualReuniones === 'activas' ? 'activas' : 'finalizadas'} para este proyecto.</p>
      ${vistaActualReuniones === 'activas' ? btnAgendarHTML : ''}
    `;
    configurarModalAgendar();
    return;
  }

  // Generación de tarjetas según la vista
  let tarjetasHTML = listaAMostrar.map(r => {
    const esFinalizada = r.estado && r.estado.toLowerCase() === 'finalizada';

    if (esFinalizada) {
      // Botón de eliminar solo visible para facilitadores
      const btnEliminarHTML = !esDesarrollador 
        ? `<button onclick="eliminarReunion(${r.id})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 13px;">[Eliminar X]</button>` 
        : '';

      return `
        <section class="tarjeta-reunion" data-id="${r.id}" style="background: #f8fafc; border-left: 5px solid #3b82f6; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2 style="margin: 0; font-size: 18px;">🔵 ${r.nombre}</h2>
              <button onclick="eliminarReunion(${r.id})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 13px;">[Eliminar X]</button>
            </div>
            <p class="detalle" style="margin: 5px 0; color: #555;">Fecha: ${new Date(r.fecha_inicio).toLocaleDateString()} &nbsp;·&nbsp; Estado: <strong>${r.estado}</strong></p>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">Timebox: Estimado / Registrado</p>
            <button class="btn-detalles" onclick="verDetallesReunion(${r.id}, ${r.id_sprint}, '${r.nombre}', '${r.fecha_inicio}', '${r.estado}')" style="background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; margin-top: 5px; font-weight: 500;">
              [Ver detalles de la reunión]
            </button>
        </section>
      `;
    } else {
      // Botón de editar solo visible si no es desarrollador
      const btnEditarHTML = !esDesarrollador 
        ? `<button class="btn-editar" onclick="editarReunion(${r.id})">Editar</button>` 
        : '';

      return `
        <section class="tarjeta-reunion" data-id="${r.id}" style="background: #fff; padding: 15px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2>${r.nombre}</h2>
            <p class="detalle">Fecha: ${new Date(r.fecha_inicio).toLocaleDateString()} · Tipo ID: ${r.id_tipo_reunion}</p>
            <p class="estado ${r.estado.toLowerCase().replace(' ', '-')}">● Estado: ${r.estado}</p>
            <button class="btn-entrar" onclick="entrarReunion(${r.id}, ${r.id_sprint})">Entrar</button>
            <button class="btn-editar" onclick="editarReunion(${r.id})">Editar</button>
        </section>
      `;
    }
  }).join('');

  // Estructura en Grid para acomodar el panel lateral de detalles a la derecha
  contenedorReuniones.innerHTML = `
    ${htmlPestanas}
    <div style="display: flex; gap: 20px; position: relative; align-items: flex-start;">
      <div style="flex: 1;" id="listaTarjetasContainer">
        ${tarjetasHTML}
        ${vistaActualReuniones === 'activas' ? btnAgendarHTML : ''}
      </div>
      <!-- Panel lateral de detalles (Oculto por defecto) -->
      <div id="panelDetallesReunionLateral" style="display: none; width: 320px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); position: sticky; top: 10px;">
        <!-- Se llena dinámicamente -->
      </div>
    </div>
  `;

  if (!esDesarrollador) {
    configurarModalAgendar();
  }
}

//cambia entre activas o finalizadas
function cambiarVistaReuniones(vista) {
  vistaActualReuniones = vista;
  renderizarSeccionReuniones();
}

//despliega panel lateral de detalles con las historias
async function verDetallesReunion(idSprint, nombre, fecha, estado) {
  const panelLateral = document.getElementById("panelDetallesReunionLateral");
  if (!panelLateral) return;

  panelLateral.style.display = "block";
  const fechaFormateada = new Date(fecha).toLocaleDateString();

  let historiasHTML = '<p style="font-size: 13px; color: #666;">Cargando historias...</p>';
  try {
    const resp = await fetch(`/reuniones/sprint/${idSprint}/historias`);
    const resJson = await resp.json();
    const historias = resJson.data || [];

    historiasHTML = historias.length > 0 
      ? historias.map(h => {
          const numMostrar = h.numeroDeHistoria ?? h.numero_de_historia ?? h.id;
          return `<div style="font-size: 13px; margin-bottom: 4px; color: #333;">• <strong>PB-${numMostrar}</strong> ${h.nombre}</div>`;
        }).join('')
      : '<span style="font-size: 13px; color: #666;">Sin historias registradas</span>';
  } catch (e) {
    historiasHTML = '<span style="font-size: 13px; color: red;">Error al cargar historias</span>';
  }

  panelLateral.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
      <h3 style="margin: 0; font-size: 16px; color: #1e293b;">Detalles de la reunión</h3>
      <button onclick="cerrarDetallesReunion()" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b;">✕</button>
    </div>
    
    <div style="font-size: 14px; color: #334155; display: flex; flex-direction: column; gap: 10px;">
      <div>
        <strong style="display: block; color: #64748b; font-size: 12px;">Título</strong>
        <span>${nombre}</span>
      </div>
      <div>
        <strong style="display: block; color: #64748b; font-size: 12px;">Sprint</strong>
        <span>Sprint ${idSprint}</span>
      </div>
      <div>
        <strong style="display: block; color: #64748b; font-size: 12px;">Fecha</strong>
        <span>${fechaFormateada}</span>
      </div>
      <div>
        <strong style="display: block; color: #64748b; font-size: 12px;">Estado</strong>
        <span>${estado}</span>
      </div>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 5px 0;">
      <div>
        <strong style="display: block; color: #64748b; font-size: 12px; margin-bottom: 4px;">Historias Trabajadas</strong>
        <div style="background: #f8fafc; padding: 8px; border-radius: 4px; max-height: 120px; overflow-y: auto;">
          ${historiasHTML}
        </div>
      </div>
    </div>
  `;
}

//cierra el panel lateral de detalles
function cerrarDetallesReunion() {
  const panelLateral = document.getElementById("panelDetallesReunionLateral");
  if (panelLateral) {
    panelLateral.style.display = "none";
  }
}

//elimina reunion localmente del arreglo
function eliminarReunion(idReunion) {
  if (!confirm("¿Deseas eliminar esta reunión del historial?")) return;
  cacheReuniones = cacheReuniones.filter(r => r.id !== idReunion);
  renderizarSeccionReuniones();
}


//cambia al sprintPlanning cuando se presiona el boton 'Entrar' en la reunión
async function entrarReunion(idReunion, idSprint) {
  try {
    //se actualiza el estado en la bd, pasa 'En curso'
    await fetch(`/reuniones/${idReunion}/iniciar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    //guarda el sprint y la reunion activa
    sessionStorage.setItem("ID_SPRINT_ACTIVO", idSprint);
    sessionStorage.setItem("ID_REUNION_ACTIVA", idReunion);

    document.querySelectorAll(".modal-class").forEach(modal => {
      modal.style.display = "none";
    });

    //busca el contenedor destinado al sprintPlanning
    const contenedorPlanning = document.getElementById("vista-sprintPlanning");

    if (contenedorPlanning) {
      //cargar el HTML de sprintPlanning
      const respuesta = await fetch('../html/sprintPlanning.html');
      contenedorPlanning.innerHTML = await respuesta.text();
      contenedorPlanning.style.display = "block";;

      if (typeof inicializarSprintPlanning === 'function') {
        inicializarSprintPlanning(idSprint, idReunion, ID_PROYECTO);
      }
    }
  } catch (err) {
    console.error('Error al intentar entrar a la reunión:', err);
  }
}

//configuracion de la agenda reunión
async function configurarModalAgendar() {
  const btnAbrirAgendar = document.getElementById("btnAbrirModalAgendar");
  const modalCrear = document.getElementById("modalCrearReunion");
  const btnCancelar = document.getElementById("btnCancelarCreacion");
  const btnGuardar = document.getElementById("btnGuardarReunion");

  if (btnAbrirAgendar && modalCrear) {
    btnAbrirAgendar.addEventListener("click", async () => {
      modalCrear.style.display = "block";
      await cargarDatosFormularioModal();
    });
  }

  if (btnCancelar && modalCrear) {
    btnCancelar.addEventListener("click", () => {
      modalCrear.style.display = "none";
    });
  }

  if (btnGuardar) {
    // Evitar múltiples bindings duplicados
    btnGuardar.onclick = async () => {
      const idTipoReunion = document.getElementById("seleccionTipoReunion").value;
      const idSprint = document.getElementById("inputSprintSeleccionado").value;
      const nombre = document.getElementById("nombreReunion").value;
      const fechaInicio = document.getElementById("fechaInicio").value;
      const fechaFin = document.getElementById("fechaFin").value;

      if (!idSprint || !fechaInicio || !fechaFin) {
        alert("Por favor completa los campos obligatorios (*).");
        return;
      }

      try {
        const respuesta = await fetch('/reuniones/crear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idProyecto: ID_PROYECTO,
            idSprint: Number(idSprint),
            idTipoReunion: Number(idTipoReunion),
            nombre,
            fechaInicio,
            fechaFin
          })
        });

        const resultado = await respuesta.json();
        if (resultado.ok) {
          alert("¡Reunión agendada con éxito!");
          modalCrear.style.display = "none";
          cargarReuniones(); // Recarga la lista de tarjetas
        } else {
          alert("Error al guardar: " + resultado.error);
        }
      } catch (err) {
        console.error("Error en la petición de creación:", err);
      }
    };
  }
}

//se cargan los sprints
async function cargarDatosFormularioModal() {
  try {
    const respuesta = await fetch(`/reuniones/formulario-datos/${ID_PROYECTO}`);
    const datos = await respuesta.json();
    
    if (datos.ok) {
      const { sprints, participantes, tiposReunion } = datos.data;

      //llenar sprints
      const contenedorSprints = document.getElementById("contenedorSprintsCards");
      const inputOcultoSprint = document.getElementById("inputSprintSeleccionado");

      if (contenedorSprints) {
        if (sprints.length > 0) {
          contenedorSprints.innerHTML = sprints.map((s, index) => `
            <div class="card-sprint-opcion" data-id="${s.id}" onclick="seleccionarSprintCard(${s.id}, this)" style="padding: 10px; border: 1px solid ${index === 0 ? '#2563eb' : '#cbd5e1'}; background: ${index === 0 ? '#eff6ff' : '#fff'}; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
              <strong>Sprint ${s.no_iteracion}</strong><br>
              <small style="color: #64748b;">${s.objetivo || 'Sin objetivo definido'}</small>
            </div>
          `).join('');
          
          // Seleccionar por defecto el primer sprint
          inputOcultoSprint.value = sprints[0].id;
        } else {
          contenedorSprints.innerHTML = '<p style="color: #666; font-size: 13px; text-align: center;">No hay sprints creados en este proyecto.</p>';
          inputOcultoSprint.value = "";
        }
      }
      //tipos de reunión
      const selectTipo = document.getElementById("seleccionTipoReunion");
      selectTipo.innerHTML = tiposReunion && tiposReunion.length > 0
        ? tiposReunion.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')
        : '<option value="">No hay tipos de reunión</option>';

      //obtiene participantes
      const contenedorParticipantes = document.getElementById("listaParticipantesCheck");
      if (contenedorParticipantes) {
        contenedorParticipantes.innerHTML = participantes.length > 0
          ? participantes.map(p => `
              <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" name="participantes" value="${p.id}"> ${p.nombre} (${p.rol})
              </label>
            `).join('')
          : '<p style="color: #666; font-size: 13px;">No hay participantes asociados al proyecto.</p>';
      }
    }
  } catch (err) {
    console.error("Error al cargar datos para el formulario:", err);
  }
}

//marcar visualmente el sprint
function seleccionarSprintCard(idSprint, elementoCard) {
  document.getElementById("inputSprintSeleccionado").value = idSprint;
  
  document.querySelectorAll(".card-sprint-opcion").forEach(card => {
    card.style.borderColor = "#cbd5e1";
    card.style.background = "#fff";
  });

  elementoCard.style.borderColor = "#2563eb";
  elementoCard.style.background = "#eff6ff";
}

// Listener para detectar el retorno automático desde Planning Poker y abrir la vista de detalles
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const seccion = urlParams.get("seccion");
  const idSprint = Number(urlParams.get("sprint")) || Number(sessionStorage.getItem("ID_SPRINT_ACTIVO")) || 1;
  const idReunion = Number(urlParams.get("reunion")) || Number(sessionStorage.getItem("ID_REUNION_ACTIVA")) || 1;

  if (seccion === "reuniones") {
    // 1. Mostrar la cabecera superior correspondiente a Reuniones
    if (typeof mostrarCabeceraR === "function") {
      mostrarCabeceraR("cabecera-springPlanning");
    }

    // 2. Ocultar todos los demás modales activos en el panel
    document.querySelectorAll(".modal-class").forEach(modal => {
      modal.style.display = "none";
    });

    // 3. Buscar el contenedor de sprint planning y cargar su contenido
    const contenedorPlanning = document.getElementById("vista-sprintPlanning");
    if (contenedorPlanning) {
      fetch('sprintPlanning.html')
        .then(res => res.text())
        .then(html => {
          contenedorPlanning.innerHTML = html;
          contenedorPlanning.style.display = "block";

          // 4. Inicializar la lógica de sprint planning (que ya detecta "?vista=detalles" por URL)
          if (typeof inicializarSprintPlanning === 'function') {
            inicializarSprintPlanning(idSprint, idReunion, ID_PROYECTO);
          }
        })
        .catch(err => console.error("Error al cargar sprintPlanning.html al retornar:", err));
    }
  }
});
