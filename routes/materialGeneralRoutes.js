
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Carpeta principal donde se guardarán los materiales.
const CARPETA_BASE = path.join(
    __dirname,
    '../almacenamiento/material-general'
);
const MaterialGeneralControlador = require(
    '../controladores/materialGeneralControlador'
);

const controlador = new MaterialGeneralControlador();

// Validar que el ID del proyecto sea un entero positivo.
function validarProyecto(req, res, next) {
    const { idProyecto } = req.params;

    if (!/^[1-9]\d*$/.test(idProyecto) ||
        !Number.isSafeInteger(Number(idProyecto))) {
        return res.status(400).json({
            ok: false,
            mensaje: 'ID de proyecto no válido.'
        });
    }

    next();
}


// Configuración de almacenamiento con Multer.
const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        const carpeta = path.join(
            CARPETA_BASE,
            req.params.idProyecto
        );

        try {
            fs.mkdirSync(carpeta, { recursive: true });
            cb(null, carpeta);
        } catch (error) {
            cb(error);
        }
    },

    filename: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        const nombre = `${crypto.randomUUID()}${extension}`;

        cb(null, nombre);
    }
});

// Tipos de archivos permitidos.
const extensionesPermitidas = [
    '.png', '.jpg', '.jpeg', '.pdf', '.zip'
];

const tiposPermitidos = {
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.pdf': ['application/pdf'],
    '.zip': [
        'application/zip',
        'application/x-zip-compressed',
        'multipart/x-zip'
    ]
};

const subirMaterial = multer({
    storage: almacenamiento,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        const tipos = tiposPermitidos[extension];

        if (extensionesPermitidas.includes(extension) &&
            tipos.includes(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error(
            'Solo se permiten archivos PNG, JPG, PDF y ZIP.'
        ));
    }
});


/**
 * GET: Listar materiales del proyecto.
 * Facilitador y desarrollador.
 */
router.get(
    '/:idProyecto',
    validarProyecto,
    (req, res) => controlador.listarMateriales(req, res)
);

/**
 * GET: Descargar un material.
 * Facilitador y desarrollador.
 */
router.get(
    '/:idProyecto/:nombreArchivo/descargar',
    validarProyecto,
    (req, res) => controlador.descargarMaterial(req, res)
);

/**
 * POST: Subir un material.
 * Solo facilitador.
 */
router.post(
    '/:idProyecto',
    validarProyecto,
    subirMaterial.single('archivo'),
    (req, res) => controlador.guardarMaterial(req, res)
);

/**
 * DELETE: Eliminar un material.
 * Solo facilitador.
 */
router.delete(
    '/:idProyecto/:nombreArchivo',
    validarProyecto,
    (req, res) => controlador.eliminarMaterial(req, res)
);

module.exports = router;

