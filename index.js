/**
 * Created by shakibbinhamid on 21/02/17.
 */
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/www'));

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
    res.redirect('/parcoords')
});

app.get('/parcoords', function(req, res) {
    res.sendFile(__dirname + '/www/parcoords.html');
});

app.get('/treemap', function(req, res) {
    res.sendFile(__dirname + '/www/treemap.html');
});

app.get('/cleaning', function(req, res) {
    res.sendFile(__dirname + '/www/cleaning.html');
});

app.listen(app.get('port'), function () {
    console.log('Example app listening on port ' + (process.env.PORT || 5000))
});
