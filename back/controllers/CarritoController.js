'use strict';

var carrito = require('../models/carrito');

const agregar_carrito_cliente = async function (req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'Por favor inicia sesión para continuar',
            data: undefined 
        });
    }

    try {
        let data = req.body;

        // Validar datos requeridos
        if (!data.cliente || !data.producto) {
            return res.status(400).send({ 
                message: 'Datos incompletos',
                data: undefined 
            });
        }

        // Verificar si el producto ya existe en el carrito
        let carrito_existente = await carrito.findOne({ 
            cliente: data.cliente, 
            producto: data.producto,
            variedad: data.variedad 
        });

        if (carrito_existente) {
            return res.status(200).send({ 
                message: 'Este producto ya está en tu carrito',
                data: undefined 
            });
        }

        // Crear nuevo item en el carrito
        let reg = await carrito.create(data);
        let carrito_completo = await carrito.findById(reg._id).populate('producto').exec();

        // Emitir evento de socket
        if (req.io) {
            req.io.emit('new-carrito-add', { 
                data: carrito_completo,
                cliente: data.cliente 
            });
        }

        return res.status(200).send({ 
            message: 'Producto agregado al carrito',
            data: carrito_completo 
        });

    } catch (error) {
        console.error('Error agregando al carrito:', error);
        return res.status(500).send({ 
            message: 'Error al agregar el producto',
            data: undefined 
        });
    }
}

const obtener_carrito_cliente = async function (req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'Por favor inicia sesión para continuar',
            data: [] 
        });
    }

    try {
        let id = req.params['id'];

        // Validar que el usuario solo pueda ver su propio carrito
        if (req.user.sub !== id) {
            return res.status(403).send({ 
                message: 'No tienes permiso para ver este carrito',
                data: [] 
            });
        }

        let carrito_cliente = await carrito.find({ cliente: id })
            .populate('producto')
            .sort({ createdAt: -1 })
            .exec();

        return res.status(200).send({ 
            data: carrito_cliente 
        });

    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        return res.status(500).send({ 
            message: 'Error al obtener el carrito',
            data: [] 
        });
    }
}

const eliminar_carrito_cliente = async function (req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'Por favor inicia sesión para continuar',
            data: undefined 
        });
    }

    try {
        let id = req.params['id'];

        // Buscar el item antes de eliminarlo para validar permisos
        let item_carrito = await carrito.findById(id);
        
        if (!item_carrito) {
            return res.status(404).send({ 
                message: 'Producto no encontrado en el carrito',
                data: undefined 
            });
        }

        // Validar que el usuario solo pueda eliminar de su propio carrito
        if (req.user.sub !== item_carrito.cliente.toString()) {
            return res.status(403).send({ 
                message: 'No tienes permiso para eliminar este producto',
                data: undefined 
            });
        }

        // Eliminar el item
        let carrito_eliminado = await carrito.findByIdAndDelete(id);

        // Emitir evento de socket
        if (req.io) {
            req.io.emit('delete-carrito', { 
                data: carrito_eliminado,
                cliente: item_carrito.cliente 
            });
        }

        return res.status(200).send({ 
            message: 'Producto eliminado del carrito',
            data: carrito_eliminado 
        });

    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        return res.status(500).send({ 
            message: 'Error al eliminar el producto',
            data: undefined 
        });
    }
}

const actualizar_cantidad_carrito = async function (req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'Por favor inicia sesión para continuar',
            data: undefined 
        });
    }

    try {
        let id = req.params['id'];
        let { cantidad } = req.body;

        // Validar cantidad
        if (!cantidad || cantidad < 1) {
            return res.status(400).send({ 
                message: 'La cantidad debe ser al menos 1',
                data: undefined 
            });
        }

        // Buscar item del carrito
        let item_carrito = await carrito.findById(id).populate('producto');
        
        if (!item_carrito) {
            return res.status(404).send({ 
                message: 'Producto no encontrado en el carrito',
                data: undefined 
            });
        }

        // Validar permisos
        if (req.user.sub !== item_carrito.cliente.toString()) {
            return res.status(403).send({ 
                message: 'No tienes permiso para modificar este producto',
                data: undefined 
            });
        }

        // Validar stock disponible
        if (cantidad > item_carrito.producto.stock) {
            return res.status(400).send({ 
                message: `Solo hay ${item_carrito.producto.stock} unidades disponibles`,
                data: undefined 
            });
        }

        // Actualizar cantidad
        item_carrito.cantidad = cantidad;
        await item_carrito.save();

        let carrito_actualizado = await carrito.findById(id).populate('producto').exec();

        // Emitir evento de socket
        if (req.io) {
            req.io.emit('update-carrito', { 
                data: carrito_actualizado,
                cliente: item_carrito.cliente 
            });
        }

        return res.status(200).send({ 
            message: 'Cantidad actualizada',
            data: carrito_actualizado 
        });

    } catch (error) {
        console.error('Error actualizando cantidad:', error);
        return res.status(500).send({ 
            message: 'Error al actualizar la cantidad',
            data: undefined 
        });
    }
}

module.exports = {
    agregar_carrito_cliente,
    obtener_carrito_cliente,
    eliminar_carrito_cliente,
    actualizar_cantidad_carrito
}