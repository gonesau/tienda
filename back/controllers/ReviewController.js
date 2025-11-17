// back/controllers/ReviewController.js
'use strict';

var Review = require('../models/review');
var DetalleVenta = require('../models/dventas');
var Venta = require('../models/ventas');
var Producto = require('../models/producto');

/**
 * Crea una nueva reseña de producto
 */
const crear_review = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: undefined 
        });
    }

    try {
        let data = req.body;

        // Validaciones básicas
        if (!data.producto || !data.venta) {
            return res.status(400).send({ 
                message: 'Datos incompletos',
                data: undefined 
            });
        }

        if (!data.review || data.review.trim().length < 10) {
            return res.status(400).send({ 
                message: 'La reseña debe tener al menos 10 caracteres',
                data: undefined 
            });
        }

        if (!data.rating || data.rating < 1 || data.rating > 5) {
            return res.status(400).send({ 
                message: 'La calificación debe estar entre 1 y 5',
                data: undefined 
            });
        }

        // Verificar que la venta existe y pertenece al cliente
        const venta = await Venta.findById(data.venta);
        
        if (!venta) {
            return res.status(404).send({ 
                message: 'Venta no encontrada',
                data: undefined 
            });
        }

        if (venta.cliente.toString() !== req.user.sub) {
            return res.status(403).send({ 
                message: 'No tienes permiso para reseñar esta compra',
                data: undefined 
            });
        }

        // Verificar que el producto existe en esa venta
        const detalleVenta = await DetalleVenta.findOne({
            venta: data.venta,
            producto: data.producto
        });

        if (!detalleVenta) {
            return res.status(400).send({ 
                message: 'No has comprado este producto en esta orden',
                data: undefined 
            });
        }

        // Verificar que no exista ya una reseña del cliente para este producto en esta venta
        const reviewExistente = await Review.findOne({
            cliente: req.user.sub,
            producto: data.producto,
            venta: data.venta
        });

        if (reviewExistente) {
            return res.status(400).send({ 
                message: 'Ya has dejado una reseña para este producto en esta orden',
                data: undefined 
            });
        }

        // Crear la reseña
        const reviewData = {
            producto: data.producto,
            cliente: req.user.sub,
            venta: data.venta,
            review: data.review.trim(),
            rating: parseInt(data.rating)
        };

        const review = await Review.create(reviewData);

        // Actualizar estadísticas del producto
        await actualizarEstadisticasProducto(data.producto);

        // Poblar datos para respuesta
        const reviewCompleta = await Review.findById(review._id)
            .populate('cliente', 'nombres apellidos')
            .populate('producto', 'titulo');

        return res.status(200).send({ 
            message: 'Reseña creada exitosamente',
            data: reviewCompleta 
        });

    } catch (error) {
        console.error('Error creando reseña:', error);
        return res.status(500).send({ 
            message: 'Error al crear la reseña',
            data: undefined 
        });
    }
};

/**
 * Lista las reseñas de un producto
 */
const listar_reviews_producto = async function(req, res) {
    try {
        const productoId = req.params['id'];

        if (!productoId) {
            return res.status(400).send({ 
                message: 'ID de producto requerido',
                data: undefined 
            });
        }

        // Verificar que el producto existe
        const producto = await Producto.findById(productoId);
        
        if (!producto) {
            return res.status(404).send({ 
                message: 'Producto no encontrado',
                data: undefined 
            });
        }

        // Obtener reseñas
        const reviews = await Review.find({ producto: productoId })
            .populate('cliente', 'nombres apellidos')
            .sort({ createdAt: -1 });

        // Calcular estadísticas
        const estadisticas = await calcularEstadisticasReviews(productoId);

        return res.status(200).send({ 
            data: reviews,
            estadisticas: estadisticas
        });

    } catch (error) {
        console.error('Error listando reseñas:', error);
        return res.status(500).send({ 
            message: 'Error al obtener las reseñas',
            data: [] 
        });
    }
};

