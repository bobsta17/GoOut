var express = require("express");
var app     = express();
var path    = require("path");
var router = express.Router();
var bodyParser = require('body-parser');
var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./configuration/config');
var routes = require('./routes/index');
var hbs = require('express-handlebars');
var session = require('express-session');
var fs = require('fs');
var key = fs.readFileSync('encryption/domain-key.txt');
var cert = fs.readFileSync('encryption/domain-crt.txt');
var ca = fs.readFileSync( 'encryption/intermediate-crt.txt' );
var options = {
key: key,
cert: cert,
ca: ca
};
var https = require('https');

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      //Further DB code.
        console.log(profile.id);
        console.log(profile);
        console.log('name:',profile.name,'first name:',profile.first_name,'lastname:',profile.last_name,'gender:',profile.gender)
      return done(null, profile);
    });
  }
));

app.use(session({secret: 'secretCookie',
                 name: 'cookieName',
                 resave: false,
                 saveUninitialized: false}));

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

app.use('/', routes);

https.createServer(options, app).listen(443);
var http = require('http');
var httpApp = express();
var httpRouter = express.Router();
httpRouter.get('*', function(req, res){
    var host = req.get('Host');
    // replace the port in the host
    host = host.replace(/:\d+$/, ":"+app.get('port'));
    // determine the redirect destination
    var destination = ['https://', host, req.url].join('');
    return res.redirect(destination);
});
httpApp.use('/', httpRouter);
var httpServer = http.createServer(httpApp);
httpServer.listen(3000);

module.exports = app;

console.log("Running Server");