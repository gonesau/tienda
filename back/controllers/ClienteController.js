'use strict';

var Cliente = require('../models/cliente');

const registro_cliente = async (req, res) => {
    //
    res.status(200).send({
        message: 'Controlador Cliente funcionando correctamente'
    });
}

module.exports = {
    registro_cliente
};