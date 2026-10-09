console.log("Frontend de IBIS funcionando");

const formulario = document.getElementById('formEquipo');
const botonFormulario = document.getElementById('btnGuardar');
const tituloFormulario = document.getElementById('id_h2');

let idEditando = null;

if (formulario) {

    // Defensa adicional: si alguien sin permisos llega a esta página
    // escribiendo la URL directamente (el enlace del menú ya está
    // oculto para su rol), lo devolvemos al listado de consulta.
    const sesionActual = obtenerSesion();

    if (sesionActual && sesionActual.rol === 'Estudiante') {

        alert('No tiene permisos para registrar o editar equipos.');
        window.location.href = 'consultar.html';
    }

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get('id');

    if (id) {
        idEditando = id;

        botonFormulario.textContent = "Actualizar equipo";
        tituloFormulario.textContent = "Editar equipo";

        cargarEquipoParaEditar(id);
    }


    formulario.addEventListener('submit', async function(event) {

        event.preventDefault();

        const datos = new FormData(formulario);

        const equipo = Object.fromEntries(datos.entries());

        let metodo;
        let url;

        if (idEditando === null) {

            metodo = "POST";
            url = 'http://localhost:3000/api/equipos';

            console.log("Registrar");

        } else {

            metodo = "PUT";
            url = 'http://localhost:3000/api/equipos/' + idEditando;

            console.log("Editar");
        }


        try {

            const respuesta = await fetch(url, {

                method: metodo,

                headers: headersConSesion(),

                body: JSON.stringify(equipo)

            });


            const resultado = await respuesta.json();


            if (respuesta.ok) {

                alert(resultado.mensaje);

                formulario.reset();

                idEditando = null;

                botonFormulario.textContent = "Guardar equipo";
                tituloFormulario.textContent = "Registrar equipo";

            } else {

                alert('Error: ' + resultado.error);

            }


        } catch (error) {

            console.error('Error de conexión:', error);

            alert('No se pudo conectar con el servidor');

        }

    });

}


async function cargarEquipoParaEditar(id) {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/equipos/' + id
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.length === 0) {

            alert('No se encontró el equipo.');

            return;
        }


        const equipo = resultado[0];


        document.getElementById('codigo').value =
            equipo.codigo || '';

        document.getElementById('nombre').value =
            equipo.nombre || '';

        document.getElementById('tipo').value =
            equipo.tipo || '';

        document.getElementById('marca').value =
            equipo.marca || '';

        document.getElementById('modelo').value =
            equipo.modelo || '';

        document.getElementById('serial').value =
            equipo.serial || '';

        document.getElementById('estado').value =
            equipo.estado || '';

        document.getElementById('ubicacion').value =
            equipo.ubicacion || '';

        document.getElementById('observaciones').value =
            equipo.observaciones || '';


        console.log('Equipo cargado para editar:', equipo);


    } catch (error) {

        console.error(
            'Error al cargar el equipo:',
            error
        );

        alert('No se pudo cargar el equipo.');

    }

}


const listaEquipos = document.getElementById('listaEquipos');
const cuerpoTabla = document.getElementById('cuerpoTabla');

const campoBuscar = document.getElementById('buscar');
const botonBuscar = document.getElementById('btnBuscar');
const filtroTipo = document.getElementById('filtroTipo');
const filtroEstado = document.getElementById('filtroEstado');
const botonLimpiarFiltros = document.getElementById('btnLimpiarFiltros');



function debounce(fn, espera) {

    let temporizador;

    return function (...args) {

        clearTimeout(temporizador);

        temporizador = setTimeout(
            () => fn(...args),
            espera
        );

    };
}



