'use strict';

var express = require('express');
var ventaController = require('../controllers/VentaController');

var api = express.Router();
var auth = require('../middlewares/authenticate');

// Ruta para registrar compra
api.post('/registro_compra_cliente', auth.auth, ventaController.registro_compra_cliente);

// Ruta para validar cupón
api.post('/validar_cupon_cliente', auth.auth, ventaController.validar_cupon_cliente);

// RUTA CORREGIDA - Generar PDF (debe estar ANTES de las rutas con parámetros dinámicos)
api.get('/generar_comprobante_pdf/:id', auth.auth, ventaController.generar_comprobante_pdf);

// ===================================
// RUTAS - HISTORIAL DE ÓRDENES
// ===================================

// Listar ventas del cliente con filtros y paginación
api.get('/listar_ventas_cliente/:id', auth.auth, ventaController.listar_ventas_cliente);

// Obtener detalle de una venta específica
api.get('/obtener_venta_cliente/:id', auth.auth, ventaController.obtener_venta_cliente);

// Obtener estadísticas de compras del cliente
api.get('/obtener_estadisticas_cliente/:id', auth.auth, ventaController.obtener_estadisticas_cliente);

module.exports = api;