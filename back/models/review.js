'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Review = require('../models/review');

var reviewSchema = Schema({
    producto: { type: Schema.ObjectId, ref: 'Producto', required: true },
    cliente: { type: Schema.ObjectId, ref: 'Cliente', required: true },
    venta: { type: Schema.ObjectId, ref: 'Venta', required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);