var Venta = require('../models/Venta');
var DetalleVenta = require('../models/dventas');



const registro_compra_cliente = async function(req, res){
    if(req.user){
        var data = req.body;
        var detalles = data.detalles;
        var d_detalles = [];

        let veta = await Venta.create(data);
        detalles.forEach(async element => {
            element.venta = veta._id;
            d_detalles.push(await DetalleVenta.create(element));
        });


        res.status(200).send({venta: venta, detalles: d_detalles});
    } else {
        res.status(500).send({message: 'No Acceso'});
    }   
}


module.exports = {
    registro_compra_cliente
}
