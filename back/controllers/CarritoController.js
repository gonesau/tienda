var carrito = require('../models/carrito');

const agregar_carrito_cliente = async function (req, res) {
    if (req.user) {
        let data = req.body;
        let carrito_cliente = await carrito.find({ cliente: data.cliente, producto: data.producto });

        if (carrito_cliente.length == 0) {
            let reg = await carrito.create(data);
            res.status(200).send({ data: reg });
        } else if(carrito_cliente.length >= 1) {
            res.status(200).send({data:undefined});
        }

    } else {
        res.status(500).send({ message: 'No autorizado' });
    }
}


const obtener_carrito_cliente = async function (req, res) {
        if (req.user) {
        let id = req.params['id'];
        let carrito_cliente = await carrito.find({ cliente: id }).populate('producto').exec();
        res.status(200).send({ data: carrito_cliente });

    } else {
        res.status(500).send({ message: 'No autorizado' });
    }
}

module.exports = {
    agregar_carrito_cliente,
    obtener_carrito_cliente
}