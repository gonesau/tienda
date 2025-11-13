'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactoSchema = Schema({
    cliente: { 
        type: Schema.ObjectId, 
        ref: 'cliente',
        required: false
    },
    nombre: { 
        type: String, 
        required: true,
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    email: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true
    },
    telefono: { 
        type: String, 
        default: '',
        trim: true,
        maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
    },
    asunto: { 
        type: String, 
        required: true,
        trim: true,
        minlength: [3, 'El asunto debe tener al menos 3 caracteres'],
        maxlength: [200, 'El asunto no puede exceder 200 caracteres']
    },
    mensaje: { 
        type: String, 
        required: true,
        trim: true,
        minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
        maxlength: [2000, 'El mensaje no puede exceder 2000 caracteres']
    },
    estado: { 
        type: String, 
        enum: ['pendiente', 'leido', 'respondido', 'cerrado'],
        default: 'pendiente'
    },
    ip_address: {
        type: String,
        default: ''
    },
    user_agent: {
        type: String,
        default: ''
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Índices para mejorar rendimiento
ContactoSchema.index({ estado: 1, createdAt: -1 });
ContactoSchema.index({ email: 1 });
ContactoSchema.index({ cliente: 1 });

module.exports = mongoose.model('Contacto', ContactoSchema);