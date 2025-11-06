// models/direccion.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DireccionSchema = Schema({
    cliente: { type: Schema.ObjectId, ref: 'cliente', required: true },
    destinatario: { type: String, required: true },
    dui: { type: String, required: true },        
    zip: { type: String, required: true },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    pais: { type: String, required: true },
    departamento: { type: String, required: false },
    municipio: { type: String, required: false },
    principal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('direccion', DireccionSchema);