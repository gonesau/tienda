'use strict';
var config = require('../models/config');
var fs = require('fs');
var path = require('path');

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
            let reg;

            if (req.files && req.files.logo) {
                console.log('si hay imagen');
                var img_path = req.files.logo.path;
                var name = img_path.split("\\");
                var logo_name = name[name.length - 1]; 

                reg = await config.findByIdAndUpdate(
                    { _id: "68daa75d1e1062bf51932fa2" },
                    {
                        categorias: JSON.parse(data.categorias),
                        titulo: data.titulo,
                        logo: logo_name,
                        serie: data.serie,
                        correlativo: data.correlativo,
                    }
                );

                if (reg.logo) {
                    fs.stat("./uploads/configuraciones/" + reg.logo, function (err) {
                        if (!err) {
                            fs.unlink("./uploads/configuraciones/" + reg.logo, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                }

            } else {
                console.log('no hay imagen');
                reg = await config.findByIdAndUpdate(
                    { _id: "68daa75d1e1062bf51932fa2" },
                    {
                        categorias: data.categorias,
                        titulo: data.titulo,
                        serie: data.serie,
                        correlativo: data.correlativo,
                    }
                );
            }

            res.status(200).send({ data: reg });

        } else {
            res.status(500).send({ message: "No autorizado" });
        }
    } else {
        res.status(500).send({ message: "No autorizado" });
    }
}

const obtener_logo = async function (req, res) {
  var img = req.params["img"];
  fs.stat("./uploads/configuraciones/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/configuraciones/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
};


module.exports = {
    actualizar_config_admin,
    obtener_config_admin,
    obtener_logo
}
