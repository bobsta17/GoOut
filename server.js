var express = require("express");
var app     = express();
var routes = require('./routes/index');
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var url = 'mongodb://localhost:27017/GoOut';
var dbName = 'GoOut';
var session = require('express-session');

/**var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./configuration/config');


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
*/

passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback : true
},
    function(req, email, password, done) {
        console.log("Starts authentication");
        MongoClient.connect(url, function(err, client) {
            const db = client.db(dbName);
            const collection = db.collection('User');
            console.log("Connects to database");
            collection.findOne({'email':email, 'password':password},function(err,user) {
                if(err) { return done(err); }
                if(!user) {
                    console.log("Fail")
                    return done(null, false, {message: 'Incorrect Email or Password.'});
                }
                console.log("Success")
                return done(null,user);
            });
        })
    }
));

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(session({ 
    secret: 'ladhirrim'/**,
    resave: true,
    saveUninitialized: true,*/
}));
app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

passport.serializeUser(function(user, done) {
    console.log("Serialising user");
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
   MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        const collection = db.collection('User');
        const result = collection.findOne({'_id':new mongo.ObjectID(id)},function(err,user) {
            console.log("deserialising user");
            return done(err, user);
        });
   });
});

app.use(express.static(__dirname + '/public'));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

var http = require('http');

var httpServer = http.createServer(app);
httpServer.listen(3000);

module.exports = app;

console.log("Running Server");