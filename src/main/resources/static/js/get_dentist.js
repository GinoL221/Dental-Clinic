window.addEventListener('load', function () {
    (function() {
        // con fetch invocamos a la API de odontólogos con el método GET
        // nos devolverá un JSON con una colección de odontólogos
        const url = '/dentists';
        const settings = {
            method: 'GET'
        };

        fetch(url, settings)
            .then(response => response.json())
            .then(data => {
                // recorremos la colección de odontólogos del JSON
                for (let dentist of data) {
                    // por cada odontólogo armaremos una fila de la tabla
                    // cada fila tendrá un id que luego nos permitirá borrar la fila si eliminamos el odontólogo
                    var table = document.getElementById("dentistTable");
                    var dentistRow = table.insertRow();
                    let tr_id = 'tr_' + dentist.id;
                    dentistRow.id = tr_id;

                    // por cada odontólogo creamos un botón delete que agregaremos en cada fila para poder eliminar la misma
                    // dicho botón invocará a la función de JavaScript deleteBy que se encargará
                    // de llamar a la API para eliminar un odontólogo
                    let deleteButton = '<button ' +
                        'id="btn_delete_' + dentist.id + '" ' +
                        'type="button" onclick="deleteBy(' + dentist.id + ')" class="btn btn-danger btn_delete">' +
                        '&times;' +
                        '</button>';

                    // por cada odontólogo creamos un botón que muestra el id y que al hacerle clic invocará
                    // a la función de JavaScript findBy que se encargará de buscar el odontólogo que queremos
                    // modificar y mostrar los datos del mismo en un formulario.
                    let updateButton = '<button ' +
                        'id="btn_id_' + dentist.id + '" ' +
                        'type="button" onclick="findBy(' + dentist.id + ')" class="btn btn-info btn_id">' +
                        dentist.id +
                        '</button>';

                    // armamos cada columna de la fila
                    // como primer columna pondremos el botón modificar
                    // luego los datos del odontólogo
                    // como última columna el botón eliminar
                    dentistRow.innerHTML = '<td>' + updateButton + '</td>' +
                        '<td class="td_id">' + dentist.id + '</td>' +
                        '<td class="td_registration">' + dentist.registrationNumber + '</td>' +
                        '<td class="td_name">' + dentist.name.toUpperCase() + '</td>' +
                        '<td class="td_lastName">' + dentist.lastName.toUpperCase() + '</td>' +
                        '<td>' + deleteButton + '</td>';
                }
            });
    })();

    (function() {
        // aquí se obtiene el pathname de la URL actual y se compara
        // si es "dentistList.html", se resalta el enlace correspondiente
        let pathname = window.location.pathname;
        if (pathname == "/dentistList.html") {
            document.querySelector(".nav .nav-item a:last-child").classList.add("active");
        }
    })();
});
