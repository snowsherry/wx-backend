var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '777' });
});

router.get('/pp', function(req, res, next) {
    res.send('pp');
});

module.exports=router;