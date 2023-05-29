const express = require("express");
const {request, response} = require("express");
const {values} = require("pg/lib/native/query");
const jwt = require("jsonwebtoken");
//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require("../utilities").generateHash;
const generateSalt = require("../utilities").generateSalt;

const sendEmail = require("../utilities").sendEmail;

const router = express.Router();

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {get} forgot password functionality
 * @apiName recovery
 * @apiGroup Password
 *
 * @apiDescription Sends a password reset email to the user
 */
router.get("/recovery/:username", (request, response, next)=> {
    /*
     * Get verify the user exists
     * generate a temporary password
     * Send a temporary password
     *
     */
    if(!isStringProvided(request.params.username)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    //Check if the user exists
    pool.query(`Select * from members where email = $1`, [request.params.username])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("User was not found")
                response.status(400).send({
                    username: request.params.username,
                    message: "User was not found"
                })
            } else {
                console.log("User was found")
                request.memberid = result.rows[0].memberid
                request.firstname = result.rows[0].firstname
                request.email = result.rows[0].email
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
}, (request, response, next)=> {
    //Get the salt and generate a temporary password
    pool.query(`Select salt from credentials where memberid = $1`, [request.memberid])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Salt was found")
                let salt = result.rows[0].salt
                i = 0
                while(i < 50){
                    code = parseInt(Math.random()*10000)
                    if(((code).toString().length == 4)) {
                        break
                    }
                    i++
                }
                request.tempPass = request.firstname + code
                request.saltedHash = generateHash(request.tempPass, salt);

                console.log("A new password has been created")
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
}, (request, response)=> {
    //Insert the new hashed password
    pool.query(`UPDATE credentials SET saltedhash = $1 where memberid = $2`, [request.saltedHash, request.memberid])
        .then((result) => {
            console.log("New password has been stored in the database")
            generateRecoveryEmail(request.email, request.firstname, request.tempPass)
            response.send({
                username: request.params.username,
                message: "A password recovery email has been sent"
            })
        }).catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error inserting member credential information",
                error: error.detail,
            });
        });
})

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} Change the password
 * @apiName recovery
 * @apiGroup Password
 *
 * @apiDescription Sends a password reset email to the user
 */
router.post("/changepass", (request, response, next)=> {
    /*
     * Get verify the user exists
     * confirm the password with the saltedhash
     * Insert the new password
     */
    if(!isStringProvided(request.body.username) || !isStringProvided(request.body.newpass) || !isStringProvided(request.body.oldpass)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else if(request.body.oldpass == request.body.newpass) {
        response.status(400).send({
            message: "Old password and new password contain the same password"
        })

    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    //Check if the user exists
    pool.query(`Select * from members where email = $1`, [request.body.username])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("User was not found")
                response.status(400).send({
                    username: request.body.username,
                    message: "User was not found"
                })
            } else {
                console.log("User was found")
                request.memberid = result.rows[0].memberid
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
}, (request, response, next)=> {
    //Get the salt and confirm the old password
    pool.query(`Select * from credentials where memberid = $1`, [request.memberid])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Salt was found")
                request.salt = result.rows[0].salt

                if(generateHash(request.body.oldpass, request.salt) === result.rows[0].saltedhash) {
                    console.log("Old password was a match and now proceeding to updating the db with new pass")
                    next()
                } else {
                    response.status(400).send({
                        username: request.body.username,
                        message: "Old password was not a match"
                    })
                }
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
}, (request, response)=> {
    //Insert the new  password
    pool.query(`UPDATE credentials SET saltedhash = $1 where memberid = $2`, [generateHash(request.body.newpass, request.salt), request.memberid])
        .then((result) => {
            console.log("New password has been stored in the database")
            response.send({
                username: request.body.username,
                message: "You password has been sucessfully changed"
            })
        }).catch((error) => {
        console.log(error)
        response.status(400).send({
            message: "Error inserting member credential information",
            error: error.detail,
        });
    });
})

/*
 * Checks if given value is an integer
 */
function isInteger(str) {
    // Check if the string is a number.
    if (isNaN(str)) {
        return false;
    }
    // Check if the string is an integer.
    return /^\d+$/.test(str);
}

function generateRecoveryEmail(email, firstName, tempPass) {
    console.log("Member is about have their email sent")
    const emailMessage =
        "Hey " + firstName + "," +
        "\nThis email is a response to password recovery protocol." +
        "\n\nThis is your temporary password: " + tempPass +
        "\nLogin and reset your password immediately" +
        "\n\nThank you," +
        "\nWeather App"

        console.log("Checking for the email address")
        if(email === "mom@gmail.com"){
            console.log("Email was mom@gmail.com")
            sendEmail("Password Recovery",emailMessage,"varunparbhakar@yahoo.in");
        } else {
            console.log("Email was not mom@gmail.com")
            console.log(email)
            sendEmail("Password Recovery",emailMessage, email);
        }
        console.log("Exiting generate email")

}


module.exports = router;
