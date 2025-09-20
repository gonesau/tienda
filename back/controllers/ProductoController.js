"use strict";

var Product = require("../models/producto");
var fs = require("fs");
var path = require("path");

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
      let reg = await Product.find({ titulo: new RegExp(filtro, "i") }).sort({
        createdAt: -1,
      });
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const obtener_portada = async function (req, res) {
  var img = req.params["img"];
  fs.stat("./uploads/productos/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/productos/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
};

const obtener_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];
      try {
        var reg = await Product.findById({ _id: id });
        res.status(200).send({ data: reg });
      } catch (err) {
        return res
          .status(200)
          .send({ message: "Error en el servidor", data: undefined });
      }
    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const actualizar_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      let data = req.body;
      console.log(req.files);

      if (req.files && req.files.portada && req.files.portada.path) {
        // Si hay imagen
        var img_path = req.files.portada.path;
        var name = img_path.split("\\");
        var portada_name = name[2];

        let reg = await Product.findByIdAndUpdate(
          { _id: id },
          {
            titulo: data.titulo,
            stock: data.stock,
            precio: data.precio,
            categoria: data.categoria,
            descripcion: data.descripcion,
            contenido: data.contenido,
            portada: portada_name,
          }
        );

        fs.stat("./uploads/productos/" + reg.portada, function (err) {
          if(!err){
            fs.unlink("./uploads/productos/" + reg.portada, (err) => {
              if (err) throw err;
            });
          }
        });

        res.status(200).send({ data: reg });
      } else {
        // No hay imagen
        let reg = await Product.findByIdAndUpdate(
          { _id: id },
          {
            titulo: data.titulo,
            stock: data.stock,
            precio: data.precio,
            categoria: data.categoria,
            descripcion: data.descripcion,
            contenido: data.contenido,
          }
        );
        res.status(200).send({ data: reg });
      }
      try {
        if (data.titulo) {
          data.slug = data.titulo
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "");
        }

        let reg = await Product.findByIdAndUpdate({ _id: id }, data, {
          new: true,
        });
        res.status(200).send({ data: reg });
      } catch (error) {
        res
          .status(500)
          .send({
            message: "Error al actualizar el producto",
            error: error.message,
          });
      }
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const eliminar_producto_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];
      let reg = await Product.findOneAndDelete({ _id: id });
      if (reg) {
        res.status(200).send({ message: "Producto eliminado" });
      } else {
        res.status(404).send({ message: "Producto no encontrado" });
      }
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
  obtener_portada,
  obtener_producto_admin,
  actualizar_producto_admin,
  eliminar_producto_admin,
};
