const express = require("express");
const {request, response} = require("express");
const {values} = require("pg/lib/native/query");
//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require("../utilities").generateHash;
const generateSalt = require("../utilities").generateSalt;

const sendEmail = require("../utilities").sendEmail;

const router = express.Router();

router.post("/getfriends/", (request, response, next)=> {
    if(!isStringProvided(request.body.user) || !isInteger(request.body.user)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    pool.query(`SELECT STRING_AGG(memberid_a::text, ', ') AS list FROM (SELECT memberid_a FROM contacts WHERE memberid_b = $1 AND status = 'Friends'
                                                                UNION
                                                                SELECT memberid_b FROM contacts WHERE memberid_a = $1 AND status = 'Friends') as mem`, ["4"])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's list")
                response.send(result.rows[0])
            }

    })
        .catch((error) => {
            console.log([request.body.email])
            console.log(error)
            response.status(500).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
})

router.post("/getrequests/", (request, response, next)=> {
    if(!isStringProvided(request.body.user) || !isInteger(request.body.user)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    pool.query(`SELECT STRING_AGG(memberid_a::text, ', ') AS list FROM (SELECT memberid_a FROM contacts WHERE memberid_b = $1 AND status = 'Pending') as mem`, [request.body.user])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's requests list")
                response.send(result.rows[0])
            }

        })
        .catch((error) => {
            console.log([request.body.email])
            console.log(error)
            response.status(500).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
})

function isInteger(str) {
    // Check if the string is a number.
    if (isNaN(str)) {
        return false;
    }
    // Check if the string is an integer.
    return /^\d+$/.test(str);
}

module.exports = router;