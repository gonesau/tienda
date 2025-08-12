'use strict';
var Admin = require('../models/admin');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../helpers/jwt');

const registro_admin = async (req, res) => {
    var data = req.body;
    var admins_arr = [];
    admins_arr = await Admin.find({email: data.email});

    if (admins_arr.length == 0) {
        if (data.password) {
            bcrypt.hash(data.password, null, null, async function(err,hash) {
                if(hash){
                    data.password = hash;
                    var reg = await Admin.create(data);
                    res.status(200).send({data: reg});
                }else{
                    res.status(500).send({message: 'Error al encriptar la contraseña', data: undefined}); // No se envía el objeto data porque no es necesario
                }
            })
        }else{
            res.status(400).send({message: 'La contraseña es obligatoria', data:undefined});// No se envía el objeto data porque no es necesario
        }
    } else {
        res.status(400).send({message: 'El Admin ya existe en la base de datos', data: undefined}); // No se envía el objeto data porque no es necesario
    }
}

const login_admin = async (req, res) => {
  var data = req.body;
  var admin_arr = [];
  admin_arr = await Admin.find({ email: data.email });
  if (admin_arr.length == 0) {
    return res.status(404).send({ message: "El Admin no existe", data: undefined });
  } else {
    //Login
    let user = admin_arr[0];
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
    registro_admin,
    login_admin
};