// =============================================
// GESTIÓN DE USUARIOS - solo rol Administrador
// =============================================

const URL_API_USUARIOS = 'http://localhost:3000';

// Defensa adicional: aunque el enlace del menú está oculto para
// quien no es Administrador, si alguien escribe la URL directamente
// lo sacamos de esta página.
const sesionUsuarios = obtenerSesion();

if (sesionUsuarios && sesionUsuarios.rol !== 'Administrador') {

    alert('No tiene permisos para acceder a la gestión de usuarios.');
    window.location.href = 'index.html';
}

const formularioUsuario = document.getElementById('formUsuario');
const selectRol = document.getElementById('id_rol');
const cuerpoTablaUsuarios = document.getElementById('cuerpoTablaUsuarios');

async function cargarRoles() {

    try {

        const respuesta = await fetch(URL_API_USUARIOS + '/api/roles', {
            headers: headersConSesion()
        });

        const roles = await respuesta.json();

        if (!respuesta.ok) {
            console.error('Error al cargar roles:', roles.error);
            return;
        }

        selectRol.innerHTML =
            '<option value="">Seleccione un rol...</option>' +
            roles.map(r => `<option value="${r.id_rol}">${r.nombre}</option>`).join('');

    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

async function cargarUsuarios() {

    try {

        const respuesta = await fetch(URL_API_USUARIOS + '/api/usuarios', {
            headers: headersConSesion()
        });

        const usuarios = await respuesta.json();

        if (!respuesta.ok) {
            console.error('Error al cargar usuarios:', usuarios.error);
            return;
        }

        cuerpoTablaUsuarios.textContent = '';

        usuarios.forEach(function (usuario) {

            const fila = document.createElement('tr');

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

formularioUsuario.addEventListener('submit', async function (event) {

    event.preventDefault();

    const datos = new FormData(formularioUsuario);
    const usuario = Object.fromEntries(datos.entries());

    try {

        const respuesta = await fetch(URL_API_USUARIOS + '/api/usuarios', {
            method: 'POST',
            headers: headersConSesion(),
            body: JSON.stringify(usuario)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {

            alert(resultado.mensaje);
            formularioUsuario.reset();
            cargarUsuarios();

        } else {

            alert('Error: ' + resultado.error);
        }

    } catch (error) {

        console.error('Error al registrar usuario:', error);
        alert('No se pudo conectar con el servidor');
    }

});

cargarRoles();
cargarUsuarios();
