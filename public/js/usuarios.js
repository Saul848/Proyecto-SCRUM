function mostrarModal(idModal){
    document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
    });

    document.getElementById(idModal).style.display = "block";
}
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
        console.log(usuarios)
        alert("datos obtenidos");
        return usuarios;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error de conexión");
        return [];
    }
}

document.getElementById("btn-miembros").addEventListener('click', async ()=>{
    mostrarModal("modal-usuarios");
    //Logica para mostrar el menú al seleccionar la opción
    const usuarios= await obtenerUsuarios();
    const contenedorUsuarios = document.getElementById("contenedor-usuarios");
    console.log("contenedor obtenido");

    if(usuarios.length === 0) {
        contenedorUsuarios.innerHTML = "<p>No hay usuarios para mostrar</p>";
    }

    const tarjetas = usuarios.map(usuario =>`
    <div id="tarjetas-usuario">
        <span>${usuario.id}</span>
        <span>${usuario.nombre}</span>
        <span>${usuario.correo_electronico}</span>
        <span>${usuario.nombre_de_usuario}</span>
    </div>
    `).join("");
    console.log("filas construidas");

    contenedorUsuarios.innerHTML = tarjetas;
})