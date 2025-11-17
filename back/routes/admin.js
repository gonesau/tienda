// Agregar al archivo back/routes/admin.js

'use strict'

var express = require('express');
var adminController = require('../controllers/AdminController');
var contactoController = require('../controllers/ContactoController');
var ventaController = require('../controllers/VentaController');
var auth = require('../middlewares/authenticate');

var api = express.Router();

// Rutas existentes de admin
api.post('/registro_admin', adminController.registro_admin);
api.post('/login_admin', adminController.login_admin);

// ===================================
// RUTAS DE CONTACTO (ADMIN)
// ===================================
api.get('/listar_mensajes_contacto_admin', auth.auth, contactoController.listar_mensajes_admin);
api.get('/obtener_mensaje_contacto_admin/:id', auth.auth, contactoController.obtener_mensaje_admin);
api.put('/actualizar_estado_mensaje_admin/:id', auth.auth, contactoController.actualizar_estado_mensaje_admin);
api.delete('/eliminar_mensaje_contacto_admin/:id', auth.auth, contactoController.eliminar_mensaje_admin);

// ===================================
// RUTAS DE VENTAS (ADMIN)
// ===================================
api.get('/listar_ventas_admin', auth.auth, ventaController.listar_ventas_admin);
api.get('/obtener_venta_admin/:id', auth.auth, ventaController.obtener_venta_admin);
api.put('/actualizar_estado_venta_admin/:id', auth.auth, ventaController.actualizar_estado_venta_admin);
api.get('/obtener_estadisticas_ventas_admin', auth.auth, ventaController.obtener_estadisticas_ventas_admin);

module.exports = api;