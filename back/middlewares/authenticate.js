"use strict";

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "gonesau";

exports.auth = function (req, res, next) {
  console.log(req.headers);
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "No autorizado" });
  }

  var token = req.headers.authorization.replace(/['"]+/g, "");
  var segment = token.split(".");
  let payload;

  if (segment.length != 3) {
    return res.status(403).send({ message: "Token invalido" });
  } else {
    try {
      payload = jwt.decode(token, secret);

      if (payload.exp <= moment().unix()) {
        return res.status(403).send({ message: "El token ha expirado" });
      }

      req.user = payload;
    } catch (ex) {
      return res.status(403).send({ message: "Token invalido" });
    }
  }

  req.user = payload;

  next();
};
