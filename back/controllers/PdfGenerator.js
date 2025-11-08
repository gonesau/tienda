const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
var Venta = require('../models/ventas');
var DetalleVenta = require('../models/dventas');
var Config = require('../models/config');

/**
 * Genera PDF del comprobante de venta
 */
const generar_comprobante_pdf = async function (req, res) {
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
                message: 'No tienes permiso para ver esta venta',
                data: undefined
            });
        }

        // Obtener detalles de la venta
        const detalles = await DetalleVenta.find({ venta: ventaId })
            .populate('producto');

        // Obtener configuración
        const config = await Config.findById({ _id: "68daa75d1e1062bf51932fa2" });

        // Crear documento PDF
        const doc = new PDFDocument({ margin: 50 });

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Comprobante-${venta.nventa}.pdf`);

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // ============================================
        // HEADER DEL PDF
        // ============================================
        doc.fontSize(20)
            .text(config.titulo || 'TIENDA ECOMMERCE', 50, 50, { align: 'center' })
            .fontSize(10)
            .text('Comprobante de Venta', { align: 'center' })
            .moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();
        doc.moveDown();

        // ============================================
        // INFORMACIÓN DE LA VENTA
        // ============================================
        doc.fontSize(12)
            .text('INFORMACIÓN DE LA COMPRA', 50, doc.y, { underline: true })
            .moveDown(0.5);

        doc.fontSize(10)
            .text(`Número de Orden: ${venta.nventa}`, 50, doc.y)
            .text(`Fecha: ${new Date(venta.createdAt).toLocaleDateString('es-ES')}`, 50, doc.y)
            .text(`Estado: ${venta.estado}`, 50, doc.y)
            .text(`Transacción PayPal: ${venta.transaccion}`, 50, doc.y)
            .moveDown();

        // ============================================
        // INFORMACIÓN DEL CLIENTE
        // ============================================
        doc.fontSize(12)
            .text('DATOS DEL CLIENTE', 50, doc.y, { underline: true })
            .moveDown(0.5);

        doc.fontSize(10)
            .text(`Nombre: ${venta.cliente.nombres} ${venta.cliente.apellidos}`, 50, doc.y)
            .text(`Email: ${venta.cliente.email}`, 50, doc.y)
            .text(`Teléfono: ${venta.cliente.telefono || 'No especificado'}`, 50, doc.y)
            .moveDown();

        // ============================================
        // DIRECCIÓN DE ENVÍO
        // ============================================
        doc.fontSize(12)
            .text('DIRECCIÓN DE ENVÍO', 50, doc.y, { underline: true })
            .moveDown(0.5);

        doc.fontSize(10)
            .text(`Destinatario: ${venta.direccion.destinatario}`, 50, doc.y)
            .text(`Dirección: ${venta.direccion.direccion}`, 50, doc.y)
            .text(`${venta.direccion.municipio ? venta.direccion.municipio + ', ' : ''}${venta.direccion.pais}`, 50, doc.y)
            .text(`Código Postal: ${venta.direccion.zip}`, 50, doc.y)
            .text(`Teléfono: ${venta.direccion.telefono}`, 50, doc.y)
            .moveDown();

        // ============================================
        // DETALLES DE PRODUCTOS
        // ============================================
        doc.fontSize(12)
            .text('PRODUCTOS', 50, doc.y, { underline: true })
            .moveDown(0.5);

        // Tabla de productos
        const tableTop = doc.y;
        const itemCodeX = 50;
        const itemDescriptionX = 150;
        const itemQtyX = 350;
        const itemPriceX = 400;
        const itemTotalX = 480;

        // Encabezados
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('PRODUCTO', itemCodeX, tableTop)
            .text('VARIEDAD', itemDescriptionX, tableTop)
            .text('CANT', itemQtyX, tableTop)
            .text('PRECIO', itemPriceX, tableTop)
            .text('TOTAL', itemTotalX, tableTop);

        // Línea debajo de encabezados
        doc.moveTo(50, doc.y + 5)
            .lineTo(550, doc.y + 5)
            .stroke();

        let position = doc.y + 15;

        // Items
        doc.font('Helvetica');
        detalles.forEach((item) => {
            doc.fontSize(9)
                .text(item.producto.titulo.substring(0, 25), itemCodeX, position)
                .text(item.variedad, itemDescriptionX, position)
                .text(item.cantidad.toString(), itemQtyX, position)
                .text(`$${item.producto.precio.toFixed(2)}`, itemPriceX, position)
                .text(`$${item.subtotal.toFixed(2)}`, itemTotalX, position);

            position += 20;
        });

        // Línea separadora
        doc.moveTo(50, position)
            .lineTo(550, position)
            .stroke();

        position += 10;

        // ============================================
        // RESUMEN DE COSTOS
        // ============================================
        const summaryX = 400;

        // Calcular subtotal de productos
        const subtotalProductos = detalles.reduce((sum, item) => sum + item.subtotal, 0);

        doc.fontSize(10)
            .text('Subtotal:', summaryX, position)
            .text(`$${subtotalProductos.toFixed(2)}`, itemTotalX, position);
        position += 20;

        // Envío
        doc.text('Envío:', summaryX, position)
            .text(`$${venta.envio_precio.toFixed(2)}`, itemTotalX, position);
        position += 20;

        doc.text(`(${venta.envio_titulo})`, summaryX + 20, position, { fontSize: 8 });
        position += 20;

        // Descuento (si existe)
        if (venta.cupon) {
            const descuento = subtotalProductos + venta.envio_precio - venta.subtotal;
            doc.fillColor('red')
                .text('Descuento:', summaryX, position)
                .text(`-$${descuento.toFixed(2)}`, itemTotalX, position)
                .fillColor('black');
            position += 20;

            doc.fontSize(8)
                .text(`Cupón: ${venta.cupon}`, summaryX + 20, position);
            position += 20;
        }

        // Línea antes del total
        doc.moveTo(summaryX, position)
            .lineTo(550, position)
            .stroke();
        position += 10;

        // TOTAL
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('TOTAL:', summaryX, position)
            .text(`$${venta.subtotal.toFixed(2)}`, itemTotalX, position);

        // ============================================
        // NOTAS
        // ============================================
        if (venta.nota) {
            doc.moveDown(2)
                .fontSize(10)
                .font('Helvetica')
                .text('NOTAS:', 50, doc.y, { underline: true })
                .moveDown(0.5)
                .fontSize(9)
                .text(venta.nota, 50, doc.y, { width: 500 });
        }

        // ============================================
        // FOOTER
        // ============================================
        doc.moveDown(3)
            .fontSize(8)
            .text(
                '¡Gracias por tu compra! Para cualquier consulta, contáctanos.',
                50,
                700,
                { align: 'center', width: 500 }
            )
            .text(
                `Documento generado el ${new Date().toLocaleDateString('es-ES')}`,
                50,
                720,
                { align: 'center', width: 500 }
            );

        // Finalizar PDF
        doc.end();

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send({
            message: 'Error al generar el comprobante',
            data: undefined
        });
    }
}

module.exports = {
    generar_comprobante_pdf
}