/**
 * Verifica si el cliente puede reseñar un producto específico de una orden
 */
const verificar_puede_resenar = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            puede_resenar: false 
        });
    }

    try {
        const { producto, venta } = req.params;

        if (!producto || !venta) {
            return res.status(400).send({ 
                message: 'Parámetros incompletos',
                puede_resenar: false 
            });
        }

        // Verificar que la venta pertenece al cliente
        const ventaData = await Venta.findById(venta);
        
        if (!ventaData || ventaData.cliente.toString() !== req.user.sub) {
            return res.status(403).send({ 
                message: 'Venta no válida',
                puede_resenar: false 
            });
        }

        // Verificar que el producto está en la venta
        const detalleVenta = await DetalleVenta.findOne({
            venta: venta,
            producto: producto
        });

        if (!detalleVenta) {
            return res.status(400).send({ 
                message: 'Producto no encontrado en esta orden',
                puede_resenar: false 
            });
        }

        // Verificar si ya existe una reseña
        const reviewExistente = await Review.findOne({
            cliente: req.user.sub,
            producto: producto,
            venta: venta
        });

        if (reviewExistente) {
            return res.status(200).send({ 
                puede_resenar: false,
                mensaje: 'Ya has dejado una reseña para este producto',
                review_existente: reviewExistente
            });
        }

        return res.status(200).send({ 
            puede_resenar: true,
            mensaje: 'Puedes dejar una reseña'
        });

    } catch (error) {
        console.error('Error verificando permisos:', error);
        return res.status(500).send({ 
            message: 'Error al verificar permisos',
            puede_resenar: false 
        });
    }
};

/**
 * Obtiene las reseñas de un cliente
 */
const obtener_reviews_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: [] 
        });
    }

    try {
        const clienteId = req.params['id'];

        // Verificar que el cliente solo puede ver sus propias reseñas
        if (req.user.sub !== clienteId) {
            return res.status(403).send({ 
                message: 'No tienes permiso',
                data: [] 
            });
        }

        const reviews = await Review.find({ cliente: clienteId })
            .populate('producto', 'titulo portada slug')
            .populate('venta', 'nventa')
            .sort({ createdAt: -1 });

        return res.status(200).send({ 
            data: reviews 
        });

    } catch (error) {
        console.error('Error obteniendo reseñas del cliente:', error);
        return res.status(500).send({ 
            message: 'Error al obtener las reseñas',
            data: [] 
        });
    }
};

/**
 * Actualiza estadísticas del producto basadas en sus reseñas
 */
async function actualizarEstadisticasProducto(productoId) {
    try {
        const reviews = await Review.find({ producto: productoId });
        
        if (reviews.length === 0) {
            await Producto.findByIdAndUpdate(productoId, {
                rating_promedio: 0,
                total_reviews: 0
            });
            return;
        }

        const sumaRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        const promedio = sumaRatings / reviews.length;

        await Producto.findByIdAndUpdate(productoId, {
            rating_promedio: parseFloat(promedio.toFixed(1)),
            total_reviews: reviews.length
        });

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

/**
 * Calcula estadísticas detalladas de las reseñas
 */
async function calcularEstadisticasReviews(productoId) {
    try {
        const reviews = await Review.find({ producto: productoId });
        
        if (reviews.length === 0) {
            return {
                total: 0,
                promedio: 0,
                distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            };
        }

        const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sumaRatings = 0;

        reviews.forEach(review => {
            distribucion[review.rating]++;
            sumaRatings += review.rating;
        });

        const promedio = sumaRatings / reviews.length;

        return {
            total: reviews.length,
            promedio: parseFloat(promedio.toFixed(1)),
            distribucion: distribucion
        };

    } catch (error) {
        console.error('Error calculando estadísticas:', error);
        return {
            total: 0,
            promedio: 0,
            distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }
}

module.exports = {
    crear_review,
    listar_reviews_producto,
    verificar_puede_resenar,
    obtener_reviews_cliente
};