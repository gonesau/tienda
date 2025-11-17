"use strict";

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "gonesau";

exports.auth = function(req, res, next) {
    if (!req.headers.authorization && !req.query.token) {
        return res.status(403).send({
            message: 'No autorizado - No se proporcionó token'
        });
    }

    // Intentar obtener token de headers o query params
    let token = req.headers.authorization || req.query.token;

    // Limpiar el token si viene con el prefijo "Bearer"
    if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
    }

    // Verificar que el token no esté vacío
    if (!token || token.trim() === '') {
        return res.status(403).send({
            message: 'No autorizado - Token inválido'
        });
    }

    try {
        // Decodificar el token
        var payload = jwt.decode(token, secret);
        
        // Verificar si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                message: 'Token expirado - Por favor inicia sesión nuevamente'
            });
        }

        // Si todo está bien, adjuntar el payload al request
        req.user = payload;
        next();
    } catch (ex) {
        console.error('Error decodificando token:', ex.message);
        return res.status(403).send({
            message: 'No autorizado - Token inválido o corrupto'
        });
    }
};
