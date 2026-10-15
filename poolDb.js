/**
 * Conexión a postgres mediante un pool de conexiones
 */
const { Pool } = require("pg")

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "midb",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "contra",
    max:10,
    idleTimeoutMillis: 60000, //Cierre de conexiones inactivas tras 60 segundos
    connectionTimeoutMillis: 10000 //falla si no conecta en 10 segundos
});

pool.on("error", (err)=>{
    console.error("Error inesperado en el pool de PostgreSQL: ", err.message);
});

module.exports = pool;