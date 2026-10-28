// Importar las dependencias necesarias para el servidor
const express = require('express');
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
// Permite las solicitudes del frontend hacia el backend.
app.use(cors());


const PORT = 3000;

// Permite recibir datos en formato JSON
app.use(express.json());

// Verifica el token JWT enviado en la solicitud para identificar al usuario
function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Debe iniciar sesión para acceder a este recurso'
        });
    }

    const token = encabezado.split(' ')[1];

    try {
        const datosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = datosUsuario;
        next();

    } catch (error) {
        return res.status(401).json({
            error: 'El token es inválido o ha expirado'
        });
    }
}


// Comprueba que el usuario autenticado tenga uno de los roles autorizados
function verificarRolAutenticado(rolesPermitidos) {
    return function (req, res, next) {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Debe autenticarse para continuar'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: 'No tiene permisos para acceder a este recurso'
            });
        }

        next();
    };
}


// Comprueba el rol enviado, se utiliza en las rutas de gestión de usuarios y roles.
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



/* Resumen de equipos para la página de Inicio */
app.get('/api/resumen', async (req, res) => {
    try {
        const consulta = `
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (
                    WHERE estado = 'Disponible'
                ) AS disponibles,
                COUNT(*) FILTER (
                    WHERE estado = 'En uso'
                ) AS en_uso,
                COUNT(*) FILTER (
                    WHERE estado = 'En mantenimiento'
                ) AS en_mantenimiento,
                COUNT(*) FILTER (
                    WHERE estado = 'Fuera de servicio'
                ) AS fuera_de_servicio
            FROM equipo
        `;

        const resultado = await pool.query(consulta);

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error('Error al obtener el resumen:', error);

        res.status(500).json({
            error: 'Error al obtener el resumen de equipos'
        });
    }
});


// Consulta los equipos registrados y permite aplicar una búsqueda por texto y filtros por tipo y estado.
app.get('/api/equipos', async (req, res) => {

    try {

        const { buscar, tipo, estado } = req.query;

        // Construye la consulta SQL y almacena los valores de los filtros para enviarlos como parámetros y evitar concatenar datos del usuario.
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

        // Ordena los equipos desde el registro más reciente hasta el más antiguo.
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

// Consulta un equipo específico mediante su identificador.
app.get('/api/equipos/:id', async (req, res) =>{
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM equipo WHERE id_equipo = $1', [id]);

    res.json(result.rows);
});

// Define los roles autorizados para gestionar equipos y los estados válidos.
const ROLES_GESTION_EQUIPOS = ['Administrador', 'Coordinacion', 'Area encargada'];
const ESTADOS_EQUIPO = ['Disponible', 'En uso', 'En mantenimiento', 'Fuera de servicio'];

//Editar un registro
// Actualiza un equipo, registra los datos anteriores y nuevos en la auditoría
app.put('/api/equipos/:id', verificarToken, verificarRolAutenticado(ROLES_GESTION_EQUIPOS), async (req, res) => {
    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
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

        if (!ESTADOS_EQUIPO.includes(estado)) {
            return res.status(400).json({
                error: 'El estado del equipo no es válido'
            });
        }

        await client.query('BEGIN');
        transaccionIniciada = true;

        // 1. Consultar los datos anteriores del equipo
        const resultadoAnterior = await client.query(
            'SELECT * FROM equipo WHERE id_equipo = $1 FOR UPDATE',
            [id]
        );

        if (resultadoAnterior.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                error: 'No se encontró el equipo'
            });
        }

        const equipoAnterior = resultadoAnterior.rows[0];

        // 2. Actualizar el equipo
        const resultadoNuevo = await client.query(
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

        const equipoNuevo = resultadoNuevo.rows[0];

        // 3. Guardar los datos anteriores y nuevos
        await client.query(
            `INSERT INTO auditoria
             (id_usuario, id_equipo, accion, detalles)
             VALUES ($1, $2, $3, $4::jsonb)`,
            [
                req.usuario.id_usuario,
                equipoNuevo.id_equipo,
                'EDITAR',
                JSON.stringify({
                    antes: equipoAnterior,
                    despues: equipoNuevo
                })
            ]
        );

        // 4. Confirmar los cambios
        await client.query('COMMIT');
        transaccionIniciada = false;

        res.status(200).json({
            mensaje: 'Equipo actualizado correctamente',
            equipo: equipoNuevo
        });

    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK');
        }

        console.error('Error al actualizar el equipo:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El código o serial del equipo ya existe'
            });
        }

        res.status(500).json({
            error: 'Error al actualizar el equipo'
        });

    } finally {
        client.release();
    }
});


