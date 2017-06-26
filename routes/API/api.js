// NPM modules
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var moment = require('moment-timezone');
var jwt = require("jsonwebtoken");


// Custom Modules
// Get your URL from config file
var cfg = require("../../config");

// Create all the schemas here
var UserSchema = require("../models/UserSchema").User;
var EventSchema = require("../models/EventSchema").EventSchema;
var EventFilesSchema = require("../models/EventFilesSchema").EventFilesSchema;

// Set default timezone
moment.tz.setDefault("Asia/Kolkata");

/* Initial Entry Point of the API*/
router.get('/', function (req, res, next) {
    res.send("Welcome to the Images Website API here");
});

// API type: POST
// API URL: /api/login
// request params: userName, password
// response variables: response,success
router.post("/login", function (req, res, next) {
    // All variables
    var userName = req.body.userName;
    var password = req.body.password;

    // attempt to authenticate user
    UserSchema.getAuthenticated(userName, password, function (err, user, reason) {
        if (err) {
            console.log(err);
            res.json({response: "Please try again!", success: false, message: "Please Try Again!"});
            return;
        }

        // login was successful if we have a user
        if (user) {
            // handle login success
            console.log('login success');
            user = JSON.parse(JSON.stringify(user));
            var payload = {
                id: user._id
            };
            var token = jwt.sign(payload, cfg.authJWT.jwtSecret);
            res.json({response: user, success: true, token: token});
            return;
        }

        // otherwise we can determine why we failed
        var reasons = UserSchema.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
                res.json({
                    response: "Username not found in database!",
                    success: false
                });
                break;
            case reasons.PASSWORD_INCORRECT:
                res.json({
                    response: "Invalid Password!",
                    success: false
                });
                break;
        }
    });

});
// End of login api

// API type: POST
// API URL: /api/signup
// request params: userName, firstName, password, mobileNumber, emailAddress
// response variables: response,success
router.post("/signup", function (req, res, next) {
    // All variables
    var userName = req.body.userName;
    var firstName = req.body.firstName;
    var password = req.body.password;
    var mobileNumber = req.body.mobileNumber;
    var emailAddress = req.body.emailAddress;

    // users ( userName, firstName, password, emailAddress, mobileNumber, registrationTimeStamp )

    // Create a new schema for current user
    var AddUser = new UserSchema({
        userName: userName,
        firstName: firstName,
        password: password,
        emailAddress: emailAddress,
        mobileNumber: mobileNumber
    });

    // Check the schema
    var error = AddUser.validateSync();
    if (error) {
        console.log(error);
        res.json({response: error, success: false, message: "Please enter valid data!"});
        return;
    }
    // Save through UserScema
    AddUser.save(function (err) {
        if (err) {
            console.log(err.errmsg);
            var message = "";
            // Custom error message
            if (err.errmsg.includes('userName')) {
                message = "UserName already taken!";
            } else if (err.errmsg.includes('emailAddress')) {
                message = "This email-address has already been registered!";
            } else if (err.errmsg.includes('mobileNumber')) {
                message = "This mobile number has already been registered!";
            } else {
                message = "Please enter valid data!";
            }
            res.json({response: message, success: false, message: message});
            return;
        }
        res.json({response: "User Added Successfully!", success: true});
    });

});
// End of signup api

// API type: POST
// API URL: /api/createEvent
// request params: eventName, eventDescription, eventImageUrl, eventDate, userId
// response variables: response, success
router.post("/createEvent", function (req, res, next) {

    var eventName = req.body.eventName;
    var eventDescription = req.body.eventDescription;
    var eventImageUrl = req.body.eventImageUrl;
    var eventDate = new Date(req.body.eventDate);
    var userId = req.body.userId;

    // events ( eventName, eventDescription, eventDate, eventImageUrl, created: {by, timeStamp}, edited: {by, timeStamp} )


    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("Invalid UserId");
        res.json({response: "Invalid UserId", success: false});
        return;
    }

    UserSchema.findOne({"_id": ObjectId(userId)}, function (err, user) {
        console.log(userId);
        if (user === null) {
            res.json({response: "No such user exists", success: false});
            return;
        }

        var AddEvent = new EventSchema({
            eventName: eventName,
            eventDescription: eventDescription,
            eventDate: eventDate,
            eventImageUrl: eventImageUrl,
            created: {
                by: ObjectId(userId),
                timeStamp: moment().format()
            },
            edited: {
                by: ObjectId(userId),
                timeStamp: moment().format()
            }
        });

        AddEvent.save(function (err) {
            if (err) {
                console.log(err.errmsg);
                var message = "";
                if (err.errmsg.includes('eventName')) {
                    message = "An event with this name is already created";
                }
                else {
                    message = err.errmsg;
                }
                res.json({response: message, success: false});
                return;
            }
            res.json({response: "Event Successfully Created!", success: true});
        });


    });


});
// End of createEvent api

