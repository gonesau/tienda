var Cupon = require('../models/cupon');

const registro_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let data = req.body;

            let reg = await Cupon.create(data);
            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: 'NoAccess' });
        }
    } else {
        res.status(500).send({ message: 'NoAccess' });
    }
}

const listar_cupones_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      var filtro = req.params["filtro"];
      let reg = await Cupon.find({ codigo: new RegExp(filtro, "i") }).sort({
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

const obtener_cupon_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == "admin") {
      let id = req.params["id"];
      try {
        let reg = await Cupon.findById({ _id: id });
        res.status(200).send({ data: reg });
      } catch (err) {
        return res.status(200).send({ message: "Error en el servidor", data: undefined });
      } 
    } else {
      res.status(500).send({ message: "NoAccess" });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const actualizar_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id'];
            let data = req.body;
            let reg = await Cupon.findByIdAndUpdate({ _id: id }, {
                codigo: data.codigo,
                tipo: data.tipo,
                valor: data.valor,
                limite: data.limite
            });
            res.status(200).send({ data: reg });
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
};

const eliminar_cupon_admin = async function (req, res) {
    if (req.user) {
        if (req.user.role == 'admin') {
            let id = req.params['id'];
            try {
                let reg = await Cupon.findByIdAndDelete({ _id: id });
                res.status(200).send({ data: reg });
            } catch (err) {
                return res.status(200).send({ message: "Error en el servidor", data: undefined });
            }
        } else {
            res.status(500).send({ message: "NoAccess" });
        }
    } else {
        res.status(500).send({ message: "NoAccess" });
    }
}; 

module.exports = {
    registro_cupon_admin,
    listar_cupones_admin,
    obtener_cupon_admin,
    actualizar_cupon_admin,
    eliminar_cupon_admin
}