/**Código previamente embebido en crearProyecto.html */

const modal = document.getElementById('modalProyecto');
const btnAbrir = document.getElementById('btnAbrirModal');
const btnCerrar = document.getElementById('btnCerrarModal');
const btnCancelar = document.getElementById('btnCancelar');

// Abrir y cerrar modal
btnAbrir.addEventListener('click', () => modal.classList.add('active'));
btnCerrar.addEventListener('click', () => modal.classList.remove('active'));
btnCancelar.addEventListener('click', () => modal.classList.remove('active'));


// Cargar usuarios al iniciar
document.addEventListener("DOMContentLoaded", async () => {
    mostrarProyectos();
    try {
        const respuesta = await fetch('/usuarios');
        const resultado = await respuesta.json();
                        
        const contenedor = document.getElementById('listaUsuarios');
        if (respuesta.ok && resultado.length > 0) {
            contenedor.innerHTML = '';
            resultado.forEach(user => {
            contenedor.innerHTML += `
            <div class="collab-item">
                <div class="user-info">
                    <input type="checkbox" name="invitado" id="user_${user.id}" value="${user.id}" data-correo="${user.correo_electronico}">
                    <label for="user_${user.id}">
                        <strong>${user.nombre}</strong>
                        <span>${user.correo_electronico}</span>
                    </label>
                </div>
                <select name="rol_${user.id}" class="select-rol">
                <option value="Developer">Developer</option>
                <option value="Scrum Master">Scrum Master</option>
                <option value="QA">QA</option>
                </select>
            </div>
            `;
        });
        } else {
            contenedor.innerHTML = '<p class="empty-text">No hay usuarios disponibles.</p>';
        }
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        document.getElementById('listaUsuarios').innerHTML = '<p class="error-text">Error al conectar con el servidor.</p>';
    }
});

// Enviar formulario
document.getElementById('formProyecto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    const nombre = document.getElementById('nombre').value;
    const duracion = document.getElementById('duracion').value;

    const checkboxes = document.querySelectorAll('input[name="invitado"]:checked');
    const colaboradores = [];

    checkboxes.forEach(cb => {
        const id_usuario = parseInt(cb.value);
        const correo = cb.getAttribute('data-correo');
        const rolSelect = document.querySelector(`select[name="rol_${id_usuario}"]`);
        const rol = rolSelect ? rolSelect.value : 'Developer';

        colaboradores.push({ id_usuario, correo, rol });
    });

    const creador = 1; 

    try {
        const respuesta = await fetch('/proyectos/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, duracion, creador, colaboradores })
        });

        const resultado = await respuesta.json();
        const alerta = document.getElementById('mensajeAlerta');
        alerta.style.display = 'block';

        if (resultado.ok) {
            alerta.className = 'mensaje exito';
            alerta.textContent = resultado.mensaje;
            document.getElementById('formProyecto').reset();
            setTimeout(() => {
                modal.classList.remove('active');
                alerta.style.display = 'none';
            }, 2000);
        } else {
            alerta.className = 'mensaje error';
            alerta.textContent = resultado.mensaje || 'Ocurrió un error.';
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        const alerta = document.getElementById('mensajeAlerta');
        alerta.style.display = 'block';
        alerta.className = 'mensaje error';
        alerta.textContent = 'Error de conexión con el servidor.';
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Guardar e Invitar';
    }
});

/**
 * Función que desactiva todos los modales en el area de trabajo y solo muestra el que se seleccionó
 * @param {*} idModal 
 */
function mostrarModalP(idModal){
    document.querySelectorAll(".modal-class").forEach(modal => {
        modal.style.display = "none";
    });

    document.getElementById(idModal).style.display = "block";
}

/**
 * Función para recuperar los usuarios desde el controlador
 * @returns 
 */
