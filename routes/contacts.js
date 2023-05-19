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

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {get} /contacts Retrieve mutual friends.
 * @apiName GetFriends
 * @apiGroup Contacts
 *
 * @apiDescription Retrieves list of memberID's mutual friends for given user associated with required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {String} User MemberID of user making the request.
 *
 * @apiSuccess (Success 200) {List} List List of users which are friends of the supplied user.
 *
 * @apiError (400: Invalid Parameters) {String} message "Invalid information provided"
 *
 * @apiError (400: SQL Error) {String} message "Error retrieving member information"
 */
router.get("/getfriends/:user", (request, response, next)=> {
    if(!isStringProvided(request.query.user) || !isInteger(request.query.user)) {
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
                                                                SELECT memberid_b FROM contacts WHERE memberid_a = $1 AND status = 'Friends') as mem`, [request.query.user])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's list")
                response.send(result.rows[0])
            }
    })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
                error: error.detail,
            });
        });
})

/**
 * @api {get} /contacts Retrieve incoming friend requests.
 * @apiName GetPending
 * @apiGroup Contacts
 *
 * @apiDescription Retrieves list of memberID's pending incoming friend requests for given user associated with required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {String} User MemberID of user making the request.
 *
 * @apiSuccess (Success 200) {List} List List of users which have pending invitations to be friends of the supplied user.
 *
 * @apiError (400: Invalid Parameters) {String} message "Invalid information provided"
 *
 * @apiError (400: SQL Error) {String} message "Error retrieving member information"
 */
router.get("/getrequests/:user", (request, response, next)=> {
    if(!isStringProvided(request.query.user) || !isInteger(request.query.user)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    pool.query(`SELECT STRING_AGG(memberid_a::text, ', ') AS list FROM (SELECT memberid_a FROM contacts WHERE memberid_b = $1 AND status = 'Pending') as mem`, [request.query.user])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's requests list")
                response.send(result.rows[0])
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error retrieving member information",
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

module.exports = router;