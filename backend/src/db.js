// Carga las variables de entorno definidas en el archivo .env
require('dotenv').config();

// Importa Pool, que permite administrar las conexiones con PostgreSQL
const { Pool } = require('pg');


// Configura la conexión a la base de datos utilizando variables de entorno
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Exporta la conexión para utilizarla desde otros archivos del backend
module.exports = pool;