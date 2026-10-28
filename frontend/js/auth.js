// Define las claves utilizadas para la sesión y las peticiones al servidor.
const CLAVE_SESION = 'ibisUsuario';
const URL_API = 'https://ibis-aaq7.onrender.com';


/** Devuelve el usuario con sesión iniciada, o null si no hay sesión. */
function obtenerSesion() {

    // Recupera los datos de la sesión almacenada en el navegador.
    const datos = localStorage.getItem(CLAVE_SESION);

    if (!datos) {
        return null;
    }

    // Convierte los datos almacenados en un objeto.
    try {
        return JSON.parse(datos);
    } catch (error) {
        return null;
    }
}

/*Guarda la sesión del usuario que acaba de iniciar sesión. */
function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

/*Cierra la sesión actual y regresa a la pantalla de login. */
function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = 'login.html';
}

/*Headers listos para usar en fetch() en las peticiones que necesitan identificar el rol del usuario*/
function headersConSesion() {

    const sesion = obtenerSesion();

    // Prepara los encabezados necesarios para las peticiones autenticadas.
    return {
        'Content-Type': 'application/json',
        'x-user-role': sesion ? sesion.rol : '',
        'Authorization': sesion && sesion.token
            ? `Bearer ${sesion.token}`
            : ''
    };

}

/*Oculta todo elemento con el atributo data-roles cuyo rol actual no esté incluido en la lista*/
function aplicarPermisosUI() {

    const sesion = obtenerSesion();

    if (!sesion) {
        return;
    }

    // Recorre los elementos que tienen permisos asociados a roles.
    document.querySelectorAll('[data-roles]').forEach(function (elemento) {

        const rolesPermitidos = elemento
            .getAttribute('data-roles')
            .split(',')
            .map(r => r.trim());

            // Oculta los elementos que no corresponden al rol de la sesión.
        if (!rolesPermitidos.includes(sesion.rol)) {
            elemento.style.display = 'none';
        }
    });
}

/** Inserta el bloque de "usuario conectado" + botón de cerrar sesión. */
function mostrarInfoSesion() {

    const sesion = obtenerSesion();
    const contenedor = document.getElementById('sesionInfo');

    if (!sesion || !contenedor) {
        return;
    }

    // Muestra el nombre, el rol y el botón para cerrar sesión.
    contenedor.innerHTML = `
        <div class="sesion-usuario">
            <span class="sesion-nombre">${sesion.nombre}</span>
            <span class="sesion-rol">${sesion.rol}</span>
        </div>
        <button type="button" id="btnCerrarSesion" class="boton-cerrar-sesion">
            Cerrar sesión
        </button>
    `;

    // Asocia el botón con la función de cierre de sesión.
    document
        .getElementById('btnCerrarSesion')
        .addEventListener('click', cerrarSesion);
}


// Identifica el formulario de inicio de sesión, si existe en la página.
const formularioLogin = document.getElementById('formLogin');

if (formularioLogin) {

    // Si ya hay una sesión activa no muestra el login de nuevo
    if (obtenerSesion()) {
        window.location.href = 'index.html';
    }

    // Procesa las credenciales ingresadas y solicita la autenticación al servidor.
    formularioLogin.addEventListener('submit', async function (event) {

        event.preventDefault();

        const correo = document.getElementById('correo').value.trim();
        const contrasena = document.getElementById('contrasena').value;
        const mensaje = document.getElementById('mensajeLogin');

        mensaje.hidden = true;

        try {

            // Envía el correo y la contraseña al servicio de autenticación.
            const respuesta = await fetch(URL_API + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            const resultado = await respuesta.json();

            // Muestra el mensaje recibido si las credenciales no son válidas.
            if (!respuesta.ok) {
                mensaje.textContent = resultado.error || 'No se pudo iniciar sesión';
                mensaje.hidden = false;
                return;
            }

            // Guarda los datos del usuario y el token de autenticación.
            guardarSesion({
                ...resultado.usuario, token: resultado.token
            });
            window.location.href = 'index.html';

            // Informa si ocurre un error de conexión con el servidor.
        } catch (error) {

            console.error('Error al iniciar sesión:', error);
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.hidden = false;
        }

    });

} else {
    // Redirige al login cuando no existe una sesión activa.
    if (!obtenerSesion()) {

        window.location.href = 'login.html';

    } else {
        // Muestra la sesión y aplica los permisos cuando la página está lista.
        document.addEventListener('DOMContentLoaded', function () {
            mostrarInfoSesion();
            aplicarPermisosUI();
        });
    }
}
