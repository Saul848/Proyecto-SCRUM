const express = require('express');
const pool = require('../poolDb'); // aqui mismo en las rutas se exporta { pool } 

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const HistoriaUsuarioDAO = require('../dao/historiaUsuarioDAO');
const HistoriaUsuarioControlador = require('../controladores/historiaUsuarioControlador');

const router = express.Router();
const controlador = new HistoriaUsuarioControlador(new HistoriaUsuarioDAO(pool));


const almacenamientoEvidencias = multer.diskStorage({
    destination: (req, file, cb) => {
        const { idProyecto, idHistoria } = req.params;

        const carpeta = path.join(
            __dirname,
            '../public/evidencias',
            String(idProyecto),
            String(idHistoria)
        );

        fs.mkdirSync(carpeta, { recursive: true });
        cb(null, carpeta);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, nombre);
    }
});

const subirEvidencia = multer({
    storage: almacenamientoEvidencias,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB máximo
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const extensionesPermitidas = ['.png', '.jpg', '.jpeg', '.pdf', '.zip'];
        
        const mimetypesPermitidos = [
            'image/png',
            'image/jpeg',
            'application/pdf',
            'application/zip',
            'application/x-zip-compressed',
            'multipart/x-zip'
        ];

        if (extensionesPermitidas.includes(extension) && mimetypesPermitidos.includes(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error('Solo se permiten imágenes (PNG, JPG), archivos PDF y ZIP.'));
    }
});

// "login" va antes de "/:id" para que no se confunda con un id
router.get('/', (req, res) => controlador.listar(req, res));

/**
 * Obtiene todas las historias del sprint actual
 * Ejemplo de petición: GET /historiasSprint/1/1  (Proyecto 1, Sprint 1)
 */
router.get('/historiasSprint/:idProyecto/:idSprint', (req, res) => controlador.obtenerHistoriasSprint(req, res));

/**
 * @name GET /
 * @description Obtiene las historias del sprint asignadas a un desarrollador
 * Ejemplo de petición: GET /historiasSprintDev/1/1/2 (Proyecto 1, Sprint 1, Desarrollador 2)
 */
router.get('/historiasSprintDev/:idProyecto/:idSprint/:idDesarrollador', (req, res) => controlador.obtenerHistoriasPorDesarrollador(req, res));

/**
 * @name GET /evidencias/:idProyecto/:idHistoria
 * @description Obtiene los archivos de evidencias usando los IDs de proyecto e historia de forma segura
 */
router.get('/evidencias/:idProyecto/:idHistoria', (req, res) => controlador.obtenerEvidenciasHistoria(req, res));

/**
 * @name POST /evidencias/:idProyecto/:idHistoria
 * @description Permite subir imagenes como evidencias de cada Historia de Usuario
 */
router.post('/evidencias/:idProyecto/:idHistoria', subirEvidencia.single('archivo'), (req, res) => controlador.guardarEvidenciaHistoria(req, res));


/**
 * @name DELETE /evidencias/:idProyecto/:idHistoria/:nombreArchivo
 * @description Elimina una imagen de evidencia de una historia de usuario.
 */
router.delete(
    "/evidencias/:idProyecto/:idHistoria/:nombreArchivo",
    (req, res) => controlador.borrarEvidenciaHistoria(req, res)
);


/**
 * @name PUT /
 * @description Actualiza el estado de una historia
 */
router.put('/estado/:idHistoria/:idProyecto', (req, res) => controlador.actualizarEstadoHistoria(req, res));



router.post('/', (req, res) => controlador.agregar(req, res));


module.exports = router;