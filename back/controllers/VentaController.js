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
/**
 * Obtiene el descuento activo actual - VERSIÓN CORREGIDA
 */
const obtener_descuento_aplicable = async function() {
    try {
        let descuentos = await Descuento.find().sort({createdAt: -1});
        
        if (!descuentos || descuentos.length === 0) {
            console.log('No hay descuentos en la BD');
            return null;
        }

        // Fecha actual en formato ISO (sin conversión a timestamp)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Resetear a inicio del día para comparación limpia

        console.log('=== DEBUG DESCUENTOS ===');
        console.log('Fecha actual:', hoy.toISOString());
        console.log('Total descuentos encontrados:', descuentos.length);

        for (let descuento of descuentos) {
            // Las fechas vienen como strings del modelo, convertirlas a Date
            const fechaInicio = new Date(descuento.fecha_inicio);
            const fechaFin = new Date(descuento.fecha_fin);
            
            // Resetear horas para comparación de solo fechas
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setHours(23, 59, 59, 999); // Fin del día

            console.log('---');
            console.log('Descuento:', descuento.titulo);
            console.log('Porcentaje:', descuento.descuento + '%');
            console.log('Fecha inicio:', fechaInicio.toISOString());
            console.log('Fecha fin:', fechaFin.toISOString());
            console.log('¿Está activo?', hoy >= fechaInicio && hoy <= fechaFin);

            // Comparar usando objetos Date directamente
            if (hoy >= fechaInicio && hoy <= fechaFin) {
                console.log('✓ DESCUENTO ACTIVO ENCONTRADO:', descuento.titulo);
                return descuento;
            }
        }
        
        console.log('✗ No hay descuentos activos para la fecha actual');
        return null;
    } catch (error) {
        console.error('Error obteniendo descuento activo:', error);
        return null;
    }
}

/**
 * Calcula precio con descuento - VERSIÓN MEJORADA
 */
const calcular_precio_con_descuento = function(precio, descuento_porcentaje) {
    if (!descuento_porcentaje || descuento_porcentaje <= 0 || descuento_porcentaje > 100) {
        return precio;
    }
    
    const precio_descuento = precio - (precio * (descuento_porcentaje / 100));
    return parseFloat(precio_descuento.toFixed(2));
}

/**
 * Registra una nueva compra del cliente - CON DESCUENTOS CORREGIDOS
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

        console.log('=== INICIO PROCESAMIENTO COMPRA ===');

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

        console.log('Descuento activo:', tiene_descuento ? `${porcentaje_descuento}%` : 'NO');

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

            console.log(`Producto: ${producto.titulo}`);
            console.log(`  Precio original: $${precio_original}`);
            console.log(`  Precio con descuento: $${precio_final}`);
            console.log(`  Cantidad: ${detalle.cantidad}`);
            console.log(`  Subtotal: $${precio_final * detalle.cantidad}`);
        }

        ahorro_descuento = subtotal_sin_descuento - subtotal_productos;

        console.log('Subtotal sin descuento:', subtotal_sin_descuento);
        console.log('Subtotal con descuento:', subtotal_productos);
        console.log('Ahorro por descuento:', ahorro_descuento);

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

            console.log('Cupón aplicado:', cupon_codigo);
            console.log('Descuento cupón:', descuento_cupon);
        }

        // ============================================
        // 6. CALCULAR TOTAL FINAL
        // ============================================
        let subtotal_con_cupón = subtotal_productos - descuento_cupon;
        let precio_envio = parseFloat(data.envio_precio) || 0;
        let total_final = subtotal_con_cupón + precio_envio;

        console.log('Subtotal con cupón:', subtotal_con_cupón);
        console.log('Precio envío:', precio_envio);
        console.log('TOTAL FINAL:', total_final);

        // ============================================
        // 7. CREAR OBJETO DE VENTA
        // ============================================
        let ventaData = {
            cliente: data.cliente,
            nventa: nventa,
            subtotal: total_final,
            envio_titulo: data.envio_titulo,
            envio_precio: precio_envio,
            transaccion: data.transaccion,
            cupon: cupon_codigo,
            estado: 'Procesando',
            direccion: data.direccion,
            nota: data.nota || ''
        };

        // ============================================
        // 8. CREAR LA VENTA
        // ============================================
        let venta = await Venta.create(ventaData);
        console.log('Venta creada:', venta._id);

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
                variedad: detalle.variedad || 'Estándar'
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
        // 10. ACTUALIZAR CORRELATIVO
        // ============================================
        await Config.findByIdAndUpdate(
            { _id: "68daa75d1e1062bf51932fa2" },
            { correlativo: correlativo.toString() }
        );

        // ============================================
        // 11. EMITIR EVENTO DE SOCKET
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
        console.log('=== COMPRA COMPLETADA EXITOSAMENTE ===');
        
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


/**
 * Lista todas las ventas de un cliente con filtros
 */
