'use strict';

var express = require('express');
var reviewController = require('../controllers/ReviewController');

var api = express.Router();
var auth = require('../middlewares/authenticate');

// Rutas protegidas (requieren autenticación)
api.post('/crear_review', auth.auth, reviewController.crear_review);
api.get('/verificar_puede_resenar/:producto/:venta', auth.auth, reviewController.verificar_puede_resenar);
api.get('/obtener_reviews_cliente/:id', auth.auth, reviewController.obtener_reviews_cliente);

// Rutas públicas
api.get('/listar_reviews_producto/:id', reviewController.listar_reviews_producto);

module.exports = api;