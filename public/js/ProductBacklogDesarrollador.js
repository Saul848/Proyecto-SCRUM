
/**
 * PRODUCT BACKLOG DEL DESARROLLADOR
 *
 * - Consulta las historias del proyecto activo.
 * - Muestra la tabla en modo solo lectura.
 * - Permite cambiar entre Mensajes y Product Backlog.
 * - El material adicional se abre desde su módulo propio.
 */

(() => {
    "use strict";

    const btnBacklog = document.getElementById(
        "dev-btn-product-backlog"
    );

    const btnMensajes = document.getElementById(
        "dev-btn-mensajes"
    );

    const seccionBacklog = document.getElementById(
        "dev-seccion-product-backlog"
    );

    const seccionMensajes = document.getElementById(
        "modal-mensajes-desarrollador"
    );

    const tituloPagina = document.getElementById(
        "dev-titulo-pagina"
    );

    const btnConversacion = document.getElementById(
        "dev-btn-iniciar"
    );

    const tablaHistorias = document.getElementById(
        "dev-pb-lista-historias"
    );
    // Historias del proyecto activo.
let todasLasHistorias = [];

// Elementos de filtrado.
const inputFiltroId = document.getElementById("inputFiltroId");
const inputFiltroNombre = document.getElementById("inputFiltroNombre");
const inputFiltroValor = document.getElementById("inputFiltroValor");
const inputFiltroSprint = document.getElementById("inputFiltroSprint");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

    // Obtener el proyecto que seleccionó el usuario.
    function obtenerProyectoActivo() {
        try {
            return JSON.parse(
                sessionStorage.getItem("proyectoActivo")
            );
        } catch (error) {
            console.error("Error al obtener proyecto:", error);
            return null;
        }
    }

    // Mostrar un mensaje dentro de la tabla.
    function mostrarMensaje(mensaje) {
        if (!tablaHistorias) return;

        tablaHistorias.innerHTML = "";

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 6;
        celda.textContent = mensaje;
        celda.style.textAlign = "center";
        celda.style.padding = "20px";

        fila.appendChild(celda);
        tablaHistorias.appendChild(fila);
    }

    // Obtener las historias del servidor.
    async function obtenerHistoriasDesarrollador(idProyecto) {
        const respuesta = await fetch(
            `/historias/historiasPB/${idProyecto}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `No se pudieron consultar las historias. HTTP ${respuesta.status}`
            );
        }

        const resultado = await respuesta.json();

        if (resultado.ok === false || resultado.success === false) {
            throw new Error(
                resultado.mensaje ||
                "Error al obtener las historias."
            );
        }

        return Array.isArray(resultado.data)
            ? resultado.data
            : [];
    }

    // Agregar una celda de texto a una fila.
    function agregarCelda(fila, contenido) {
        const celda = document.createElement("td");

        celda.textContent =
            contenido === null ||
            contenido === undefined ||
            contenido === ""
                ? "—"
                : String(contenido);

        fila.appendChild(celda);
        return celda;
    }

    // Mostrar los criterios de aceptación.
    function agregarCeldaCriterios(fila, criterios) {
        const celda = document.createElement("td");

        if (!Array.isArray(criterios) || criterios.length === 0) {
            celda.textContent = "Sin criterios de aceptación";
        } else {
            const lista = document.createElement("ul");
            lista.className = "dev-pb-criterios";

            criterios.forEach(criterio => {
                const texto = typeof criterio === "string"
                    ? criterio
                    : criterio?.criterio;

                if (!texto) return;

                const elemento = document.createElement("li");
                elemento.textContent = texto;
                lista.appendChild(elemento);
            });

            if (lista.children.length > 0) {
                celda.appendChild(lista);
            } else {
                celda.textContent = "Sin criterios de aceptación";
            }
        }

        fila.appendChild(celda);
    }

    // Construir la tabla con las historias recuperadas.
    function mostrarHistorias(historias) {
        if (!tablaHistorias) return;

        tablaHistorias.innerHTML = "";

        if (historias.length === 0) {
            mostrarMensaje(
                "No hay historias de usuario registradas en este proyecto."
            );
            return;
        }

        historias.forEach(historia => {
            const fila = document.createElement("tr");

            agregarCelda(
                fila,
                historia.id ?? historia.historia_id
            );

            agregarCelda(
                fila,
                historia.nombre ?? historia.titulo
            );

            agregarCelda(
                fila,
                historia.descripcion ?? historia.descripccion
            );

            agregarCeldaCriterios(
                fila,
                historia.criterios
            );

            agregarCelda(
                fila,
                historia.valor
            );

            agregarCelda(
                fila,
                historia.sprint ??
                historia.sprintAsig ??
                historia.asignado_al_sprint
            );

            tablaHistorias.appendChild(fila);
        });
    }
    // Aplicar filtros a las historias del proyecto activo.
function aplicarFiltrosDesarrollador() {

    const filtroId = inputFiltroId?.value.trim().toLowerCase() || "";
    const filtroNombre = inputFiltroNombre?.value.trim().toLowerCase() || "";
    const filtroValor = inputFiltroValor?.value.trim().toLowerCase() || "";
    const filtroSprint = inputFiltroSprint?.value.trim().toLowerCase() || "";

    const historiasFiltradas = todasLasHistorias.filter(historia => {

        const id = String(
            historia.id ?? historia.historia_id ?? ""
        ).toLowerCase();

        const nombre = String(
            historia.nombre ?? historia.titulo ?? ""
        ).toLowerCase();

        const valor = String(
            historia.valor ?? ""
        ).toLowerCase();

        const sprint = String(
            historia.sprint ??
            historia.sprintAsig ??
            historia.asignado_al_sprint ??
            ""
        ).toLowerCase();

        return (
            id.includes(filtroId) &&
            nombre.includes(filtroNombre) &&
            valor.includes(filtroValor) &&
            sprint.includes(filtroSprint)
        );
    });

    mostrarHistorias(historiasFiltradas);
}

    // Consultar y cargar las historias del proyecto.
    async function cargarProductBacklog() {
        const proyecto = obtenerProyectoActivo();

        if (!proyecto || !proyecto.id) {
            mostrarMensaje(
                "Primero debes seleccionar un proyecto."
            );
            return;
        }

        mostrarMensaje("Cargando historias de usuario...");

        try {
            const historias = await obtenerHistoriasDesarrollador(
               proyecto.id
            );

            console.log(
                "Historias del Product Backlog:",
                historias
            );

            todasLasHistorias = historias;
            aplicarFiltrosDesarrollador();

        } catch (error) {
            console.error(
                "Error al cargar Product Backlog:",
                error
            );

            mostrarMensaje(error.message);
        }
    }

    // Mostrar la sección Product Backlog.
    function abrirProductBacklog() {
        if (!seccionBacklog || !seccionMensajes) {
            console.error(
                "No se encontraron las secciones del desarrollador."
            );
            return;
        }

        seccionMensajes.style.display = "none";
        seccionBacklog.style.display = "block";

        if (tituloPagina) {
            tituloPagina.textContent = "Product Backlog";
        }

        if (btnConversacion) {
            btnConversacion.style.display = "none";
        }

        btnMensajes?.classList.remove("activo");
        btnBacklog?.classList.add("activo");

        cargarProductBacklog();
    }

    // Regresar a la sección Mensajes.
    function abrirMensajes() {
        if (!seccionBacklog || !seccionMensajes) return;

        seccionBacklog.style.display = "none";
        seccionMensajes.style.display = "";

        if (tituloPagina) {
            tituloPagina.textContent = "Mensajes";
        }

        if (btnConversacion) {
            btnConversacion.style.display = "";
        }

        btnBacklog?.classList.remove("activo");
        btnMensajes?.classList.add("activo");
    }

    // Eventos de navegación.
    btnBacklog?.addEventListener(
        "click",
        abrirProductBacklog
    );

    btnMensajes?.addEventListener(
        "click",
        abrirMensajes
    );
    // ==========================================
// EVENTOS DE LOS FILTROS DEL PRODUCT BACKLOG
// ==========================================

// Filtrar automáticamente mientras se escribe.
[
    inputFiltroId,
    inputFiltroNombre,
    inputFiltroValor,
    inputFiltroSprint
].forEach(input => {
    input?.addEventListener(
        "input",
        aplicarFiltrosDesarrollador
    );
});

// Limpiar todos los filtros.
btnLimpiarFiltros?.addEventListener("click", () => {

    [
        inputFiltroId,
        inputFiltroNombre,
        inputFiltroValor,
        inputFiltroSprint
    ].forEach(input => {
        if (input) {
            input.value = "";
        }
    });

    // Mostrar nuevamente todas las historias.
    aplicarFiltrosDesarrollador();
});

})();
