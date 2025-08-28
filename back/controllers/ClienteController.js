"use strict";

var Cliente = require("../models/cliente");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../helpers/jwt");

const registro_cliente = async function (req, res) {
  var data = req.body;
  var clientes_arr = [];
  clientes_arr = await Cliente.find({ email: data.email });

  if (clientes_arr.length == 0) {
    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          var reg = await Cliente.create(data);
          res.status(200).send({ cliente: reg });
        } else {
          res.status(500).send({
            message: "Error al encriptar la contraseña",
            data: undefined,
          }); // No se envía el objeto data porque no es necesario
        }
      });
    } else {
      res
        .status(400)
        .send({ message: "La contraseña es obligatoria", data: undefined }); // No se envía el objeto data porque no es necesario
    }
  } else {
    res.status(400).send({
      message: "El cliente ya existe en la base de datos",
      data: undefined,
    }); // No se envía el objeto data porque no es necesario
  }
};

const login_cliente = async function (req, res) {
  var data = req.body;
  var clientes_arr = [];
  clientes_arr = await Cliente.find({ email: data.email });
  if (clientes_arr.length == 0) {
    return res
      .status(404)
      .send({ message: "El cliente no existe", data: undefined });
  } else {
    //Login
    let user = clientes_arr[0];
    bcrypt.compare(data.password, user.password, async function (error, check) {
      if (check) {
        return res.status(200).send({
          data: user,
          token: jwt.createToken(user),
        });
      } else {
        res
          .status(400)
          .send({
            message: "Error al iniciar sesión, verifique sus credenciales",
            data: undefined,
          });
      }
    });
  }
};

const listar_clientes_filtro_admin = async function (req, res) {
  console.log(req.user);
  if (req.user) {
    if (req.user.role == "admin") {
      let tipo = req.query.tipo;
      let filtro = req.query.filtro;

      if (!tipo || tipo == "null") {
        let clientes = await Cliente.find().sort({ apellidos: 1 });
        return res.status(200).send({ data: clientes });
      } else {
        if (tipo == "apellidos") {
          let reg = await Cliente.find({ apellidos: new RegExp(filtro, "i") });
          return res.status(200).send({ data: reg });
        } else if (tipo == "correo") {
          let reg = await Cliente.find({ email: new RegExp(filtro, "i") });
          return res.status(200).send({ data: reg });
        }
      }
    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const registro_cliente_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var data = req.body;

      bcrypt.hash('123456789', null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          let reg = await Cliente.create(data);
          res.status(200).send({ data: reg });
        }
      })
    } else {
      res.status(200).send({ message: 'Error en el servidor', data: undefined });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const obtener_cliente_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'admin') {
      var id = req.params['id'];
      try {
        var reg = await Cliente.findById({ _id: id });
        res.status(200).send({ data: reg });
      } catch (err) {
        return res.status(200).send({ message: 'Error en el servidor', data: undefined });
      }


    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};


const actualizar_cliente_admin = async function (req, res) {
    if (req.user) {
    if (req.user.role == 'admin') {
      var id = req.params['id'];
      var data = req.body;

      var reg = await Cliente.findByIdAndUpdate({ _id: id }, 
        {
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email,
          telefono: data.telefono,
          f_nacimiento: data.f_nacimiento,
          dui: data.dui,
          genero: data.genero
        }
      );
        res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
}

module.exports = {
  registro_cliente,
  login_cliente,
  listar_clientes_filtro_admin,
  registro_cliente_admin,
  obtener_cliente_admin,
  actualizar_cliente_admin
};
