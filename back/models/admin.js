'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AdminSchema = new Schema({
    nombres: {type: String, required: true},
    apellidos: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    telefono: {type: String, required: true},
    rol: {type: String, required: true},
    dui: {type: String, required: true},
});

// Asegura que el índice de dui sea único solo si el campo existe (sparse)
AdminSchema.index({ dui: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model('admin', AdminSchema);