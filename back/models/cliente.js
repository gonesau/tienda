'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClienteSchema = new Schema({

    nombres: {type: String, required: true},
    apellidos: {type: String, required: true},
    pais: {type: String, required: false},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    perfil: {type: String, default: 'perfil.png', required: true},
    telefono: {type: String, required: false},
    genero: {type: String, required: false},
    f_nacimiento: {type: Date, required: false},
    dui: {type: String, required: true, unique: true},
});


module.exports = mongoose.model('cliente', ClienteSchema);