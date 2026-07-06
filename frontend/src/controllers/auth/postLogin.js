const path = require('path');
const axios = /** @type {any} */ (require('axios'));
const { validationResult } = require('express-validator');
const apiConfig = require('../../config/apiConfig');
const logger = require('../../utils/logger-server');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const postLogin = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const viewPath = path.join(__dirname, '../../views/users/login.ejs');
      return res.render(viewPath, {
        title: 'Iniciar Sesión | Clínica Odontológica',
        errors: errors.mapped(),
        oldData: req.body,
        extraStylesheets: ['/css/views/auth.css'],
      });
    }

    const { email, password } = req.body;

    // Llamar al backend Spring Boot para autenticar
    const backendResponse = await axios.post(apiConfig.getAuthUrl('LOGIN'), {
      email,
      password,
    });

    // Si el login fue exitoso
    if (backendResponse.status === 200) {
      const { token, role, id, firstName, lastName, email } = backendResponse.data;

      // Asegurar que la sesión está inicializada
      if (!req.session) {
        return res.status(500).json({ error: 'Error de sesión' });
      }

      // Guardar en sesión (más confiable para desarrollo)
      req.session.user = {
        id: id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role,
        token: token,
      };

      // Forzar el guardado de la sesión
      req.session.save((/** @type {any} */ err) => {
        if (err) {
          logger.error('Error al guardar sesión:', err);
          return res.status(500).json({ error: 'Error al guardar sesión' });
        } else {
          // También guardar en cookies como backup
          res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/',
            sameSite: 'lax',
          });

          res.cookie('userRole', role, {
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/',
            sameSite: 'lax',
          });

          res.cookie('userEmail', email, {
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/',
            sameSite: 'lax',
          });

          // Cookies are already set above. For native form POST (no JS / JS
          // blocked), returning JSON would expose raw data on screen with no
          // redirect. A 303 redirect is all a cookied browser needs.
          const isModularRequest = req.headers['x-requested-with'] === 'ModularAuth';
          if (isModularRequest) {
            return res.json({
              success: true,
              role,
              email,
              id,
              firstName: firstName || '',
              lastName: lastName || '',
            });
          } else {
            return res.redirect(303, '/');
          }
        }
      });
    }
  } catch (/** @type {any} */ error) {
    logger.error('Error en el controlador postLogin:', error);

    const viewPath = path.join(__dirname, '../../views/users/login.ejs');

    // Manejar errores específicos del backend
    if (error.response) {
      const status = error.response.status;
      let errorMessage = 'Error al iniciar sesión';

      if (status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (status === 404) {
        errorMessage = 'Usuario no encontrado';
      }

      return res.render(viewPath, {
        title: 'Iniciar Sesión | Clínica Odontológica',
        errors: {
          general: { msg: errorMessage },
        },
        oldData: req.body,
        extraStylesheets: ['/css/views/auth.css'],
      });
    }

    // Error interno del servidor
    res.status(500).render(viewPath, {
      title: 'Iniciar Sesión | Clínica Odontológica',
      errors: {
        general: { msg: 'Error interno del servidor' },
      },
      oldData: req.body,
      extraStylesheets: ['/css/views/auth.css'],
    });
  }
};

module.exports = postLogin;
