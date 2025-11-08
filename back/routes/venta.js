'use strict';

var express = require('express');
var ventaController = require('../controllers/VentaController');

var api = express.Router();
var auth = require('../middlewares/authenticate');

// Ruta para registrar compra
api.post('/registro_compra_cliente', auth.auth, ventaController.registro_compra_cliente);

// Ruta para validar cupón
api.post('/validar_cupon_cliente', auth.auth, ventaController.validar_cupon_cliente);

api.get('/generar_comprobante_pdf/:id', auth.auth, ventaController.generar_comprobante_pdf);

module.exports = api;