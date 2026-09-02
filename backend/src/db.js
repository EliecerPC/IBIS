const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ibis_db',
    password: '6326',
    port: 5432
});

module.exports = pool;