// API type: GET
// API URL: /api/getAllEvents
// response params: response, success
router.get("/getAllEvents", function (req, res, next) {

    EventSchema.find().exec(function (err, events) {
        if (err) {
            console.log(err);
            res.json({response: err, success: false});
            return;
        }
        res.json({response: events, success: true});
    });

});
// End of getAllEvents api

// API type: POST
// API URL: /api/addFilesForEvent
// request params: videos [], images [], userId, eventId
// response variables: response, success
router.post("/addFilesForEvent", function (req, res, next) {

    var videos = req.body.videos;   // videos []
    var images = req.body.images;   // images []
    var userId = req.body.userId;
    var eventId = req.body.eventId;

    // videos = [
    //     {
    //         videoUrl: "videourl1234"
    //     }
    // ];
    // images = [
    //     {
    //         imageUrl: "imageurl1234"
    //     }
    // ];
    // images = [];

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("Invalid UserId");
        res.json({response: "Invalid UserId", success: false});
        return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.log("Invalid EventId");
        res.json({response: "Invalid EventId", success: false});
        return;
    }


    UserSchema.findOne({"_id": ObjectId(userId)}, function (err, user) {
        console.log("userId: " + userId);

        // if no user exists with given userId
        if (user === null) {
            res.json({response: "No such user exists", success: false});
            return;
        }

        // if no event exists with given eventId
        EventSchema.findOne({"_id": eventId}, function (err, event) {
            console.log("eventId: " + eventId);

            if (event === null) {
                res.json({response: "No such event exists", success: false});
                return;
            }

            if (videos === undefined && images === undefined) {
                res.json({response: "No image or video urls", success: false});
                return;
            }

            EventFilesSchema.findOne({eventId: eventId, userId: userId}, function (err, eventFiles) {

                var AddEventFiles = new EventFilesSchema({
                    eventId: eventId,
                    userId: userId,
                    files: {
                        images: images,
                        videos: videos
                    }
                });

                // if no such eventId, userId combination exists
                //      1. add a new entry to the db
                if (eventFiles === null) {

                    AddEventFiles.save(function (err) {
                        console.log(err);
                        if (err) {
                            res.json({response: err, success: false});
                            return;
                        }
                        res.json({response: "Files successfully added for the event", success: true});
                    });
                    return;
                }

                var pushQuery;
                if (images.length !== 0 && videos.length !== 0) {
                    pushQuery = {
                        'files.images': {$each: images},
                        'files.videos': {$each: videos}
                    };
                }
                else if (images.length !== 0) {
                    pushQuery = {
                        'files.images': {$each: images}
                    };
                }
                else {
                    pushQuery = {
                        'files.videos': {$each: videos}
                    };
                }

                // else update the previous entry
                EventFilesSchema.update({userId: userId, eventId: eventId}, {
                    $push: pushQuery
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                        res.json({response: err, success: false});
                        return;
                    }

                    console.log(result);
                    // result.files.images.push(images);
                    // result.files.videos.push(videos);
                    res.json({response: "Files successfully updated for the event", success: true});

                });


            });


        });
    });


});
// End of addFilesForEvent api

// API type: GET
// API URL: /api/getEventDetails/:eventId
// response params: response, success
router.get("/getEventDetails/:eventId", function (req, res, next) {

    var eventId = req.params.eventId;
    console.log("eventId: " + eventId);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.log("Invalid EventId");
        res.json({response: "Invalid EventId", success: false});
        return;
    }

    // EventSchema.find({_id: ObjectId(eventId)}).exec(function (err, events) {
    //     if (err) {
    //         console.log(err);
    //         res.json({response: err, success: false});
    //         return;
    //     }
    //     res.json({response: events, success: true});
    // });

    EventFilesSchema.aggregate(
        [
            {
                "$lookup": {
                    "localField": "eventId",
                    "from": "events",
                    "foreignField": "_id",
                    "as": "eventInfo"
                }
            },
            {"$unwind": "$eventInfo"}
            // ,{
            //     "$project": {
            //         "eventInfo._id": 0
            //     }
            // }
        ]
    ).exec(function (err, events) {
        if (err) {
            console.log(err);
            res.json({response: err, success: false});
            return;
        }
        res.json({response: events, success: true});
    });

});
// End of /api/getEventDetails/:eventId



module.exports = router;
