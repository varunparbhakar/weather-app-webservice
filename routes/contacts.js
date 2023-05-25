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
    if(!isStringProvided(request.params.user) || !isInteger(request.params.user)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }
}, (request, response, next)=> {
    pool.query(`SELECT memberid, firstname, lastname, username, email from members WHERE memberid IN (SELECT memberid_a FROM contacts WHERE memberid_b = $1 AND status = 'Friends'
                                          UNION
                                          SELECT memberid_b FROM contacts WHERE memberid_a = $1 AND status = 'Friends' )`, [request.params.user])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's list")
                response.json({
                    message: "get/contacts/getfriends successful!",
                    rows: result.rows
                })
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
router.get("/getrequests/", (request, response, next)=> {
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
    console.log(request.query.user)
    pool.query(`
        SELECT memberid, firstname, lastname, username, email 
        from members WHERE memberid 
                               IN (SELECT memberid_a FROM contacts WHERE memberid_b = $1 AND status = 'Pending')`, [request.query.user])
        .then((result) => {
            if(result.rowCount == 0) {
                console.log("Nothing was returned")
            } else {
                console.log("Returning the friend's requests list")
                response.send(result.rows)
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

router.post("/sendfriendrequest/", (request, response, next)=> {
    console.log(request.body.sender)
    console.log(request.body.receiver)
    console.log("Checking if the 2 body params are provided")
    if(!isStringProvided(request.body.sender) || !isInteger(request.body.sender) ||!isStringProvided(request.body.receiver) || !isInteger(request.body.receiver)) {

        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Invalid information provided"
        })
    } else if(request.body.sender == request.body.receiver){
        response.status(400).send({
            message: "User is not allowed to send friend request to themselves"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }

}, (request, response, next) => {
    //check if they exists in the database
    console.log("Checking if the send is in the database")
    pool.query(`SELECT * FROM members WHERE memberid = $1`, [request.body.receiver])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("User was not found")
                response.staus(400).send({
                    receiver: request.body.receiver,
                    sender : request.body.sender,
                    message: "This user does not exists"
                })
            } else {
                console.log("User was found")
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error finding user in the database",
                error: error.detail,
            });
        });
}, (request, response, next) => {
    //check if they have already sent you a friend request
    console.log("Searching for any conflicts in the database")
    pool.query(`SELECT *
                FROM contacts
                WHERE (memberid_a = $1 AND memberid_b = $2) UNION (
                    SELECT *
                    FROM contacts
                    WHERE memberid_a = $2 AND memberid_b = $1
                )`, [request.body.sender, request.body.receiver])
        .then((result) => {
            console.log(isInteger(result.rowCount))
            console.log(result.rowCount, "ROW COUNT AFTER SEARCHING")
            if(result.rowCount > 0) {
                console.log("User has either received or already sent a friend request.")
                response.status(400).send({
                    sender : request.body.sender,
                    message: "User has either received or already sent a friend request."
                })
            } else {
                console.log("Neither party has tried to add each other")
                // response.send("Neither party has tried to add each other")
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error searching member friend's status information",
                error: error.detail,
            });
        });
}
, (request, response) => {
    //Registering the friend request
    console.log("Inserting the friend request into the database")
    pool.query(`Insert into contacts (memberid_a, memberid_b, status) VALUES ($1, $2, 'Pending');`, [request.body.sender, request.body.receiver])
        .then((result) => {
            if(result.rowCount == 1) {
                console.log("Insertion successful")
                response.send({
                    receiver: request.body.receiver,
                    sender: request.body.sender,
                    message: "Friend request has been sent"
                })
            } else {
                console.log("Insertion not successful")
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error inserting member friend's status information",
                error: error.detail,
            });
        });
})


//Delete Contact
router.post("/remove/", (request, response, next)=> {
    if(!isStringProvided(request.body.user) || !isStringProvided(request.body.friend) ||!isInteger(request.body.user)|| !isInteger(request.body.friend)) {
        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Information is missing"
        })
    } else {
        console.log("Appropriate info was provided")
        next();
    }
}, (request, response, next)=> {
    console.log("Checking if the friend is in the database")
    pool.query(`SELECT * FROM members WHERE memberid = $1`, [request.body.friend])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("User was not found")
                response.staus(400).send({
                    receiver: request.body.receiver,
                    sender : request.body.sender,
                    message: "This user does not exists"
                })
            } else {
                console.log("User was found")
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error finding user in the database",
                error: error.detail,
            });
        });
}, (request, response, next)=> {
    console.log("Deleting from Contacts")
    pool.query(`DELETE FROM contacts WHERE memberid_a = $1 OR memberid_b = $1`, [request.body.friend])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("The delete contact request was not successful")
                response.send({
                    message: "The delete contact request was not successful"
                })
            } else {
                console.log("The delete contact request was successful")
                response.send({
                    message: "The delete contact request was successful"
                })
                next()
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error finding user in the database",
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
