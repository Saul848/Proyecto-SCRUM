const params = new URLSearchParams(window.location.search);
const rol = (params.get("usuario") || "facilitador").toLowerCase();
const esFacilitador = rol === "facilitador";
const ID_SPRINT = 1;
const NOMBRE_SPRINT = "Sprint-1";


const btnUsuario = document.getElementById("btnUsuario");
if (btnUsuario) {
  btnUsuario.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
}

let requisitos = []; // Se llenará desde la BD


const desarrolladores = ["Desarrollador 1", "Desarrollador 2", "Desarrollador 3"];

let seleccionados = [];   // ids marcados en fase 1

/* ============ REFERENCIAS ============ */
const vistas = {
  fase1:   document.getElementById("vista-fase1"),
  resumen: document.getElementById("vista-resumen"),
  fase2:   document.getElementById("vista-fase2")
};

const btnTerminarSeleccion = document.getElementById("btnTerminarSeleccion");
const btnVolverFase1 = document.getElementById("btnVolverFase1");
const btnContinuar = document.getElementById("btnContinuar");
const btnVolverResumen = document.getElementById("btnVolverResumen");
const btnConfirmarSprint = document.getElementById("btnConfirmarSprint");
const btnSalir = document.getElementById("btnSalir");
const inpFechaInicio = document.getElementById("inpFechaInicio");
const inpFechaFin = document.getElementById("inpFechaFin");
const txtRestante = document.getElementById("txtRestante");


/* ============ CARGAR HISTORIAS DESDE LA BD ============ */
async function cargarHistorias() {
  try {
      const respuesta = await fetch('/reuniones/1/historias', {
          headers: { "Accept": "application/json" }
      });
      const datos = await respuesta.json();
      requisitos = datos.data || [];

      const lista = document.getElementById('listaRequisitos');
      lista.innerHTML = requisitos.length
          ? requisitos.map(h => `
              <li>
                  <label>
                      <input type="checkbox" value="${h.id}">
                      ${h.nombre} — Valor: ${h.valor}
                  </label>
              </li>
          `).join('')
          : '<li>No hay historias de usuario.</li>';
  } catch (err) {
      console.error('Error al cargar historias:', err);
  }
}





function mostrarVista(nombre) {
  Object.values(vistas).forEach(v => v.classList.add("oculto"));
  vistas[nombre].classList.remove("oculto");
}

function requisitosSeleccionados() {
  return requisitos.filter(r => seleccionados.includes(r.id));
}

/* ============ VISTA 1 ============ */

btnTerminarSeleccion.addEventListener("click", async () => {
    if (seleccionados.length === 0) return;

    try {
        const res = await fetch('/reuniones/seleccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: seleccionados.map(Number) })
        });
        const { ok } = await res.json();
        if (!ok) throw new Error('Error al guardar selección');

        pintarResumen();
        mostrarVista("resumen");
    } catch (err) {
        console.error('No se pudo guardar la selección:', err);
        alert('Ocurrió un error al guardar la selección.');
    }
});



function actualizarSeleccion() {
  seleccionados = Array.from(
    document.querySelectorAll("#listaRequisitos input[type=checkbox]:checked")
  ).map(c => Number(c.value));

  if (btnTerminarSeleccion) {
    btnTerminarSeleccion.disabled = seleccionados.length === 0 || !esFacilitador;
  }
}

document.getElementById("listaRequisitos").addEventListener("change", (e) => {
  if (e.target.matches("input[type=checkbox]")) {
    actualizarSeleccion();
  }
});


/* ============ VISTA 2 (resumen) ============ */
function pintarResumen() {
  const tbody = document.getElementById("cuerpoResumen");
  tbody.innerHTML = "";

  requisitosSeleccionados().forEach(r => {
    const tr = document.createElement("tr");

    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = r.nombre;

    const tdValor = document.createElement("td");
    tdValor.textContent = r.valor;

    tr.append(tdTitulo, tdValor);
    tbody.appendChild(tr);
  });
}

