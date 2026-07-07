import http from 'http';

const PORT = 8080;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    
    // Route matching
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      try {
        const payload = JSON.parse(body);
        if (payload.email === 'admin@dentalclinic.com' && payload.password === 'Admin123!') {
          res.writeHead(200);
          res.end(JSON.stringify({
            token: 'mock-admin-token',
            role: 'ADMIN',
            email: 'admin@dentalclinic.com',
            firstName: 'Admin',
            lastName: 'User',
            id: 1
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ message: 'Credenciales incorrectas' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Bad Request' }));
      }
      return;
    }
    
    if (req.method === 'GET' && url.pathname === '/api/auth/validate') {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer mock-admin-token') {
        res.writeHead(200);
        res.end(JSON.stringify({
          id: 1,
          email: 'admin@dentalclinic.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ message: 'Token inválido' }));
      }
      return;
    }

    // Default route
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not Found' }));
  });
});

server.listen(PORT, () => {
  console.log(`Mock backend listening on port ${PORT}`);
});
