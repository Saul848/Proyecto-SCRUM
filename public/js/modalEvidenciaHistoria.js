let historiaActualEvidencias = null;

async function asegurarModalCargadoEvidenciaHistoria() {
    // Si ya existe en el DOM, no hace nada
    if (document.getElementById("modal-evidencias-historia-kanban")) return;

    try {
        // Asegúrate de poner la ruta correcta hacia tu archivo .html separado
        const respuesta = await fetch('../html/modalEvidenciaHistoria.html');
        if (!respuesta.ok) {
            console.error("No se pudo cargar el archivo HTML del modal.");
            return;
        }
        const html = await respuesta.text();

        //Inyectarlo dentro de la zona de trabajo para mantener orden
        const zonaTrabajo = document.getElementById("zonaDeTrabajo");
        if (zonaTrabajo) {
            zonaTrabajo.insertAdjacentHTML('beforeend', html);
        } else {
            // Fallback por si la zona de trabajo no se encuentra
            document.body.insertAdjacentHTML('beforeend', html);
        }
    } catch (error) {
        console.error("Error de red al intentar cargar el modal:", error);
    }
}

/**
 * Abre el modal de evidencias de una historia.
 */
async function abrirModalEvidenciasHistoria(historiaId) {
    // Asegurar que el HTML exista antes de intentar rellenarlo
    await asegurarModalCargadoEvidenciaHistoria();

    const historia = historiasDelSprint.find(
        h => Number(h.historia_id) === Number(historiaId)
    );

    if (!historia) {
        alert("No se encontró la historia seleccionada.");
        return;
    }

    historiaActualEvidencias = historia;

    document.getElementById(
        "kanban-evidencias-id-historia-num"
    ).textContent = historiaId;

    const estado = historia.estado_actual;

    document.getElementById(
        "kanban-evidencias-badge-estado"
    ).textContent = estado;

    aplicarReglasPermisosYEstadoHistoria(estado);
    mostrarModal("modal-evidencias-historia-kanban");

    const idProyecto = proyectoActualKanban.id;
    const idHistoria = historia.historia_id;

    await cargarArchivosEvidenciasHistoria(idProyecto, idHistoria);
}

/**
 * Configura la interfaz según el rol y el estado.
 */
function aplicarReglasPermisosYEstadoHistoria(estado) {
    const esTerminada = ["terminado", "terminada"].includes(String(estado).toLowerCase());
    const puedeSubir = ROL_ACTUAL === "desarrollador" && !esTerminada;

    const zona = document.getElementById("kanban-evidencias-zona-carga");
    const input = document.getElementById("kanban-evidencias-input-file");
    const alerta = document.getElementById("kanban-evidencias-alerta");
    const texto = document.getElementById("kanban-evidencias-alerta-texto");

    zona.style.display = puedeSubir ? "" : "none";   // no depende del CSS
    input.disabled = !puedeSubir;
    zona.onclick = puedeSubir ? () => input.click() : null;

    alerta.classList.remove("info", "bloqueado");
    if (esTerminada) {
        alerta.classList.add("bloqueado");
        texto.textContent = "Historia terminada: no se pueden subir ni borrar evidencias.";
    } else if (!puedeSubir) {
        alerta.classList.add("info");
        texto.textContent = "Modo de solo lectura: puedes ver y descargar evidencias.";
    } else {
        alerta.classList.add("info");
        texto.textContent = "Puedes subir imágenes (PNG, JPG), PDF o ZIP (máx. 5 MB) y borrar las que tú subiste.";
    }
}

/**
 * Obtiene y dibuja las evidencias de una historia.
 */
