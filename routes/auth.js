const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.trim().length < 1)
        return res.status(400).json({ success: false, message: 'Username is required.' });
    if (!password || password.length < 1)
        return res.status(400).json({ success: false, message: 'Password is required.' });

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username.trim()]
        );

        if (rows.length === 0)
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });

        // Store role in session
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ success: true, message: 'Login successful.', role: user.role });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});


// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.trim().length < 1)
        return res.status(400).json({ success: false, message: 'Username is required.' });
    if (!password || password.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    try {
        const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Username not found.' });

        const hashed = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = ? WHERE username = ?', [hashed, username.trim()]);
        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out.' });
    });
});

// GET /api/auth/check
router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
});

module.exports = router;
