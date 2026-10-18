/**
 * @file Servidor principal Express para la API de gestion de oxxo.
 * @description Configura los middlewares, sirve archivos estáticos e integra las rutas de la API.
 * @module app
 * @requires express
 */

require("dotenv").config(); // Libreria para acceder a la clave del .env y obtener la clave_secreta para cifrar los tokens
const https = require("https");
const http = require("http");
const fs = require("fs")
const path = require('path');
const express = require("express");

const app = express();
/**
 * Middleware para procesar cuerpos de solicitud en formato JSON.
 */
app.use(express.json());

/**
 * Middleware para servir archivos estáticos (frontend UI, assets, etc.).
 */
app.use(express.static(path.join(__dirname, 'public/html')));

/**
 *
 */
app.use('/data', express.static(path.join(__dirname, 'data')));

/**
 * Rutas de usuarios
 */
app.use('/usuarios', require('./routes/usuarios'));

/**
 * Carga del certificado autorfirmado para el cifrado
 */
const opciones = {
    key: fs.readFileSync(path.join(__dirname, "certs", "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certs", "cert.pem")),
    minVersion: "TLSv1.2"
}

/**
 * Puerto de escucha predeterminado del servidor.
 * @type {number}
 */
const PORT = 8443;

https.createServer(opciones, app).listen(PORT, ()=>{
    console.log("HTTPS en https://localhost:8443")
})

/**
 * Toda petición http es redirigida hacia https
 */
http.createServer((req, res)=>{
    const host = (req.headers.host || "localhost").split(":")[0];
    res.writeHead(301, {Location:`https://${host}:8443${req.url}`});
    res.end();
}).listen(8082);