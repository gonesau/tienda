// back/controllers/VentaController.js - ACTUALIZACIÓN PARA DESCUENTOS
var Venta = require('../models/ventas');
var DetalleVenta = require('../models/dventas');
var Carrito = require('../models/carrito');
var Producto = require('../models/producto');
var Config = require('../models/config');
var Cupon = require('../models/cupon');
var Descuento = require('../models/descuento');
const { generar_comprobante_pdf } = require('./PdfGenerator');

/**
 * Obtiene el descuento activo actual
 */
const obtener_descuento_aplicable = async function() {
    let descuentos = await Descuento.find().sort({createdAt:-1});
    var today = Date.parse(new Date().toISOString())/1000;

    for(let element of descuentos) {
        var fecha_inicio = Date.parse(element.fecha_inicio)/1000;
        var fecha_fin = Date.parse(element.fecha_fin)/1000;
        
        if(today >= fecha_inicio && today <= fecha_fin){
            return element;
        }
    }
    
    return null;
}

/**
 * Calcula precio con descuento
 */
const calcular_precio_con_descuento = function(precio, descuento_porcentaje) {
    if (!descuento_porcentaje || descuento_porcentaje <= 0) return precio;
    
    const precio_descuento = precio - (precio * (descuento_porcentaje / 100));
    return parseFloat(precio_descuento.toFixed(2));
}

