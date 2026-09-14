console.log("Frontend de IBIS funcionando");

/*Capturar los datos del formulario*/
const formulario = document.getElementById('formEquipo');

formulario.addEventListener('submit', async function(event) {

    event.preventDefault();

    const datos = new FormData(formulario);

    const equipo = Object.fromEntries(datos.entries());

    try {

        const respuesta = await fetch('http://localhost:3000/api/equipos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(equipo)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {

            alert(resultado.mensaje);

            formulario.reset();

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
        
        cuerpoTabla.appendChild(fila);
    });

    console.log(equipos);

});