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
var EventImagesSchema = require("../models/EventImagesSchema").EventImagesSchema;

// Set default timezone
moment.tz.setDefault("Asia/Kolkata");

/* Initial Entry Point of the API*/
router.get('/', function (req, res, next) {
    res.send("Welcome to the Images Website API here");
});

router.post("/login", function (req, res, next) {
    // All variables
    var userName = req.body.userName;
    var password = req.body.password;

    // attempt to authenticate user
    UserSchema.getAuthenticated(userName, password, function (err, user, reason) {
        if (err) {
            console.log(err);
            res.json({response: "Please try again!", success: "false", message: "Please Try Again!"});
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
            res.json({response: user, success: "true", token: token});
            return;
        }

        // otherwise we can determine why we failed
        var reasons = UserSchema.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
                res.json({
                    response: "Username not found in database!",
                    success: "false"
                });
                break;
            case reasons.PASSWORD_INCORRECT:
                res.json({
                    response: "Invalid Password!",
                    success: "false"
                });
                break;
        }
    });

});
// End of login api


// POST signup api
// Post variable = userName,firstName,password,mobileNumber,emailAddress
// Response variable = response,success
router.post("/signup", function (req, res, next) {
    // All variables
    var userName = req.body.userName;
    var firstName = req.body.firstName;
    var password = req.body.password;
    var mobileNumber = req.body.mobileNumber;
    var emailAddress = req.body.emailAddress;


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
        res.json({response: error, success: "false", message: "Please enter valid data!"});
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
            res.json({response: message, success: "false", message: message});
            return;
        }
        res.json({response: "User Added Successfully!", success: "true"});
    });

});
// End of signup api


// Post request
// request params: eventName, eventImageUrl, eventDate
// response params: response, success
router.post("/createEvent", function (req, res, next) {
    var eventName = req.body.eventName;
    var eventImageUrl = req.body.eventImageUrl;
    var eventDate = new Date(req.body.eventDate);
    var userId = req.body.userId;


    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("Invalid UserId");
        res.json({response: "Invalid UserId", success: "false"});
        return;
    }

    UserSchema.findOne({"_id": ObjectId(userId)}, function (err, user) {
        console.log(userId);
        if (user === null) {
            res.json({response: "No such user exists", success: "false"});
            return;
        }

        var AddEvent = new EventSchema({
            eventName: eventName,
            eventImageUrl: eventImageUrl,
            eventDate: eventDate,
            userId: userId
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
                res.json({response: message, success: "false"});
                return;
            }
            res.json({response: "Event Successfully Created!", success: "true"});
        });


    });



});


// GET request
// response params: response, success
router.get("/getAllEvents", function (req, res, next) {

    EventSchema.find().exec(function (err, events) {
        if (err) {
            console.log(err);
            res.json({response: err, success: "false"});
            return;
        }
        res.json({response: events, success: "true"});
    });

});

module.exports = router;
