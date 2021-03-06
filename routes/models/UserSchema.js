var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

// users ( userName, firstName, password, emailAddress, mobileNumber, registrationTimeStamp )

var UserSchema = new Schema({
    userName: {
        type: String,
        required: [true, 'username must be provided'],
        minlength: [2, 'UserName requires at least 2 characters!'],
        unique: [true, 'Username already exists']
    },
    firstName: {
        type: String,
        required: [true, 'first name must be provided'],
        minlength: [2, 'First Name requires at least 2 characters!']
    },
    password: {
        type: String,
        required: [true, 'Password must be entered'],
        minlength: [6, 'Minimum length of the password should be 6']
    },
    mobileNumber: {
        //Still Doubt here. Number or String? Length will checked with String Only.
        type: String,
        unique: [true, 'Mobile Number Already Entered'],
        minlength: [10, 'Digits of Mobile Number is not 10'],
        maxlength: [10, 'Digits of Mobile Number is not 10']
    },
    emailAddress: {
        type: String,
        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,9})+$/.test(v);
            },
            message: '{VALUE} is not a valid email address'
        },
        required: [true, 'Email Address Required'],
        unique: [true, 'Email Address exists in the database'],
        lowercase: true,
        trim: true,
        index: true
    },
    registrationTimeStamp: {
        type: Date,
        default: Date.now
    }
}, {strict: true});


// Add methods to schemas

UserSchema.virtual('isLocked').get(function () {
    // check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            // set the hashed password back on our user document
            user.password = hash;
            console.log("Adding User : " + user);
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.methods.incLoginAttempts = function (cb) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: {loginAttempts: 1},
            $unset: {lockUntil: 1}
        }, cb);
    }
    // otherwise we're incrementing
    var updates = {$inc: {loginAttempts: 1}};
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = {lockUntil: Date.now() + LOCK_TIME};
    }
    return this.update(updates, cb);
};

// expose enum on the model, and provide an internal convenience reference
var reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1
};

UserSchema.statics.getAuthenticated = function (username, password, cb) {
    this.findOne({userName: username}, function (err, user) {
        if (err) return cb(err);

        // make sure the user exists
        if (!user) {
            return cb(null, null, reasons.NOT_FOUND);
        }

        // test for a matching password
        user.comparePassword(password, function (err, isMatch) {
            if (err) return cb(err);

            // check if the password was a match
            if (isMatch) {
                return cb(null, user);
            }

            // password is incorrect, so increment login attempts before responding
            return cb(null, null, reasons.PASSWORD_INCORRECT);
        });
    });
};

// Initialize each and every schemas
var User = mongoose.model('User', UserSchema);

User.on('index', function (error) {
    if (error) {
        console.log("Error creating Index in User Schema!");
    }
});

// Export schemas
module.exports = {
    User: User
};
