
/**
 * MATERIAL ADICIONAL GENERAL DEL PROYECTO
 *
 * Facilitador:
 * - Subir materiales
 * - Consultar materiales
 * - Descargar materiales
 * - Eliminar materiales
 *
 * Desarrollador:
 * - Consultar materiales
 * - Descargar materiales
 */

(() => {
    "use strict";

    let proyectoMaterialActual = null;
    let solicitudListado = 0;

    const FORMATOS_PERMITIDOS = [
        ".png", ".jpg", ".jpeg", ".pdf", ".zip"
    ];

    const TAMANO_MAXIMO = 5 * 1024 * 1024;

    // Buscar elementos exclusivamente dentro de nuestro modal.
    function elementoMaterial(id) {
        const modal = document.getElementById(
            "mi-modal-evidencias-general"
        );

        return modal?.querySelector(`[id="${id}"]`) ?? null;
    }

    // Obtener el proyecto seleccionado.
    function obtenerProyectoActivo() {
        try {
            return JSON.parse(
                sessionStorage.getItem("proyectoActivo")
            );
        } catch (error) {
            console.error(
                "Error al leer el proyecto:",
                error
            );
            return null;
        }
    }

    // Obtener el rol del usuario en el proyecto.
    function obtenerRolMaterial() {
        const proyecto = proyectoMaterialActual ||
            obtenerProyectoActivo();

        const rol = String(
            proyecto?.rol || proyecto?.rolOriginal || ""
        ).toLowerCase().trim();

        if (rol === "scrum master") {
            return "facilitador";
        }

        if (rol === "developer") {
            return "desarrollador";
        }

        if (rol === "product owner") {
            return "cliente";
        }

        return rol;
    }

    // Abrir modal de material adicional.
    async function abrirModalMaterialGeneral() {
        const proyecto = obtenerProyectoActivo();

        if (!proyecto || !proyecto.id) {
            alert("Primero debes seleccionar un proyecto.");
            return;
        }

        const modal = document.getElementById(
            "mi-modal-evidencias-general"
        );

        if (!modal) {
            console.error(
                "No se encontró el modal de material general."
            );
            return;
        }

        proyectoMaterialActual = proyecto;

        modal.style.setProperty(
            "display", "flex", "important"
        );

        modal.style.setProperty(
            "position", "fixed", "important"
        );

        modal.style.setProperty(
            "inset", "0", "important"
        );

        modal.style.setProperty(
            "z-index", "999999", "important"
        );

        const badge = elementoMaterial(
            "material-general-badge-estado"
        );

        if (badge) {
            badge.textContent = "General";
            badge.className = "badge-estado general-badge";
        }

        // Restablecer la vista previa.
        limpiarVistaPreviaMaterial();

        // Configurar permisos y consultar materiales.
        aplicarPermisosMaterialGeneral();

        await cargarMaterialGeneral();
    }

    // Cerrar modal.
    function cerrarModalMaterialGeneral(evento) {
        if (evento) {
            evento.preventDefault();
            evento.stopPropagation();
        }

        const modal = document.getElementById(
            "mi-modal-evidencias-general"
        );

        if (modal) {
            modal.style.setProperty(
                "display", "none", "important"
            );
        }

        // Invalidar consultas anteriores.
        solicitudListado++;

        proyectoMaterialActual = null;
    }

    // Mostrar opciones según el rol del proyecto.
    function aplicarPermisosMaterialGeneral() {
        const rol = obtenerRolMaterial();

        const zonaCarga = elementoMaterial(
            "material-general-zona-carga"
        );

        const alerta = elementoMaterial(
            "material-general-alerta-texto"
        );

        const input = elementoMaterial(
            "material-general-input-file"
        );

        const esFacilitador = rol === "facilitador";

        if (zonaCarga) {
            zonaCarga.style.setProperty(
                "display",
                esFacilitador ? "block" : "none",
                "important"
            );
        }

        if (input) {
            input.disabled = !esFacilitador;
        }

        if (alerta) {
            alerta.textContent = esFacilitador
                ? "Puedes subir archivos PNG, JPG, PDF o ZIP de hasta 5 MB."
                : "Material compartido para consulta y descarga.";
        }
    }

    // Consultar y mostrar materiales del proyecto.
    async function cargarMaterialGeneral() {
        if (!proyectoMaterialActual) return;

        const idProyecto = proyectoMaterialActual.id;
        const numeroSolicitud = ++solicitudListado;

        const lista = elementoMaterial(
            "material-general-lista-archivos"
        );

        const contador = elementoMaterial(
            "material-general-contador"
        );

        if (!lista) {
            console.error(
                "No se encontró la lista de material general."
            );
            return;
        }

        lista.textContent = "Cargando materiales...";

        if (contador) {
            contador.textContent = "Cargando archivos...";
        }

        try {
            const respuesta = await fetch(
                `/material-general/${idProyecto}`
            );

            const resultado = await respuesta.json();

            // Evitar que una consulta anterior cambie el modal.
            if (
                numeroSolicitud !== solicitudListado ||
                !proyectoMaterialActual ||
                String(proyectoMaterialActual.id) !== String(idProyecto)
            ) {
                return;
            }

            if (!respuesta.ok || !resultado.ok) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudieron consultar los materiales."
                );
            }

            const archivos = Array.isArray(resultado.data)
                ? resultado.data
                : [];

            console.log(
                "Materiales del proyecto:",
                idProyecto,
                archivos
            );

            if (contador) {
                contador.textContent =
                    `Archivos subidos (${archivos.length})`;
            }

            lista.innerHTML = "";

            if (archivos.length === 0) {
                const mensaje = document.createElement("div");
                mensaje.className = "sin-archivos";
                mensaje.textContent =
                    "No hay materiales subidos todavía.";

                lista.appendChild(mensaje);
                return;
            }

            const esFacilitador =
                obtenerRolMaterial() === "facilitador";

            archivos.forEach(archivo => {
                const item = document.createElement("div");
                item.className =
                    "kanban-evidencias-item-archivo";

                // Información del archivo.
                const informacion = document.createElement("div");
                informacion.className =
                    "kanban-evidencias-item-info";

                informacion.style.cursor = "pointer";

                const nombre = document.createElement("strong");
                nombre.className =
                    "kanban-evidencias-item-nombre";

                nombre.textContent = archivo.nombre;

                informacion.appendChild(nombre);

                // Contenedor de botones.
                const acciones = document.createElement("div");
                acciones.className =
                    "kanban-evidencias-item-acciones";

                // Botón descargar.
                const btnDescargar =
                    document.createElement("button");

                btnDescargar.type = "button";
                btnDescargar.className =
                    "btn-modal-cancelar kanban-btn-descargar";

                btnDescargar.textContent = "Descargar";

                btnDescargar.addEventListener("click", () => {
                    descargarMaterialGeneral(
                        archivo.url,
                        archivo.nombre
                    );
                });

                acciones.appendChild(btnDescargar);

                // Solo el facilitador puede borrar.
                if (esFacilitador) {
                    const btnBorrar =
                        document.createElement("button");

                    btnBorrar.type = "button";
                    btnBorrar.className =
                        "btn-modal-cancelar kanban-btn-borrar";

                    btnBorrar.textContent = "Borrar";
                    btnBorrar.style.background = "#fee2e2";
                    btnBorrar.style.color = "#dc2626";

                    btnBorrar.addEventListener("click", () => {
                        eliminarMaterialGeneral(
                            archivo.nombre
                        );
                    });

                    acciones.appendChild(btnBorrar);
                }

                // Seleccionar archivo para vista previa.
                informacion.addEventListener("click", () => {
                    mostrarVistaPreviaMaterial(
                        archivo.url,
                        archivo.nombre
                    );
                });

                item.append(informacion, acciones);
                lista.appendChild(item);
            });

        } catch (error) {
            if (numeroSolicitud !== solicitudListado) {
                return;
            }

            console.error(
                "Error al cargar materiales:",
                error
            );

            lista.textContent = error.message;

            if (contador) {
                contador.textContent =
                    "Materiales no disponibles";
            }
        }
    }

    // Limpiar la vista previa.
    function limpiarVistaPreviaMaterial() {
        const contenedor = elementoMaterial(
            "material-general-preview-content"
        );

        if (!contenedor) return;

        contenedor.innerHTML = "";

        const icono = document.createElement("span");
        icono.className = "preview-icono-default";
        icono.textContent = "🖼️";

        const nombre = document.createElement("span");
        nombre.className = "preview-nombre-archivo";
        nombre.textContent = "Selecciona un archivo";

        contenedor.append(icono, nombre);
    }

    // Mostrar vista previa del material seleccionado.
    function mostrarVistaPreviaMaterial(url, nombreArchivo) {
        const contenedor = elementoMaterial(
            "material-general-preview-content"
        );

        if (!contenedor) return;

        contenedor.innerHTML = "";

        const extension = nombreArchivo
            .substring(nombreArchivo.lastIndexOf("."))
            .toLowerCase();

        if ([".png", ".jpg", ".jpeg"].includes(extension)) {
            const imagen = document.createElement("img");

            imagen.src = url;
            imagen.alt = nombreArchivo;
            imagen.className = "preview-imagen-real";
            imagen.style.maxWidth = "100%";
            imagen.style.maxHeight = "180px";
            imagen.style.objectFit = "contain";

            contenedor.appendChild(imagen);

        } else if (extension === ".pdf") {
            const enlace = document.createElement("a");

            enlace.href = url;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            enlace.textContent = "Abrir PDF";
            enlace.className = "btn-modal-cancelar";

            contenedor.appendChild(enlace);

        } else if (extension === ".zip") {
            const texto = document.createElement("p");

            texto.textContent =
                "Los archivos ZIP no tienen vista previa. Puedes descargarlos.";

            contenedor.appendChild(texto);
        }

        const nombre = document.createElement("span");
        nombre.className = "preview-nombre-archivo";
        nombre.textContent = nombreArchivo;

        contenedor.appendChild(nombre);
    }

    // Descargar material.
    function descargarMaterialGeneral(url, nombre) {
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = nombre;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
    }

    // Subir material adicional.
    async function subirMaterialGeneral(input) {
        const archivo = input.files?.[0];

        if (!archivo) return;

        if (!proyectoMaterialActual) {
            alert("No hay un proyecto seleccionado.");
            input.value = "";
            return;
        }

        if (obtenerRolMaterial() !== "facilitador") {
            alert("Solo el facilitador puede subir materiales.");
            input.value = "";
            return;
        }

        const extension = archivo.name
            .substring(archivo.name.lastIndexOf("."))
            .toLowerCase();

        if (!FORMATOS_PERMITIDOS.includes(extension)) {
            alert("Solo se permiten archivos PNG, JPG, PDF y ZIP.");
            input.value = "";
            return;
        }

        if (archivo.size > TAMANO_MAXIMO) {
            alert("El archivo no debe superar los 5 MB.");
            input.value = "";
            return;
        }

        const idProyecto = proyectoMaterialActual.id;

        const datos = new FormData();
        datos.append("archivo", archivo);

        try {
            const respuesta = await fetch(
                `/material-general/${idProyecto}`,
                {
                    method: "POST",
                    body: datos
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.ok) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudo subir el material."
                );
            }

            alert("Material subido correctamente.");

            // Actualizar el listado después de subir.
            if (
                proyectoMaterialActual &&
                String(proyectoMaterialActual.id) === String(idProyecto)
            ) {
                await cargarMaterialGeneral();
            }

        } catch (error) {
            console.error(
                "Error al subir material:",
                error
            );

            alert(error.message);

        } finally {
            input.value = "";
        }
    }

    // Eliminar material adicional.
    async function eliminarMaterialGeneral(nombreArchivo) {
        if (!proyectoMaterialActual) return;

        if (obtenerRolMaterial() !== "facilitador") {
            alert("No tienes permiso para eliminar materiales.");
            return;
        }

        if (!confirm(
            `¿Deseas eliminar el material "${nombreArchivo}"?`
        )) {
            return;
        }

        const idProyecto = proyectoMaterialActual.id;

        try {
            const respuesta = await fetch(
                `/material-general/${idProyecto}/` +
                encodeURIComponent(nombreArchivo),
                {
                    method: "DELETE"
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.ok) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudo eliminar el material."
                );
            }

            alert("Material eliminado correctamente.");

            // Limpiar vista previa.
            limpiarVistaPreviaMaterial();

            // Actualizar lista.
            if (
                proyectoMaterialActual &&
                String(proyectoMaterialActual.id) === String(idProyecto)
            ) {
                await cargarMaterialGeneral();
            }

        } catch (error) {
            console.error(
                "Error al eliminar material:",
                error
            );

            alert(error.message);
        }
    }

    // Abrir modal al hacer clic en Compartir material.
    document.addEventListener("click", evento => {
        const boton = evento.target.closest(
            "#btn-compartir-material"
        );

        if (boton) {
            abrirModalMaterialGeneral();
        }
    });

    // Funciones que utiliza nuestro HTML.
    window.cerrarMiModalGeneral = cerrarModalMaterialGeneral;
    window.subirMaterialGeneral = subirMaterialGeneral;

})();

