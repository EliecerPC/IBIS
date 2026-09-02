const express = require('express');
const pool = require('./db');

const app = express();

const PORT = 3000;

// Permite recibir datos en formato JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Servidor de IBIS funcionando'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de IBIS ejecutándose en http://localhost:${PORT}`);
});