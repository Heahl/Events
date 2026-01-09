import createError from 'http-errors';
import express, {json, urlencoded} from 'express';
import {static as expressStatic} from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import rateLimit from "express-rate-limit";
import session from "express-session";
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import specs from './swaggerOptions.js';
import swaggerUi from 'swagger-ui-express';

import authRouter from './routes/auth/auth.js';
import adminEventsRouter from './routes/private/adminEvents.js';
import publicEventsRouter from './routes/public/publicEvents.js';
import AdminFrontendRouter from "./routes/private/adminFrontend.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Rate Limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 200, // Max 200 Anfragen pro IP
    message: {error: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.'},
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 5, // Max 5 Anmeldeversuche pro IP
    message: {error: 'Zu viele Anmeldeversuche, bitte versuchen Sie es in 15 Minuten erneut.'},
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(logger('dev'));
app.use(generalLimiter);
app.use(json());
app.use(urlencoded({extended: false}));
app.use(cookieParser());

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

// === VOR MIDDLEWARE ===
// Root '/' -> weiterleitung zu '/event'
app.get('/', (req, res) => {
    res.redirect('/event');
})

// Statische Dateien für alle Nutzer
app.use(expressStatic(join(__dirname, 'public')));

// Swagger-Dokumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Authentifizierungsrouten
app.use('/', authRouter);

// Öffentliche Events Routen
app.use('/event', publicEventsRouter);
// === VOR-MIDDLEWARE ===

// middleware auf Routen anwenden
app.use((req, res, next) => {
    // skip für public routen
    if (req.path.startsWith('/event') ||
        req.path.startsWith('/auth') ||
        req.path === '/' ||
        req.path === '/login' ||
        req.path === '/register') {
        return next();
    }

    // auth check für alle weiteren Routen
    if (!req.session?.userId) {
        // API-Client (JSON) -> 401
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            return res.status(401).json({error: 'Nicht authentifiziert'});
        }
        // klassischer Browser -> redirect
        return res.redirect('/login');
    }
    next();
});

// Authentifizierungsrouten mit speziellem Rate Limiting
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Geschützte Routen
// web
app.use('/admin', AdminFrontendRouter);
// api
app.use('/api/events', adminEventsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    /*res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};*/

    // render the error page
    res.status(err.status || 500);
    res.render('auth/error');
});

export default app;