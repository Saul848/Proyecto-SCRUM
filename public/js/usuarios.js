/**
 * @file Contiene la lógica del cliente para el registro de usuarios.
 * @description Este archivo maneja la interacción del usuario con el formulario de registro y la
 * obtención de usuarios desde el servidor.
 * @module public/js/usuarios
 * @requires fetch
 * @requires DOM
 */

/**
 * Función para ocultar todos los modales de una clase, y mostrar solo el del id seleccionado
 * @param {idModal} idModal 
 */
function mostrarModal(idModal){
    document.querySelectorAll(".modal-class").forEach(modal => {
        modal.style.display = "none";
    });

    document.getElementById(idModal).style.display = "block";
}

/**
 * Envía los datos del formulario de registro al servidor mediante una petición POST.
 * @async
 * @param {Event} evento - El evento de envío del formulario.
 * @returns {Promise<void>}
 */
async function registrarUsuario(evento) {
    evento.preventDefault();

    const nombre = document.getElementById("reg-nombre").value;
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const passwd = document.getElementById("reg-passwd").value;

    try {
        const respuesta = await fetch('/usuarios', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ nombre, username, email, passwd })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert("¡Cuenta creada exitosamente!");
            document.getElementById("form-registro").reset();
        } else {
            alert(`Error al registrarse: ${resultado.error || 'Verifica los datos'}`);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Ocurrió un error al intentar conectar con el servidor.");
    }
}

/**
 * Función para recuperar los usuarios desde el controlador
 * @returns 
 */
async function obtenerUsuarios() {
    
    try {
        // Generamos la solicitud
        const respuesta = await fetch(`/usuarios/scrumbird`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        // Obtenemos los datos del JSON
        const datos = await respuesta.json();
        // Convertido a un array de usuarios
        const usuarios = datos.data || [];
        
        // Regresa el arreglo con los datos
        //console.log(usuarios)
        console.log("datos obtenidos");
        return usuarios;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

/**
 * Construcción de la lista de usuarios en el panel de miembros
 */
document.getElementById("btn-miembros").addEventListener('click', async ()=>{
    mostrarModal("modal-usuarios");
    //Logica para mostrar el menú al seleccionar la opción
    const usuarios= await obtenerUsuarios();
    const contenedorUsuarios = document.getElementById("contenedor-usuarios");

    if(usuarios.length === 0) {
        contenedorUsuarios.innerHTML = "<p>No hay usuarios para mostrar</p>";
        return;
    }

    const tarjetas = usuarios.map(usuario =>`
    <button class="tarjeta-usuario" data-id="${usuario.id}" data-nombre="${usuario.nombre}" data-email="${usuario.correo_electronico}" data-username="${usuario.nombre_de_usuario}">
        <span>${usuario.id}</span>
        <span>${usuario.nombre}</span>
        <span>${usuario.correo_electronico}</span>
        <span>${usuario.nombre_de_usuario}</span>
    </button>
    `).join("");
    console.log("filas construidas");
    contenedorUsuarios.innerHTML = tarjetas;

    contenedorUsuarios.addEventListener('click', async (evento)=>{
        const tarjeta= evento.target.closest('.tarjeta-usuario');

        if(!tarjeta) return;

        const idUsuario = tarjeta.dataset.id;
        const name = tarjeta.dataset.nombre;
        const email = tarjeta.dataset.email;
        const username = tarjeta.dataset.username;
        console.log("Click en el usuario con id: ", idUsuario);
        const proyectos = await listarProyectosUsuario(idUsuario);
        /**Contenido de cada tarjeta para usuario individual - plantilla: añadir lógica todavía y css */
        const tarjetasProyectos = proyectos.length === 0
            ? "<p>Este usuario no participa en ningún proyecto.</p>"
            : proyectos.map(p => `
                <div class="item-card">
                    <span class="item-nombre">${p.nombre}</span>
                    <span class="badge badge-azul">${p.rol}</span>
                </div>
            `).join("");

        const detalles = `
        <div id="cont-detalles-usuario" class="modal-overlay active">
            <div class="detalles-card">
                <button type="button" id="btn-cerrar-detalles">&times;</button>
                <h2>Detalles de ${username}</h2>

                <div id="detalles-usuario">
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Usuario:</strong> ${username}</p>
                    <p><strong>ID:</strong> ${idUsuario}</p>
                    <p><strong>Correo:</strong> ${email}</p>
                </div>

                <h3>Proyectos actuales:</h3>
                <div id="projects-usuario">${tarjetasProyectos}</div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detalles);
        
        document.getElementById('btn-cerrar-detalles').addEventListener('click', () => {
            document.getElementById('cont-detalles-usuario').remove();
        });
    })    
})

async function listarProyectosUsuario(idUsuario) {
    try{
        const proyectosDeUsuario= await fetch(`/proyectos/listarProyectosDeUsuario/${idUsuario}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        // Obtenemos los datos del JSON
        const datos = await proyectosDeUsuario.json();
        // Convertido a un array de proyectos
        
        const proyectos = Array.isArray(datos) ? datos : (datos.data || []);
        //console.log("datos obtenidos: "+ proyectos);

        return proyectos;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

document.getElementById("btn-capacitacion").addEventListener('click', ()=>{
    mostrarModal("modal-capacitacion");
})