async function obtenerProyectosDeUsuario(idUser) {
    try {
        // Generamos la solicitud
        const respuesta = await fetch(`/proyectos/listarProyectosDeUsuario/${idUser}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        // Obtenemos los datos del JSON
        const datos = await respuesta.json();
        console.log("datos obtenidos - proyectos")
        // Convertido a un array de usuarios
        /*const proyectos = datos.data || [];
        console.log("proyectos: "+proyectos);
        
        // Regresa el arreglo con los datos
        //console.log(usuarios)*/
        return datos;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

/**
 * Convierte los roles del proyecto a los nombres
 * utilizados en las páginas de esta implementación.
 */
function convertirRol(rol) {
    const roles = {
        "Scrum Master": "facilitador",
        "Developer": "desarrollador",
        "Product Owner": "cliente"
    };

    return roles[rol] || rol;
}

let todosLosProyectos = [];
let filtroActual = "activos";

function proyectosSegunFiltro() {
    switch (filtroActual) {
        case "eliminados": return todosLosProyectos.filter(p => p.eliminado);
        case "todos":      return todosLosProyectos;
        default:           return todosLosProyectos.filter(p => !p.eliminado);
    }
}

function pintarProyectos() {
    const contenedor = document.querySelector("#mis-proyectos .lista-items");
    const lista = proyectosSegunFiltro();

    if (lista.length === 0) {
        const mensajes = {
            activos: "Sin proyectos aún, ¡prueba a crear uno!",
            eliminados: "No tienes proyectos eliminados.",
            todos: "Sin proyectos."
        };
        contenedor.innerHTML = `<p>${mensajes[filtroActual]}</p>`;
        return;
    }

    contenedor.innerHTML = lista.map(proyecto => {
        if (proyecto.eliminado) {
            const puedeRestaurar = proyecto.rol === "Scrum Master";
            return `
                <div class="item-card eliminado" data-id="${proyecto.id}">
                    <span class="item-nombre">${proyecto.nombre}</span>
                    <span class="badge badge-gris">Eliminado</span>
                    ${puedeRestaurar
                        ? `<button type="button" class="btn-restaurar" data-id="${proyecto.id}">Restaurar</button>`
                        : ""}
                </div>
            `;
        }
        return `
            <button class="item-card" data-id="${proyecto.id}">
                <span class="item-nombre">${proyecto.nombre}</span>
                <span class="badge badge-azul">${proyecto.rol}</span>
            </button>
        `;
    }).join("");
}

/**
 * Método para mostrar el panel de proyectos.
 */
async function mostrarProyectos() {
    mostrarModalP("modal-proyectos");

    const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));
    const idUser = usuarioActivo.id;

    todosLosProyectos = await obtenerProyectosDeUsuario(idUser);
    console.log("Proyectos recibidos:", todosLosProyectos);

    pintarProyectos();
}

document.querySelector("#mis-proyectos .lista-items").addEventListener('click', (evento) => {
    const tarjetaP = evento.target.closest('.item-card');
    if (!tarjetaP) return;

    const idProyecto = Number(tarjetaP.dataset.id);
    console.log(idProyecto);

    const proyectoSeleccionado = todosLosProyectos.find(
        proyecto => Number(proyecto.id) === idProyecto
    );

    if (!proyectoSeleccionado) {
        console.error("No se encontró el proyecto seleccionado.");
        return;
    }

    const botonRestaurar = evento.target.closest('.btn-restaurar');
    if (botonRestaurar) {
        const idProyecto = Number(botonRestaurar.dataset.id);
        restaurarProyecto(idProyecto);
        return;
    }

    // Los eliminados no son accesibles
    if (proyectoSeleccionado.eliminado) return;

    const rolOriginal = proyectoSeleccionado.rol;
    const rolConvertido = convertirRol(rolOriginal);

    sessionStorage.setItem('proyectoActivo', JSON.stringify({
        id: proyectoSeleccionado.id,
        nombre: proyectoSeleccionado.nombre,
        rolOriginal: rolOriginal,
        rol: rolConvertido
    }));

    console.log("Proyecto activo:", JSON.parse(sessionStorage.getItem('proyectoActivo')));

    switch (rolConvertido) {
        case "facilitador":
            window.location.href = '/html/PanelFacilitador.html';
            break;
        case "desarrollador":
            window.location.href = '/html/PanelDesarrollador.html';
            break;
        case "cliente":
            window.location.href = '/html/PanelCliente.html';
            break;
        default:
            console.error("Rol no reconocido:", rolOriginal);
            alert("No se reconoce tu rol en este proyecto.");
    }
});

document.getElementById("filtro-proyectos").addEventListener('click', (evento) => {
    const boton = evento.target.closest('.filtro-btn');
    if (!boton) return;

    filtroActual = boton.dataset.filtro;
    document.querySelectorAll('#filtro-proyectos .filtro-btn')
        .forEach(b => b.classList.toggle('activo', b === boton));

    pintarProyectos();
});

document.getElementById("btn-proyectos").addEventListener('click', async () => {
    mostrarProyectos();
});

async function restaurarProyecto(idProyecto) {
    try {
        const respuesta = await fetch(`/proyectos/restaurar/${idProyecto}`, {
            method: "PUT",
            headers: { "Accept": "application/json" }
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.ok) {
            alert(resultado.mensaje || "No se pudo restaurar el proyecto.");
            return;
        }

        // Actualiza la lista en memoria y repinta, sin volver a pedir datos
        const proyecto = todosLosProyectos.find(p => Number(p.id) === idProyecto);
        if (proyecto) proyecto.eliminado = false;
        pintarProyectos();
    } catch (error) {
        console.error("Error al restaurar el proyecto:", error);
        alert("Ocurrió un error de conexión.");
    }
}