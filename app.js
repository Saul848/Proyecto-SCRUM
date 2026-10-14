/**
 * @file Servidor principal Express para la API de gestion de oxxo.
 * @description Configura los middlewares, sirve archivos estáticos e integra las rutas de la API.
 * @module app
 * @requires express
 * 
 */

require("dotenv").config(); // Libreria para acceder a la clave del .env y obtener la clave_secreta para cifrar los tokens

const express = require("express");

const path = require('path');

const app = express();
/**
 * Middleware para procesar cuerpos de solicitud en formato JSON.
 */
app.use(express.json());

/**
 * Middleware para servir archivos estáticos (frontend UI, assets, etc.).
 */
app.use(express.static("public"));

app.use('/data', express.static(path.join(__dirname, 'data')));


/**
 * Puerto de escucha predeterminado del servidor.
 * @type {number}
 */
const PORT = 3000;

/**
 * Inicia el servidor HTTP.
 */
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});