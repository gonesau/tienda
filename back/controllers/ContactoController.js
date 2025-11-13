'use strict';
var Contacto = require('../models/contacto');

const enviar_mensaje_contacto = async (req, res) => {
    let data = req.body;
    let reg = await Contacto.create(data);
    res.status(200).send({ data: reg });
}

module.exports = {
    enviar_mensaje_contacto
};