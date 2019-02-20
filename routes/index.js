var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FET AI Hackathon[Hot Desking]' });
});

module.exports = router;
