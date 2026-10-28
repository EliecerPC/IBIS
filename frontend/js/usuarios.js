// Define la dirección del servidor para las operaciones con usuarios.
const URL_API_USUARIOS = 'https://ibis-aaq7.onrender.com';

// Obtiene los datos del usuario que tiene la sesión activa.
const sesionUsuarios = obtenerSesion();

if (sesionUsuarios && sesionUsuarios.rol !== 'Administrador') {

    alert('No tiene permisos para acceder a la gestión de usuarios.');
    window.location.href = 'index.html';
}

// Identifica el formulario, el selector de roles y la tabla de usuarios.
const formularioUsuario = document.getElementById('formUsuario');
const selectRol = document.getElementById('id_rol');
const cuerpoTablaUsuarios = document.getElementById('cuerpoTablaUsuarios');

// Consulta los roles disponibles para asignarlos a nuevos usuarios.
async function cargarRoles() {

    try {

        // Solicita los roles al servidor utilizando los datos de la sesión.
        const respuesta = await fetch(URL_API_USUARIOS + '/api/roles', {
            headers: headersConSesion()
        });

        const roles = await respuesta.json();

        if (!respuesta.ok) {
            console.error('Error al cargar roles:', roles.error);
            return;
        }

        // Genera las opciones del selector con los roles recibidos.
        selectRol.innerHTML =
            '<option value="">Seleccione un rol...</option>' +
            roles.map(r => `<option value="${r.id_rol}">${r.nombre}</option>`).join('');

    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

// Consulta los usuarios registrados para mostrarlos en la tabla.
async function cargarUsuarios() {

    try {

        // Solicita la lista de usuarios al servidor.
        const respuesta = await fetch(URL_API_USUARIOS + '/api/usuarios', {
            headers: headersConSesion()
        });

        const usuarios = await respuesta.json();

        if (!respuesta.ok) {
            console.error('Error al cargar usuarios:', usuarios.error);
            return;
        }

        // Limpia la tabla antes de mostrar los resultados actualizados.
        cuerpoTablaUsuarios.textContent = '';

        // Recorre los usuarios para construir las filas de la tabla.
        usuarios.forEach(function (usuario) {

            const fila = document.createElement('tr');

            // Crea las celdas con el nombre, correo y rol de cada usuario.
            const celdaNombre = document.createElement('td');
            celdaNombre.textContent = usuario.nombre;
            fila.appendChild(celdaNombre);

            const celdaCorreo = document.createElement('td');
            celdaCorreo.textContent = usuario.correo;
            fila.appendChild(celdaCorreo);

            const celdaRol = document.createElement('td');
            celdaRol.textContent = usuario.rol;
            fila.appendChild(celdaRol);

            cuerpoTablaUsuarios.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// Procesa el formulario para registrar un nuevo usuario.
formularioUsuario.addEventListener('submit', async function (event) {

    event.preventDefault();

    // Recopila los datos ingresados y los organiza en un objeto.
    const datos = new FormData(formularioUsuario);
    const usuario = Object.fromEntries(datos.entries());

    try {

        // Envía los datos del nuevo usuario al servidor.
        const respuesta = await fetch(URL_API_USUARIOS + '/api/usuarios', {
            method: 'POST',
            headers: headersConSesion(),
            body: JSON.stringify(usuario)
        });

        const resultado = await respuesta.json();

        // Confirma el registro y actualiza la tabla de usuarios.
        if (respuesta.ok) {

            alert(resultado.mensaje);
            formularioUsuario.reset();
            cargarUsuarios();

        } else {

            alert('Error: ' + resultado.error);
        }

        // Informa si ocurre un error durante el registro del usuario.
    } catch (error) {

        console.error('Error al registrar usuario:', error);
        alert('No se pudo conectar con el servidor');
    }

});

// Carga los roles disponibles y los usuarios al abrir la página.
cargarRoles();
cargarUsuarios();
