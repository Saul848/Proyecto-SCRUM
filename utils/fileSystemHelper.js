const fs = require('fs');
const path = require('path');

/**
 * Crea la carpeta principal para un proyecto: evidencias/idProyecto
 * @param {number|string} idProyecto 
 */
function crearCarpetaProyecto(idProyecto) {
    try {
        const rutaProyecto = path.join(__dirname, '../public/evidencias', String(idProyecto));
        if (!fs.existsSync(rutaProyecto)) {
            fs.mkdirSync(rutaProyecto, { recursive: true });
            console.log(`[FS] Carpeta de proyecto creada: ${rutaProyecto}`);
        }
    } catch (error) {
        console.error(`Error al crear la carpeta del proyecto ${idProyecto}:`, error);
        throw error;
    }
}

/**
 * Crea la carpeta específica para una historia de usuario: evidencias/idProyecto/idHistoria
 * @param {number|string} idProyecto 
 * @param {number|string} idHistoria 
 */
function crearCarpetaHistoria(idProyecto, idHistoria) {
    try {
        const rutaHistoria = path.join(__dirname, '../public/evidencias', String(idProyecto), String(idHistoria));
        if (!fs.existsSync(rutaHistoria)) {
            fs.mkdirSync(rutaHistoria, { recursive: true });
            console.log(`[FS] Carpeta de historia creada: ${rutaHistoria}`);
        }
    } catch (error) {
        console.error(`Error al crear la carpeta de la historia ${idHistoria}:`, error);
        throw error;
    }
}

module.exports = {
    crearCarpetaProyecto,
    crearCarpetaHistoria
};