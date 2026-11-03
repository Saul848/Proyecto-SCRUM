// ==========================================
// GESTIÓN DEL MODAL DE MATERIAL ADICIONAL / EVIDENCIAS
// ==========================================
window.historiaActualEvidencias = null; // Variable global para el material general

// Escuchar el clic en el botón de compartir material adicional
document.addEventListener("click", async (event) => {
    const btnCompartir = event.target.closest("#btn-compartir-material");
    
    if (btnCompartir) {
        console.log("¡Click detectado! Intentando abrir modal...");

        const idProyectoGeneral = 1; 
        const idHistoriaGeneral = 0; // ID 0 para material general (PB-26)

        window.historiaActualEvidencias = {
            id_proyecto: idProyectoGeneral,
            historia_id: idHistoriaGeneral,
            estado: "En progreso"
        };

        const modalEvidencias = document.getElementById("mi-modal-evidencias-general");
        if (modalEvidencias) {
            modalEvidencias.setAttribute("style", "display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0, 0, 0, 0.5) !important; justify-content: center !important; align-items: center !important; z-index: 999999 !important;");
            console.log("¡Modal forzado a mostrarse en pantalla!");
        } else {
            console.error("¡ERROR! No se encontró el elemento con ID 'mi-modal-evidencias-general' en el HTML.");
            return; 
        }

        // Textos informativos y visuales
        const badgeEstado = document.getElementById("kanban-evidencias-badge-estado");
        if (badgeEstado) {
            badgeEstado.textContent = "General";
            badgeEstado.className = "badge-estado general-badge";
        }

        if (typeof aplicarReglasPermisosYEstado === "function") {
            aplicarReglasPermisosYEstado("En progreso");
        }

        if (typeof cargarArchivosEvidencias === "function") {
            await cargarArchivosEvidencias(idProyectoGeneral, idHistoriaGeneral);
        }
    }
});

/**
 * Función exclusiva para cerrar tu modal y ocultarlo limpiamente
 */
function cerrarMiModalGeneral(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const modalEvidencias = document.getElementById("mi-modal-evidencias-general");
    if (modalEvidencias) {
        modalEvidencias.setAttribute("style", "display: none !important;");
    }

    window.historiaActualEvidencias = null;
}
/**
 * Configurar permisos y visibilidad según el rol (Facilitador vs Desarrollador)
 */
window.aplicarReglasPermisosYEstado = function() {
    const zonaCarga = document.getElementById("kanban-evidencias-zona-carga");
    const alertaTexto = document.getElementById("kanban-evidencias-alerta-texto");

    // Verificamos de forma segura si la variable global ya existe; si no, asignamos el rol por defecto de esta vista
    if (typeof ROL_ACTUAL === 'undefined') {
        var ROL_ACTUAL = window.location.href.includes('Facilitador') ? "facilitador" : "desarrollador";
    }

    const rolActual = ROL_ACTUAL.toLowerCase().trim();
    console.log("Rol detectado:", rolActual);

    if (rolActual === "desarrollador") {
        if (zonaCarga) zonaCarga.style.setProperty("display", "none", "important");
        if (alertaTexto) alertaTexto.textContent = "Material compartido por el facilitador para consulta y descarga.";
    } else {
        // Como estás en el panel de facilitador, forzamos que se muestre la zona de carga
        if (zonaCarga) zonaCarga.style.setProperty("display", "block", "important");
        if (alertaTexto) alertaTexto.textContent = "Puedes subir imágenes PNG, JPG, PDF o ZIP y borrar las que tú subiste.";
    }
}

/**
 * Cargar y listar los archivos subidos
 */
