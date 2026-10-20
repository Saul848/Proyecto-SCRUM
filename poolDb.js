/**
 * Conexión a postgres mediante un pool de conexiones
 */
require("dotenv").config();
const { Pool } = require("pg")

const pool = new Pool({
    host: process.env.PGHOST || "server-scrum-angelmisaeljacome-1684.a.aivencloud.com",
    port: Number(process.env.PGPORT) || 14303,
    database: process.env.PGDATABASE || "defaultdb",
    user: process.env.PGUSER || "avnadmin",
    password: process.env.PGPASSWORD || "AVNS_UHSTKKKnaruxnHK0qIT", //se deja por puebas, en un entorno real sería recomendable quitarla
    ssl: {
        rejectUnauthorized: false // <(Permite aceptar el certificado SSL del servidor en la nube)
    },
    max:10,
    idleTimeoutMillis: 60000, //Cierre de conexiones inactivas tras 60 segundos
    connectionTimeoutMillis: 10000 //falla si no conecta en 10 segundos
});

pool.on("error", (err)=>{
    console.error("Error inesperado en el pool de PostgreSQL: ", err.message);
});

module.exports = pool;