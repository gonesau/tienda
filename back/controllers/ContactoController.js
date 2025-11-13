'use strict';

const Contacto = require('../models/contacto');

/**
 * Validaciones personalizadas sin dependencias externas
 */
const validaciones = {
    validarNombre: (nombre) => {
        if (!nombre || nombre.trim().length < 3) {
            return { valido: false, mensaje: 'El nombre debe tener al menos 3 caracteres' };
        }
        if (nombre.length > 100) {
            return { valido: false, mensaje: 'El nombre no puede exceder 100 caracteres' };
        }
        // Solo letras, espacios, acentos y ñ
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!regex.test(nombre)) {
            return { valido: false, mensaje: 'El nombre solo puede contener letras' };
        }
        return { valido: true };
    },

    validarEmail: (email) => {
        if (!email) {
            return { valido: false, mensaje: 'El email es requerido' };
        }
        // Validación de email sin dependencias
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            return { valido: false, mensaje: 'El formato del email es inválido' };
        }
        if (email.length > 100) {
            return { valido: false, mensaje: 'El email no puede exceder 100 caracteres' };
        }
        return { valido: true };
    },

    validarTelefono: (telefono) => {
        if (telefono && telefono.trim() !== '') {
            // Eliminar guiones y espacios para validar
            const telefonoLimpio = telefono.replace(/[-\s]/g, '');
            if (!/^\d{8,15}$/.test(telefonoLimpio)) {
                return { valido: false, mensaje: 'El teléfono debe tener entre 8 y 15 dígitos' };
            }
        }
        return { valido: true };
    },

    validarAsunto: (asunto) => {
        if (!asunto || asunto.trim().length < 3) {
            return { valido: false, mensaje: 'El asunto debe tener al menos 3 caracteres' };
        }
        if (asunto.length > 200) {
            return { valido: false, mensaje: 'El asunto no puede exceder 200 caracteres' };
        }
        return { valido: true };
    },

    validarMensaje: (mensaje) => {
        if (!mensaje || mensaje.trim().length < 10) {
            return { valido: false, mensaje: 'El mensaje debe tener al menos 10 caracteres' };
        }
        if (mensaje.length > 2000) {
            return { valido: false, mensaje: 'El mensaje no puede exceder 2000 caracteres' };
        }
        return { valido: true };
    }
};

/**
 * Sanitiza el texto para prevenir XSS (sin dependencias)
 */
