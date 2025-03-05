require('dotenv').config();
const express = require('express');
const session = require("express-session");
const passport = require("passport");
const cors = require('cors');
const helmet = require('helmet');
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const timeSaveRouter = require('./server/timeKeeper');
const userConfigurationRouter = require('./server/userConfiguration');
const isAuthenticated = require('./auth/isAuthenticated');

const app = express();
require('./auth/auth');

const corsOptions = {
    // origin: (origin, callback) => {
    //   const allowedOrigins = [
    //     "https://localhost:8081",
    //   ];
    //   if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },

    origin: '*',
    // origin: 'http://localhost:3000',
    credentials: true, // If you need to handle cookies or authentication tokens
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Allow resources from the same origin
                scriptSrc: [
                    "'self'", // Allow scripts from the same origin
                    "https://cdn.tailwindcss.com", // Tailwind CSS CDN
                    "https://unpkg.com/aos@2.3.1/dist/aos.js", // AOS library
                    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js", // Bootstrap JS
                    "https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.15.10/sweetalert2.all.min.js", // SweetAlert2
                    "'unsafe-inline'", // Allow inline scripts (if necessary)
                ],
                fontSrc: [
                    "'self'", // Allow fonts from the same origin
                    "https://fonts.gstatic.com", // Google Fonts
                ],
                imgSrc: [
                    "'self'", // Allow images from the same origin
                    "data:", // Allow data URIs for images
                    "https://firebasestorage.googleapis.com", // Firebase Storage for images
                    "https://lh3.googleusercontent.com", // Google profile pictures
                ],
                connectSrc: [
                    "'self'", // Allow API requests to the same origin
                    "https://monthly-time-calculator.onrender.com", // Your app's domain
                    "https://accounts.google.com",
                    "https://oauth2.googleapis.com",
                    "http://localhost:3000",
                ],
                frameSrc: [
                    "'self'", // Allow iframes from the same origin
                ],
                objectSrc: [
                    "'none'", // Disallow objects (e.g., Flash)
                ],
                baseUri: ["'self'"], // Restrict base URLs to the same origin
                formAction: ["'self'"], // Restrict form actions to the same origin
            },
        },
    })
);
app.use(express.json());
app.use(express.static('public'));

// Session setup
app.use(
    session({ 
        secret: process.env.SECRET_SESSION_KEY,
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: false }, // Set to `false` for HTTP // set to `true` for HTTPS
        cookie: { secure: true },
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Log file
const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
morgan.token('body', (req) => {
    const body = { ...req.body };
    if (body.password) body.password = '*****';
    return JSON.stringify(body);
});

app.use(morgan(':date[iso] :method :url :status :response-time ms - :body', { stream: logStream }));
app.use(morgan('dev'));

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
    console.log("Logout route called");
    req.logOut(err => {
        if (err) {
            console.error("Logout error:", err);
            // return next(err);
            return res.status(500).send("Logout failed");
        }
        req.session.destroy(() => {
            console.log("Session destroyed");
            res.redirect('/'); 
            // res.redirect("http://localhost:3000/"); 
            console.log("Redirect sent to /");
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