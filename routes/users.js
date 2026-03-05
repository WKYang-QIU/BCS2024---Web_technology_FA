const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// GET all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, username, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST create new user
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.trim().length < 3)
        return res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
    if (!password || password.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    try {
        // Check if username already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ?', [username.trim()]
        );
        if (existing.length > 0)
            return res.status(400).json({ success: false, message: 'Username already exists.' });

        const hashed = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username.trim(), hashed]
        );
        res.status(201).json({ success: true, message: 'User created successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating user.' });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    // Prevent deleting yourself
    if (req.session.user && req.session.user.id === id)
        return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });

    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, message: 'User deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting user.' });
    }
});

module.exports = router;
