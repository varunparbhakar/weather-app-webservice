//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} name the name for the chat
 *
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 *
 * @apiError (400: Unknown user) {String} message "unknown email address"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (400: Unknown Chat ID) {String} message "invalid chat id"
 *
 * @apiUse JSONError
 */
router.post("/", (request, response, next) => {
    if (!isStringProvided(request.body.name)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response) => {

    let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`
    let values = [request.body.name]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true,
                chatID:result.rows[0].chatid
            })
        }).catch(err => {
            console.log(err);
            response.status(400).send({
                message: "SQL Error",
                error: err
            })

        })
    ;
})

/**
 * @api {put} /chats/:chatId? Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 *
 * @apiDescription Adds the user associated with the required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to add the user to
 *
 * @apiSuccess {boolean} success true when the name is inserted
 *
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.put("/:chatId/", (request, response, next) => {
        //validate on empty parameters
        if (!request.params.chatId) {
            response.status(400).send({
                message: "Missing required information"
            })
        } else if (isNaN(request.params.chatId)) {
            response.status(400).send({
                message: "Malformed parameter. chatId must be a number"
            })
        } else {
            next()
        }
    }, (request, response, next) => {
        //validate chat id exists
        let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
        let values = [request.params.chatId]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "Chat ID not found"
                    })
                } else {
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
        //code here based on the results of the query
    }, (request, response, next) => {
        //validate email exists
        let query = 'SELECT * FROM Members WHERE MemberId=$1'
        let values = [request.decoded.memberid]

        console.log(request.decoded)

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "email not found"
                    })
                } else {
                    //user found
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response, next) => {
        //validate email does not already exist in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2'
        let values = [request.params.chatId, request.decoded.memberid]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: "user already joined"
                    })
                } else {
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })

    }, (request, response) => {
        //Insert the memberId into the chat
        let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`
        let values = [request.params.chatId, request.decoded.memberid]
        pool.query(insert, values)
            .then(result => {
                response.json({
                    success: true,
                    email: request.params.email
                })
            }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
    }
)

/**
 * @api {put} /chats/:chatId?/:email? Request add another user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 *
 * @apiDescription Adds the user associated with the required email.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to add the user to
 * @apiParam {String} email the email of user to add
 *
 * @apiSuccess {boolean} success true when the name is inserted
 *
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.put("/:chatId/:email/", (request, response, next) => {
        //validate on empty parameters
        console.log('step 1');

        if (!request.params.chatId) {
            response.status(400).send({
                message: "Missing required information"
            })
        } else if (isNaN(request.params.chatId)) {
            response.status(400).send({
                message: "Malformed parameter. chatId must be a number"
            })
        } else {
            next()
        }
    }, (request, response, next) => {
        //validate chat id exists
        let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
        let values = [request.params.chatId]
        console.log('step 2');

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "Chat ID not found"
                    })
                } else {
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
        //code here based on the results of the query
    }, (request, response, next) => {
        //validate email exists
        let query = 'SELECT * FROM Members WHERE Email=$1'
        let values = [request.params.email]
        console.log('step 3');

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "email not found"
                    })
                } else {
                    //user found
                    response.memberId = result.rows[0].memberid;
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response, next) => {
        //validate email does not already exist in the chat
        let query = `SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2`;
        let values = [request.params.chatId, response.memberId];
        console.log("step 4");

        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: "user already joined"
                    })
                } else {
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })

    }, (request, response) => {
        //Insert the memberId into the chat
        console.log('step 5');

        let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`;
        let values = [request.params.chatId, response.memberId];
        pool.query(insert, values)
            .then(result => {
                response.send({
                    success: true
                })
            }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
    }
)

/**
 * @api {get} /chats/memberId=:memberId? Request to get the chats a user is in
 * @apiName GetChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} memberId the user to look up.
 *
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} top message at the top of the chat
 *
 * @apiError (404: MemberId Not Found) {String} message "Member ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. MemberId must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/memberId=:memberId", (request, response, next) => {
    let num = Number(request.params.memberId);
    //validate on missing or invalid (type) parameters
    if (!num) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(num)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next();
    }
},  (request, response) => {
    //get chat id
    let query = `SELECT chats.chatid, chats.name FROM chats JOIN chatmembers ON chats.chatid = chatmembers.chatid WHERE memberid = $1`;
    let values = [request.params.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.json({
                    message: "no chat found"
                });
            } else {
                response.json({
                    message: "Retrieved chats successfully",
                    rows: result.rows
                })
            }
        }).catch(error => {
        response.status(400).send({
            message: "SQL Error",
            error: error
        });
    });
});

/**
 * @api {get} /chats/:chatId? Request to get the emails and top message of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to look up.
 *
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 *
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/:chatId", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.params.chatId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
},  (request, response, next) => {
    console.log("started: validate chat id exists");
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
        response.status(400).send({
            message: "SQL Error",
            error: error
        })
    })
}, (request, response) => {
    console.log("started: retrieve the members");
    //Retrieve the members
    let query = `SELECT Members.Email FROM ChatMembers INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId WHERE ChatId=$1`
    let values = [request.params.chatId]
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member's email not found"
                })
            } else {
                response.emails = result.rows.map(row => row.email);
                response.json({
                    success: true,
                    message: "get/chats emails successful!",
                    email: response.emails
                });
            }
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error",
            error: err
        })
    })
});

/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 *
 * @apiDescription Does not delete the user associated with the required JWT but
 * instead deletes the user based on the email parameter.
 *
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 *
 * @apiSuccess {boolean} success true when the name is deleted
 *
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.delete("/delete/:chatId/:email", (request, response, next) => {
        //validate on empty parameters
        if (!request.params.chatId || !request.params.email) {
            response.status(400).send({
                message: "Missing required information"
            })
        } else if (isNaN(request.params.chatId)) {
            response.status(400).send({
                message: "Malformed parameter. chatId must be a number"
            })
        } else {
            next()
        }
    }, (request, response, next) => {
        //validate chat id exists
        let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
        let values = [request.params.chatId]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "Chat ID not found"
                    })
                } else {
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response, next) => {
        //validate email exists AND convert it to the associated memberId
        let query = 'SELECT MemberID FROM Members WHERE Email=$1'
        let values = [request.params.email]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "email not found"
                    })
                } else {
                    request.params.email = result.rows[0].memberid
                    next()
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response, next) => {
        //validate email exists in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2'
        let values = [request.params.chatId, request.params.email]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "user not in chat"
                    })
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })

    }, (request, response) => {
        //Delete the memberId from the chat
        let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`
        let values = [request.params.chatId, request.params.email]
        pool.query(insert, values)
            .then(result => {
                response.send({
                    success: true
                })
            }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
    }
)

/**
 * @api {post} /chats/createchat/ Make a chat with two users
 * @apiName CreateChat
 * @apiGroup Chats
 *
 * @apiDescription Adds the user associated with the required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to add the user to
 *
 * @apiSuccess {boolean} success true when the name is inserted
 *
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. user must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.post("/createchat/", (request, response, next) => {
    //validate on empty parameters
    if(!isStringProvided(request.body.userone) || !isStringProvided(request.body.usertwo)
                    || !isInteger(request.body.userone)|| !isInteger(request.body.usertwo)) {
                    // || !isStringProvided(request.body.chatname)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate email exists
    let query = 'SELECT * FROM Members WHERE MemberId=$1'
    let values = [request.decoded.memberid]

    console.log(request.decoded)

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                //user found
                request.firstusername = result.rows[0].username;
                next()
            }
        }).catch(error => {
        response.status(400).send({
            message: "SQL Error: userone",
            error: error
        })
    })
},(request, response, next) => {
    //validate email exists
    let query = 'SELECT * FROM Members WHERE MemberId=$1'
    let values = [request.body.usertwo]

    console.log(request.body.usertwo)

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                //user found
                request.secondusername = result.rows[0].username;
                next()
            }
        }).catch(error => {
        response.status(400).send({
            message: "SQL Error: usertwo",
            error: error
        })
    })
}, (request, response, next) => {
    //create chat
    let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`
    let chatname = request.firstusername + "," + request.secondusername;
    let values = [chatname] //request.body.
    pool.query(insert, values)
        .then(result => {
            request.chatid = result.rows[0].chatid;
            next();
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error: chat insert",
            error: err
        })
    })
}, (request, response, next) => {
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
              VALUES ($1, $2)
              RETURNING *`
    let values = [request.chatid, request.decoded.memberid]
    pool.query(insert, values)
        .then(result => {
            next();
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error: insert userone into chat",
            error: err
        })
    })
}, (request, response) => {
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
              VALUES ($1, $2)
              RETURNING *`
    let numusertwo = Number(request.body.usertwo);
    let values = [request.chatid, numusertwo]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true,
                chatid:request.chatid
            })
        }).catch(err => {
            console.log(err);
        response.status(400).send({
            message: "SQL Error: insert usertwo into chat",
            error: err
        })
    })
}
)

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


module.exports = router