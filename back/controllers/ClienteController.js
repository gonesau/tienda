"use strict";

var Cliente = require("../models/cliente");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../helpers/jwt");

var direccion = require("../models/direccion");

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
        res.status(400).send({
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

      bcrypt.hash("123456789", null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          let reg = await Cliente.create(data);
          res.status(200).send({ data: reg });
        }
      });
    } else {
      res
        .status(200)
        .send({ message: "Error en el servidor", data: undefined });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const obtener_cliente_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];
      try {
        var reg = await Cliente.findById({ _id: id });
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

const actualizar_cliente_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];
      var data = req.body;

      var reg = await Cliente.findByIdAndUpdate(
        { _id: id },
        {
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email,
          telefono: data.telefono,
          f_nacimiento: data.f_nacimiento,
          dui: data.dui,
          pais: data.pais,
          genero: data.genero,
        }
      );
      res.status(200).send({ data: reg });
    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const eliminar_cliente_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var id = req.params["id"];
      try {
        var reg = await Cliente.findOneAndDelete({ _id: id });
        if (!reg) {
          return res
            .status(200)
            .send({ message: "Cliente no encontrado", data: undefined });
        }
        res.status(200).send({ data: reg });
      } catch (err) {
        return res
          .status(500)
          .send({ message: "Error en el servidor", data: undefined });
      }
    } else {
      res.status(500).send({ message: "No autorizado" });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const obtener_cliente_guest = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];
    try {
      var reg = await Cliente.findById({ _id: id });
      res.status(200).send({ data: reg });
    } catch (err) {
      return res
        .status(200)
        .send({ message: "Error en el servidor", data: undefined });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const actualizar_perfil_cliente_guest = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];
    var data = req.body;

    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        var reg = await Cliente.findByIdAndUpdate(
          { _id: id },
          {
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            f_nacimiento: data.f_nacimiento,
            dui: data.dui,
            pais: data.pais,
            genero: data.genero,
            password: hash
          }
        );
      });
      res.status(200).send({ data: reg });
    } else {
      var reg = await Cliente.findByIdAndUpdate(
        { _id: id },
        {
          nombres: data.nombres,
          apellidos: data.apellidos,
          telefono: data.telefono,
          f_nacimiento: data.f_nacimiento,
          dui: data.dui,
          pais: data.pais,
          genero: data.genero,
        }
      );
    }
    res.status(200).send({ data: reg });
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};


/*********************************/
// Direcciones
const registro_direccion_cliente = async function (req, res) {
  if (req.user) {
    var data = req.body;

    if(data.principal){
      // Si la nueva dirección es principal, actualizar las demás direcciones a no principal
      await direccion.updateMany(
        { cliente: req.user.sub },
        { $set: { principal: false } }
      );
    }
    let reg = await direccion.create(data);
    res.status(200).send({ data: reg });
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

const obtener_direcciones_cliente = async function (req, res) {
  if (req.user) {
    var id = req.params["id"];
    try {
      let direcciones = await direccion.find({ cliente: id }).sort({ principal: -1 }).populate('cliente');
      res.status(200).send({ data: direcciones });
    } catch (err) {
      return res
        .status(200)
        .send({ message: "Error en el servidor", data: undefined });
    }
  } else {
    res.status(500).send({ message: "No autorizado" });
  }
};

/**
 * Establece una dirección como principal
 */
const establecer_direccion_principal = async function (req, res) {
  if (req.user) {
    try {
      const id = req.params['id'];
      
      // Buscar la dirección
      const direccionActual = await direccion.findById(id);
      
      if (!direccionActual) {
        return res.status(404).send({ 
          message: 'Dirección no encontrada', 
          data: undefined 
        });
      }

      // Verificar que la dirección pertenezca al cliente autenticado
      if (direccionActual.cliente.toString() !== req.user.sub) {
        return res.status(403).send({ 
          message: 'No tienes permiso para modificar esta dirección', 
          data: undefined 
        });
      }

      // Si ya es principal, no hacer nada
      if (direccionActual.principal) {
        return res.status(200).send({ 
          message: 'Esta dirección ya es la principal', 
          data: direccionActual 
        });
      }

      // Quitar el estatus de principal a todas las direcciones del cliente
      await direccion.updateMany(
        { cliente: req.user.sub },
        { $set: { principal: false } }
      );

      // Establecer esta dirección como principal
      direccionActual.principal = true;
      await direccionActual.save();

      res.status(200).send({ 
        message: 'Dirección principal actualizada correctamente',
        data: direccionActual 
      });
      
    } catch (err) {
      console.error('Error estableciendo dirección principal:', err);
      return res.status(500).send({ 
        message: 'Error en el servidor', 
        data: undefined 
      });
    }
  } else {
    res.status(500).send({ message: 'No autorizado' });
  }
};

/**
 * Elimina una dirección del cliente
 */
const eliminar_direccion_cliente = async function (req, res) {
  if (req.user) {
    try {
      const id = req.params['id'];
      
      // Buscar la dirección
      const direccionEliminar = await direccion.findById(id);
      
      if (!direccionEliminar) {
        return res.status(404).send({ 
          message: 'Dirección no encontrada', 
          data: undefined 
        });
      }

      // Verificar que la dirección pertenezca al cliente autenticado
      if (direccionEliminar.cliente.toString() !== req.user.sub) {
        return res.status(403).send({ 
          message: 'No tienes permiso para eliminar esta dirección', 
          data: undefined 
        });
      }

      // No permitir eliminar la dirección principal si hay más direcciones
      if (direccionEliminar.principal) {
        const totalDirecciones = await direccion.countDocuments({ 
          cliente: req.user.sub 
        });
        
        if (totalDirecciones > 1) {
          return res.status(400).send({ 
            message: 'No puedes eliminar la dirección principal. Primero establece otra dirección como principal.', 
            data: undefined 
          });
        }
      }

      // Eliminar la dirección
      await direccion.findByIdAndDelete(id);

      res.status(200).send({ 
        message: 'Dirección eliminada correctamente',
        data: direccionEliminar 
      });
      
    } catch (err) {
      console.error('Error eliminando dirección:', err);
      return res.status(500).send({ 
        message: 'Error en el servidor', 
        data: undefined 
      });
    }
  } else {
    res.status(500).send({ message: 'No autorizado' });
  }
};

module.exports = {
  registro_cliente,
  login_cliente,
  listar_clientes_filtro_admin,
  registro_cliente_admin,
  obtener_cliente_admin,
  actualizar_cliente_admin,
  eliminar_cliente_admin,
  obtener_cliente_guest,
  actualizar_perfil_cliente_guest,
  registro_direccion_cliente,
  obtener_direcciones_cliente,
  establecer_direccion_principal,
  eliminar_direccion_cliente
};
