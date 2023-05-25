const config = require("../config.js");

//express is the framework we're going to use to handle requests
const express = require("express");

//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require("../utilities").generateHash;

const router = express.Router();

//Pull in the JWT module along with out a secret key
const jwt = require("jsonwebtoken");
const sendEmail = require("../utilities").sendEmail;
const key = {
  secret: config.JSON_WEB_TOKEN,
};

/**
 * @api {get} /auth Request to sign a user in the system
 * @apiName GetAuth
 * @apiGroup Auth
 *
 * @apiHeader {String} authorization "username:password" uses Basic Auth
 *
 * @apiSuccess {boolean} success true when the name is found and password matches
 * @apiSuccess {String} message "Authentication successful!"
 * @apiSuccess {String} token JSON Web Token
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Authentication successful!",
 *       "token": "eyJhbGciO...abc123"
 *     }
 *
 * @apiError (400: Missing Authorization Header) {String} message "Missing Authorization Header"
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 * @apiError (404: User Not Found) {String} message "User not found"
 *
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 *
 */
router.get(
  "/",
  (request, response, next) => {
    if (
      isStringProvided(request.headers.authorization) &&
      request.headers.authorization.startsWith("Basic ")
    ) {
      next();
    } else {
      response.status(400).json({ message: "Missing Authorization Header" });
    }
  },
  (request, response, next) => {


      // obtain auth credentials from HTTP Header
    const base64Credentials = request.headers.authorization.split(" ")[1];

    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );

    const [email, password] = credentials.split(":");

    if (isStringProvided(email) && isStringProvided(password)) {
      request.auth = {
        email: email,
        password: password,
      };
      next();
    } else {
      response.status(400).send({
        message: "Malformed Authorization Header",
      });
    }
  },
  (request, response, next) => {
      pool.query(`SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                      INNER JOIN Members ON
                      Credentials.memberid=Members.memberid
                      WHERE Members.email=$1`,[request.auth.email])
      .then((result) => {
        console.log(request.auth.email, "Row Count: ", result.rowCount)
          if (result.rowCount <= 0) {
            response.status(404).send({
            message: "User not found",
          });
          return;
        }

        //Retrieve the salt used to create the salted-hash provided from the DB
        let salt = result.rows[0].salt;

        //Retrieve the salted-hash password provided from the DB
        let storedSaltedHash = result.rows[0].saltedhash;

        //Generate a hash based on the stored salt and the provided password
        let providedSaltedHash = generateHash(request.auth.password, salt);

        //Did our salted hash match their salted hash?
        if (storedSaltedHash === providedSaltedHash) {
          //credentials match. get a new JWT
            console.log("Password was matched")
          let token = jwt.sign(
            {
              email: request.auth.email,
              memberid: result.rows[0].memberid,
            },
            key.secret,
            {
              expiresIn: "14 days", // expires in 14 days
            }
          );
          //package and send the results

            pool.query(`SELECT * from members where email = $1`, [request.auth.email])
                .then((result) => {
                    if(result.rows[0].verification != 1) {
                        console.log("Member is not verified")
                        memberId = result.rows[0].memberid
                        firstName = result.rows[0].firstname
                        pool.query(`SELECT * from verification where email = $1`, [request.auth.email])
                            .then((result) => {
                                if(result.rowCount <= 0) {
                                    //Member is not verified and a token needs to be generated
                                    console.log("Code has not been generated");
                                    generateToken(request, response, memberId, firstName)

                                } else {
                                    console.log("Code was already generated")
                                    console.log("Deleting the previously generated verification code")
                                    pool.query(`DELETE from verification where email = $1`, [request.auth.email])
                                        .then((result) => {
                                            if(result.rowCount > 0) {
                                                //Member is not verified and a token needs to be generated
                                                console.log("Verification code was deleted successfully");
                                                generateToken(request, response, memberId, firstName)

                                            } else {
                                                console.log("Verification code was not deleted successfully")
                                                response.status(409).send({
                                                    email: request.auth.email,
                                                    message: "Internal database error",
                                                })
                                            }
                                        }).catch((error) => {
                                        console.log([request.auth.email])
                                        console.log(error)
                                        response.status(500).send({
                                            message: "Error deleting member verification code",
                                            error: error.detail,
                                        });
                                    });
                                }
                            }).catch((error) => {
                            console.log([request.auth.email])
                            console.log(error)
                            response.status(500).send({
                                message: "Error retrieving member verification status",
                                error: error.detail,
                            });
                        })

                    } else {
                        console.log("Member is verified")
                        // stash the memberid into the request object to be used in the next function
                        // next();
                        response.json({
                            success: true,
                            message: "Authentication successful!",
                            token: token,
                            email:result.rows[0].email,
                            username: result.rows[0].username,
                            firstname: result.rows[0].firstname,
                            lastname: result.rows[0].lastname,
                            memberId: result.rows[0].memberId,
                        });
                    }

                    // console.log(result.rows[0]);
                })
                .catch((error) => {
                    console.log([request.auth.email])
                    console.log(error)
                    response.status(500).send({
                        message: "Error retrieving member information",
                        error: error.detail,
                    });
                });

        } else {
          //credentials dod not match
          response.status(400).send({
            message: "Credentials did not match",
          });
        }
      })
      .catch((err) => {
        //log the error
          console.log(err)
        response.status(400).send({
            message: err.detail,
        });
      });
  }
);


function generateToken(request, response, memberId, firstName) {
    console.log("Member is about to have there token generated")
    // Payload - data to be included in the token
    const payload = {
        userId: request.auth.email,
        memberId: memberId,
        date: new Date().getTime()
    };
    // Options - set the algorithm and expiration time
    const options = {
        algorithm: 'HS256',
        expiresIn: '5m' // Token expires in 1 hour
    };
    const token = jwt.sign(payload, key.secret, options);
    console.log('Generated JWT:', token);
    const verificationlink = "https://theweatherapp.herokuapp.com/verify/submitverification/?email="+request.auth.email+"&verifycode="+token
    const emailMessage =
        "Hey " + firstName + "," +
        "\nThis is is a verification email, please click the provided link to be verified." +
        "\n" + verificationlink+
        "\nThank you," +
        "\nWeather App"

    // Generate the token
    pool.query(`INSERT into verification (memberid, email, verificationtoken) VALUES ($1, $2, $3)`, [memberId, request.auth.email, token])
        .then((result) => {
            if(result.rowCount > 0) {
                console.log("Token was generated and now checking for the email")
                if(request.auth.email === "mom@gmail.com"){
                    console.log("Email was mom@gmail.com")
                    sendEmail("Verification Email",emailMessage,"varunparbhakar@yahoo.in");
                }else {
                    console.log("Email was not mom@gmail.com")
                    console.log(request.auth.email)
                    sendEmail("Verification Email",emailMessage,request.auth.email);
                }
            } else {
                console.log("Insertion was not successful")
                response.status(400).send({
                    email: request.auth.email,
                    message: "Database insertion error",

                })
            }
        }).catch((error) => {
        // console.log("Caught an Error in generate token")
        //     console.log([request.auth.email])
        // response.status(500).send({
        //     message: "Error storing verification information",
        //     error: error.detail,})
        })
    response.status(401).send({
        message: "User is not verified, a verification email has been sent"
    })

    // console.log("Exiting generate token")

}

module.exports = router;