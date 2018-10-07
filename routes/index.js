var express = require("express");
var router = express.Router();
var url = "mongodb://localhost:27017/";
var mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
const dbName = 'GoOut';
var passport = require('passport');

function isAuthenticated(req,res,next){
   if(req.user)
      return next();
   else
        res.redirect('/login');
}

function getEvents(user, callback) {
    MongoClient.connect(url, function(err, client) {
        var events=[];
        const db = client.db(dbName);
        var collection = db.collection('Attendance');
        collection.find({user_id: new mongo.ObjectID(user._id)}).toArray(function(err,result) {
            if(err) throw err;
            collection = db.collection('Event');
            var counter = 0;
            for(var i=0;i<result.length;i++) {
                events.push({going:result[i].going,eventInfo: {}});
                collection.findOne({_id: new mongo.ObjectID(result[i].event_id)}, function(err, eventResult) {
                    events[counter].eventInfo = eventResult;
                    counter++;
                    if(counter == result.length) {
                        client.close();
                        callback(events);
                    }
                });
            }
        });
    });
} 

function getEvent(eventID, callback) {
    MongoClient.connect(url, function(err, client) {
        console.log("Finding event")
        const db = client.db(dbName);
        var collection = db.collection('Event');
        collection.findOne({_id: new mongo.ObjectID(eventID)}, function(err, result) {
            if(err) throw err;
            client.close();
            callback(result);
        });
    });
}

router.get('/', isAuthenticated, function(req, res){
    getEvents(req.user, function(events) {
        res.render('index', {event: events});
    })
});

router.get('/test/:item', isAuthenticated, function(req,res) {
    res.render('index');
})

router.get('/event/:eventID', isAuthenticated, function(req,res) {
    getEvent(req.params.eventID,function(event) {
        console.log("rendering");
        res.render('event', event);
    })
});

router.get('/login', function(req,res) {
    res.render('loginPage');
});

router.get('/addAccount', function(req,res) {
    res.render('addAccount');
});

router.get('/addEvent', isAuthenticated, function(req,res) {
    res.render('addEvent');
});

router.post('/addEvent',isAuthenticated, function(req,res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var collection = db.collection('Event');
        const event = {
            eventName: req.body.eventName,
            address: req.body.address,
            images: [],
            date: req.body.date,
            requirements: req.body.requirements,
            cost: req.body.cost,
            maxPeople: req.body.maxPeople,
            private: req.body.private,
            time: req.body.time
        };
        collection.insertOne(event, function(err) {
            if(err) throw err;
            console.log("1 event inserted");
            collection = db.collection('Attendance');
            const attendance = {
                user_id: req.user._id,
                event_id: event._id,
                host: 'true',
                going: 'yes'
            }
            collection.insertOne(attendance, function(err) {
                if(err) throw err;
                console.log("1 attendance inserted");
                client.close();
            });
        });
        
        res.redirect('/');
    });
});

router.post('/addAccount', function(req,res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        const collection = db.collection('User');
        const user = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            email: req.body.email,
            password: req.body.password,
            phone: ""
        };
        collection.insertOne(user, function(err) {
            if(err) throw err;
            console.log("1 user inserted");
            client.close();
        });
        res.redirect('/login');
    });
});
    
router.post('/login'
            ,passport.authenticate('local', { successRedirect: '/',
                                              failureRedirect: '/login'}));

module.exports = router;