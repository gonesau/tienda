'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port = process.env.PORT || 4201;

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/tienda')
  .then(() => {
    console.log('Conectado a la base de datos');

    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectarse a la base de datos:', err);
  });

module.exports = app;