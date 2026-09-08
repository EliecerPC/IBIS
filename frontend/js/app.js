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