const listar_ventas_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: [] 
        });
    }

    try {
        const clienteId = req.params['id'];
        
        // Verificar que el usuario solo pueda ver sus propias órdenes
        if (req.user.sub !== clienteId) {
            return res.status(403).send({ 
                message: 'No tienes permiso para ver estas órdenes',
                data: [] 
            });
        }

        // Obtener parámetros de filtro y paginación
        const { 
            filtro = '', 
            estado = '', 
            page = 1, 
            limit = 10 
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir query de búsqueda
        let query = { cliente: clienteId };

        // Filtro por estado
        if (estado && estado !== 'todos') {
            query.estado = estado;
        }

        // Filtro por número de venta o transacción
        if (filtro && filtro.trim() !== '') {
            query.$or = [
                { nventa: new RegExp(filtro, 'i') },
                { transaccion: new RegExp(filtro, 'i') }
            ];
        }

        // Obtener ventas con populate de direcciones
        const ventas = await Venta.find(query)
            .populate('direccion')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        // Para cada venta, obtener la cantidad de productos
        const ventasConDetalles = await Promise.all(
            ventas.map(async (venta) => {
                const cantidadProductos = await DetalleVenta.countDocuments({ 
                    venta: venta._id 
                });
                
                return {
                    ...venta,
                    cantidad_productos: cantidadProductos
                };
            })
        );

        // Contar total de documentos para paginación
        const total = await Venta.countDocuments(query);

        return res.status(200).send({ 
            data: ventasConDetalles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error listando ventas del cliente:', error);
        return res.status(500).send({ 
            message: 'Error al obtener las órdenes',
            data: [] 
        });
    }
}

/**
 * Obtiene detalles de una venta específica
 */
const obtener_venta_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: undefined 
        });
    }

    try {
        const ventaId = req.params['id'];

        // Obtener venta con populate
        const venta = await Venta.findById(ventaId)
            .populate('cliente')
            .populate('direccion');

        if (!venta) {
            return res.status(404).send({ 
                message: 'Venta no encontrada',
                data: undefined 
            });
        }

        // Verificar que la venta pertenezca al usuario
        if (venta.cliente._id.toString() !== req.user.sub) {
            return res.status(403).send({ 
                message: 'No tienes permiso para ver esta orden',
                data: undefined 
            });
        }

        // Obtener detalles de la venta con productos
        const detalles = await DetalleVenta.find({ venta: ventaId })
            .populate('producto')
            .sort({ createdAt: 1 });

        return res.status(200).send({ 
            data: {
                venta: venta,
                detalles: detalles
            }
        });

    } catch (error) {
        console.error('Error obteniendo venta:', error);
        return res.status(500).send({ 
            message: 'Error al obtener la orden',
            data: undefined 
        });
    }
}

/**
 * Obtiene estadísticas de compras del cliente
 */
const obtener_estadisticas_cliente = async function(req, res) {
    if (!req.user) {
        return res.status(401).send({ 
            message: 'No autorizado',
            data: undefined 
        });
    }

    try {
        const clienteId = req.params['id'];

        if (req.user.sub !== clienteId) {
            return res.status(403).send({ 
                message: 'No tienes permiso',
                data: undefined 
            });
        }

        // Estadísticas básicas
        const totalOrdenes = await Venta.countDocuments({ cliente: clienteId });
        
        const ordenesCompletadas = await Venta.countDocuments({ 
            cliente: clienteId, 
            estado: 'Entregado' 
        });

        const ordenesPendientes = await Venta.countDocuments({ 
            cliente: clienteId, 
            estado: { $in: ['Procesando', 'Enviado'] }
        });

        // Calcular total gastado
        const ventasCompletadas = await Venta.find({ 
            cliente: clienteId, 
            estado: 'Entregado' 
        }).select('subtotal');

        const totalGastado = ventasCompletadas.reduce(
            (sum, venta) => sum + venta.subtotal, 
            0
        );

        return res.status(200).send({ 
            data: {
                total_ordenes: totalOrdenes,
                ordenes_completadas: ordenesCompletadas,
                ordenes_pendientes: ordenesPendientes,
                total_gastado: totalGastado
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return res.status(500).send({ 
            message: 'Error al obtener estadísticas',
            data: undefined 
        });
    }
}




module.exports = {
    registro_compra_cliente,
    validar_cupon_cliente,
    generar_comprobante_pdf,
    obtener_descuento_aplicable,
    calcular_precio_con_descuento,
    listar_ventas_cliente,
    obtener_venta_cliente,
    obtener_estadisticas_cliente
}