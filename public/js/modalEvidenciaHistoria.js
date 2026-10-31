
let historiaActualEvidencias = null;

/**
 * Abre el modal de evidencias de una historia.
 */
async function abrirModalEvidencias(historiaId) {
    const historia = historiasDelSprint.find(
        h => Number(h.historia_id ?? h.id) === Number(historiaId)
    );

    if (!historia) {
        alert("No se encontró la historia seleccionada.");
        return;
    }

    historiaActualEvidencias = historia;

    mostrarModal("modal-evidencias-historia-kanban");

    document.getElementById(
        "kanban-evidencias-id-historia-num"
    ).textContent = historiaId;

    const estado = historia.estado_actual ?? historia.estado ?? "En progreso";

    document.getElementById(
        "kanban-evidencias-badge-estado"
    ).textContent = estado;

    aplicarReglasPermisosYEstado(estado);

    const idProyecto = historia.id_proyecto ?? 1;
    const idHistoria = historia.historia_id ?? historia.id;

    await cargarArchivosEvidencias(idProyecto, idHistoria);
}

/**
 * Configura la interfaz según el rol y el estado.
 */
function aplicarReglasPermisosYEstado(estado) {
    const esTerminada = ["terminado", "terminada"].includes(
        String(estado).toLowerCase()
    );

    const zonaCarga = document.getElementById(
        "kanban-evidencias-zona-carga"
    );

    const inputArchivo = document.getElementById(
        "kanban-evidencias-input-file"
    );

    const alertaTexto = document.getElementById(
        "kanban-evidencias-alerta-texto"
    );

    const alerta = document.getElementById(
        "kanban-evidencias-alerta"
    );

    const puedeSubir =
        ROL_ACTUAL === "desarrollador" && !esTerminada;

    zonaCarga.classList.toggle("bloqueado", !puedeSubir);
    inputArchivo.disabled = !puedeSubir;

    // Evita acumular eventos onclick al abrir diferentes historias.
    zonaCarga.onclick = puedeSubir
        ? () => inputArchivo.click()
        : null;

    if (esTerminada) {
        alerta.classList.add("bloqueado");
        alertaTexto.textContent =
            "Historia terminada: no se pueden subir ni borrar evidencias.";
    } else if (ROL_ACTUAL === "facilitador" || ROL_ACTUAL === "cliente") {
        alerta.classList.remove("bloqueado");
        alertaTexto.textContent =
            "Modo de solo lectura: puedes ver y descargar evidencias.";
    } else {
        alerta.classList.remove("bloqueado");
        alertaTexto.textContent =
            "Puedes subir imágenes PNG o JPG y borrar las que tú subiste.";
    }
}

/**
 * Obtiene y dibuja las evidencias de una historia.
 */
async function cargarArchivosEvidencias(idProyecto, idHistoria) {
    const lista = document.getElementById(
        "kanban-evidencias-lista-archivos"
    );

    lista.innerHTML = "<p>Cargando evidencias...</p>";

    try {
        const respuesta = await fetch(
            `/historias/evidencias/${idProyecto}/${idHistoria}`
        );

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const resultado = await respuesta.json();

        if (!resultado.ok) {
            throw new Error(
                resultado.mensaje || "No se pudieron cargar las evidencias."
            );
        }

        const archivos = resultado.data || [];

        document.getElementById(
            "kanban-evidencias-contador"
        ).textContent = `Archivos subidos (${archivos.length})`;

        lista.innerHTML = "";

        if (archivos.length === 0) {
            lista.innerHTML =
                "<p style='text-align:center;padding:2vh;color:#94a3b8'>" +
                "No hay evidencias subidas aún.</p>";
            return;
        }

        const estado = String(
            historiaActualEvidencias.estado_actual ??
            historiaActualEvidencias.estado ??
            ""
        ).toLowerCase();

        const esTerminada = ["terminado", "terminada"].includes(estado);

        archivos.forEach(archivo => {
            const item = document.createElement("div");
            item.className = "kanban-evidencias-item-archivo";

            // ID provisional: debe sustituirse por el ID real del usuario.
            const esAutor =
                Number(archivo.id_usuario_subio) ===
                Number(window.USUARIO_ACTUAL_ID ?? 1);

            let botones = `
                <button type="button"
                    class="kanban-btn-accion kanban-btn-descargar">
                    Descargar
                </button>
            `;

            if (
                ROL_ACTUAL === "desarrollador" &&
                esAutor &&
                !esTerminada
            ) {
                botones += `
                    <button type="button"
                        class="kanban-btn-accion kanban-btn-borrar">
                        Borrar
                    </button>
                `;
            } else if (ROL_ACTUAL === "desarrollador" && !esAutor) {
                botones += `
                    <span class="kanban-lbl-bloqueado">Ajena</span>
                `;
            }

            item.innerHTML = `
                <div class="kanban-evidencias-item-info">
                    <span class="kanban-evidencias-item-icono">&#128444;</span>
                    <div class="kanban-evidencias-item-textos">
                        <span class="kanban-evidencias-item-nombre"></span>
                        <span class="kanban-evidencias-item-meta"></span>
                    </div>
                </div>
                <div class="kanban-evidencias-item-acciones">
                    ${botones}
                </div>
            `;

            // Usar textContent para mostrar el nombre sin interpretarlo como HTML.
            item.querySelector(".kanban-evidencias-item-nombre")
                .textContent = archivo.nombre;

            item.querySelector(".kanban-evidencias-item-meta")
                .textContent =
                `Subida por ${archivo.nombre_usuario ?? "Usuario"} · ` +
                `${archivo.fecha ?? ""}`;

            item.querySelector(".kanban-evidencias-item-info")
                .addEventListener("click", () => {
                    mostrarVistaPrevia(archivo.url, archivo.nombre);
                });

            item.querySelector(".kanban-btn-descargar")
                .addEventListener("click", () => {
                    descargarEvidencia(archivo.url, archivo.nombre);
                });

            const botonBorrar = item.querySelector(".kanban-btn-borrar");

            if (botonBorrar) {
                botonBorrar.addEventListener("click", () => {
                    borrarEvidencia(archivo.nombre);
                });
            }

            lista.appendChild(item);
        });

    } catch (error) {
        console.error("Error al cargar evidencias:", error);
        lista.innerHTML =
            "<p style='color:#dc2626'>Error al cargar los archivos.</p>";
    }
}

