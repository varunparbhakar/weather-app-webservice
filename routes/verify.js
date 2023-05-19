//express is the framework we're going to use to handle requests
const express = require("express");
const {request, response} = require("express");
//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require("../utilities").generateHash;
const generateSalt = require("../utilities").generateSalt;
const jwt = require('jsonwebtoken');

const secretKey = process.env.JSON_WEB_TOKEN;

const sendEmail = require("../utilities").sendEmail;

const router = express.Router();

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {get} /verify Get Authentication Token.
 * @apiName GetToken
 * @apiGroup Verify
 *
 * @apiDescription Generates an JWT token for a user so they can be considered verified.
 *
 * @apiParam {String} email Email of user making the request.
 *
 * @apiSuccess (Success 200) {String} email Email address which the verification email was sent to.
 *
 * @apiError (400: Invalid Parameters) {String} message "This user is not a member"
 *
 * @apiError (409: Invalid Parameters) {String} message "User is already verified"
 *
 * @apiError (500: SQL Error) {String} message "Error retrieving member verification information"
 */
router.get("/gettoken/", (request, response, next) => {
    if (isStringProvided(request.query.email)) {
        //This person is trying to get verified
        pool.query(`SELECT * from members where email = $1`, [request.query.email])
            .then((result) => {
                if(result.rowCount <= 0) {
                    response.status(400).send({
                        email: request.query.email,
                        message: "This user is not a member",
                    });
                } else {
                    console.log(request.query.email)
                    console.log("User exists and needs to be verified")
                    next()
                }
            }).catch((error) => {
            console.log([request.query.email])
            console.log(error)
            response.status(500).send({
                message: "Error retrieving member verification information",
                error: error.detail,
            });
        });

    } else {
        response.status(400).json({ message: "Email is not provided" });
    }
}, (request, response, next) => {
    //Checking if the user has been verified
    pool.query(`SELECT * from members where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rows[0].verification == 0) {
                //Member is not verified and a token needs to be generated
                console.log("User has not been verified, send user to verification");
                memberId = result.rows[0].memberid
                firstName = result.rows[0].firstname
                next()
            } else {
                console.log("User is already verified")
                response.status(409).send({
                    email: request.query.email,
                    message: "User is already verified",

                })
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification status",
            error: error.detail,
        });
    });
}, (request, response, next) =>{
    //Checking is the code has already been generated for the user
    //Checking if the user has been verified
    console.log("Checking is the code has already been generated for the user")
    pool.query(`SELECT * from verification where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rowCount <= 0) {
                //Member is not verified and a token needs to be generated
                console.log("Code has not been generated");
                next()
            } else {
                console.log("Code was already generated")
                console.log("Deleting the previously generated verification code")
                pool.query(`DELETE from verification where email = $1`, [request.query.email])
                    .then((result) => {
                        if(result.rowCount > 0) {
                            //Member is not verified and a token needs to be generated
                            console.log("Verification code was deleted successfully");
                            next()
                        } else {
                            console.log("Verification code was not deleted successfully")
                            response.status(409).send({
                                email: request.query.email,
                                message: "Internal database error",

                            })
                        }
                    }).catch((error) => {
                    console.log([request.query.email])
                    console.log(error)
                    response.status(500).send({
                        message: "Error deleting member verification code",
                        error: error.detail,
                    });
                });
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification status",
            error: error.detail,
        });
    });

},(request, response)=> {
    console.log("Member is about to have there token generated")
    // Payload - data to be included in the token
    const payload = {
        userId: request.query.email,
        memberId: memberId,
        date: new Date().getTime()
    };
    // Options - set the algorithm and expiration time
    const options = {
        algorithm: 'HS256',
        expiresIn: '5m' // Token expires in 1 hour
    };
    const token = jwt.sign(payload, secretKey, options);
    console.log('Generated JWT:', token);

    // Generate the token
    pool.query(`INSERT into verification (memberid, email, verificationtoken) VALUES ($1, $2, $3)`, [memberId, request.query.email, token])
        .then((result) => {
            if(result.rowCount > 0) {
                console.log("Token has been stored into the database")

                const verificationlink = "https://theweatherapp.herokuapp.com/verify/submitverification/?email="+request.query.email+"&verifycode="+token
                const emailMessage =
                    "Hey " + firstName + "," +
                    "\nThis is is a verification email, please click the provided link to be verified." +
                    "\n" + verificationlink+
                    "\nThank you," +
                    "\nWeather App"

                if(request.auth.email === "mom@gmail.com"){
                    sendEmail("Verification Email",emailMessage,"varunparbhakar@yahoo.in");
                } else {
                    sendEmail("Verification Email",emailMessage,request.auth.email);
                }

                response.send({
                    email: request.query.email,
                    message: "A verification email has been sent to this address."
                });
            } else {
                console.log("Insertion was not successful")
                response.status(400).send({
                    email: request.query.email,
                    message: "Database insertion error",

                })
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error storing verification information",
            error: error.detail,
        });
    });
})

