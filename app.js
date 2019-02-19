const express = require('express')
const createError = require('http-errors');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');

const db = require('./db');
const storage = require('./storage');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const app = express();
const port = process.env.PORT || 1337;

// db.connect();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('short'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const main = async() => {
    // Connect database
    await db.connect();
    console.log("DB connected successfully.");

    // Connect storage
    await storage.connect();
    console.log("Storage connected successfully.");

    // Start web service
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

main().catch(err => {
    console.error(`Cannot start server! error: ${err}`);
    process.exit(1);
})
