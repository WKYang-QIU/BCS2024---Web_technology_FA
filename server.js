const express = require('express');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
const itemsRouter = require('./routes/items');
app.use('/api/items', itemsRouter);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

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
