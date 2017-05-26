var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var fs = require('fs');
var util = require('util');

var log_file = fs.createWriteStream(__dirname + '/server_console.log.json', {flags: 'a'});
var requestsLogStream = fs.createWriteStream(__dirname + '/requests.log.json', {flags: 'a'});
var log_stdout = process.stdout;

// Custom Modules
// Get your URL from config file
var cfg = require("./config.js");
var URL = cfg.db.URL;


mongoose.connect(URL);

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/API/api');
var auth = require("./auth.js")(); // Order matters because of mongoose.connect()

var app = express();
app.use(auth.initialize());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// store stdout in /server_console.log.json file
console.log = function (anything) { //
    log_file.write(util.format(anything) + '\n');
    log_stdout.write(util.format(anything) + '\n');
};

// store POST, PUT, GET request logs in /requests.log.json file
app.use(logger('combined', {stream: requestsLogStream}));

// app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api',cors(),api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Read the link below about express behind a proxy
app.set('trust proxy', true);
app.set('trust proxy', 'loopback');


module.exports = app;
