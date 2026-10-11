
const URL_API_AUDITORIA = 'http://localhost:3000/api/auditoria';


function generarDetallesLegibles(registro) {
    const detalles = registro.detalles || {};

    // Las operaciones de edición tienen datos anteriores y nuevos.
    if (registro.accion === 'EDITAR') {
        const antes = detalles.antes || {};
        const despues = detalles.despues || {};

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

    // Para insertar o eliminar, mostrar los datos del equipo.
    return Object.entries(detalles)
        .filter(([campo]) => campo !== 'id_equipo')
        .map(([campo, valor]) => `${campo}: ${valor ?? 'Sin dato'}`)
        .join('\n');
}


async function cargarAuditoria() {
    const mensaje = document.getElementById('mensajeAuditoria');
    const cuerpoTabla = document.getElementById('cuerpoAuditoria');

    try {
        const respuesta = await fetch(URL_API_AUDITORIA, {
            headers: headersConSesion()
        });

        const datos = await respuesta.json();

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

        datos.forEach(registro => {
            const fila = document.createElement('tr');

            const fecha = new Date(registro.fecha_hora);

            
        const detallesRegistro = registro.detalles || {};

            
            const equipo = detallesRegistro.despues
                || detallesRegistro.antes
                || detallesRegistro;

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

            const valores = [
                fecha.toLocaleString('es-CO'),
                registro.usuario_nombre || 'Usuario desconocido',
                registro.accion,
                nombreEquipo,
                detalles
            ];

            
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

        mensaje.textContent = `Operaciones registradas: ${datos.length}`;

    } catch (error) {
        console.error('Error al cargar auditoría:', error);
        mensaje.textContent = error.message;
    }
}

document.addEventListener('DOMContentLoaded', cargarAuditoria);
