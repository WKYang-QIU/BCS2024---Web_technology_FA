const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'qiu_lostandfound_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
}));

// ── Passport Setup ────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const username = email.split('@')[0]; // use email prefix as username

        // Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length > 0) {
            // Existing user
            return done(null, { id: rows[0].id, username: rows[0].username, role: rows[0].role });
        } else {
            // Auto-register new user with student role
            const bcrypt = require('bcryptjs');
            const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
            const [result] = await db.query(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, randomPass, 'student']
            );
            return done(null, { id: result.insertId, username, role: 'student' });
        }
    } catch (err) {
        return done(err, null);
    }
}));

// ── Google OAuth Routes ───────────────────────────────────────
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        req.session.user = req.user;
        res.redirect('/index.html');
    }
);

// ── Auth Middleware ───────────────────────────────────────────
function requireLogin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Please login first.' });
    }
}

// ── Static files ──────────────────────────────────────────────
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// ── Routes ───────────────────────────────────────────────────
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');
const usersRouter = require('./routes/users');

app.use('/api/auth', authRouter);
app.use('/api/items', requireLogin, itemsRouter);
app.use('/api/users', requireLogin, usersRouter);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Server Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

// ── Test DB Connection ────────────────────────────────────────
db.query('SELECT 1')
    .then(() => console.log('Database connected successfully.'))
    .catch(err => console.error('Database connection failed:', err));