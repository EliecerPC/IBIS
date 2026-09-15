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

        } else {

            alert('Error: ' + resultado.error);

        }

    } catch (error) {

        console.error('Error de conexión:', error);

        alert('No se pudo conectar con el servidor');

    }

});

const botonConsultar = document.getElementById('btnConsultar');
const listaEquipos = document.getElementById('listaEquipos');
const cuerpoTabla = document.getElementById('cuerpoTabla');

botonConsultar.addEventListener('click', async function() {

    const respuesta = await fetch('http://localhost:3000/api/equipos');
    const equipos = await respuesta.json();

    cuerpoTabla.textContent = ''; //hacer que la tabla se limpie

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

    console.log(equipos);

});