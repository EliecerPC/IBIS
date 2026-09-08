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

// Registrar un nuevo equipo
app.post('/api/equipos', async (req, res) => {

    try {

        const {
            codigo,
            nombre,
            tipo,
            marca,
            modelo,
            serial,
            estado,
            ubicacion,
            observaciones
        } = req.body;

        const result = await pool.query(
            `INSERT INTO equipo
            (codigo, nombre, tipo, marca, modelo, serial, estado, ubicacion, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                codigo,
                nombre,
                tipo,
                marca,
                modelo,
                serial,
                estado,
                ubicacion,
                observaciones
            ]
        );

        console.log('Equipo registrado:', result.rows[0]);

        res.status(201).json({
            mensaje: 'Equipo registrado correctamente',
            equipo: result.rows[0]
        });

    } catch (error) {

        console.error('Error al registrar equipo:', error.message);

        res.status(500).json({
            error: 'Error al registrar el equipo'
        });
    }

});