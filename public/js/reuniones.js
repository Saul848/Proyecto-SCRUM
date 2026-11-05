const params = new URLSearchParams(window.location.search);
const ID_PROYECTO = Number(params.get("proyecto")) || 1;

//se cargan reuniones segun el proyecto activo
async function cargarReuniones() {
  try {
    const respuesta = await fetch(`/reuniones/proyecto/${ID_PROYECTO}`, {
      headers: { "Accept": "application/json" }
    });
    const datos = await respuesta.json();
    const listaReuniones = datos.data || [];

    const contenedorReuniones = document.querySelector("#modal-reuniones .area-fondo");
    const btnAgendarHTML = `<button class="btn-agendar" id="btnAbrirModalAgendar">Agendar nueva reunión +</button>`;

    if (listaReuniones.length === 0) {
      contenedorReuniones.innerHTML = `
        <p style="text-align: center; color: #666; margin-top: 20px;">No hay reuniones agendadas para este proyecto.</p>
        ${btnAgendarHTML}
      `;
      configurarModalAgendar();
      return;
    }

    contenedorReuniones.innerHTML = listaReuniones.map(r => `
      <section class="tarjeta-reunion" data-id="${r.id}">
          <h2>${r.nombre}</h2>
          <p class="detalle">Fecha: ${r.fecha_inicio} · Tipo ID: ${r.id_tipo_reunion}</p>
          <p class="estado ${r.estado.toLowerCase().replace(' ', '-')}">● Estado: ${r.estado}</p>
          <button class="btn-entrar" onclick="entrarReunion(${r.id}, ${r.id_sprint})">Entrar</button>
          <button class="btn-editar" onclick="editarReunion(${r.id})">Editar</button>
      </section>
    `).join('') + btnAgendarHTML;

    configurarModalAgendar();

  } catch (err) {
    console.error('Error al cargar las reuniones:', err);
  }
}

//cambia al sprintPlanning cuando se presiona el boton 'Entrar' en la reunión
async function entrarReunion(idReunion, idSprint) {
  try {
    //se actualiza el estado en la bd, pasa 'En curso'
    await fetch(`/reuniones/${idReunion}/iniciar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    //redirigimos a la pantalla del Sprint Planning
    window.location.href = `sprintPlanning.html?proyecto=${ID_PROYECTO}&sprint=${idSprint}&reunion=${idReunion}`;
  } catch (err) {
    console.error('Error al intentar iniciar la reunión:', err);
    //redirección de respaldo por si ocurre un fallo de red
    window.location.href = `sprintPlanning.html?proyecto=${ID_PROYECTO}&sprint=${idSprint}&reunion=${idReunion}`;
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
      const idSprint = document.getElementById("seleccionSprint").value;
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
      const { sprints } = datos.data;
      const selectSprint = document.getElementById("seleccionSprint");
      
      selectSprint.innerHTML = sprints.length > 0 
        ? sprints.map(s => `<option value="${s.id}">Sprint ${s.no_iteracion} - ${s.objetivo || 'Sin objetivo'}</option>`).join('')
        : '<option value="">No hay sprints creados en este proyecto</option>';
    }
  } catch (err) {
    console.error("Error al cargar datos para el formulario:", err);
  }
}

cargarReuniones();
