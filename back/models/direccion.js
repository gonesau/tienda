// models/direccion.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DireccionSchema = Schema({
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    destinatario: { type: String, required: true },
    pais: { type: String, required: true },
    departamento: { type: String, required: true },
    municipio: { type: String, required: true },
    direccion: { type: String, required: true },
    referencia: { type: String },
    telefono: { type: String, required: true },
    principal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('direccion', DireccionSchema);
