'use strict';

const { duration, deprecationHandler } = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DireccionSchema = new Schema({
    cliente: { type: Schema.ObjectId, ref: 'Cliente', required: true },
    destinatario: { type: String, required: true },
    dui: { type: String, required: true },
    zip: { type: String, required: true },
    direccion: { type: String, required: true },
    pais: { type: String, required: true },
    departamento: { type: String, required: true },
    municipio: { type: String, required: true },
    telefono: { type: String, required: true },
    principal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model('direccion', DireccionSchema);