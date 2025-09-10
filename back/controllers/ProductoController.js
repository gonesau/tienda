"use strict";

var Product = require("../models/producto");

const registro_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let data = req.body;
      var img_path = req.files.portada.path;
      var name = img_path.split("\\");
      var portada_name = name[2];
      data.portada = portada_name;
      data.slug = data.titulo
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      let reg = await Product.create(data);
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const listar_productos_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
        var filtro = req.params["filtro"];
        let reg = await Product.find({ titulo: new RegExp(filtro, "i") }).sort({ createdAt: -1 });
        res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

module.exports = {
  registro_producto_admin,
  listar_productos_admin,
};
