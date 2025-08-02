document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
        alert('Las contraseñas no coinciden');
        return;
    }

    const data = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: password,
        role: document.getElementById('role').value
    };

    fetch('/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        alert('Usuario registrado con éxito');
        console.log(data);
        window.location.href = '/login.html';
    })
    .catch(err => {
        console.error(err);
        alert('Error al registrar usuario');
    });
});
