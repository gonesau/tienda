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

// Configurar Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('delete-carrito', function(data) {
        io.emit('new-carrito', data);
        console.log('Evento delete-carrito:', data);
    });

    socket.on('add-carrito-add', function(data) {
        io.emit('new-carrito-add', data);
        console.log('Evento add-carrito-add:', data);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// Middleware para compartir io en todas las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Para administrar el cuerpo de las peticiones
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));

// CORS middleware
app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Rutas
var cliente_route = require('./routes/cliente');
var admin_route = require('./routes/admin');
var producto_route = require('./routes/producto');
var cupon_route = require('./routes/cupon');
var config_route = require('./routes/config');
var carrito_route = require('./routes/carrito');
var venta_route = require('./routes/venta');

app.use('/api', cliente_route);
app.use('/api', admin_route);
app.use('/api', producto_route);
app.use('/api', cupon_route);
app.use('/api', config_route);
app.use('/api', carrito_route);
app.use('/api', venta_route);

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/tienda', {
    useUnifiedTopology: true, 
    useNewUrlParser: true
})
.then(() => {
    console.log('✓ Conectado a la base de datos MongoDB');

    // Iniciar servidor solo después de conectar a la BD
    server.listen(port, () => {
        console.log(`✓ Servidor corriendo en http://localhost:${port}`);
        console.log(`✓ Socket.IO configurado correctamente`);
    });
})
.catch((err) => {
    console.error('✗ Error al conectarse a la base de datos:', err);
    process.exit(1);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
});

module.exports = app;