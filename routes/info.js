////express is the framework we're going to use to handle requests
//const express = require("express");
////Access the connection to Heroku Database
//const pool = require("../utilities").pool;
//
//const validation = require("../utilities").validation;
//let isStringProvided = validation.isStringProvided;
//
//const generateHash = require("../utilities").generateHash;
//const generateSalt = require("../utilities").generateSalt;
//
//const sendEmail = require("../utilities").sendEmail;
//
//const router = express.Router();
//router.get("/:id", (req, res)=> {
//    const id = req.params.id;
//    let theQuery =
//          "SELECT name From members WHERE id = MyID VALUES ($1)";
//        let values = [id];
//        pool
//          .query(theQuery, values)
//          .then((result) => {
//            //We need to retrived the user's name
//            response.status(201).send({
//              success: true,
//              email: request.body.email,
//            });
//          })
//          .catch((error) => {
//
//            response.status(400).send({
//              message: "other error, see detail",
//              detail: error.detail,
//            });
//          });
//
//});
//module.exports = router;