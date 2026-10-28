// Define la dirección del servicio de auditoría.
const URL_API_AUDITORIA = 'https://ibis-aaq7.onrender.com/api/auditoria';

// Organiza los detalles de cada operación para mostrarlos en la tabla.
function generarDetallesLegibles(registro) {
    const detalles = registro.detalles || {};

    // Las operaciones de edición tienen datos anteriores y nuevos.
    if (registro.accion === 'EDITAR') {
        const antes = detalles.antes || {};
        const despues = detalles.despues || {};

        // Asigna nombres legibles a los campos del equipo.
        const nombresCampos = {
            codigo: 'Código',
            nombre: 'Nombre',
            tipo: 'Tipo',
            marca: 'Marca',
            modelo: 'Modelo',
            serial: 'Serial',
            estado: 'Estado',
            ubicacion: 'Ubicación',
            observaciones: 'Observaciones'
        };

        // Identifica los campos cuyos valores fueron modificados.
        const cambios = Object.keys(nombresCampos)
            .filter(campo => antes[campo] !== despues[campo]);

        if (cambios.length === 0) {
            return 'No se detectaron cambios en los campos.';
        }

        return cambios.map(campo => {
            const anterior = antes[campo] ?? 'Sin dato';
            const nuevo = despues[campo] ?? 'Sin dato';

            return `${nombresCampos[campo]}: ${anterior} → ${nuevo}`;
        }).join('\n');
    }

    // Organiza los datos del equipo en operaciones de registro o eliminación.
    return Object.entries(detalles)
        .filter(([campo]) => campo !== 'id_equipo')
        .map(([campo, valor]) => `${campo}: ${valor ?? 'Sin dato'}`)
        .join('\n');
}

// Consulta el historial de operaciones y lo muestra en la tabla.
async function cargarAuditoria() {
    const mensaje = document.getElementById('mensajeAuditoria');
    const cuerpoTabla = document.getElementById('cuerpoAuditoria');

    try {
        // Solicita el historial al servidor con los datos de la sesión.
        const respuesta = await fetch(URL_API_AUDITORIA, {
            headers: headersConSesion()
        });

        const datos = await respuesta.json();

        // Comprueba si la consulta se realizó correctamente.
        if (!respuesta.ok) {
            throw new Error(
                datos.error || 'No se pudo cargar el historial'
            );
        }

        cuerpoTabla.innerHTML = '';

        if (datos.length === 0) {
            mensaje.textContent = 'No hay operaciones registradas.';
            return;
        }

        // Recorre los registros para construir las filas de la tabla.
        datos.forEach(registro => {
            const fila = document.createElement('tr');

            const fecha = new Date(registro.fecha_hora);

            
        const detallesRegistro = registro.detalles || {};

            // Obtiene los datos del equipo según el tipo de operación.
            const equipo = detallesRegistro.despues
                || detallesRegistro.antes
                || detallesRegistro;

            // Construye la identificación del equipo para mostrarla en el historial.
            let nombreEquipo = equipo.codigo || '';

            if (equipo.nombre) {
                nombreEquipo += nombreEquipo
                    ? ` - ${equipo.nombre}`
                    : equipo.nombre;
            }

            if (!nombreEquipo && equipo.id_equipo) {
                nombreEquipo = `ID: ${equipo.id_equipo}`;
            }

            if (!nombreEquipo && registro.id_equipo !== null) {
                nombreEquipo = `ID: ${registro.id_equipo}`;
            }

            if (!nombreEquipo) {
                nombreEquipo = 'Equipo eliminado';
            }


            const detalles = generarDetallesLegibles(registro);

            // Construye la identificación del equipo para mostrarla en el historial.
            const valores = [
                fecha.toLocaleString('es-CO'),
                registro.usuario_nombre || 'Usuario desconocido',
                registro.accion,
                nombreEquipo,
                detalles
            ];

            // Crea las celdas y agrega los datos de cada registro.
            valores.forEach((valor, indice) => {
                const celda = document.createElement('td');

                celda.textContent = valor;

                // Conserva los saltos de línea de la columna Detalles.
                if (indice === 4) {
                    celda.style.whiteSpace = 'pre-line';
                }

                fila.appendChild(celda);
            });


            cuerpoTabla.appendChild(fila);
        });

        // Muestra la cantidad de operaciones encontradas.
        mensaje.textContent = `Operaciones registradas: ${datos.length}`;

        // Informa los errores que ocurran al consultar el historial.
    } catch (error) {
        console.error('Error al cargar auditoría:', error);
        mensaje.textContent = error.message;
    }
}

// Carga el historial cuando el documento está listo.
document.addEventListener('DOMContentLoaded', cargarAuditoria);
