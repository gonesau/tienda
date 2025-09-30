'use strict';
var config = require('../models/config');

const obtener_config_admin = async (req, res) => {
    if (req.user) {
        if (req.user.role == "admin") {
            let reg = await config.findById({ _id: "68daa75d1e1062bf51932fa2" });
            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "No autorizado" });
        }
    } else {
        res.status(500).send({ message: "No autorizado" });
    }
}

const actualizar_config_admin = async (req, res) => {
    if (req.user) {
        if (req.user.role == "admin") {
            let data = req.body;

            if (req.files) {
                // Si hay imagen
                var img_path = req.files.logo.path;
                var name = img_path.split("\\");
                var logo_name = name[2];

                let reg = await config.findByIdAndUpdate({ _id: "68daa75d1e1062bf51932fa2" }, {
                    categorias: data.categorias,
                    titulo: data.titulo,
                    logo: logo_name,
                    serie: data.serie,
                    correlativo: data.correlativo,
                });

                fs.stat("./uploads/configuraciones/" + reg.logo, function (err) {
                    if (!err) {
                        fs.unlink("./uploads/configuraciones/" + reg.logo, (err) => {
                            if (err) throw err;
                        });
                    }
                });

            } else {
                let reg = await config.findByIdAndUpdate({ _id: "68daa75d1e1062bf51932fa2" }, {
                    categorias: data.categorias,
                    titulo: data.titulo,
                    serie: data.serie,
                    correlativo: data.correlativo,
                });
            }

            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "No autorizado" });
        }
    } else {
        res.status(500).send({ message: "No autorizado" });
    }
}


module.exports = {
    actualizar_config_admin,
    obtener_config_admin
}