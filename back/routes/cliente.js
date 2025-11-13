// back/routes/cliente.js
'use restrict'

var express = require('express');
var clienteController = require('../controllers/ClienteController');
var contactoController = require('../controllers/ContactoController');
const cliente = require('../models/cliente');

var api = express.Router();
var auth = require('../middlewares/authenticate');

// Autenticación
api.post('/registro_cliente', clienteController.registro_cliente);
api.post('/login_cliente', clienteController.login_cliente);

// Gestión de clientes (Admin)
api.get('/listar_clientes_filtro_admin', auth.auth, clienteController.listar_clientes_filtro_admin);
api.post('/registro_cliente_admin', auth.auth, clienteController.registro_cliente_admin);
api.get('/obtener_cliente_admin/:id', auth.auth, clienteController.obtener_cliente_admin);
api.put('/actualizar_cliente_admin/:id', auth.auth, clienteController.actualizar_cliente_admin);
api.delete('/eliminar_cliente_admin/:id', auth.auth, clienteController.eliminar_cliente_admin);

// Perfil de cliente (Guest)
api.get('/obtener_cliente_guest/:id', auth.auth, clienteController.obtener_cliente_guest);
api.put('/actualizar_perfil_cliente_guest/:id', auth.auth, clienteController.actualizar_perfil_cliente_guest);

// Rutas de direcciones
api.post('/registro_direccion_cliente', auth.auth, clienteController.registro_direccion_cliente);
api.get('/obtener_direcciones_cliente/:id', auth.auth, clienteController.obtener_direcciones_cliente);
api.put('/establecer_direccion_principal/:id', auth.auth, clienteController.establecer_direccion_principal);
api.delete('/eliminar_direccion_cliente/:id', auth.auth, clienteController.eliminar_direccion_cliente);
api.get('/obtener_direccion_principal_cliente/:id', auth.auth, clienteController.obtener_direccion_principal_cliente);

// Ruta de contacto
api.post('/enviar_mensaje_contacto', contactoController.enviar_mensaje_contacto);


module.exports = api;