const sanitizarTexto = (texto) => {
    if (!texto) return '';
    
    // Reemplazar caracteres HTML especiales
    const mapeo = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return texto.trim().replace(/[&<>"'\/]/g, (char) => mapeo[char]);
};

/**
 * Normaliza email (sin dependencias)
 */
const normalizarEmail = (email) => {
    if (!email) return '';
    return email.trim().toLowerCase();
};

/**
 * Detecta y bloquea spam básico
 */
const esSpam = (data) => {
    const textoCompleto = `${data.nombre} ${data.email} ${data.asunto} ${data.mensaje}`.toLowerCase();
    
    // Palabras clave de spam comunes
    const palabrasSpam = [
        'viagra', 'casino', 'lottery', 'bitcoin', 'cryptocurrency',
        'click here', 'buy now', 'limited offer', 'act now',
        'congratulations', 'winner', 'prize', 'earn money',
        'work from home', 'no experience', 'guaranteed'
    ];

    for (const palabra of palabrasSpam) {
        if (textoCompleto.includes(palabra)) {
            return true;
        }
    }

    // Detectar múltiples URLs (posible spam)
    const urlCount = (textoCompleto.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
        return true;
    }

    return false;
};

/**
 * Rate limiting simple (en memoria)
 * En producción, usar Redis o similar
 */
const rateLimitMap = new Map();

const verificarRateLimit = (ip) => {
    const ahora = Date.now();
    const limite = 5; // 5 mensajes
    const ventana = 60 * 60 * 1000; // 1 hora

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const intentos = rateLimitMap.get(ip);
    
    // Limpiar intentos antiguos
    const intentosRecientes = intentos.filter(tiempo => ahora - tiempo < ventana);
    
    if (intentosRecientes.length >= limite) {
        return {
            permitido: false,
            mensaje: 'Has alcanzado el límite de mensajes. Por favor intenta más tarde.'
        };
    }

    intentosRecientes.push(ahora);
    rateLimitMap.set(ip, intentosRecientes);
    
    return { permitido: true };
};

/**
 * Envía mensaje de contacto
 */
const enviar_mensaje_contacto = async (req, res) => {
    try {
        // Obtener IP del cliente
        const ip = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;

        // Verificar rate limiting
        const rateLimit = verificarRateLimit(ip);
        if (!rateLimit.permitido) {
            return res.status(429).send({
                success: false,
                message: rateLimit.mensaje
            });
        }

        let data = req.body;

        // Validar que los datos existan
        if (!data) {
            return res.status(400).send({
                success: false,
                message: 'No se recibieron datos'
            });
        }

        // Validar cada campo
        const validacionNombre = validaciones.validarNombre(data.nombre);
        if (!validacionNombre.valido) {
            return res.status(400).send({
                success: false,
                message: validacionNombre.mensaje
            });
        }

        const validacionEmail = validaciones.validarEmail(data.email);
        if (!validacionEmail.valido) {
            return res.status(400).send({
                success: false,
                message: validacionEmail.mensaje
            });
        }

        const validacionTelefono = validaciones.validarTelefono(data.telefono);
        if (!validacionTelefono.valido) {
            return res.status(400).send({
                success: false,
                message: validacionTelefono.mensaje
            });
        }

        const validacionAsunto = validaciones.validarAsunto(data.asunto);
        if (!validacionAsunto.valido) {
            return res.status(400).send({
                success: false,
                message: validacionAsunto.mensaje
            });
        }

        const validacionMensaje = validaciones.validarMensaje(data.mensaje);
        if (!validacionMensaje.valido) {
            return res.status(400).send({
                success: false,
                message: validacionMensaje.mensaje
            });
        }

        // Detectar spam
        if (esSpam(data)) {
            console.log('Mensaje detectado como spam:', { ip, email: data.email });
            return res.status(400).send({
                success: false,
                message: 'Tu mensaje fue detectado como spam. Si crees que esto es un error, contacta con soporte.'
            });
        }

        // Sanitizar datos
        const datosLimpios = {
            nombre: sanitizarTexto(data.nombre),
            email: normalizarEmail(data.email),
            telefono: data.telefono ? sanitizarTexto(data.telefono) : '',
            asunto: sanitizarTexto(data.asunto),
            mensaje: sanitizarTexto(data.mensaje),
            estado: 'pendiente',
            ip_address: ip,
            user_agent: req.headers['user-agent'] || ''
        };

        // Si el usuario está autenticado, agregar su ID
        if (req.user && req.user.sub) {
            datosLimpios.cliente = req.user.sub;
        }

        // Guardar en la base de datos
        const registro = await Contacto.create(datosLimpios);

        // Log para auditoría
        console.log('Nuevo mensaje de contacto:', {
            id: registro._id,
            email: registro.email,
            ip: ip,
            fecha: new Date()
        });

        return res.status(200).send({
            success: true,
            message: 'Tu mensaje ha sido enviado correctamente. Te responderemos pronto.',
            data: {
                id: registro._id,
                fecha: registro.createdAt
            }
        });

    } catch (error) {
        console.error('Error en enviar_mensaje_contacto:', error);
        
        // Errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message);
            return res.status(400).send({
                success: false,
                message: mensajes.join(', ')
            });
        }

        return res.status(500).send({
            success: false,
            message: 'Error al procesar tu mensaje. Por favor intenta nuevamente.'
        });
    }
};

/**
 * Obtiene todos los mensajes de contacto (solo admin)
 */
const listar_mensajes_admin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permisos para acceder a esta información'
            });
        }

        const { estado, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        let filtro = {};
        if (estado && ['pendiente', 'leido', 'respondido', 'cerrado'].includes(estado)) {
            filtro.estado = estado;
        }

        const mensajes = await Contacto.find(filtro)
            .populate('cliente', 'nombres apellidos email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Contacto.countDocuments(filtro);

        return res.status(200).send({
            success: true,
            data: mensajes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error en listar_mensajes_admin:', error);
        return res.status(500).send({
            success: false,
            message: 'Error al obtener los mensajes'
        });
    }
};

module.exports = {
    enviar_mensaje_contacto,
    listar_mensajes_admin
};