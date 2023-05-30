//express is the framework we're going to use to handle requests
const express = require("express");

var router = express.Router();

//Access the connection to Heroku Database
const pool = require("../utilities/exports").pool;

const validation = require("../utilities/exports").validation;
let isStringProvided = validation.isStringProvided;


/**
 * @api {get} /addfavorite Add favorite weather location
 * @apiName AddFavorite
 * @apiGroup Weather
 *
 * @apiDescription Add a favorite location
 *
 * @apiParam {String} zip zipcode or city name for weather retrieval
 * @apiParam {String} user memberID of user making request
 * @apiParam {String} nickname user making request
 * @apiParam {String} lat latitude of location
 * @apiParam {String} long longitude of location
 *
 * @apiSuccess (Success 200) {boolean} success true when the name is inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: External Service Error) {String} message "External weather service error"
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 */
router.post("/addfavorite/", (request, response, next)=> {
        console.log(request.body.user);
        console.log(request.body.nickname);
        console.log(request.body.lat);
        console.log(request.body.long);
        console.log(request.body.zip);

        console.log("Checking if the body params are provided")
        if(!isStringProvided(request.body.user) || !isInteger(request.body.user)
            ||!isStringProvided(request.body.nickname)
            ||!isStringProvided(request.body.lat) || !isLat(request.body.lat)
            ||!isStringProvided(request.body.long) || !isLong(request.body.long)
            ||!isStringProvided(request.body.zip) || !isZipCode(request.body.zip)
        ) {

            console.log("user info is not provided or is in wrong format");
            response.status(400).send({
                message: "Information provided in the wrong format"
            })
        } else {
            console.log("User is requesting contacts");
            next();
        }

    }, (request, response, next) => {
        //check if they exists in the database
        console.log("Checking if nickname is already taken for this user")
        pool.query(`SELECT * FROM locations WHERE nickname = $1 AND memberid = $2`, [request.body.nickname, request.body.user])
            .then((result) => {
                if(result.rowCount <= 0) {
                    console.log("Nickname is not taken for this user")
                    next()

                } else {
                    console.log("Nickname is taken for this user")
                    response.status(400).send({
                        user: request.body.user,
                        nickname : request.body.nickname,
                        message: "Nickname is taken for this user"
                    })
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
    //check if they exists in the database
    console.log("Checking if long and LAT is already taken for this user")
    pool.query(`SELECT * FROM locations WHERE lat = $1 AND long = $2 AND memberid = $3`, [request.body.lat, request.body.long, request.body.user])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("Long and Lat is not taken for this user")
                next()

            } else {
                console.log("Long and Lat is taken for this user")
                response.status(400).send({
                    user: request.body.user,
                    lat : request.body.lat,
                    long : request.body.long,
                    message: "Long and Lat is taken for this user"
                })
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error finding user in the database",
                error: error.detail,
            });
        });
}, (request, response) => {
    //Insert the data into the database
    console.log("Inserting the database into the database")
    pool.query(`INSERT into locations (memberid, lat, long, zip) VALUES ($1,$2, $3, $4);`,
        [request.body.user, request.body.lat, request.body.long, request.body.zip])
        .then((result) => {
                if(result.rowCount == 1) {
                    console.log("Insertion successful")
                    response.send({
                        user: request.body.receiver,
                        nickname: request.body.receiver,
                        lat: request.body.sender,
                        long: request.body.receiver,
                        zip: request.body.sender,
                        message: "Your favorite location has been logged in the database"
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

/**
 * @api {get} /removefavorite Remove favorite weather location
 * @apiName RemoveFavorite
 * @apiGroup Weather
 *
 * @apiDescription Remove a favorite location
 *
 * @apiParam {String} zip zipcode or city name for weather retrieval
 * @apiParam {String} user memberID of user making request
 * @apiParam {String} nickname user making request
 * @apiParam {String} lat latitude of location
 * @apiParam {String} long longitude of location
 *
 * @apiSuccess (Success 200) {boolean} success true when the name is inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: External Service Error) {String} message "External weather service error"
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 */
router.post("/removefavorite/", (request, response, next)=> {
    console.log(request.body.user);
    console.log(request.body.nickname);
    console.log("Checking if the body params are provided")
    if(!isStringProvided(request.body.user) || !isInteger(request.body.user)
        ||!isStringProvided(request.body.nickname)
    ) {

        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Information provided in the wrong format"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }

}, (request, response, next) => {
    //check if they exists in the database
    console.log("Checking if nickname is already taken for this user")
    pool.query(`SELECT * FROM locations WHERE nickname = $1 AND memberid = $2`, [request.body.nickname, request.body.user])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("Favorite was not found")
                response.status(400).send({
                    user: request.body.user,
                    nickname : request.body.nickname,
                    message: "Favorite was not found"
                })

            } else {
                console.log("Favorite was not found")
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
}, (request, response) => {
    //Deleting from the database
    console.log("Deleting location from teh database")
    pool.query(`DELETE FROM locations WHERE memberid = $1 AND nickname = $2;`, [request.body.user, request.body.nickname])
        .then((result) => {
            console.log("Insertion successful")
            response.send({
                user: request.body.user,
                nickname: request.body.nickname,
                message: "Your favorite location was deleted"
            })
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error inserting member friend's status information",
                error: error.detail,
            });
        });
})

/**
 * @api {get} /getall Get favorite weather locations
 * @apiName GetFavorite
 * @apiGroup Weather
 *
 * @apiDescription Get favorite locations
 *
 * @apiParam {String} zip zipcode or city name for weather retrieval
 * @apiParam {String} user memberID of user making request
 * @apiParam {String} nickname user making request
 * @apiParam {String} lat latitude of location
 * @apiParam {String} long longitude of location
 *
 * @apiSuccess (Success 200) {boolean} success true when the name is inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: External Service Error) {String} message "External weather service error"
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 */
router.get("/getall/", (request, response, next)=> {
    console.log(request.query.user);

    console.log("Checking if the body params are provided")
    if(!isStringProvided(request.query.user) || !isInteger(request.query.user)
    ) {

        console.log("user info is not provided or is in wrong format");
        response.status(400).send({
            message: "Information provided in the wrong format"
        })
    } else {
        console.log("User is requesting contacts");
        next();
    }

}, (request, response, next) => {
    //check if they exists in the database
    console.log("Checking if nickname is already taken for this user")
    pool.query(`SELECT nickname, lat, long, zip FROM locations WHERE  memberid = $1`, [request.query.user])
        .then((result) => {
            if(result.rowCount <= 0) {
                console.log("No locations were found for this user")
                response.status(400).send({
                    user: request.query.user,
                    message: "No locations were found for this user"
                })
            } else {
                console.log(result.rowCount + " locations were found for this user")
                response.send({
                    message: "Successfull " + result.rowCount + " locations were found for this user",
                    user: request.query.user,
                    locations: result.rows,
                })
            }
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "Error finding locations in the database",
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

function isZipCode(str) {
    // Check if the string is a number.
    if (isNaN(str)) {
        return false;
    }
    // Check if the string is an integer.
    return /[0-9]{5}/.test(str);
}

function isLat(str) {
    // Check if the string is a Latitude.
    if (isNaN(str)) {
        return false;
    }
    return /^[-+]?([1-8]?\d(?:\.\d{1,6})?|90(?:\.0{1,6})?)$/.test(str);
}

function isLong(str) {
    // Check if the string is a Longitude.
    if (isNaN(str)) {
        return false;
    }
    return /^[-+]?(?:180(?:\.0{1,6})?|(?:1[0-7]\d|\d{1,2})(?:\.\d{1,6})?)$/.test(str);
}

module.exports = router;