function actualizarOpcionesFiltro(equipos) {

    if (!filtroTipo || !filtroEstado) {
        return;
    }


    const tiposUnicos = [
        ...new Set(
            equipos
                .map(e => e.tipo)
                .filter(Boolean)
        )
    ].sort();


    const estadosUnicos = [
        ...new Set(
            equipos
                .map(e => e.estado)
                .filter(Boolean)
        )
    ].sort();


    const tipoSeleccionado = filtroTipo.value;
    const estadoSeleccionado = filtroEstado.value;


    filtroTipo.innerHTML =
        '<option value="">Todos</option>' +
        tiposUnicos
            .map(t => `<option value="${t}">${t}</option>`)
            .join('');


    filtroEstado.innerHTML =
        '<option value="">Todos</option>' +
        estadosUnicos
            .map(e => `<option value="${e}">${e}</option>`)
            .join('');



    if (tiposUnicos.includes(tipoSeleccionado)) {
        filtroTipo.value = tipoSeleccionado;
    }


    if (estadosUnicos.includes(estadoSeleccionado)) {
        filtroEstado.value = estadoSeleccionado;
    }

}


async function cargarEquipos() {

    if (
        !campoBuscar ||
        !filtroTipo ||
        !filtroEstado ||
        !cuerpoTabla
    ) {
        return;
    }


    const params = new URLSearchParams();


    if (campoBuscar.value.trim()) {

        params.append('buscar',campoBuscar.value.trim());

    }


    if (filtroTipo.value) {

        params.append('tipo',filtroTipo.value);

    }


    if (filtroEstado.value) {

        params.append('estado',filtroEstado.value
        );

    }


    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/equipos?' +
            params.toString()
        );


        const equipos = await respuesta.json();


        renderizarTabla(equipos);


        return equipos;


    } catch (error) {

        console.error(
            'Error al cargar los equipos:',
            error
        );

    }

}

async function actualizarFiltrosDisponibles() {

    if (!filtroTipo || !filtroEstado) {
        return;
    }


    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/equipos'
        );


        const todos = await respuesta.json();


        actualizarOpcionesFiltro(todos);


    } catch (error) {

        console.error(
            'Error al actualizar los filtros:',
            error
        );

    }

}


function renderizarTabla(equipos) {

    if (!cuerpoTabla) {
        return;
    }


    cuerpoTabla.textContent = '';


    if (equipos.length === 0) {

        const fila = document.createElement('tr');

        const celda = document.createElement('td');

        celda.colSpan = 9;

        celda.textContent ='No se encontraron equipos con esos criterios.';

        celda.style.textAlign = 'center';

        fila.appendChild(celda);

        cuerpoTabla.appendChild(fila);

        return;
    }



    equipos.forEach(function(equipo) {

        const fila = document.createElement('tr');


        /* Código */

        const celdaCodigo =
            document.createElement('td');

        celdaCodigo.textContent =
            equipo.codigo;

        fila.appendChild(celdaCodigo);


        /* Nombre */

        const celdaNombre =
            document.createElement('td');

        celdaNombre.textContent =
            equipo.nombre;

        fila.appendChild(celdaNombre);


        /* Tipo */

        const celdaTipo =
            document.createElement('td');

        celdaTipo.textContent =
            equipo.tipo;

        fila.appendChild(celdaTipo);


        /* Marca */

        const celdaMarca =
            document.createElement('td');

        celdaMarca.textContent =
            equipo.marca;

        fila.appendChild(celdaMarca);


        /* Modelo */

        const celdaModelo =
            document.createElement('td');

        celdaModelo.textContent =
            equipo.modelo;

        fila.appendChild(celdaModelo);


        /* Estado */

        const celdaEstado =
            document.createElement('td');

        celdaEstado.textContent =
            equipo.estado;

        fila.appendChild(celdaEstado);


        /* Ubicación */

        const celdaUbicacion =
            document.createElement('td');

        celdaUbicacion.textContent =
            equipo.ubicacion;

        fila.appendChild(celdaUbicacion);


        /* Observaciones */

        const celdaObservaciones =
            document.createElement('td');

        celdaObservaciones.textContent =
            equipo.observaciones;

        fila.appendChild(celdaObservaciones);


        /* Acciones */

        const celdaAcciones =
            document.createElement('td');


        // Solo Administrador, Coordinacion y Area encargada pueden
        // editar o eliminar equipos (ver permisos en el backend).
        const sesion = obtenerSesion();

        const puedeGestionar =
            sesion &&
            ['Administrador', 'Coordinacion', 'Area encargada'].includes(sesion.rol);

        if (!puedeGestionar) {

            celdaAcciones.textContent = '—';
            fila.appendChild(celdaAcciones);
            cuerpoTabla.appendChild(fila);
            return;
        }


        /*Botón Editar*/

        const botonEditar =
            document.createElement('button');

        botonEditar.textContent =
            "Editar";

        botonEditar.dataset.id =
            equipo.id_equipo;

        celdaAcciones.appendChild(
            botonEditar
        );


        /*Botón Eliminar*/

        const botonEliminar =
            document.createElement('button');

        botonEliminar.textContent =
            "Eliminar";

        botonEliminar.dataset.id =
            equipo.id_equipo;

        celdaAcciones.appendChild(
            botonEliminar
        );


        fila.appendChild(celdaAcciones);



        botonEditar.addEventListener(
            'click',
            function(event) {

                const id =
                    event.target.dataset.id;


                window.location.href =
                    'formulario.html?id=' + id;

            }
        );


        botonEliminar.addEventListener(
            'click',
            async function(event) {

                const id =
                    event.target.dataset.id;


                const confirmar =
                    confirm(
                        "¿Está seguro de eliminar este equipo?"
                    );


                if (confirmar === true) {

                    try {

                        const respuesta =
                            await fetch(
                                'http://localhost:3000/api/equipos/' +
                                id,
                                {
                                    method: "DELETE",
                                    headers: headersConSesion()
                                }
                            );


                        const resultado =
                            await respuesta.json();


                        if (respuesta.ok) {

                            alert(
                                resultado.mensaje
                            );


                            const fila =
                                event.target
                                    .parentElement
                                    .parentElement;

                            fila.remove();


                            actualizarFiltrosDisponibles();

                        } else {

                            alert(
                                'Error: ' +
                                resultado.error
                            );

                        }


                    } catch (error) {

                        console.error(
                            'Error al eliminar:',
                            error
                        );

                        alert(
                            'No se pudo eliminar el equipo.'
                        );

                    }

                }

            }
        );


        cuerpoTabla.appendChild(fila);

    });

}



