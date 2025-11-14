'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var DetalleVentaSchema = Schema({
    producto: {type: Schema.ObjectId, ref: 'Producto', required: true},
    venta: {type: Schema.ObjectId, ref: 'venta', required: true},
    subtotal: {type: Number, required: true},
    cantidad: {type: Number, required: true},
    variedad: {type: String, required: false},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('DetalleVenta', DetalleVentaSchema);