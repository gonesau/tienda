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


module.exports = {
    registro_descuento_admin,
    listar_descuentos_admin,
    obtener_banner_descuento,
    obtener_descuento_admin,
    actualizar_descuento_admin,
    eliminar_descuento_admin

}