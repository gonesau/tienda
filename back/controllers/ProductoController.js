'use strict';

var Product = require('../models/producto');

const registro_producto_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){
            let data = req.body;
            console.log('Body:', data);
            console.log('Files:', req.files); 
            res.status(200).send({ message: 'Producto recibido', data });
        } else {
            res.status(500).send({message: 'NoAccess'});
        }
    } else {
        res.status(500).send({message: 'NoAccess'});
    }
}


module.exports = {
    registro_producto_admin
};