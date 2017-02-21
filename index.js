/**
 * Created by shakibbinhamid on 21/02/17.
 */
var express = require('express');
var app = express();

app.use(express.static('www'));

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});
