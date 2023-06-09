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

/**
 * @api {post} /info Request information about supplied member. DEPRECIATED.
 * @apiName PostInfo
 * @apiGroup Info
 *
 * @apiDescription Retrieves information about user based on email.
 *
 * @apiParam {String} email Email of the member information is desired for.
 *
 * @apiSuccess (Success 200) {JSON} body Table data about user.
 *
 * @apiError (400: Invalid User) {String} message "Error retriving member information"
 */
router.post("/", (request, response) => {
    console.log(request.body);
    if (isStringProvided(request.body.email)) {
        pool.query(`SELECT * from members where email = $1`, [request.body.email])
            .then((result) => {
                // stash the memberid into the request object to be used in the next function
                // next();
                response.send(result.rows[0]);
                // console.log(result.rows[0]);
            })
            .catch((error) => {
                console.log([request.body.email])
                console.log(error)
                response.status(400).send({
                    message: "Error retriving member information",
                    error: error.detail,
                });
            });
    } else {
        response.status(400).send({
            message: "Missing required information",
        });
    }
});

module.exports = router;