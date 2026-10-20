const params = new URLSearchParams(window.location.search);
const rol = params.get('usuario') || 'facilitador';

document.getElementById('btnUsuario').textContent =
  rol.charAt(0).toUpperCase() + rol.slice(1);

const requisitos = [
  { id: 'PB-01', texto: 'Inicio de sesión o creación de cuenta' },
  { id: 'PB-02', texto: 'Creación de proyectos' },
  { id: 'PB-03', texto: 'Generar el product backlog' },
  { id: 'PB-04', texto: 'Generar un Sprint backlog' },
  { id: 'PB-05', texto: 'Asignación de historias de usuario a desarrolladores' },
  { id: 'PB-06', texto: 'Estado de las historias de usuario en la lista del Sprint backlog' }
];

const dudas = [
  { autor: 'Equipo', texto: '¿PB:03 puede depender de PB-02?', tipo: 'equipo' },
  { autor: 'Cliente', texto: 'Sí, primero el login.', tipo: 'cliente' }
];

let tareas = [];

const listaRequisitos = document.getElementById('listaRequisitos');
requisitos.forEach((req, index) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <input type="checkbox" id="req-${index}" data-id="${req.id}">
    <label for="req-${index}">${req.id} ${req.texto}</label>
  `;
  listaRequisitos.appendChild(li);
});

const contenedorDudas = document.getElementById('contenedorDudas');
function renderizarDudas() {
  contenedorDudas.innerHTML = '';
  dudas.forEach(d => {
    const div = document.createElement('div');
    div.className = 'mensaje-duda ' + d.tipo;
    div.innerHTML = `<span class="autor">${d.autor}:</span>${d.texto}`;
    contenedorDudas.appendChild(div);
  });
}
renderizarDudas();

//ocultar segun el rol
function aplicarPermisos() {
  const esFacilitador = rol === 'facilitador';
  const esCliente = rol === 'cliente';

  //boton de nueva duda, no lo ve cliente
  document.getElementById('zonaNuevaDuda').classList.toggle('oculto', esCliente);
  //el cliente no puede tachar requisitos
  if (esCliente) {
    document.querySelectorAll('#listaRequisitos input[type="checkbox"]')
      .forEach(cb => cb.disabled = true);
  }

  //botón de continuar solo para facilitador
  document.getElementById('btnContinuar').classList.toggle('oculto', !esFacilitador);

  //botón confirmar sprint backlog solo para facilitador
  document.getElementById('btnConfirmar').classList.toggle('oculto', !esFacilitador);

  //botón de nueva tarea solo para facilitador
  document.getElementById('btnNuevaTarea').classList.toggle('oculto', !esFacilitador);
}
aplicarPermisos();

//agrega nueva nota
document.getElementById('btnNuevaDuda').addEventListener('click', () => {
  const input = document.getElementById('inputDuda');
  const texto = input.value.trim();
  if (!texto) return;

  const autor = rol === 'cliente' ? 'Cliente' : 'Equipo';
  dudas.push({ autor, texto, tipo: rol === 'cliente' ? 'cliente' : 'equipo' });
  renderizarDudas();
  input.value = '';
});

//navegación entre fases 
const fase1 = document.getElementById('fase1');
const fase2 = document.getElementById('fase2');

document.getElementById('btnContinuar').addEventListener('click', () => {
  const seleccionados = [];
  document.querySelectorAll('#listaRequisitos input[type="checkbox"]:checked')
    .forEach(cb => {
      const req = requisitos[cb.dataset.index || requisitos.findIndex(r => r.id === cb.dataset.id)];
      seleccionados.push(req);
    });

  if (seleccionados.length === 0) {
    alert('Selecciona al menos un requisito para continuar.');
    return;
  }

  document.getElementById('requisitosSeleccionados').textContent =
    seleccionados.map(r => r.id + ' ' + r.texto).join(' · ');

    tareas = seleccionados.map(req => ({
        id: req.id,
        texto: req.texto,
        esfuerzo: '',
        asignado: ''
    }));

    renderizarTareas();

  //cambia fase
  fase1.classList.add('oculto');
  fase2.classList.remove('oculto');
});

document.getElementById('btnVolver').addEventListener('click', () => {
  fase2.classList.add('oculto');
  fase1.classList.remove('oculto');
});

function renderizarTareas() {
  const cuerpo = document.getElementById('cuerpoTareas');
  cuerpo.innerHTML = '';

  tareas.forEach((t, index) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${t.id} ${t.texto}</td>
        <td>
            <input type="number" min="1" max="5" value="${t.esfuerzo}"
            data-tarea="${index}" class="input-esfuerzo"
            ${rol === 'cliente' ? 'disabled' : ''}>
        </td>
        <td class="asignado" data-asignado="${index}">${t.asignado || '________'}</td>
        <td>
            <button class="btn-autoasignar" data-tarea="${index}"
            ${rol === 'cliente' ? 'disabled' : ''}>Autoasignar</button>
        </td>
        `;
        cuerpo.appendChild(fila);
    });
    
    document.querySelectorAll('.input-esfuerzo').forEach(input => {
        input.addEventListener('input', (e) => {
        tareas[e.target.dataset.tarea].esfuerzo = e.target.value;
        });
    });

    document.querySelectorAll('.btn-autoasignar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.tarea;
      const nombre = rol === 'cliente' ? 'Cliente' : 'Yo';
      tareas[idx].asignado = nombre;
      document.querySelector(`[data-asignado="${idx}"]`).textContent = nombre;
    });
  });
}

//nueva tarea como facilitador
document.getElementById('btnNuevaTarea').addEventListener('click', () => {
  const descripcion = prompt('Describe la nueva tarea:');
  if (!descripcion) return;
  tareas.push({ id: 'PB-N', texto: descripcion, esfuerzo: '', asignado: '' });
  renderizarTareas();
});

document.getElementById('btnConfirmar').addEventListener('click', () => {
  console.log('Sprint Backlog confirmado:', {
    requisitos: tareas.map(t => t.texto),
    tareas,
    dudas
  });
  alert('Sprint Backlog confirmado. (Guardado en consola por ahora)');
});