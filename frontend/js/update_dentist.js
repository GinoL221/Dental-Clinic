window.addEventListener('load', function () {

    // Buscamos y obtenemos el formulario donde están
    // los datos que el usuario pudo haber modificado del odontólogo
    const formulario = document.querySelector('#update_dentist_form');

    formulario.addEventListener('submit', function (event) {
        let dentistId = document.querySelector('#dentist_id').value;

        // creamos un JSON que tendrá los datos del odontólogo
        // a diferencia de un odontólogo nuevo en este caso enviamos el id
        // para poder identificarla y modificarla para no cargarla como nueva
        const formData = {
            id: document.querySelector('#dentist_id').value,
            registrationNumber: document.querySelector('#registrationNumber').value,
            name: document.querySelector('#name').value,
            lastName: document.querySelector('#lastName').value,

        };

        // invocamos utilizando la función fetch la API odontólogos con el método PUT que modificará
        // el odontólogo que enviaremos en formato JSON
        const url = '/dentists';
        const settings = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        }
          fetch(url,settings)
          .then(response => response.json())

    })
 })

// Es la función que se invoca cuando se hace click sobre el id de un odontólogo del listado
// se encarga de llenar el formulario con los datos del odontólogo
// que se desea modificar
function findBy(id) {
          const url = '/dentists'+"/"+id;
          const settings = {
              method: 'GET'
          }
          fetch(url,settings)
          .then(response => response.json())
          .then(data => {
              let dentist = data;
              document.querySelector('#dentist_id').value = dentist.id;
              document.querySelector('#registrationNumber').value = dentist.registrationNumber;
              document.querySelector('#name').value = dentist.name;
              document.querySelector('#lastName').value = dentist.lastName;
              // el formulario por default esta oculto y al editar se habilita
              document.querySelector('#div_dentist_updating').style.display = "block";
          }).catch(error => {
              alert("Error: " + error);
          })
      }