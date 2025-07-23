'use restrict'

var express = require('express');
var clienteController = require('../controllers/ClienteController');
const cliente = require('../models/cliente');

var api = express.Router();

api.post('/registro_cliente', clienteController.registro_cliente);

module.exports = api;
