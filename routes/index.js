var express = require("express");
var router = express.Router();
var url = "mongodb://localhost:27017/";
var mongo = require("mongodb");

router.get('/', function(req, res){
    res.render('index');
});

module.exports = router;