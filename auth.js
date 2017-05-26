// auth.js
var passport = require("passport");
var cfg = require("./config.js");
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var moment = require('moment-timezone');

// Custom Modules
// Get your URL from config file
var URL = cfg.db.URL;

var UserSchema = require("./routes/models/UserSchema").User;


var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = cfg.authJWT.jwtSecret;


module.exports = function() {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        UserSchema.findOne({"_id": ObjectId(jwt_payload.id)}, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                done(null, user);
            } else {
                done(null, false);
                // or you could create a new account
            }
        });
    }));
    return {
        initialize: function() {
            return passport.initialize();
        },
        authenticate: function() {
            return passport.authenticate("jwt", { session : false });
        }
    };
};
