const { create } = require('../models/config');
var Descuento = require('../models/descuento');

const registro_descuento_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){
            let data = req.body;

            var img_path = req.files.banner.path;
            var name = img_path.split('\\');
            var banner_name = name[2];
            data.banner = banner_name;

            let reg = await Descuento.create(data);
            res.status(200).send({data: reg});

        }else{
            res.status(500).send({message: 'No autorizado'});
        }
    }else{
        res.status(500).send({message: 'No autorizado'});
    }
}


const listar_descuentos_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){

            var filtro = req.params['filtro'];

            let descuentos = await Descuento.find({titulo: new RegExp(filtro, 'i')}).sort({createdAt:-1});
            res.status(200).send({data: descuentos});
        }else{
            res.status(500).send({message: 'No autorizado'});
        }
    }else{
        res.status(500).send({message: 'No autorizado'});
    }
}

const obtener_banner_descuento = async function(req, res){
    var img = req.params['img'];
    const fs = require('fs');
    const path = require('path');
    
    fs.stat('./uploads/descuentos/'+img, function(err){
        if(!err){
            let img_path = './uploads/descuentos/'+img;
            res.status(200).sendFile(path.resolve(img_path));
        } else {
            let img_path = './uploads/default.jpg';
            res.status(200).sendFile(path.resolve(img_path));
        }
    });

}

const obtener_descuento_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){
            var id = req.params['id'];
            try{
                var descuento = await Descuento.findById({_id: id});
                res.status(200).send({data: descuento});
            }catch(err){
                return res.status(200).send({message: 'Error en el servidor', data: undefined});
            }
        }else{
            res.status(500).send({message: 'No autorizado'});
        }
    }else{
        res.status(500).send({message: 'No autorizado'});
    }
}

const actualizar_descuento_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){
            let id = req.params['id'];
            let data = req.body;

            if(req.files && req.files.banner){
                var img_path = req.files.banner.path;
                var name = img_path.split('\\');
                var banner_name = name[2];
                let reg = await Descuento.findByIdAndUpdate({_id: id}, {
                    titulo: data.titulo,
                    banner: banner_name,
                    descuento: data.descuento,
                    fecha_inicio: data.fecha_inicio,
                    fecha_fin: data.fecha_fin
                });
                res.status(200).send({data: reg});
            }else{
                let reg = await Descuento.findByIdAndUpdate({_id: id}, {
                    titulo: data.titulo,
                    descuento: data.descuento,
                    fecha_inicio: data.fecha_inicio,
                    fecha_fin: data.fecha_fin
                });
                res.status(200).send({data: reg});
            }
        }else{
            res.status(500).send({message: 'No autorizado'});
        }
    }else{
        res.status(500).send({message: 'No autorizado'});
    }
}

const eliminar_descuento_admin = async function(req, res){
    if(req.user){
        if(req.user.role == 'admin'){
            let id = req.params['id'];
            let reg = await Descuento.findByIdAndDelete({_id: id});
            res.status(200).send({data: reg});
        }else{
            res.status(500).send({message: 'No autorizado'});
        }
    }else{
        res.status(500).send({message: 'No autorizado'});
    }
}

// back/controllers/DescuentoController.js - FUNCIÓN CORREGIDA

const obtener_descuento_activo = async function(req, res){
    try {
        // Obtener todos los descuentos ordenados por fecha de creación
        let descuentos = await Descuento.find().sort({createdAt: -1});
        
        if (!descuentos || descuentos.length === 0) {
            console.log('No hay descuentos en la base de datos');
            return res.status(200).send({data: undefined});
        }

        // Fecha actual (inicio del día para comparación limpia)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        console.log('=== VERIFICANDO DESCUENTOS ACTIVOS ===');
        console.log('Fecha actual:', hoy.toISOString());
        console.log('Total descuentos en BD:', descuentos.length);

        // Buscar el primer descuento activo
        for (let descuento of descuentos) {
            // Convertir strings de fecha a objetos Date
            const fechaInicio = new Date(descuento.fecha_inicio);
            const fechaFin = new Date(descuento.fecha_fin);
            
            // Ajustar horas para comparación
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setHours(23, 59, 59, 999);

            console.log('---');
            console.log('Descuento:', descuento.titulo);
            console.log('Porcentaje:', descuento.descuento + '%');
            console.log('Inicio:', fechaInicio.toISOString());
            console.log('Fin:', fechaFin.toISOString());
            
            // Verificar si está activo
            const estaActivo = hoy >= fechaInicio && hoy <= fechaFin;
            console.log('¿Activo?', estaActivo);

            if (estaActivo) {
                console.log('✓ DESCUENTO ACTIVO ENCONTRADO');
                return res.status(200).send({
                    data: {
                        _id: descuento._id,
                        titulo: descuento.titulo,
                        banner: descuento.banner,
                        descuento: descuento.descuento,
                        fecha_inicio: descuento.fecha_inicio,
                        fecha_fin: descuento.fecha_fin
                    }
                });
            }
        }

        console.log('✗ No hay descuentos activos');
        return res.status(200).send({data: undefined});

    } catch (error) {
        console.error('Error obteniendo descuento activo:', error);
        return res.status(500).send({
            message: 'Error al obtener descuento',
            data: undefined
        });
    }
}

module.exports = {
    registro_descuento_admin,
    listar_descuentos_admin,
    obtener_banner_descuento,
    obtener_descuento_admin,
    actualizar_descuento_admin,
    eliminar_descuento_admin,
    obtener_descuento_activo
}