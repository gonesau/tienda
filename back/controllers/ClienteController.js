"use strict";

var Cliente = require("../models/cliente");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../helpers/jwt");

const registro_cliente = async (req, res) => {
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
          res
            .status(500)
            .send({
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
    res
      .status(400)
      .send({
        message: "El cliente ya existe en la base de datos",
        data: undefined,
      }); // No se envía el objeto data porque no es necesario
  }
};

const login_cliente = async (req, res) => {
  var data = req.body;
  var clientes_arr = [];
  clientes_arr = await Cliente.find({ email: data.email });
  if (clientes_arr.length == 0) {
    return res.status(404).send({ message: "El cliente no existe", data: undefined });
  } else {
    //Login
    let user = clientes_arr[0];
    bcrypt.compare(data.password, user.password, async function (error, check) {
      if (check) {
        return res.status(200).send({ 
          data: user,
          token: jwt.createToken(user)
        });
      }else{
        res.status(400).send({message: "Error al iniciar sesión, verifique sus credenciales",data: undefined,}); 
      }
    });
  }
};

module.exports = {
  registro_cliente,
  login_cliente,
};
