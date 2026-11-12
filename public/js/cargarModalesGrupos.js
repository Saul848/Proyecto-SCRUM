
document.addEventListener("DOMContentLoaded", async () => {
    const contenedor = document.getElementById(
        "contenedorModalesGrupos"
    );

    if (!contenedor) return;

    try {
        const respuesta = await fetch(
            "/html/modalGrupos.html"
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar los modales"
            );
        }

        const html = await respuesta.text();

        contenedor.innerHTML = html;

        document.dispatchEvent(
            new CustomEvent("modalesGruposCargados")
        );

    } catch (error) {
        console.error(
            "Error al cargar los modales de grupos:",
            error
        );
    }
});
