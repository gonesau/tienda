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

    const urlCount = (textoCompleto.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
        return true;
    }

    return false;
};

/**
 * Rate limiting simple (en memoria)
 */
const rateLimitMap = new Map();

const verificarRateLimit = (ip) => {
    const ahora = Date.now();
    const limite = 5;
    const ventana = 60 * 60 * 1000;

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const intentos = rateLimitMap.get(ip);
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
 * Envía mensaje de contacto (PÚBLICO)
 */
const enviar_mensaje_contacto = async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;

        const rateLimit = verificarRateLimit(ip);
        if (!rateLimit.permitido) {
            return res.status(429).send({
                success: false,
                message: rateLimit.mensaje
            });
        }

        let data = req.body;

        if (!data) {
            return res.status(400).send({
                success: false,
                message: 'No se recibieron datos'
            });
        }

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

        if (esSpam(data)) {
            console.log('Mensaje detectado como spam:', { ip, email: data.email });
            return res.status(400).send({
                success: false,
                message: 'Tu mensaje fue detectado como spam. Si crees que esto es un error, contacta con soporte.'
            });
        }

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

        if (req.user && req.user.sub) {
            datosLimpios.cliente = req.user.sub;
        }

        const registro = await Contacto.create(datosLimpios);

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
 * Obtiene todos los mensajes de contacto (ADMIN)
 */
const listar_mensajes_admin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permisos para acceder a esta información'
            });
        }

        const { filtro, estado, page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        // Filtro por estado
        if (estado && ['pendiente', 'leido', 'respondido', 'cerrado'].includes(estado)) {
            query.estado = estado;
        }

        // Filtro por texto (nombre, email, asunto, mensaje)
        if (filtro && filtro.trim() !== '') {
            query.$or = [
                { nombre: new RegExp(filtro, 'i') },
                { email: new RegExp(filtro, 'i') },
                { asunto: new RegExp(filtro, 'i') },
                { mensaje: new RegExp(filtro, 'i') }
            ];
        }

        const mensajes = await Contacto.find(query)
            .populate('cliente', 'nombres apellidos email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Contacto.countDocuments(query);

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

/**
 * Obtiene un mensaje específico (ADMIN)
 */
const obtener_mensaje_admin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permisos para acceder a esta información'
            });
        }

        const id = req.params['id'];

        const mensaje = await Contacto.findById(id)
            .populate('cliente', 'nombres apellidos email telefono');

        if (!mensaje) {
            return res.status(404).send({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        return res.status(200).send({
            success: true,
            data: mensaje
        });

    } catch (error) {
        console.error('Error en obtener_mensaje_admin:', error);
        return res.status(500).send({
            success: false,
            message: 'Error al obtener el mensaje'
        });
    }
};

/**
 * Actualiza el estado de un mensaje (ADMIN)
 */
const actualizar_estado_mensaje_admin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        const id = req.params['id'];
        const { estado } = req.body;

        // Validar estado
        const estadosValidos = ['pendiente', 'leido', 'respondido', 'cerrado'];
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).send({
                success: false,
                message: 'Estado inválido'
            });
        }

        const mensaje = await Contacto.findByIdAndUpdate(
            id,
            { estado },
            { new: true }
        );

        if (!mensaje) {
            return res.status(404).send({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        return res.status(200).send({
            success: true,
            message: 'Estado actualizado correctamente',
            data: mensaje
        });

    } catch (error) {
        console.error('Error en actualizar_estado_mensaje_admin:', error);
        return res.status(500).send({
            success: false,
            message: 'Error al actualizar el estado'
        });
    }
};

/**
 * Elimina un mensaje (ADMIN)
 */
const eliminar_mensaje_admin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        const id = req.params['id'];

        const mensaje = await Contacto.findByIdAndDelete(id);

        if (!mensaje) {
            return res.status(404).send({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        return res.status(200).send({
            success: true,
            message: 'Mensaje eliminado correctamente',
            data: mensaje
        });

    } catch (error) {
        console.error('Error en eliminar_mensaje_admin:', error);
        return res.status(500).send({
            success: false,
            message: 'Error al eliminar el mensaje'
        });
    }
};

module.exports = {
    enviar_mensaje_contacto,
    listar_mensajes_admin,
    obtener_mensaje_admin,
    actualizar_estado_mensaje_admin,
    eliminar_mensaje_admin
};