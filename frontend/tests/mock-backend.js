import http from "http";

const PORT = Number(process.env.E2E_BACKEND_PORT || 8080);

let tempMustChangePassword = true;
let dentist2State = {
  id: 2,
  registrationNumber: "MAT-2002",
  firstName: "María",
  lastName: "González",
  email: "dentist@dentalclinic.com",
  specialties: [],
};
/** @type {Record<string, unknown> | null} */
let lastDentistUpdate = null;
/** @type {Record<string, unknown> | null} */
let lastAppointmentUpdate = null;

function resetTestState() {
  tempMustChangePassword = true;
  dentist2State = {
    id: 2,
    registrationNumber: "MAT-2002",
    firstName: "María",
    lastName: "González",
    email: "dentist@dentalclinic.com",
    specialties: [],
  };
  lastDentistUpdate = null;
  lastAppointmentUpdate = null;
}

/** @param {string | undefined} authHeader */
function resolveUserByAuthHeader(authHeader) {
  if (authHeader === "Bearer mock-admin-token") {
    return {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@dentalclinic.com",
      role: "ADMIN",
    };
  }
  if (authHeader === "Bearer mock-dentist-token") {
    return {
      id: 2,
      firstName: dentist2State.firstName,
      lastName: dentist2State.lastName,
      email: dentist2State.email,
      role: "DENTIST",
    };
  }
  if (authHeader === "Bearer mock-temp-token") {
    return {
      id: 3,
      firstName: "Temp",
      lastName: "Patient",
      email: "temp@dentalclinic.com",
      role: "PATIENT",
      mustChangePassword: tempMustChangePassword,
    };
  }
  return null;
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");

    // Route matching
    const url = new URL(
      req.url || "",
      `http://${req.headers.host || "localhost"}`,
    );

    if (req.method === "POST" && url.pathname === "/api/__test/reset") {
      resetTestState();
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/__test/reset-temp") {
      tempMustChangePassword = true;
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/__test/last-requests") {
      res.writeHead(200);
      res.end(JSON.stringify({ lastDentistUpdate, lastAppointmentUpdate }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      try {
        const payload = JSON.parse(body);
        if (
          payload.email === "admin@dentalclinic.com" &&
          payload.password === "Admin123!"
        ) {
          res.writeHead(200);
          res.end(
            JSON.stringify({
              token: "mock-admin-token",
              role: "ADMIN",
              email: "admin@dentalclinic.com",
              firstName: "Admin",
              lastName: "User",
              id: 1,
            }),
          );
        } else if (
          payload.email === "dentist@dentalclinic.com" &&
          payload.password === "Dentist123!"
        ) {
          res.writeHead(200);
          res.end(
            JSON.stringify({
              token: "mock-dentist-token",
              role: "DENTIST",
              email: dentist2State.email,
              firstName: dentist2State.firstName,
              lastName: dentist2State.lastName,
              id: 2,
            }),
          );
        } else if (
          payload.email === "temp@dentalclinic.com" &&
          payload.password === "Temp123!"
        ) {
          res.writeHead(200);
          res.end(
            JSON.stringify({
              token: "mock-temp-token",
              role: "PATIENT",
              email: "temp@dentalclinic.com",
              firstName: "Temp",
              lastName: "Patient",
              id: 3,
              mustChangePassword: tempMustChangePassword,
            }),
          );
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ message: "Credenciales incorrectas" }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Bad Request" }));
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const user = resolveUserByAuthHeader(req.headers.authorization);
      if (user) {
        // Exactly the public SessionProfileResponse fields — no token,
        // password, or authority ever leaves this endpoint.
        res.writeHead(200);
        res.end(JSON.stringify(user));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ message: "Token inválido" }));
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/change-password") {
      const user = resolveUserByAuthHeader(req.headers.authorization);
      if (!user) {
        res.writeHead(401);
        res.end(JSON.stringify({ message: "Token inválido" }));
        return;
      }
      if (user.id === 3) {
        tempMustChangePassword = false;
      }
      res.writeHead(204);
      res.end();
      return;
    }

    const user = resolveUserByAuthHeader(req.headers.authorization);
    if (!user && url.pathname.startsWith("/api/")) {
      res.writeHead(401);
      res.end(JSON.stringify({ message: "Token inválido" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/dentists") {
      res.writeHead(200);
      res.end(
        JSON.stringify([
          {
            id: 1,
            registrationNumber: "MAT-1001",
            firstName: "Carlos",
            lastName: "Pérez",
            email: "carlos@dentalclinic.com",
            specialties: [],
          },
          dentist2State,
        ]),
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/dentists/2") {
      res.writeHead(200);
      res.end(JSON.stringify(dentist2State));
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/dentists/2/specialties"
    ) {
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/specialties") {
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/dentists/2") {
      try {
        const payload = JSON.parse(body);
        if (
          typeof payload.registrationNumber !== "string" ||
          !payload.registrationNumber ||
          typeof payload.email !== "string" ||
          !payload.email
        ) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              message: "registrationNumber y email deben ser strings",
            }),
          );
          return;
        }
        lastDentistUpdate = payload;
        dentist2State = {
          ...dentist2State,
          firstName: payload.firstName ?? dentist2State.firstName,
          lastName: payload.lastName ?? dentist2State.lastName,
          email: payload.email,
          registrationNumber: payload.registrationNumber,
        };
        res.writeHead(200);
        res.end(JSON.stringify(dentist2State));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Bad Request" }));
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/patients") {
      res.writeHead(200);
      res.end(
        JSON.stringify([
          {
            id: 1,
            firstName: "Juan",
            lastName: "Pérez",
            email: "juan@example.com",
            cardIdentity: 12345678,
            admissionDate: "2026-01-10",
          },
          {
            id: 2,
            firstName: "Ana",
            lastName: "López",
            email: "ana@example.com",
            cardIdentity: 87654321,
            admissionDate: "2026-02-15",
          },
        ]),
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/appointments/1") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          id: 1,
          patientId: 1,
          dentistId: 2,
          date: "2026-12-01",
          time: "10:00",
          description: "Control",
          status: "SCHEDULED",
        }),
      );
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/appointments/1") {
      try {
        const payload = JSON.parse(body);
        if (payload.description === "TRIGGER_ERROR") {
          res.writeHead(400);
          res.end(JSON.stringify({ message: "Horario no disponible" }));
          return;
        }
        if (
          payload.dentistId === null ||
          payload.dentistId === undefined ||
          Array.isArray(payload.dentistId)
        ) {
          res.writeHead(400);
          res.end(JSON.stringify({ message: "dentistId inválido" }));
          return;
        }
        lastAppointmentUpdate = payload;
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: 1,
            ...payload,
            status: "SCHEDULED",
          }),
        );
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Bad Request" }));
      }
      return;
    }

    if (
      req.method === "PATCH" &&
      url.pathname === "/api/appointments/1/status"
    ) {
      try {
        const payload = JSON.parse(body);
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: 1,
            status: payload.status || "SCHEDULED",
          }),
        );
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Bad Request" }));
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/appointments/search") {
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    // Default route
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  });
});

server.listen(PORT, () => {
  console.log(`Mock backend listening on port ${PORT}`);
});