async function cargarArchivosEvidenciasHistoria(idProyecto, idHistoria) {
    const lista = document.getElementById(
        "kanban-evidencias-lista-archivos"
    );

    lista.innerHTML = "<p>Cargando evidencias...</p>";
    console.log(`/historias/evidencias/${idProyecto}/${idHistoria}`);
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
            historiaActualEvidencias.estado_actual
        ).toLowerCase();

        const esTerminada = ["terminado", "terminada"].includes(estado);

        archivos.forEach(archivo => {
            const item = document.createElement("div");
            item.className = "kanban-evidencias-item-archivo";

            const esAutor =
                Number(archivo.id_usuario_subio) ===
                Number(usuarioActualKanban.id);

            // 1. Botón de descarga para todos los roles
            let botones = `
    <button type="button" class="kanban-btn-accion kanban-btn-descargar">
        Descargar
    </button>
`;

            // 2. Limpiar y verificar el rol actual de forma estricta
            const rolLimpio = String(ROL_ACTUAL ?? "").trim().toLowerCase();

            // SI NO ES DESARROLLADOR (ej. facilitador o cliente), JAMÁS se agrega el botón de borrar
            if (rolLimpio === "desarrollador") {
                if (esAutor && !esTerminada) {
                    botones += `
                        <button type="button" class="kanban-btn-accion kanban-btn-borrar">
                            Borrar
                        </button>
                    `;
                } else if (!esAutor) {
                    botones += `
                        <span class="kanban-lbl-bloqueado">Ajena</span>
                    `;
                }
            }
            // Si el rol es "facilitador", "cliente" o cualquier otro, el bloque anterior se omite por completo y SOLO tendrá el botón de Descargar.

            // Determinar icono según la extensión del archivo
            const nombreLower = archivo.nombre.toLowerCase();
            let iconoHtml = "&#128444;"; // Imagen por defecto
            if (nombreLower.endsWith(".pdf")) {
                iconoHtml = "&#128196;"; // Documento PDF
            } else if (nombreLower.endsWith(".zip")) {
                iconoHtml = "&#128230;"; // Archivo comprimido ZIP
            }

            item.innerHTML = `
                <div class="kanban-evidencias-item-info">
                    <span class="kanban-evidencias-item-icono">${iconoHtml}</span>
                    <div class="kanban-evidencias-item-textos">
                        <span class="kanban-evidencias-item-nombre"></span>
                        <span class="kanban-evidencias-item-meta"></span>
                    </div>
                </div>
                <div class="kanban-evidencias-item-acciones">
                    ${botones}
                </div>
            `;

            item.querySelector(".kanban-evidencias-item-nombre")
                .textContent = archivo.nombre;

            item.querySelector(".kanban-evidencias-item-meta")
                .textContent =
                `Subida por ${archivo.nombre_usuario ?? "Usuario"} · ` +
                `${archivo.fecha ?? ""}`;

            item.querySelector(".kanban-evidencias-item-info")
                .addEventListener("click", () => {
                    mostrarVistaPreviaHistoria(archivo.url, archivo.nombre);
                });

            item.querySelector(".kanban-btn-descargar")
                .addEventListener("click", () => {
                    descargarEvidenciaHistoria(archivo.url, archivo.nombre);
                });

            const botonBorrar = item.querySelector(".kanban-btn-borrar");

            if (botonBorrar) {
                botonBorrar.addEventListener("click", () => {
                    borrarEvidenciaHistoria(archivo.nombre);
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
 * Muestra la vista previa del archivo (imagen, PDF o aviso para ZIP).
 */
function mostrarVistaPreviaHistoria(urlArchivo, nombreArchivo) {
    const contenedor = document.getElementById(
        "kanban-evidencias-preview-content"
    );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    const extension = nombreArchivo
        .substring(nombreArchivo.lastIndexOf('.'))
        .toLowerCase();

    if (['.png', '.jpg', '.jpeg'].includes(extension)) {
        // Vista previa para imágenes
        const imagen = document.createElement("img");
        imagen.src = urlArchivo;
        imagen.alt = nombreArchivo;
        imagen.className = "preview-imagen-real";

        contenedor.appendChild(imagen);

    } else if (extension === '.pdf') {
        // Icono y botón para abrir PDF
        const iconoPdf = document.createElement("div");
        iconoPdf.className = "preview-icono-default";
        iconoPdf.textContent = "📄";

        const btnVerPdf = document.createElement("a");
        btnVerPdf.href = urlArchivo;
        btnVerPdf.target = "_blank";
        btnVerPdf.rel = "noopener noreferrer";
        btnVerPdf.className = "btn-modal-cancelar";
        btnVerPdf.style.marginTop = "5px";
        btnVerPdf.style.textDecoration = "none";
        btnVerPdf.textContent = "Ver PDF";

        contenedor.append(iconoPdf, btnVerPdf);

    } else if (extension === '.zip') {
        // Icono y botón para descargar ZIP
        const iconoZip = document.createElement("div");
        iconoZip.className = "preview-icono-default";
        iconoZip.textContent = "📦";

        const btnDescargarZip = document.createElement("a");
        btnDescargarZip.href = urlArchivo;
        btnDescargarZip.download = nombreArchivo;
        btnDescargarZip.className = "btn-modal-cancelar";
        btnDescargarZip.style.marginTop = "5px";
        btnDescargarZip.style.textDecoration = "none";
        btnDescargarZip.textContent = "Descargar ZIP";

        contenedor.append(iconoZip, btnDescargarZip);
    }

    // Nombre del archivo
    const nombre = document.createElement("span");
    nombre.className = "preview-nombre-archivo";
    nombre.textContent = nombreArchivo;

    contenedor.appendChild(nombre);
}

/**
 * Descarga una evidencia.
 */
function descargarEvidenciaHistoria(url, nombre) {
    let urlCompleta = url;

    // Completar URL si es una ruta relativa
    if (!url.startsWith('http')) {
        const base = window.location.origin;
        urlCompleta = url.startsWith('/')
            ? base + url
            : base + '/' + url;
    }

    const enlace = document.createElement("a");
    enlace.href = urlCompleta;
    enlace.download = nombre || 'evidencia';
    enlace.setAttribute('target', '_blank');
    enlace.rel = "noopener noreferrer";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
}


/**
 * Sube una evidencia al servidor.
 */
async function manejarSeleccionArchivoHistoria(input) {
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

    // Tipos permitidos: Imágenes (PNG, JPEG), PDF y ZIP
    const tiposPermitidos = [
        "image/png",
        "image/jpeg",
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "multipart/x-zip"
    ];

    // Validación extra por extensión por si el navegador no detecta bien el MIME type del .zip
    const nombreLower = archivo.name.toLowerCase();
    const esZipValido = nombreLower.endsWith(".zip");
    const esPdfValido = nombreLower.endsWith(".pdf") || archivo.type === "application/pdf";
    const esImgValida = ["image/png", "image/jpeg"].includes(archivo.type);

    if (!esImgValida && !esPdfValido && !esZipValido) {
        alert("Solo se permiten imágenes (PNG, JPG), archivos PDF o comprimidos ZIP.");
        input.value = "";
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        alert("El archivo no puede superar los 5 MB.");
        input.value = "";
        return;
    }

    const idProyecto = proyectoActualKanban.id;
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

        await cargarArchivosEvidenciasHistoria(idProyecto, idHistoria);

    } catch (error) {
        console.error("Error al subir evidencia:", error);
        alert(error.message || "Error al subir el archivo.");
    } finally {
        input.value = "";
    }
}

/**
 * Borra una evidencia por su nombre.
 */
async function borrarEvidenciaHistoria(nombreArchivo) {
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

    const idProyecto = proyectoActualKanban.id;
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

        // Limpiar la vista previa si se estaba mostrando el archivo borrado.
        const previewContent = document.getElementById("kanban-evidencias-preview-content");
        const elementoVisual = previewContent.querySelector("img, embed");

        if (elementoVisual && elementoVisual.getAttribute("src") ===
            `/evidencias/${idProyecto}/${idHistoria}/${nombreArchivo}`) {
            mostrarVistaPreviaPlaceholderHistoria();
        }

        await cargarArchivosEvidenciasHistoria(idProyecto, idHistoria);

        alert("Evidencia borrada correctamente.");

    } catch (error) {
        console.error("Error al borrar evidencia:", error);
        alert(error.message || "Error al borrar la evidencia.");
    }
}

function mostrarVistaPreviaPlaceholderHistoria() {
    const contenedor = document.getElementById(
        "kanban-evidencias-preview-content"
    );

    contenedor.innerHTML = `
        <div class="preview-icono-default">&#128444;</div>
        <span class="preview-nombre-archivo">Selecciona un archivo</span>
        <span class="preview-sub-text">
            Aquí se mostrará la vista previa del archivo
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