/**
 * Muestra la imagen seleccionada en la vista previa.
 */
function mostrarVistaPrevia(urlImagen, nombreArchivo) {
    const contenedor = document.getElementById(
        "kanban-evidencias-preview-content"
    );

    contenedor.innerHTML = "";

    const imagen = document.createElement("img");
    imagen.src = urlImagen;
    imagen.alt = nombreArchivo;
    imagen.className = "preview-imagen-real";

    const nombre = document.createElement("span");
    nombre.className = "preview-nombre-archivo";
    nombre.textContent = nombreArchivo;

    contenedor.append(imagen, nombre);
}

/**
 * Descarga una evidencia.
 */
function descargarEvidencia(url, nombre) {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
}

/**
 * Sube una evidencia al servidor.
 */
async function manejarSeleccionArchivo(input) {
    const archivo = input.files[0];

    if (!archivo || !historiaActualEvidencias) return;

    const estado = String(
        historiaActualEvidencias.estado_actual ??
        historiaActualEvidencias.estado ??
        ""
    ).toLowerCase();

    if (ROL_ACTUAL !== "desarrollador") {
        alert("Solo los desarrolladores pueden subir evidencias.");
        input.value = "";
        return;
    }

    if (["terminado", "terminada"].includes(estado)) {
        alert("No puedes subir evidencias a una historia terminada.");
        input.value = "";
        return;
    }

    if (!["image/png", "image/jpeg"].includes(archivo.type)) {
        alert("Solo se permiten imágenes PNG, JPG o JPEG.");
        input.value = "";
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar los 5 MB.");
        input.value = "";
        return;
    }

    const idProyecto = historiaActualEvidencias.id_proyecto ?? 1;
    const idHistoria =
        historiaActualEvidencias.historia_id ??
        historiaActualEvidencias.id;

    const datos = new FormData();
    datos.append("archivo", archivo);

    try {
        const respuesta = await fetch(
            `/historias/evidencias/${idProyecto}/${idHistoria}`,
            {
                method: "POST",
                body: datos
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || "No se pudo subir la evidencia."
            );
        }

        alert("Evidencia subida correctamente.");

        await cargarArchivosEvidencias(idProyecto, idHistoria);

    } catch (error) {
        console.error("Error al subir evidencia:", error);
        alert(error.message || "Error al subir la imagen.");
    } finally {
        input.value = "";
    }
}

/**
 * Borra una evidencia por su nombre.
 */
async function borrarEvidencia(nombreArchivo) {
    if (!historiaActualEvidencias) return;

    const estado = String(
        historiaActualEvidencias.estado_actual ??
        historiaActualEvidencias.estado ??
        ""
    ).toLowerCase();

    if (ROL_ACTUAL !== "desarrollador") {
        alert("No tienes permiso para borrar evidencias.");
        return;
    }

    if (["terminado", "terminada"].includes(estado)) {
        alert("No puedes borrar evidencias de una historia terminada.");
        return;
    }

    if (!confirm(`¿Deseas borrar la evidencia "${nombreArchivo}"?`)) {
        return;
    }

    const idProyecto = historiaActualEvidencias.id_proyecto ?? 1;
    const idHistoria =
        historiaActualEvidencias.historia_id ??
        historiaActualEvidencias.id;

    const nombreCodificado = encodeURIComponent(nombreArchivo);

    const url = `/historias/evidencias/${idProyecto}/${idHistoria}/${nombreCodificado}`;

    console.log("URL de borrado:", url);

    try {

        const respuesta = await fetch(url, {
            method: "DELETE"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || "No se pudo borrar la evidencia."
            );
        }

        // Limpiar la vista previa si se estaba mostrando la imagen borrada.
        const imagen = document.querySelector(
            "#kanban-evidencias-preview-content img"
        );

        if (imagen && imagen.getAttribute("src") ===
            `/evidencias/${idProyecto}/${idHistoria}/${nombreArchivo}`) {
            mostrarVistaPreviaPlaceholder();
        }

        await cargarArchivosEvidencias(idProyecto, idHistoria);

        alert("Evidencia borrada correctamente.");

    } catch (error) {
        console.error("Error al borrar evidencia:", error);
        alert(error.message || "Error al borrar la evidencia.");
    }
}

function mostrarVistaPreviaPlaceholder() {
    const contenedor = document.getElementById(
        "kanban-evidencias-preview-content"
    );

    contenedor.innerHTML = `
        <div class="preview-icono-default">&#128444;</div>
        <span class="preview-nombre-archivo">Selecciona un archivo</span>
        <span class="preview-sub-text">
            Aquí se mostrará la imagen a tamaño completo
        </span>
    `;
}

/**
 * Regresa al detalle de la historia.
 */
function regresarAlDetalleHistoria() {
    if (historiaActualEvidencias) {
        verDetallesHistoriaKanban(
            historiaActualEvidencias.historia_id ??
            historiaActualEvidencias.id
        );
    } else {
        mostrarModal("modal-detalle-historia-kanban");
    }
}
