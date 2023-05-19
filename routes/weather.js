//express is the framework we're going to use to handle requests
const express = require("express");
const { WEATHER_API_KEY } = require("../config");

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

const router = express.Router();

/*
 * Handler for processing async external get requests.
 * Source: https://gist.github.com/msmfsd/fca50ab095b795eb39739e8c4357a808
 */
async function fetchAsync (u) {
    let response = await fetch(u);
    let data = await response.json();
    return data;
}

/**
 * @api {get} /weather Request retrieve weather for a specific zipcode
 * @apiName GetWeather
 * @apiGroup Weather
 *
 * @apiDescription Gets weather for a specific zipcode for user.
 *
 * @apiParam {String} zipcode Required: zipcode or city name for weather retrieval
 * 
 * @apiQuery {int} days Optional: Amount of days to retrieve, between 1 and 5 inclusive. Default 5.
 *
 * @apiSuccess (Success 200) {boolean} success true when the name is inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: External Service Error) {String} message "External weather service error"
 */
router.get("/:zipcode?:days?", (request, response, next) => {
    if (isStringProvided(request.query.zipcode)) {
        next();
    } else {
        response.status(400).send({
          message: "Missing required information",
        });
    }
}, (request, response) => {
    let num = Number(request.query.days);
    let dayCount = (Number.isInteger(num) && num > 0 && num < 6) ? num : 5;
    let url = "http://api.weatherapi.com/v1/forecast.json?aqi=no&alerts=no&days=" + dayCount + "&key=" + WEATHER_API_KEY + "&q=" + request.query.zipcode;
    fetchAsync(url)
    .then(data => response.status(200).send(data))
    .catch(reason => response.status(400).send(reason.message));
});

module.exports = router;