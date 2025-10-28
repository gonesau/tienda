'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CarritoSchema = new Schema({
    producto: { type: Schema.ObjectId, ref: 'Producto', required: true },
    cliente: { type: Schema.ObjectId, ref: 'Cliente', required: true },
    cantidad: { type: Number, required: true },
    variedad: { type: String, required: false },
    createdAt: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model('carrito', CarritoSchema);