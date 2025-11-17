'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductoSchema = Schema({
    titulo: {type: String, required: true},
    slug: {type: String, required: true},
    galeria : [{type: Object, required: false}],
    portada : {type: String, required: true},
    precio : {type: Number, required: true},
    descripcion : {type: String, required: true},
    contenido : {type: String, required: true},
    stock : {type: Number, required: true},
    nventas : {type: Number, default: 0, required: true},
    npuntos : {type: Number, default: 0, required: true},
    variedades : [{type: Object, required: false}],
    titulo_variedad : {type: String, required: false},
    categoria : {type: String, required: true},
    estado: {type: String, default: 'Edicion', required: true},
    
    // NUEVOS CAMPOS PARA REVIEWS
    rating_promedio: {type: Number, default: 0},
    total_reviews: {type: Number, default: 0},
    
    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('Producto', ProductoSchema);