
const fs = require('fs');
const path = require('path');

const CARPETA_BASE = path.resolve(
    __dirname,
    '../almacenamiento/material-general'
);

// Obtiene la carpeta correspondiente al proyecto.
function obtenerCarpetaProyecto(idProyecto) {
    return path.join(CARPETA_BASE, String(idProyecto));
}

// Comprueba que el nombre no contenga rutas ni extensiones no admitidas.
function nombreArchivoValido(nombre) {
    return (
        typeof nombre === 'string' &&
        nombre === path.basename(nombre) &&
        /^[a-f0-9-]{36}\.(png|jpg|jpeg|pdf|zip)$/i.test(nombre)
    );
}

class MaterialGeneralControlador {

    // GET: listar materiales de un proyecto.
    async listarMateriales(req, res) {
        try {
            const carpeta = obtenerCarpetaProyecto(
                req.params.idProyecto
            );

            if (!fs.existsSync(carpeta)) {
                return res.json({
                    ok: true,
                    data: []
                });
            }

            const nombres = await fs.promises.readdir(carpeta);

            const archivos = nombres
                .filter(nombreArchivoValido)
                .map(nombre => ({
                    nombre,
                    url: `/material-general/${req.params.idProyecto}/${encodeURIComponent(nombre)}/descargar`
                }));

            return res.json({
                ok: true,
                data: archivos
            });

        } catch (error) {
            console.error('Error al listar materiales:', error);

            return res.status(500).json({
                ok: false,
                mensaje: 'No se pudieron consultar los materiales.'
            });
        }
    }

    // POST: confirmar que el archivo se guardó.
    async guardarMaterial(req, res) {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se recibió ningún archivo.'
            });
        }

        return res.status(201).json({
            ok: true,
            mensaje: 'Material subido correctamente.',
            data: {
                nombre: req.file.filename
            }
        });
    }

    // GET: descargar un archivo.
    async descargarMaterial(req, res) {
        const { idProyecto, nombreArchivo } = req.params;

        if (!nombreArchivoValido(nombreArchivo)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Nombre de archivo no válido.'
            });
        }

        const ruta = path.join(
            obtenerCarpetaProyecto(idProyecto),
            nombreArchivo
        );

        return res.download(ruta, nombreArchivo, error => {
            if (error && !res.headersSent) {
                res.status(error.code === 'ENOENT' ? 404 : 500).json({
                    ok: false,
                    mensaje: 'No se pudo descargar el archivo.'
                });
            }
        });
    }

    // DELETE: eliminar un archivo.
    async eliminarMaterial(req, res) {
        const { idProyecto, nombreArchivo } = req.params;

        if (!nombreArchivoValido(nombreArchivo)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Nombre de archivo no válido.'
            });
        }

        try {
            const ruta = path.join(
                obtenerCarpetaProyecto(idProyecto),
                nombreArchivo
            );

            await fs.promises.unlink(ruta);

            return res.json({
                ok: true,
                mensaje: 'Material eliminado correctamente.'
            });

        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'Archivo no encontrado.'
                });
            }

            console.error('Error al eliminar material:', error);

            return res.status(500).json({
                ok: false,
                mensaje: 'No se pudo eliminar el material.'
            });
        }
    }
}

module.exports = MaterialGeneralControlador;
