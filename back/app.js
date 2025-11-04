'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port = process.env.PORT || 4201;

var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {
    socket.on('delete-carrito', function(data) {
        io.emit('new-carrito', data);
        console.log(data);
    });

    socket.on('add-carrito-add', function(data) {
        io.emit('new-carrito-add', data);
        console.log(data);
    });

});

// Middleware para compartir io en todas las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});


// Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

server.listen(port, () => {
    console.log('Servidor corriendo en el puerto ' + port);
});



// Middleware
var cliente_route = require('./routes/cliente');
var admin_route = require('./routes/admin');
var producto_route = require('./routes/producto');
var cupon_route = require('./routes/cupon');
var config_route = require('./routes/config');
var carrito_route = require('./routes/carrito');


// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/tienda', {useUnifiedTopology: true, useNewUrlParser: true})
  .then(() => {
    console.log('Conectado a la base de datos');

    // Iniciar servidor
    server.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectarse a la base de datos:', err);
  });

// Para administrar el cuerpo de las peticiones
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));


app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


app.use('/api', cliente_route);
app.use('/api', admin_route);
app.use('/api', producto_route);
app.use('/api', cupon_route);
app.use('/api', config_route);
app.use('/api', carrito_route);

module.exports = app;