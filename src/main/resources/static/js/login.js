document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    fetch('/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error('Credenciales inválidas');
        return res.json();
    })
    .then(data => {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem("userRole", data.role);
        window.location.href = '/';  // Redirigir a la raíz
    })
    .catch(error => alert('Error: ' + error.message));
});
