const express = require('express');
const session = require('express-session');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'qiu_lostandfound_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
}));

// Auth Middleware
function requireLogin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Please login first.' });
    }
}

// Static files 
app.use(express.static('public'));

// Routes
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');

app.use('/api/auth', authRouter);
app.use('/api/items', requireLogin, itemsRouter); // protected

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Server Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

// Test DB Connection
db.query('SELECT 1')
    .then(() => console.log('Database connected successfully.'))
    .catch(err => console.error('Database connection failed:', err));