/**
 * @api {get} /verify Submit Verification.
 * @apiName SubmitVerification
 * @apiGroup Verify
 *
 * @apiDescription Verifies user based on provided query code.
 *
 * @apiParam {String} email Email of user making the request.
 * 
 * @apiParam {String} verifycode Verification code of user making the request.
 *
 * @apiSuccess (Success 200) {String} email Email address of the user which has been verified.
 *
 * @apiError (400: Invalid Parameters) {String} message "This user is not a member"
 *
 * @apiError (409: Invalid Parameters) {String} message "User is already verified"
 *
 * @apiError (500: SQL Error) {String} message "Error retrieving member verification information"
 */
router.get("/submitverification/",(request, response, next) => {
    if (isStringProvided(request.query.email) && isStringProvided(request.query.verifycode)) {
    //This person is trying to get verified
    pool.query(`SELECT * from members where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rowCount <= 0) {
                response.status(400).send({
                    email: request.query.email,
                    message: "This user is not a memeber",
                });
            } else {
                console.log("User exists and needs to be verified")
                next()
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification information",
            error: error.detail,
        });
    });

} else {
    response.status(400).json({ message: "Email is not provided and the verification code not provided" });
}
}, (request, response, next) => {
    //Checking if the user has been verified
    pool.query(`SELECT * from members where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rows[0].verification == 0) {
                //Member is not verified and a token needs to be generated
                console.log("User has not been verified, send user to verification");
                memberId = result.rows[0].memberid
                firstName = result.rows[0].firstname
                userInfo = result.rows[0]
                next()
            } else {
                console.log("User is already verified")
                response.status(409).send({
                    email: request.query.email,
                    message: "User is already verified",

                })

            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification status",
            error: error.detail,
        });
    });
}, (request, response, next) =>{
    //Checking is the code has already been generated for the user
    //Checking if the user has been verified
    console.log("Checking is the code has already been generated for the user")
    pool.query(`SELECT * from verification where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rowCount <= 0) {
                //Member is not verified and a token needs to be generated
                response.send({
                    email: request.query.email,
                    message: "User needs to request a verification code"
                })
            } else {
                console.log("Code was already generated")
                console.log("Now forwarding to code verification")
                next();
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification status",
            error: error.detail,
        });
    });

}, (request, response, next) =>{
    console.log("Verifying user's verification code")
    pool.query(`SELECT * from verification where email = $1`, [request.query.email])
        .then((result) => {
            jwt.verify(request.query.verifycode, secretKey, (err, decoded) => {
                if (err) {
                    console.error('Token verification failed:', err.message);
                    response.send({
                        email: request.query.email,
                        message: "Verification for this email was not successfull, please request another verification link"
                    })
                } else {
                    //Token has been verified, but not fully validated
                    if(decoded.memberId !== userInfo.memberid ||
                        decoded.userId !== request.query.email ||
                        result.rows[0].verificationtoken !== request.query.verifycode ) {
                        console.log("Information Mismatch while validating the user")
                        response.send("Information Mismatch while validating the user")

                    } else {
                        console.log('Token verified successfully, update the memebers table');
                        pool.query(`UPDATE members SET verification = $1 WHERE email = $2`, ["1", request.query.email])
                            .then((result)=> {
                            if(result.rowCount <= 0) {
                                response.status(500).send({
                                    message: "Error updating member verification status"
                                });
                            } else {
                                console.log("Update was successfull, now trying to delete token from verification table")
                                next()
                            }
                        }).catch((error)=>{
                            console.log([request.query.email])
                            console.log(error)
                            response.status(500).send({
                                message: "Error updating member verification status",
                                error: error.detail,
                            });

                        })
                    }
                }
            });

        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error retrieving member verification status",
            error: error.detail,
        });
    });


}, (request, response) => {
    pool.query(`DELETE from verification where email = $1`, [request.query.email])
        .then((result) => {
            if(result.rowCount > 0) {
                //Member is not verified and a token needs to be generated
                console.log("Verification code was deleted successfully");
                response.send({
                    email:request.query.email,
                    message: "User has been succesfully verified"
                })
            } else {
                console.log("Verification code was not deleted successfully")
            }
        }).catch((error) => {
        console.log([request.query.email])
        console.log(error)
        response.status(500).send({
            message: "Error deleting member verification code",
            error: error.detail,
        });
    });
});
module.exports = router;