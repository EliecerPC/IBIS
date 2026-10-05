// =============================================
// AUTENTICACIÓN Y CONTROL DE SESIÓN - IBIS
// =============================================
//
// Este archivo se incluye en TODAS las páginas (antes que app.js).
// Se encarga de:
//   1. Manejar el formulario de login (solo existe en login.html).
//   2. Proteger el resto de páginas: si no hay sesión iniciada,
//      redirige a login.html.
//   3. Mostrar el nombre/rol del usuario y el botón de cerrar sesión
//      en la barra lateral.
//   4. Ocultar los elementos del menú o de la interfaz que el rol
//      actual no tiene permitido usar (data-roles="...").
//
// La sesión se guarda en localStorage, bajo la clave "ibisUsuario",
// como un objeto { id_usuario, nombre, correo, id_rol, rol }.

const CLAVE_SESION = 'ibisUsuario';
const URL_API = 'http://localhost:3000';

/** Devuelve el usuario con sesión iniciada, o null si no hay sesión. */
function obtenerSesion() {

    const datos = localStorage.getItem(CLAVE_SESION);

    if (!datos) {
        return null;
    }

    try {
        return JSON.parse(datos);
    } catch (error) {
        return null;
    }
}

/** Guarda la sesión del usuario que acaba de iniciar sesión. */
function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

/** Cierra la sesión actual y regresa a la pantalla de login. */
function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = 'login.html';
}

/**
 * Headers listos para usar en fetch() en las peticiones que
 * necesitan identificar el rol del usuario (POST/PUT/DELETE de
 * equipos, gestión de usuarios, etc.).
 */
function headersConSesion() {

    const sesion = obtenerSesion();

    return {
        'Content-Type': 'application/json',
        'x-user-role': sesion ? sesion.rol : ''
    };
}

/**
 * Oculta todo elemento con el atributo data-roles cuyo rol actual
 * no esté incluido en la lista (separada por comas). Por ejemplo:
 * <a data-roles="Administrador,Coordinacion">Agregar equipo</a>
 */
function aplicarPermisosUI() {

    const sesion = obtenerSesion();

    if (!sesion) {
        return;
    }

    document.querySelectorAll('[data-roles]').forEach(function (elemento) {

        const rolesPermitidos = elemento
            .getAttribute('data-roles')
            .split(',')
            .map(r => r.trim());

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

    contenedor.innerHTML = `
        <div class="sesion-usuario">
            <span class="sesion-nombre">${sesion.nombre}</span>
            <span class="sesion-rol">${sesion.rol}</span>
        </div>
        <button type="button" id="btnCerrarSesion" class="boton-cerrar-sesion">
            Cerrar sesión
        </button>
    `;

    document
        .getElementById('btnCerrarSesion')
        .addEventListener('click', cerrarSesion);
}

// ---------- Lógica propia de login.html ----------

const formularioLogin = document.getElementById('formLogin');

if (formularioLogin) {

    // Si ya hay una sesión activa, no tiene sentido ver el login de nuevo
    if (obtenerSesion()) {
        window.location.href = 'index.html';
    }

    formularioLogin.addEventListener('submit', async function (event) {

        event.preventDefault();

        const correo = document.getElementById('correo').value.trim();
        const contrasena = document.getElementById('contrasena').value;
        const mensaje = document.getElementById('mensajeLogin');

        mensaje.hidden = true;

        try {

            const respuesta = await fetch(URL_API + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                mensaje.textContent = resultado.error || 'No se pudo iniciar sesión';
                mensaje.hidden = false;
                return;
            }

            guardarSesion(resultado.usuario);
            window.location.href = 'index.html';

        } catch (error) {

            console.error('Error al iniciar sesión:', error);
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.hidden = false;
        }

    });

} else {

    // ---------- Protección del resto de páginas ----------
    // Cualquier página que no sea login.html requiere sesión iniciada.

    if (!obtenerSesion()) {

        window.location.href = 'login.html';

    } else {

        document.addEventListener('DOMContentLoaded', function () {
            mostrarInfoSesion();
            aplicarPermisosUI();
        });
    }
}