/**
 * Registra una nueva compra del cliente - ACTUALIZADO CON DESCUENTOS
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

        // ============================================
        // 1. VALIDACIONES BÁSICAS
        // ============================================
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

        // ============================================
        // 2. OBTENER DESCUENTO ACTIVO
        // ============================================
        const descuento_activo = await obtener_descuento_aplicable();
        const tiene_descuento = !!descuento_activo;
        const porcentaje_descuento = tiene_descuento ? descuento_activo.descuento : 0;

        // ============================================
        // 3. OBTENER CONFIGURACIÓN PARA NÚMERO DE VENTA
        // ============================================
        let config = await Config.findById({ _id: "68daa75d1e1062bf51932fa2" });
        
        if (!config) {
            return res.status(500).send({ 
                message: 'Error al obtener configuración del sistema',
                data: undefined 
            });
        }

        // Generar número de venta único
        let correlativo = parseInt(config.correlativo) + 1;
        let nventa = config.serie + '-' + correlativo.toString().padStart(7, '0');

        // ============================================
        // 4. CALCULAR SUBTOTAL CON DESCUENTO
        // ============================================
        let subtotal_productos = 0;
        let subtotal_sin_descuento = 0;
        let ahorro_descuento = 0;
        
        for (let detalle of data.detalles) {
            let producto = await Producto.findById(detalle.producto);
            
            if (!producto) {
                return res.status(400).send({ 
                    message: `Producto no encontrado`,
                    data: undefined 
                });
            }

            // Validar stock
            if (producto.stock < detalle.cantidad) {
                return res.status(400).send({ 
                    message: `Stock insuficiente para ${producto.titulo}. Disponible: ${producto.stock}`,
                    data: undefined 
                });
            }

            // Calcular precio con descuento si aplica
            const precio_original = producto.precio;
            const precio_final = tiene_descuento 
                ? calcular_precio_con_descuento(precio_original, porcentaje_descuento)
                : precio_original;

            subtotal_sin_descuento += (precio_original * detalle.cantidad);
            subtotal_productos += (precio_final * detalle.cantidad);
        }

        ahorro_descuento = subtotal_sin_descuento - subtotal_productos;

        // ============================================
        // 5. PROCESAR CUPÓN DE DESCUENTO (SI EXISTE)
        // ============================================
        let descuento_cupon = 0;
        let cupon_codigo = null;

        if (data.cupon && data.cupon.trim() !== '') {
            let cupon = await Cupon.findOne({ 
                codigo: data.cupon.trim().toUpperCase() 
            });

            if (!cupon) {
                return res.status(400).send({ 
                    message: 'El cupón ingresado no existe',
                    data: undefined 
                });
            }

            // Validar límite de usos
            if (cupon.limite <= 0) {
                return res.status(400).send({ 
                    message: 'Este cupón ya no tiene usos disponibles',
                    data: undefined 
                });
            }

            // Calcular descuento según tipo (sobre el precio YA con descuento)
            if (cupon.tipo === 'Porcentaje') {
                descuento_cupon = subtotal_productos * (cupon.valor / 100);
            } else if (cupon.tipo === 'Valor fijo') {
                descuento_cupon = cupon.valor;
            }

            // Validar que el descuento no sea mayor al subtotal
            if (descuento_cupon > subtotal_productos) {
                descuento_cupon = subtotal_productos;
            }

            cupon_codigo = cupon.codigo;

            // Reducir límite del cupón
            await Cupon.findByIdAndUpdate(cupon._id, {
                $inc: { limite: -1 }
            });
        }

        // ============================================
        // 6. CALCULAR TOTAL FINAL
        // ============================================
        let subtotal_con_cupón = subtotal_productos - descuento_cupon;
        let precio_envio = parseFloat(data.envio_precio) || 0;
        let total_final = subtotal_con_cupón + precio_envio;

        // ============================================
        // 7. CREAR OBJETO DE VENTA
        // ============================================
        let ventaData = {
            cliente: data.cliente,
            nventa: nventa,
            subtotal: total_final, // Total final incluyendo envío
            envio_titulo: data.envio_titulo,
            envio_precio: precio_envio,
            transaccion: data.transaccion,
            cupon: cupon_codigo,
            estado: 'Procesando',
            direccion: data.direccion,
            nota: data.nota || '',
            // Campos adicionales para descuentos
            descuento_porcentaje: porcentaje_descuento,
            descuento_promocion: tiene_descuento ? descuento_activo._id : null,
            ahorro_total: ahorro_descuento + descuento_cupon
        };

        // ============================================
        // 8. CREAR LA VENTA
        // ============================================
        let venta = await Venta.create(ventaData);

        // ============================================
        // 9. PROCESAR CADA DETALLE DE VENTA
        // ============================================
        let detalles_guardados = [];

        for (let detalle of data.detalles) {
            let producto = await Producto.findById(detalle.producto);

            // Calcular precio final con descuento
            const precio_original = producto.precio;
            const precio_con_descuento = tiene_descuento 
                ? calcular_precio_con_descuento(precio_original, porcentaje_descuento)
                : precio_original;

            // Crear detalle de venta
            let detalleData = {
                producto: detalle.producto,
                venta: venta._id,
                subtotal: precio_con_descuento * detalle.cantidad,
                cantidad: detalle.cantidad,
                variedad: detalle.variedad || 'Estándar',
                precio_unitario: precio_con_descuento,
                precio_original: precio_original
            };

            let detalleVenta = await DetalleVenta.create(detalleData);
            detalles_guardados.push(detalleVenta);

            // Actualizar stock y ventas del producto
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

        // ============================================
        // 10. ACTUALIZAR CORRELATIVO EN CONFIGURACIÓN
        // ============================================
        await Config.findByIdAndUpdate(
            { _id: "68daa75d1e1062bf51932fa2" },
            { correlativo: correlativo.toString() }
        );

        // ============================================
        // 11. EMITIR EVENTO DE SOCKET (SI ESTÁ DISPONIBLE)
        // ============================================
        if (req.io) {
            req.io.emit('nueva-venta', { 
                venta: venta,
                detalles: detalles_guardados,
                cliente: data.cliente 
            });
        }

        // ============================================
        // 12. RESPUESTA EXITOSA
        // ============================================
        res.status(200).send({ 
            message: 'Compra realizada exitosamente',
            venta: venta, 
            detalles: detalles_guardados,
            descuento_aplicado: descuento_cupon,
            ahorro_promocion: ahorro_descuento,
            ahorro_total: ahorro_descuento + descuento_cupon
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

/**
 * Valida un cupón de descuento
 */
const validar_cupon_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: undefined 
        });
    }

    try {
        const { codigo } = req.body;

        if (!codigo || codigo.trim() === '') {
            return res.status(400).send({ 
                message: 'Debe ingresar un código de cupón',
                data: undefined 
            });
        }

        let cupon = await Cupon.findOne({ 
            codigo: codigo.trim().toUpperCase() 
        });

        if (!cupon) {
            return res.status(404).send({ 
                message: 'El cupón ingresado no existe',
                data: undefined 
            });
        }

        if (cupon.limite <= 0) {
            return res.status(400).send({ 
                message: 'Este cupón ya no tiene usos disponibles',
                data: undefined 
            });
        }

        res.status(200).send({ 
            message: 'Cupón válido',
            data: cupon 
        });

    } catch (error) {
        console.error('Error validando cupón:', error);
        res.status(500).send({ 
            message: 'Error al validar el cupón',
            data: undefined 
        });
    }
}

module.exports = {
    registro_compra_cliente,
    validar_cupon_cliente,
    generar_comprobante_pdf,
    obtener_descuento_aplicable,
    calcular_precio_con_descuento
}