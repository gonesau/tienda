var Venta = require('../models/ventas');
var DetalleVenta = require('../models/dventas');
var Carrito = require('../models/carrito');
var Producto = require('../models/producto');
var Config = require('../models/config');

/**
 * Registra una nueva compra del cliente
 */
const registro_compra_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: undefined 
        });
    }

    try {
        var data = req.body;

        // Validaciones básicas
        if (!data.detalles || data.detalles.length === 0) {
            return res.status(400).send({ 
                message: 'No hay productos en el carrito',
                data: undefined 
            });
        }

        if (!data.direccion) {
            return res.status(400).send({ 
                message: 'Debe especificar una dirección de envío',
                data: undefined 
            });
        }

        if (!data.transaccion) {
            return res.status(400).send({ 
                message: 'No se ha recibido la transacción de PayPal',
                data: undefined 
            });
        }

        // Obtener configuración para el número de venta
        let config = await Config.findById({ _id: "68daa75d1e1062bf51932fa2" });
        
        if (!config) {
            return res.status(500).send({ 
                message: 'Error al obtener configuración del sistema',
                data: undefined 
            });
        }

        // Generar número de venta
        let correlativo = parseInt(config.correlativo) + 1;
        let nventa = config.serie + '-' + correlativo.toString().padStart(7, '0');

        // Crear objeto de venta
        let ventaData = {
            cliente: data.cliente,
            nventa: nventa,
            subtotal: data.subtotal,
            envio_titulo: data.envio_titulo,
            envio_precio: data.envio_precio,
            transaccion: data.transaccion,
            cupon: data.cupon || null,
            estado: 'Procesando',
            direccion: data.direccion,
            nota: data.nota || ''
        };

        // Crear la venta
        let venta = await Venta.create(ventaData);

        // Array para los detalles
        let detalles_guardados = [];

        // Procesar cada detalle de venta
        for (let detalle of data.detalles) {
            // Validar stock del producto
            let producto = await Producto.findById(detalle.producto);
            
            if (!producto) {
                // Revertir venta si un producto no existe
                await Venta.findByIdAndDelete(venta._id);
                return res.status(400).send({ 
                    message: `Producto no encontrado`,
                    data: undefined 
                });
            }

            if (producto.stock < detalle.cantidad) {
                // Revertir venta si no hay stock suficiente
                await Venta.findByIdAndDelete(venta._id);
                return res.status(400).send({ 
                    message: `Stock insuficiente para ${producto.titulo}. Disponible: ${producto.stock}`,
                    data: undefined 
                });
            }

            // Crear detalle de venta
            let detalleData = {
                producto: detalle.producto,
                venta: venta._id,
                subtotal: detalle.subtotal,
                cantidad: detalle.cantidad,
                variedad: detalle.variedad || 'Estándar'
            };

            let detalleVenta = await DetalleVenta.create(detalleData);
            detalles_guardados.push(detalleVenta);

            // Actualizar stock del producto
            await Producto.findByIdAndUpdate(
                producto._id,
                {
                    $inc: { 
                        stock: -detalle.cantidad,
                        nventas: detalle.cantidad 
                    }
                }
            );

            // Eliminar producto del carrito
            await Carrito.findByIdAndDelete(detalle._id);
        }

        // Actualizar correlativo en la configuración
        await Config.findByIdAndUpdate(
            { _id: "68daa75d1e1062bf51932fa2" },
            { correlativo: correlativo.toString() }
        );

        // Emitir evento de socket si está disponible
        if (req.io) {
            req.io.emit('nueva-venta', { 
                venta: venta,
                detalles: detalles_guardados,
                cliente: data.cliente 
            });
        }

        res.status(200).send({ 
            message: 'Compra realizada exitosamente',
            venta: venta, 
            detalles: detalles_guardados 
        });

    } catch (error) {
        console.error('Error procesando compra:', error);
        res.status(500).send({ 
            message: 'Error al procesar la compra',
            data: undefined,
            error: error.message 
        });
    }
}

module.exports = {
    registro_compra_cliente
}