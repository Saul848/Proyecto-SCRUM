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
        console.log("datos :"+ datos);
        // Convertido a un array de usuarios
        /*const proyectos = datos.data || [];
        console.log("proyectos: "+proyectos);
        
        // Regresa el arreglo con los datos
        //console.log(usuarios)*/
        alert("datos obtenidos");
        return datos;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

/**
 * Método para mostrar el panel de proyectos
 */
document.getElementById("btn-proyectos").addEventListener('click', async ()=>{
    mostrarModalP("modal-proyectos");
    const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'))
    const idUser = usuarioActivo.id;
    const proyectos = await obtenerProyectosDeUsuario(idUser);
    console.log("proyectos recibidos:", proyectos);
    
    const contenedor = document.querySelector("#mis-proyectos .lista-items");
    if(proyectos.length === 0) {
        contenedor.innerHTML = "<p>Sin proyectos aún, ¡prueba a crear uno!</p>";
    }

    const tarjetasP = proyectos.map(proyecto =>`
    <button class="item-card" data-id="${proyecto.id}">
        <span class="item-nombre">${proyecto.nombre}</span>
        <span class="badge badge-azul">${proyecto.rol}</span>
    </button>
    `).join("");

    console.log("filas construidas");

    contenedor.innerHTML = tarjetasP;

    console.log("filas insertadas")

    contenedor.addEventListener('click', (evento)=>{
        const tarjetaP = evento.target.closest('.item-card');

        if(!tarjetaP) return;
        console.log(sessionStorage.getItem('usuarioActivo'))

        window.location.href = '/html/PanelFacilitador.html';
    })
});