if (
    campoBuscar &&
    botonBuscar &&
    filtroTipo &&
    filtroEstado &&
    botonLimpiarFiltros
) {



    botonBuscar.addEventListener(
        'click',
        cargarEquipos
    );



    campoBuscar.addEventListener(
        'input',
        debounce(
            cargarEquipos,
            400
        )
    );


    campoBuscar.addEventListener(
        'keydown',
        function(event) {

            if (event.key === 'Enter') {

                event.preventDefault();

                cargarEquipos();

            }

        }
    );


    filtroTipo.addEventListener(
        'change',
        cargarEquipos
    );


    filtroEstado.addEventListener(
        'change',
        cargarEquipos
    );



    botonLimpiarFiltros.addEventListener(
        'click',
        function() {

            campoBuscar.value = '';

            filtroTipo.value = '';

            filtroEstado.value = '';

            cargarEquipos();

        }
    );



    actualizarFiltrosDisponibles();

    cargarEquipos();

}

/* Cargar los contadores de la página de Inicio */
async function cargarResumen() {
    const total = document.getElementById('totalEquipos');

    // Si no estamos en Inicio, no hay contadores que actualizar.
    if (!total) {
        return;
    }

    try {
        const respuesta = await fetch(
            'http://localhost:3000/api/resumen'
        );

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el resumen');
        }

        const resumen = await respuesta.json();

        total.textContent = resumen.total;
        document.getElementById('equiposDisponibles').textContent =
            resumen.disponibles;
        document.getElementById('equiposEnUso').textContent =
            resumen.en_uso;
        document.getElementById('equiposMantenimiento').textContent =
            resumen.en_mantenimiento;
        document.getElementById('equiposFueraServicio').textContent =
            resumen.fuera_de_servicio;

    } catch (error) {
        console.error('Error al cargar el resumen:', error);
    }
}

cargarResumen();
