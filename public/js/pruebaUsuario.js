document.addEventListener("DOMContentLoaded", () => {
    // Llamada a la función al cargar el DOM
    listarUsuarios();
});

    async function listarUsuarios() {
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