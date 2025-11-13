'use strict'

var mogoose = require('mongoose');
var Schema = mogoose.mongoose.Schema;

var ContactoSchema = Schema({
    cliente: {type: Schema.ObjectId, ref: 'Cliente'},
    mensaje: {type: String, required: true},
    asunto: {type: String, default: '', required: true},
    email: {type: String, required: true},
    telefono: {type: String, default: ''},
    estado: {type: String, default: true},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mogoose.model('Contacto', ContactoSchema);