const urlParams = new URLSearchParams(window.location.search);
const rol = (urlParams.get("usuario") || "facilitador").toLowerCase();
const esFacilitador = rol === "facilitador";

const ID_SPRINT = Number(urlParams.get("sprint")) || 1;
const ID_REUNION = Number(urlParams.get("reunion")) || 1;
const ID_PROYECTO = Number(urlParams.get("proyecto")) || 1;

let requisitos = []; // Almacenará las historias del sprint

const btnContinuar = document.getElementById("btnContinuar");
const btnContinuarPP = document.getElementById("btnContinuarPP");
const btnContinuarFase2 = document.getElementById("btnContinuarFase2");
const btnVolverFase1 = document.getElementById("btnVolverFase1");
const btnConfirmarSprint = document.getElementById("btnConfirmarSprint");
const btnSalir = document.getElementById("btnSalir");
const inpFechaInicio = document.getElementById("inpFechaInicio");
const inpFechaFin = document.getElementById("inpFechaFin");
const txtRestante = document.getElementById("txtRestante");

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
    cuerpoHistorias.innerHTML = requisitos.length > 0
      ? requisitos.map(h => `
          <tr>
            <td><strong>${h.nombre}</strong><br><small>${h.descripcion || ''}</small></td>
            <td>${h.valor || 0}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" style="text-align: center;">No hay historias asignadas a este sprint.</td></tr>';

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
    if (el) el.style.display = "none";
  });
}

function mostrarCabecera(id) {
  ocultarTodasCabeceras();
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}

function mostrarVista(idVista) {
  document.querySelectorAll(".vista, #vistaDetalles, #vista-fase2").forEach(v => {
    v.classList.add("oculto");
    v.style.display = "none";
  });

  const vistaActiva = document.getElementById(idVista);
  if (vistaActiva) {
    vistaActiva.classList.remove("oculto");
    vistaActiva.style.display = "block";
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
  
  // Hacemos visibles las columnas de estimación
  document.getElementById("colPuntos").classList.remove("oculto");
  document.getElementById("colFactor").classList.remove("oculto");
  document.getElementById("colEsfuerzo").classList.remove("oculto");

  cuerpoTabla.innerHTML = requisitos.map(h => {
    const puntosIniciales = h.puntos_de_historia || 5; //valor por defecto para pruebas si viene vacío
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
  //se muestra el esfuerzo total
  console.log("Esfuerzo Total Calculado:", esfuerzoAcumulado);
}

//navegación entre botones
if (btnContinuar) {
  btnContinuar.addEventListener("click", () => {
    mostrarVista("vistaDetalles");
  });
}

if (btnContinuarPP) {
  btnContinuarPP.addEventListener("click", () => {
    //botón para avanzar hacia la fase 2 tras revisar o simular el planning poker
    mostrarVista("vista-fase2");
  });
}

if (btnVolverFase1) {
  btnVolverFase1.addEventListener("click", () => {
    mostrarVista("vista-fase1");
  });
}

if (btnSalir) {
  btnSalir.addEventListener("click", () => {
    if (!confirm("¿Salir de la reunión?")) return;
    window.location.href = `FacilitadorPB.html?proyecto=${ID_PROYECTO}`;
  });
}

//fase 2 - asignación de historias
function cargarAsignacionFase2() {
  const cuerpoAsignacion = document.getElementById("cuerpoAsignacion");
  
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

if (btnConfirmarSprint) {
  btnConfirmarSprint.addEventListener("click", async () => {
    try {
      //petición para finalizar la reunión en la BD y registrar el resumen
      await fetch(`/reuniones/${ID_REUNION}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint: ID_SPRINT })
      });

      alert("¡Sprint Backlog confirmado con éxito! La reunión ha finalizado.");
      window.location.href = `FacilitadorPB.html?proyecto=${ID_PROYECTO}`;
    } catch (err) {
      console.error("Error al confirmar el sprint:", err);
      alert("Ocurrió un error al finalizar la reunión.");
    }
  });
}

//calculo de duración
function calcularRestante() {
  const ini = inpFechaInicio.value;
  const fin = inpFechaFin.value;

  if (!ini || !fin) {
    if (txtRestante) txtRestante.textContent = "Tiempo restante: -- días";
    return;
  }

  const dias = Math.ceil((new Date(fin) - new Date(ini)) / 86400000);
  if (txtRestante) {
    txtRestante.textContent = dias < 0 ? "⚠ Fecha fin errónea" : `${dias} días`;
  }
}

if (inpFechaInicio) inpFechaInicio.addEventListener("change", calcularRestante);
if (inpFechaFin) inpFechaFin.addEventListener("change", calcularRestante)

cargarHistoriasSprint();
mostrarVista("vista-fase1");