async function cargarArchivosEvidencias(idProyecto, idHistoria) {
    const lista = document.getElementById("kanban-evidencias-lista-archivos");
    if (!lista) return;

    lista.innerHTML = "<p>Cargando evidencias...</p>";

    try {
        const respuesta = await fetch(`/historias/evidencias/${idProyecto}/${idHistoria}`);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

        const resultado = await respuesta.json();
        if (!resultado.ok) throw new Error(resultado.mensaje || "No se pudieron cargar las evidencias.");

        const archivos = resultado.data || [];
        const contador = document.getElementById("kanban-evidencias-contador");
        if (contador) {
            contador.textContent = `Archivos subidos (${archivos.length})`;
        }

        lista.innerHTML = "";

        if (archivos.length === 0) {
            lista.innerHTML = "<div class='sin-archivos'>No hay evidencias subidas aún.</div>";
            return;
        }

        archivos.forEach(archivo => {
            const item = document.createElement("div");
            item.className = "kanban-evidencias-item-archivo";

            const esAutor = Number(archivo.id_usuario_subio) === Number(window.USUARIO_ACTUAL_ID ?? 1);

            let botones = `
                <button type="button" class="btn-modal-cancelar kanban-btn-descargar">Descargar</button>
            `;

            if ((ROL_ACTUAL === "desarrollador" || ROL_ACTUAL === "facilitador") && esAutor) {
                botones += `
                    <button type="button" class="btn-modal-cancelar kanban-btn-borrar" style="background:#fee2e2; color:#dc2626;">Borrar</button>
                `;
            }

            item.innerHTML = `
                <div class="kanban-evidencias-item-info" style="cursor:pointer; display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <span>📄</span>
                    <div>
                        <strong class="kanban-evidencias-item-nombre" style="font-size:13px; color:#1e293b;"></strong>
                        <br>
                        <small class="kanban-evidencias-item-meta" style="font-size:11px; color:#64748b;"></small>
                    </div>
                </div>
                <div class="kanban-evidencias-item-acciones" style="display:flex; gap:5px; margin-bottom:10px;">
                    ${botones}
                </div>
            `;

            item.querySelector(".kanban-evidencias-item-nombre").textContent = archivo.nombre;
            item.querySelector(".kanban-evidencias-item-meta").textContent = `Subida por ${archivo.nombre_usuario ?? "Usuario"} · ${archivo.fecha ?? ""}`;

            item.querySelector(".kanban-evidencias-item-info").addEventListener("click", () => {
                mostrarVistaPrevia(archivo.url, archivo.nombre);
            });

            item.querySelector(".kanban-btn-descargar").addEventListener("click", () => {
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
        lista.innerHTML = "<p style='color:#dc2626; text-align:center;'>Error al cargar los archivos.</p>";
    }
}

/**
 * Vista previa de archivos
 */
function mostrarVistaPrevia(urlArchivo, nombreArchivo) {
    const contenedor = document.getElementById("kanban-evidencias-preview-content");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    const extension = nombreArchivo.substring(nombreArchivo.lastIndexOf('.')).toLowerCase();

    if (['.png', '.jpg', '.jpeg'].includes(extension)) {
        const imagen = document.createElement("img");
        imagen.src = urlArchivo;
        imagen.alt = nombreArchivo;
        imagen.style.maxWidth = "100%";
        imagen.style.maxHeight = "120px";
        imagen.style.borderRadius = "4px";
        contenedor.appendChild(imagen);
    } else if (extension === '.pdf') {
        const iconoPdf = document.createElement("div");
        iconoPdf.className = "preview-icono-default";
        iconoPdf.innerHTML = "📄";
        
        const btnVerPdf = document.createElement("a");
        btnVerPdf.href = urlArchivo;
        btnVerPdf.target = "_blank";
        btnVerPdf.className = "btn-modal-cancelar";
        btnVerPdf.style.marginTop = "5px";
        btnVerPdf.style.textDecoration = "none";
        btnVerPdf.textContent = "Ver PDF";
        contenedor.append(iconoPdf, btnVerPdf);
    } else if (extension === '.zip') {
        const iconoZip = document.createElement("div");
        iconoZip.className = "preview-icono-default";
        iconoZip.innerHTML = "📦";
        
        const btnDescargarZip = document.createElement("a");
        btnDescargarZip.href = urlArchivo;
        btnDescargarZip.download = nombreArchivo;
        btnDescargarZip.className = "btn-modal-cancelar";
        btnDescargarZip.style.marginTop = "5px";
        btnDescargarZip.style.textDecoration = "none";
        btnDescargarZip.textContent = "Descargar ZIP";
        contenedor.append(iconoZip, btnDescargarZip);
    }

    const nombre = document.createElement("span");
    nombre.className = "preview-nombre-archivo";
    nombre.textContent = nombreArchivo;
    contenedor.appendChild(nombre);
}

/**
 * Descargar archivo
 */
function descargarEvidencia(url, nombre) {
    let urlCompleta = url;
    if (!url.startsWith('http')) {
        const base = window.location.origin;
        urlCompleta = url.startsWith('/') ? base + url : base + '/' + url;
    }

    const enlace = document.createElement("a");
    enlace.href = urlCompleta;
    enlace.download = nombre || 'evidencia';
    enlace.setAttribute('target', '_blank');
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
}

/**
 * Subir archivo
 */
async function manejarSeleccionArchivo(input) {
    const archivo = input.files[0];
    if (!archivo) return;

    const idProyecto = window.historiaActualEvidencias?.id_proyecto ?? 1;
    const idHistoria = window.historiaActualEvidencias?.historia_id ?? 0;

    const datos = new FormData();
    datos.append("archivo", archivo);

    try {
        const respuesta = await fetch(`/historias/evidencias/${idProyecto}/${idHistoria}`, {
            method: "POST",
            body: datos
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo subir el archivo.");

        alert("Archivo subido correctamente.");
        await cargarArchivosEvidencias(idProyecto, idHistoria);
    } catch (error) {
        console.error("Error al subir el archivo:", error);
        alert(error.message || "Error al subir el archivo.");
    } finally {
        input.value = "";
    }
}

/**
 * Borrar archivo
 */
async function borrarEvidencia(nombreArchivo) {
    if (!confirm(`¿Deseas borrar la evidencia "${nombreArchivo}"?`)) return;

    const idProyecto = window.historiaActualEvidencias?.id_proyecto ?? 1;
    const idHistoria = window.historiaActualEvidencias?.historia_id ?? 0;
    const nombreCodificado = encodeURIComponent(nombreArchivo);

    try {
        const respuesta = await fetch(`/historias/evidencias/${idProyecto}/${idHistoria}/${nombreCodificado}`, {
            method: "DELETE"
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo borrar la evidencia.");

        await cargarArchivosEvidencias(idProyecto, idHistoria);
        alert("Evidencia borrada correctamente.");
    } catch (error) {
        console.error("Error al borrar evidencia:", error);
        alert(error.message || "Error al borrar la evidencia.");
    }
}