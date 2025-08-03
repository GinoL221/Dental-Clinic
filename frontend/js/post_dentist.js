window.addEventListener('load', function () {

    // Verificamos si el usuario es ADMIN
    const role = localStorage.getItem('userRole');
    if (role !== 'ADMIN') {
        alert('No tenés permisos para acceder a esta página.');
        window.location.href = '/index.html';
        return;
    }

    const formulario = document.querySelector('#add_new_dentist');

    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = {
            name: document.querySelector('#firstName').value,
            lastName: document.querySelector('#lastName').value,
            registrationNumber: document.querySelector('#registrationNumber').value
        };

        const token = localStorage.getItem('jwtToken');

        const settings = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        };

        fetch('/dentists', settings)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(msg => {
                        throw new Error(`Error ${response.status}: ${msg}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                let successAlert = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        Odontólogo agregado exitosamente.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                document.querySelector('#response').innerHTML = successAlert;
                document.querySelector('#response').style.display = "block";
                resetForm();
            })
            .catch(error => {
                console.error('Error al guardar odontólogo:', error);
                let errorAlert = `
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        Error al guardar odontólogo: ${error.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                document.querySelector('#response').innerHTML = errorAlert;
                document.querySelector('#response').style.display = "block";
                resetForm();
            });
    });

    function resetForm() {
        document.querySelector('#firstName').value = "";
        document.querySelector('#lastName').value = "";
        document.querySelector('#registrationNumber').value = "";
    }

});
