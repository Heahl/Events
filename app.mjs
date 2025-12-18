import createError from 'http-errors';
import express, {json, urlencoded} from 'express';
import {static as expressStatic} from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import authRouter from './routes/auth.js';
import adminEventsRouter from './routes/adminEvents.js';
import publicEventsRouter from './routes/publicEvents.js';
import AdminFrontendRouter from "./routes/adminFrontend.js";
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import session from "express-session";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressStatic(join(__dirname, 'public')));

/* Session-Token */
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-muss-aber-min-32-Zeichen-lang-sein',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 //24h
    }
}));

app.use('/', authRouter);
app.use('/event', publicEventsRouter);
app.use('/admin', AdminFrontendRouter);
app.use('/api/events', adminEventsRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