/* ============ VISTA 3 (fase 2) ============ */
function pintarTareas() {
  const tbody = document.getElementById("cuerpoTareas");
  tbody.innerHTML = "";

  requisitosSeleccionados().forEach(r => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = r.id;

    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = r.nombre;

    const tdSprint = document.createElement("td");
    tdSprint.textContent = NOMBRE_SPRINT;

  const tdResp = document.createElement("td");
    tdResp.className = "celda-responsable";
    if (esFacilitador) {
      const sel = document.createElement("select");
      sel.className = "sel-responsable";
      sel.innerHTML =
        '<option value="">—</option>' +
        desarrolladores.map(d => `<option value="${d}">${d}</option>`).join("");
      tdResp.appendChild(sel);
    } else {
      tdResp.textContent = "—";
    }
    
    const tdEsfuerzo = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "number";
    inp.className = "inp-esfuerzo";
    inp.min = "0";
    inp.value = "0";
    inp.disabled = !esFacilitador;
    tdEsfuerzo.appendChild(inp);

    const tdAccion = document.createElement("td");
    if (esFacilitador) {
      const btn = document.createElement("button");
      btn.className = "btn-azul btn-asignar";
      btn.textContent = "Asignar";
      btn.addEventListener("click", () => {
        const sel = tr.querySelector(".sel-responsable");
        if (!sel.value) {
          alert("Selecciona un desarrollador antes de asignar.");
          return;
        }
        tdResp.textContent = sel.value;
        tdAccion.textContent = "✓";
      });
      tdAccion.appendChild(btn);
    }

    tr.append(tdId, tdTitulo, tdSprint, tdResp, tdEsfuerzo, tdAccion);
    tbody.appendChild(tr);
  });
}

function calcularRestante() {
  const ini = inpFechaInicio.value;
  const fin = inpFechaFin.value;

  if (!ini || !fin) {
    txtRestante.textContent = "Tiempo restante: -- días";
    return;
  }

  const dias = Math.ceil((new Date(fin) - new Date(ini)) / 86400000);

  if (dias < 0) {
    txtRestante.textContent = "⚠ La fecha fin es anterior al inicio";
    return;
  }
  txtRestante.textContent = `Tiempo restante: ${dias} días`;
}

 // Función específica que usa tu compañero para el Sprint
function mostrarModalSprint(idModal, idCabecera) {
        // 1. Ocultar todos los modales
        document.querySelectorAll(".modal-class").forEach(modal => {
            modal.style.display = "none";
        });

        document.querySelectorAll(".cabecera-default").forEach(modal =>{
          modal.style.display="none";
        })

        // 2. Mostrar el modal seleccionado
        const modalSeleccionado = document.getElementById(idModal);
        if (modalSeleccionado) {
            modalSeleccionado.style.display = "block";
        }
        
        // 3. Controlar la cabecera superior
        const cabeceraSeleccionada = document.getElementById(idCabecera);
        if(cabeceraSeleccionada){
          cabeceraSeleccionada.style.display = "flex";
        }

        const tituloCentral = document.getElementById("tituloSeccionCentral");

        if (idModal === 'modal-product-backlog') {
            tituloCentral.textContent = "Sprint backlog del proyecto: ";
            tituloCentral.style.display = "block";
        } else {
            // En Product Backlog y otras vistas
            tituloCentral.style.display = "none";
            btnIniciar.style.display = "none";
        }
    }

/* ============ NAVEGACIÓN ENTRE VISTAS ============ */
btnVolverFase1.addEventListener("click", () => {
  cargarHistorias();
  actualizarSeleccion();
  mostrarVista("fase1");
});


btnContinuar.addEventListener("click", () => {
  // sin funcionalidad
  console.log("Continuar a Fase 2");
});

btnVolverResumen.addEventListener("click", () => {
  pintarResumen();
  mostrarVista("resumen");
});

btnSalir.addEventListener("click", () => {
  if (!confirm("¿Salir de la reunión? Se perderá lo no confirmado.")) return;
  window.location.href = "FacilitadorPB.html";
});

btnConfirmarSprint.addEventListener("click", () => {
  const filas = Array.from(document.querySelectorAll("#cuerpoTareas tr"));

  const asignaciones = filas.map(tr => ({
    id: tr.children[0].textContent,
    sprint: tr.children[2].textContent,
    responsable: tr.children[3].textContent.trim(),
    esfuerzo: Number(tr.querySelector(".inp-esfuerzo").value) || 0
  }));

  const sinAsignar = asignaciones.filter(a => a.responsable === "—" || a.responsable === "");
  if (sinAsignar.length > 0) {
    alert(`Faltan ${sinAsignar.length} historia(s) por asignar responsable.`);
    return;
  }

  const esfuerzoTotal = asignaciones.reduce((s, a) => s + a.esfuerzo, 0);

  // Aquí después: accesoDao.guardarSprintBacklog(...)
  console.log("Sprint Backlog confirmado:", {
    sprint: ID_SPRINT,
    historias: asignaciones,
    esfuerzoTotal
  });

  alert(`Sprint Backlog confirmado.\nEsfuerzo total: ${esfuerzoTotal} puntos.`);
  window.location.href = "FacilitadorPB.html";
});

inpFechaInicio.addEventListener("change", calcularRestante);
inpFechaFin.addEventListener("change", calcularRestante);

/* ============================================================
   Init
   ============================================================ */
cargarHistorias();
mostrarVista("fase1");
actualizarSeleccion();