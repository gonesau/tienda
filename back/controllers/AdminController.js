'use strict';
var Admin = require('../models/admin');
var bcrypt = require('bcrypt-nodejs');

const registro_admin = async (req, res) => {
    var data = req.body;
    var admins_arr = [];
    admins_arr = await Admin.find({email: data.email});

    if (admins_arr.length == 0) {
        if (data.password) {
            bcrypt.hash(data.password, null, null, async function(err,hash) {
                if(hash){
                    data.password = hash;
                    var reg = await Admin.create(data);
                    res.status(200).send({data: reg});
                }else{
                    res.status(500).send({message: 'Error al encriptar la contraseña', data: undefined}); // No se envía el objeto data porque no es necesario
                }
            })
        }else{
            res.status(400).send({message: 'La contraseña es obligatoria', data:undefined});// No se envía el objeto data porque no es necesario
        }
    } else {
        res.status(400).send({message: 'El Admin ya existe en la base de datos', data: undefined}); // No se envía el objeto data porque no es necesario
    }
}

module.exports = {
    registro_admin
};