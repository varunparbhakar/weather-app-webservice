//express is the framework we're going to use to handle requests
const express = require("express");
//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require("../utilities").generateHash;
const generateSalt = require("../utilities").generateSalt;

const sendEmail = require("../utilities").sendEmail;

const router = express.Router();

router.get("/", (request, response) => {
  if (isStringProvided(request.body.id)) {
    pool
        .query(`SELECT * from members where memberid = $1`, [request.body.id])
        .then((result) => {
          //stash the memberid into the request object to be used in the next function
          console.log(result.rows[0]);
          // next();
          response.send(result.rows[0]);
        })

  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

module.exports = router;