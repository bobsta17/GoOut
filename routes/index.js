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

function getAttendance(query,callback) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var collection = db.collection('Attendance');
        collection.find(query).toArray(function(err, result) {
            if(err) throw err;
            client.close();
            callback(result);
        });
    });
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
            if(result[0]==undefined) {
                callback(events);
            }
            else {
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
            }
        });
    });
}

function getFriends(friends, callback) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var friendsUpdated=[];
        var counter = 0;
        var collection = db.collection('User');
        for(var i=0;i<friends.length;i++) {
            collection.findOne({_id: new mongo.ObjectID(friends[i])}, function(err, result) {
                if(err) throw err;
                friendsUpdated[counter] = result;
                counter++;
                if(counter==friends.length) {
                    client.close();
                    callback(friendsUpdated);
                } 
            });
        }
    });
}

function getEvent(eventID, callback) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var collection = db.collection('Event');
        collection.findOne({_id: new mongo.ObjectID(eventID)}, function(err, result) {
            if(err) throw err;
            client.close();
            callback(result);
        });
    });
}

function getUserPage(userID, callback) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var collection = db.collection('User');
        collection.findOne({_id: new mongo.ObjectID(userID)}, function(err, result) {
            if(err) throw err;
            client.close();
            getEvents(result, function(events) {
                if(result.friends) {
                    getFriends(result.friends, function(friends) {
                        result.friends = friends;
                        callback(events, result);
                    });
                } else {
                    callback(events, result);
                }
            });
        });
    });
}

function addFriendTest(friendList,userID,callback) {
    console.log("Running function");
    for(var i=0;i<friendList.length;i++) {
        if(userID==friendList[i]) {
            console.log("Already Friends")
            callback(false);
        } else callback(true);
    }
}

router.get('/social', isAuthenticated, function(req,res) {
    res.render('social');
});

router.get('/friends', isAuthenticated, function(req,res) {
    res.render('friends');
});

router.get('/search', isAuthenticated, function(req,res) {
    res.render('search');
})

router.post('/search', isAuthenticated, function(req,res) {
    MongoClient.connect(url, function(err, client) {
        var queryType = req.body.queryType;
        var query = req.body.query.split(' ');
        var actualQuery = [];
        const db = client.db(dbName);
        var collection = db.collection(queryType);
        if(queryType == 'User') {
            for(var i=0;i<query.length;i++) {
                actualQuery.push({$or: [{firstName: new RegExp(query[i],'i')},{lastName:  new RegExp(query[i],'i')}]});
            }
        }
        else if(queryType=='Event') {
            for(var i=0;i<query.length;i++) {
                actualQuery.push({$or: [{eventName: new RegExp(query[i],'i')},{address:  new RegExp(query[i],'i')}]});
            }
        }
        collection.find({$or: actualQuery}).toArray(function(err,result) {
            client.close();
            res.render('search',{result: result});
        });
    });
});

router.get('/', isAuthenticated, function(req, res){
    getEvents(req.user, function(events) {
        res.render('index', {event: events});
    });
});

router.get('/event/:eventID', isAuthenticated, function(req,res) {
    getEvent(req.params.eventID,function(event) {
        res.render('event', event);
    })
});

router.get('/user/:userID', isAuthenticated, function(req,res) {
    getUserPage(req.params.userID,function(events, user) {
        if(user._id.equals(req.user._id)) {
            console.log("Nope 1");
            res.render('user', {user:user,event:events});
        }
        else if(req.user.friends) {
            addFriendTest(req.user.friends,req.params.userID, function(addFriendBoolean) {
                console.log(addFriendBoolean);
                if(addFriendBoolean) {
                    console.log("Yep");
                    res.render('user', {user:user,event:events,addFriend: true});
                } else {
                    console.log("Nope 2");
                    res.render('user', {user:user,event:events});
                }
            });
        } else res.render('user', {user:user,event:events,addFriend: true});
    });
});

router.get('/login', function(req,res) {
    res.render('loginPage');
});

router.get('/addAccount', function(req,res) {
    res.render('addAccount');
});

router.get('/addEvent', isAuthenticated, function(req,res) {
    res.render('addEvent',req.user);
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
    console.log(req.body);
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