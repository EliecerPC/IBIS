const express = require('express');
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());


const PORT = 3000;

// Permite recibir datos en formato JSON
app.use(express.json());

/**
 * Middleware de permisos por rol.
 *
 * El rol de la persona que hace la petición viaja en el header
 * "x-user-role" (el frontend lo agrega automáticamente después del
 * login, ver js/auth.js). Si el rol no está en la lista de roles
 * permitidos, la petición se rechaza con 403 antes de tocar la base
 * de datos, sin importar si el botón correspondiente estaba oculto
 * o no en la interfaz.
 *
 * Nota: este mecanismo es suficiente para el alcance académico del
 * proyecto, pero no reemplaza un sistema de autenticación robusto
 * (JWT, sesiones firmadas, etc.), ya que el header podría ser
 * falsificado por alguien con conocimientos técnicos. Queda como
 * mejora para una fase futura si el proyecto lo requiere.
 */
function verificarRol(rolesPermitidos) {

    return function (req, res, next) {

        const rol = req.headers['x-user-role'];

        if (!rol) {
            return res.status(401).json({
                error: 'Debe iniciar sesión para realizar esta acción'
            });
        }

        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({
                error: 'No tiene permisos para realizar esta acción'
            });
        }

        next();
    };
}

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

// Consultar todos los equipos (con búsqueda y filtros opcionales)
app.get('/api/equipos', async (req, res) => {

    try {

        const { buscar, tipo, estado } = req.query;

        let query = 'SELECT * FROM equipo WHERE 1=1';
        const valores = [];

        // Búsqueda por texto (código, nombre, serial, marca o modelo)
        if (buscar) {
            valores.push(`%${buscar}%`);
            const posicion = valores.length;
            query += ` AND (
                codigo ILIKE $${posicion} OR
                nombre ILIKE $${posicion} OR
                serial ILIKE $${posicion} OR
                marca ILIKE $${posicion} OR
                modelo ILIKE $${posicion}
            )`;
        }

        // Filtro por tipo
        if (tipo) {
            valores.push(tipo);
            query += ` AND tipo = $${valores.length}`;
        }

        // Filtro por estado
        if (estado) {
            valores.push(estado);
            query += ` AND estado = $${valores.length}`;
        }

        query += ' ORDER BY id_equipo DESC';

        const result = await pool.query(query, valores);

        res.json(result.rows);

    } catch (error) {

        console.error('Error al obtener los equipos:', error);

        res.status(500).json({
            error: 'Error al obtener los equipos'
        });

    }

});

app.get('/api/equipos/:id', async (req, res) =>{
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM equipo WHERE id_equipo = $1', [id]);

    res.json(result.rows);
});

// Roles que pueden registrar, editar y eliminar equipos
const ROLES_GESTION_EQUIPOS = ['Administrador', 'Coordinacion', 'Area encargada'];

//Editar un registro
app.put('/api/equipos/:id', verificarRol(ROLES_GESTION_EQUIPOS), async (req, res) => {

    try{

        const id = req.params.id;

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
            `UPDATE equipo
            SET codigo = $1,
                nombre = $2,
                tipo = $3,
                marca = $4,
                modelo = $5,
                serial = $6,
                estado = $7,
                ubicacion = $8,
                observaciones = $9
                WHERE id_equipo = $10
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
                    observaciones,
                    id
                ]
        );

        console.log(result.rows);

        res.status(200).json({
            mensaje: 'Equipo actualizado correctamente',
            equipo: result.rows[0]
        });
    
    } catch (error) {

        console.error('Error al actualizar el equipo:', error.message);

        res.status(500).json({
            error: 'Error al actualizar el equipo'
        });
    }

});

//Eliminar un registro
app.delete('/api/equipos/:id', verificarRol(ROLES_GESTION_EQUIPOS), async (req, res) => {

    try{

        const id = req.params.id;

        const result = await pool.query(
            'DELETE FROM equipo WHERE id_equipo = $1', [id]
        );

        res.status(200).json({
            mensaje: 'Equipo eliminado correctamente'
        });

    } catch (error){
        console.error('Error al eliminar el equipo:', error.message);

        res.status(500).json({
            error: 'Error al eliminar el equipo'
        });
    }
});

// Registrar un nuevo equipo
app.post('/api/equipos', verificarRol(ROLES_GESTION_EQUIPOS), async (req, res) => {

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

// =============================================
// AUTENTICACIÓN, USUARIOS Y ROLES
// =============================================

// Solo el Administrador puede ver y crear usuarios
const ROLES_ADMIN = ['Administrador'];

// Iniciar sesión
app.post('/api/login', async (req, res) => {

    try {

        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({
                error: 'Debe ingresar correo y contraseña'
            });
        }

        const result = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.correo, u.contrasena,
                    r.id_rol, r.nombre AS rol
             FROM usuario u
             JOIN rol r ON r.id_rol = u.id_rol
             WHERE u.correo = $1`,
            [correo]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = result.rows[0];

        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

        if (!contrasenaValida) {
            return res.status(401).json({
                error: 'Correo o contraseña incorrectos'
            });
        }

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                id_rol: usuario.id_rol,
                rol: usuario.rol
            }
        });

    } catch (error) {

        console.error('Error al iniciar sesión:', error.message);

        res.status(500).json({
            error: 'Error al iniciar sesión'
        });
    }

});

// Consultar los roles disponibles (para el formulario de registro de usuarios)
app.get('/api/roles', verificarRol(ROLES_ADMIN), async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT id_rol, nombre FROM rol ORDER BY nombre ASC'
        );

        res.json(result.rows);

    } catch (error) {

        console.error('Error al obtener los roles:', error.message);

        res.status(500).json({
            error: 'Error al obtener los roles'
        });
    }

});

// Consultar todos los usuarios registrados
app.get('/api/usuarios', verificarRol(ROLES_ADMIN), async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol
             FROM usuario u
             JOIN rol r ON r.id_rol = u.id_rol
             ORDER BY u.id_usuario ASC`
        );

        res.json(result.rows);

    } catch (error) {

        console.error('Error al obtener los usuarios:', error.message);

        res.status(500).json({
            error: 'Error al obtener los usuarios'
        });
    }

});

// Registrar un nuevo usuario
app.post('/api/usuarios', verificarRol(ROLES_ADMIN), async (req, res) => {

    try {

        const { nombre, correo, contrasena, id_rol } = req.body;

        if (!nombre || !correo || !contrasena || !id_rol) {
            return res.status(400).json({
                error: 'Todos los campos son obligatorios'
            });
        }

        // La contraseña nunca se guarda en texto plano
        const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

        const result = await pool.query(
            `INSERT INTO usuario (nombre, correo, contrasena, id_rol)
             VALUES ($1, $2, $3, $4)
             RETURNING id_usuario, nombre, correo, id_rol`,
            [nombre, correo, contrasenaHasheada, id_rol]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: result.rows[0]
        });

    } catch (error) {

        console.error('Error al registrar el usuario:', error.message);

        // Código 23505 de PostgreSQL = violación de restricción UNIQUE (correo repetido)
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Ya existe un usuario registrado con ese correo'
            });
        }

        res.status(500).json({
            error: 'Error al registrar el usuario'
        });
    }

});