console.log("Frontend de IBIS funcionando");

/*Capturar los datos del formulario*/
const formulario = document.getElementById('formEquipo');
const botonFormulario = document.getElementById('btnGuardar');
const tituloFormulario = document.getElementById('id_h2');

let idEditando = null;

formulario.addEventListener('submit', async function(event) {

    event.preventDefault();

    const datos = new FormData(formulario);

    const equipo = Object.fromEntries(datos.entries());

    let metodo;
    let url;

    if (idEditando === null){
        metodo = "POST";
        url = 'http://localhost:3000/api/equipos';
        console.log("Registrar");
    } else{
        metodo = "PUT";
        url = 'http://localhost:3000/api/equipos/' + idEditando;
        console.log("Editar");
    }

    try {

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(equipo)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {

            alert(resultado.mensaje);

            formulario.reset();

            idEditando = null;
            botonFormulario.textContent = "Guardar equipo";
            tituloFormulario.textContent = "Registrar equipo";

            actualizarFiltrosDisponibles();
            cargarEquipos();

        } else {

            alert('Error: ' + resultado.error);

        }

    } catch (error) {

        console.error('Error de conexión:', error);

        alert('No se pudo conectar con el servidor');

    }

});

const listaEquipos = document.getElementById('listaEquipos');
const cuerpoTabla = document.getElementById('cuerpoTabla');

const campoBuscar = document.getElementById('buscar');
const botonBuscar = document.getElementById('btnBuscar');
const filtroTipo = document.getElementById('filtroTipo');
const filtroEstado = document.getElementById('filtroEstado');
const botonLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

/* Evita disparar una consulta por cada tecla presionada */
function debounce(fn, espera) {
    let temporizador;
    return function (...args) {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => fn(...args), espera);
    };
}

/* Llena los selects de Tipo y Estado con los valores únicos existentes */
function actualizarOpcionesFiltro(equipos) {

    const tiposUnicos = [...new Set(equipos.map(e => e.tipo).filter(Boolean))].sort();
    const estadosUnicos = [...new Set(equipos.map(e => e.estado).filter(Boolean))].sort();

    const tipoSeleccionado = filtroTipo.value;
    const estadoSeleccionado = filtroEstado.value;

    filtroTipo.innerHTML = '<option value="">Todos</option>' +
        tiposUnicos.map(t => `<option value="${t}">${t}</option>`).join('');

    filtroEstado.innerHTML = '<option value="">Todos</option>' +
        estadosUnicos.map(e => `<option value="${e}">${e}</option>`).join('');

    // Conserva la selección previa si el valor sigue existiendo
    if (tiposUnicos.includes(tipoSeleccionado)) filtroTipo.value = tipoSeleccionado;
    if (estadosUnicos.includes(estadoSeleccionado)) filtroEstado.value = estadoSeleccionado;
}

/* Consulta el backend aplicando los filtros actuales y dibuja la tabla */
async function cargarEquipos() {

    const params = new URLSearchParams();

    if (campoBuscar.value.trim()) params.append('buscar', campoBuscar.value.trim());
    if (filtroTipo.value) params.append('tipo', filtroTipo.value);
    if (filtroEstado.value) params.append('estado', filtroEstado.value);

    const respuesta = await fetch('http://localhost:3000/api/equipos?' + params.toString());
    const equipos = await respuesta.json();

    renderizarTabla(equipos);

    return equipos;
}

/* Consulta sin filtros, solo para mantener actualizadas las opciones de Tipo/Estado */
async function actualizarFiltrosDisponibles() {
    const respuesta = await fetch('http://localhost:3000/api/equipos');
    const todos = await respuesta.json();
    actualizarOpcionesFiltro(todos);
}