//Eliminar un registro
app.delete('/api/equipos/:id', verificarToken, verificarRolAutenticado(ROLES_GESTION_EQUIPOS), async (req, res) => {
    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        const id = req.params.id;

        await client.query('BEGIN');
        transaccionIniciada = true;

        // 1. Consultar el equipo antes de eliminarlo
        const resultado = await client.query(
            'SELECT * FROM equipo WHERE id_equipo = $1 FOR UPDATE',
            [id]
        );

        if (resultado.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                error: 'No se encontró el equipo'
            });
        }

        const equipo = resultado.rows[0];

        // 2. Guardar la auditoría antes de eliminar
        await client.query(
            `INSERT INTO auditoria
             (id_usuario, id_equipo, accion, detalles)
             VALUES ($1, $2, $3, $4::jsonb)`,
            [
                req.usuario.id_usuario,
                equipo.id_equipo,
                'ELIMINAR',
                JSON.stringify({
                    codigo: equipo.codigo,
                    nombre: equipo.nombre,
                    tipo: equipo.tipo,
                    marca: equipo.marca,
                    modelo: equipo.modelo,
                    serial: equipo.serial,
                    estado: equipo.estado,
                    ubicacion: equipo.ubicacion,
                    observaciones: equipo.observaciones
                })
            ]
        );

        // 3. Eliminar el equipo
        await client.query(
            'DELETE FROM equipo WHERE id_equipo = $1',
            [id]
        );

        // 4. Confirmar ambas operaciones
        await client.query('COMMIT');
        transaccionIniciada = false;

        res.status(200).json({
            mensaje: 'Equipo eliminado correctamente'
        });

    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK');
        }

        console.error('Error al eliminar el equipo:', error.message);

        res.status(500).json({
            error: 'Error al eliminar el equipo'
        });

    } finally {
        client.release();
    }
});


// Registra un equipo nuevo y guarda la operación en la auditoría.
app.post('/api/equipos', verificarToken, verificarRolAutenticado(ROLES_GESTION_EQUIPOS), async (req, res) => {
    const client = await pool.connect();

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

        if (!ESTADOS_EQUIPO.includes(estado)) {
            return res.status(400).json({
                error: 'El estado del equipo no es válido'
            });
        }

        await client.query('BEGIN');

        // 1. Registrar el equipo
        const resultadoEquipo = await client.query(
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

        const equipo = resultadoEquipo.rows[0];

        // 2. Registrar la acción en la auditoría
        await client.query(
            `INSERT INTO auditoria
            (id_usuario, id_equipo, accion, detalles)
            VALUES ($1, $2, $3, $4::jsonb)`,
            [
                req.usuario.id_usuario,
                equipo.id_equipo,
                'INSERTAR',
                JSON.stringify({
                    codigo: equipo.codigo,
                    nombre: equipo.nombre,
                    tipo: equipo.tipo,
                    marca: equipo.marca,
                    modelo: equipo.modelo,
                    serial: equipo.serial,
                    estado: equipo.estado,
                    ubicacion: equipo.ubicacion,
                    observaciones: equipo.observaciones
                })
            ]
        );

        // 3. Confirmar ambas operaciones
        await client.query('COMMIT');

        res.status(201).json({
            mensaje: 'Equipo registrado correctamente',
            equipo
        });

    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Error al registrar equipo:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El código o serial del equipo ya existe'
            });
        }

        res.status(500).json({
            error: 'Error al registrar el equipo'
        });

    } finally {
        client.release();
    }
});

// Solo el Administrador puede ver y crear usuarios
const ROLES_ADMIN = ['Administrador'];


// Permite al administrador consultar el historial de operaciones
app.get(
    '/api/auditoria',
    verificarToken,
    verificarRolAutenticado(ROLES_ADMIN),
    async (req, res) => {
        try {
            const resultado = await pool.query(
                `SELECT
                    a.id_auditoria,
                    a.id_usuario,
                    u.nombre AS usuario_nombre,
                    u.correo AS usuario_correo,
                    a.id_equipo,
                    a.accion,
                    a.fecha_hora,
                    a.detalles
                 FROM auditoria a
                 LEFT JOIN usuario u
                    ON u.id_usuario = a.id_usuario
                 ORDER BY a.fecha_hora DESC,
                          a.id_auditoria DESC`
            );

            res.status(200).json(resultado.rows);

        } catch (error) {
            console.error(
                'Error al consultar la auditoría:',
                error.message
            );

            res.status(500).json({
                error: 'Error al consultar el historial de auditoría'
            });
        }
    }
);



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

        
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            token,
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


