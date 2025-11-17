// back/models/review.js
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReviewSchema = Schema({
    producto: { 
        type: Schema.ObjectId, 
        ref: 'Producto', 
        required: true 
    },
    cliente: { 
        type: Schema.ObjectId, 
        ref: 'cliente', 
        required: true 
    },
    venta: { 
        type: Schema.ObjectId, 
        ref: 'venta', 
        required: true 
    },
    review: { 
        type: String, 
        required: true,
        minlength: [10, 'La reseña debe tener al menos 10 caracteres'],
        maxlength: [1000, 'La reseña no puede exceder 1000 caracteres']
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Índice compuesto único para evitar reseñas duplicadas
ReviewSchema.index({ cliente: 1, producto: 1, venta: 1 }, { unique: true });

// Índices para consultas frecuentes
ReviewSchema.index({ producto: 1, createdAt: -1 });
ReviewSchema.index({ cliente: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
