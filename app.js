const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

const indexRouter = require('./routes');
app.use('/', indexRouter);

module.exports = app;