function renderizarTabla(equipos) {

    cuerpoTabla.textContent = ''; //hacer que la tabla se limpie

    if (equipos.length === 0) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 9;
        celda.textContent = 'No se encontraron equipos con esos criterios.';
        celda.style.textAlign = 'center';
        fila.appendChild(celda);
        cuerpoTabla.appendChild(fila);
        return;
    }

    equipos.forEach(function(equipo){
        const fila = document.createElement('tr');

        const celdaCodigo = document.createElement('td');
        celdaCodigo.textContent = equipo.codigo;
        fila.appendChild(celdaCodigo);
        
        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = equipo.nombre;
        fila.appendChild(celdaNombre);

        const celdaTipo = document.createElement('td');
        celdaTipo.textContent = equipo.tipo;
        fila.appendChild(celdaTipo);

        const celdaMarca = document.createElement('td');
        celdaMarca.textContent = equipo.marca;
        fila.appendChild(celdaMarca);

        const celdaModelo = document.createElement('td');
        celdaModelo.textContent = equipo.modelo;
        fila.appendChild(celdaModelo);

        const celdaEstado = document.createElement('td');
        celdaEstado.textContent = equipo.estado;
        fila.appendChild(celdaEstado);

        const celdaUbicacion = document.createElement('td');
        celdaUbicacion.textContent = equipo.ubicacion;
        fila.appendChild(celdaUbicacion);

        const celdaObservaciones = document.createElement('td');
        celdaObservaciones.textContent = equipo.observaciones;
        fila.appendChild(celdaObservaciones);

        const celdaAcciones = document.createElement('td');
        const botonAcciones = document.createElement('button');
        botonAcciones.textContent = "Editar";
        celdaAcciones.appendChild(botonAcciones);
        fila.appendChild(celdaAcciones);
        botonAcciones.dataset.id = equipo.id_equipo; 

        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = "Eliminar";
        celdaAcciones.appendChild(botonEliminar);
        botonEliminar.dataset.id = equipo.id_equipo;
        


        botonEliminar.addEventListener('click', async function (event) {
            const id = event.target.dataset.id;

            const confirmar = confirm("¿Está seguro de eliminar este equipo?");
            if (confirmar === true){
                const respuesta = await fetch('http://localhost:3000/api/equipos/' + id,{
                    method: "DELETE"
                });
                const resultado = await respuesta.json();

                if (respuesta.ok){
                    alert(resultado.mensaje);
                    const fila = event.target.parentElement.parentElement;

                    fila.remove();

                    actualizarFiltrosDisponibles();

                }
            }
        });


        botonAcciones.addEventListener('click', async function (event) {
            const id = event.target.dataset.id;
            idEditando = id;
            botonFormulario.textContent = "Actualizar equipo";
            tituloFormulario.textContent = "Editar equipo";

            console.log('ID editando:', idEditando);

            const respuesta = await fetch('http://localhost:3000/api/equipos/' + id);
            const resultado = await respuesta.json();

            const equipo = resultado[0];

            const campoCodigo = document.getElementById('codigo');
            campoCodigo.value = equipo.codigo;

            const campoNombre = document.getElementById('nombre');
            campoNombre.value = equipo.nombre;

            const campoTipo = document.getElementById('tipo');
            campoTipo.value = equipo.tipo;

            const campoMarca = document.getElementById('marca');
            campoMarca.value = equipo.marca;

            const campoModelo = document.getElementById('modelo');
            campoModelo.value = equipo.modelo;

            const campoSerial = document.getElementById('serial');
            campoSerial.value = equipo.serial;

            const campoEstado = document.getElementById('estado');
            campoEstado.value = equipo.estado;

            const campoUbicacion = document.getElementById('ubicacion');
            campoUbicacion.value = equipo.ubicacion;

            const campoObservaciones = document.getElementById('observaciones');
            campoObservaciones.value = equipo.observaciones;

            console.log(equipo);
        });
        
        cuerpoTabla.appendChild(fila);
    });

}

/* Buscar al hacer clic en la lupa */
botonBuscar.addEventListener('click', cargarEquipos);

/* Buscar mientras se escribe, con una pequeña pausa (debounce) */
campoBuscar.addEventListener('input', debounce(cargarEquipos, 400));

/* Buscar también con la tecla Enter */
campoBuscar.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        cargarEquipos();
    }
});

/* Filtrar al cambiar el select de Tipo o Estado */
filtroTipo.addEventListener('change', cargarEquipos);
filtroEstado.addEventListener('change', cargarEquipos);

/* Limpiar todos los filtros y volver a mostrar el listado completo */
botonLimpiarFiltros.addEventListener('click', function () {
    campoBuscar.value = '';
    filtroTipo.value = '';
    filtroEstado.value = '';
    cargarEquipos();
});

/* Carga inicial: opciones de filtro + listado completo */
actualizarFiltrosDisponibles();
cargarEquipos();