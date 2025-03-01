require('dotenv').config();
const express = require('express');
const session = require("express-session");
const passport = require("passport");
const cors = require('cors');
const timeSaveRouter = require('./server/timeKeeper');
const userConfigurationRouter = require('./server/userConfiguration');
const isAuthenticated = require('./auth/isAuthenticated');

const app = express();
require('./auth/auth');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Session setup
app.use(
    session({ 
        secret: process.env.SECRET_SESSION_KEY,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Routers
app.get('/healthcheck', (req, res) => {
    try {
        res.status(200).end();
    } catch (err) {
        res.status(503).end();
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: [ 'email', 'profile' ] })
);

app.get('/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/monthly-time-calculator',
        failureRedirect: '/auth/failure'
    })
);

app.get('/monthly-time-calculator', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + "/public/calculator.html");
});

app.get('/auth/failure', (req, res) => {
    res.sendFile(__dirname + "/public/404.html");
});

app.get('/logout', (req, res) => {
    req.logOut(err => {
        if (err) {
            return next(err);
        }
        req.session.destroy(() => {
            res.redirect('/'); 
        });
    });
});

app.get('/api/v1/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            id: req.user.googleId,
            name: req.user.name,
            photo: req.user.picture
        });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});

app.use("/api/v1/timesheet", isAuthenticated, timeSaveRouter);
app.use("/api/v1/configuration", isAuthenticated, userConfigurationRouter);

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});