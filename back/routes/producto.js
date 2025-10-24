'use strict';
var express = require('express');
var productoController = require('../controllers/ProductoController');

var api = express.Router();
var auth = require('../middlewares/authenticate');
var multiparty = require('connect-multiparty');
var path = multiparty({uploadDir: './uploads/productos'});

//Productos
api.post('/registro_producto_admin', [auth.auth, path] , productoController.registro_producto_admin);
api.get('/listar_productos_admin', auth.auth, productoController.listar_productos_admin);
api.get('/listar_productos_admin/:filtro', auth.auth, productoController.listar_productos_admin);
api.get('/obtener_portada/:img', productoController.obtener_portada);
api.get('/obtener_producto_admin/:id', auth.auth, productoController.obtener_producto_admin);
api.put('/actualizar_producto_admin/:id', [auth.auth, path] , productoController.actualizar_producto_admin);
api.delete('/eliminar_producto_admin/:id', auth.auth, productoController.eliminar_producto_admin);


//Inventario de productos
api.get('/listar_inventario_producto_admin/:id', auth.auth, productoController.listar_inventario_producto_admin);
api.delete('/eliminar_inventario_producto_admin/:id', auth.auth, productoController.eliminar_inventario_producto_admin);
api.post('/registro_inventario_producto_admin', auth.auth, productoController.registro_inventario_producto_admin);

//Variedades de productos
api.put('/actualizar_producto_variedades_admin/:id', auth.auth, productoController.actualizar_producto_variedades_admin);

//Galería de imágenes
api.put('/agregar_imagen_galeria_admin/:id', [auth.auth, path] , productoController.agregar_imagen_galeria_admin);
api.put('/eliminar_imagen_galeria_admin/:id', auth.auth, productoController.eliminar_imagen_galeria_admin);

//Publicos
api.get('/listar_productos_publico/:filtro', productoController.listar_productos_publico);
api.get('/listar_productos_publico', productoController.listar_productos_publico);
api.get('/obtener_producto_slug_publico/:slug', productoController.obtener_producto_slug_publico);


module.exports =  api;