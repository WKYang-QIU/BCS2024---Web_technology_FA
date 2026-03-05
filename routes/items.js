const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Helper: server-side validation
function validateItem(data) {
    const errors = [];
    const { title, description, category, location, date_occurred, contact_name } = data;

    if (!title || title.trim().length < 3 || title.trim().length > 255)
        errors.push('Title must be between 3 and 255 characters.');
    if (!description || description.trim().length < 5)
        errors.push('Description must be at least 5 characters.');
    if (!['Lost', 'Found'].includes(category))
        errors.push('Category must be Lost or Found.');
    if (!location || location.trim().length < 2)
        errors.push('Location is required.');
    if (!date_occurred || isNaN(Date.parse(date_occurred)))
        errors.push('Valid date is required.');
    if (!contact_name || contact_name.trim().length < 5)
        errors.push('Contact name is required (min 5 characters).');

    return errors;
}

// GET all items
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM items ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching items.' });
    }
});

// GET single item by ID
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Item not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST create new item
router.post('/', async (req, res) => {
    const { title, description, category, location, date_occurred, contact_name } = req.body;

    const errors = validateItem(req.body);
    if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

    // Sanitize inputs
    const safeTitle = escapeHtml(title.trim());
    const safeDesc = escapeHtml(description.trim());
    const safeLoc = escapeHtml(location.trim());
    const safeContact = escapeHtml(contact_name.trim());

    try {
        const [result] = await db.query(
            'INSERT INTO items (title, description, category, location, date_occurred, contact_name) VALUES (?, ?, ?, ?, ?, ?)',
            [safeTitle, safeDesc, category, safeLoc, date_occurred, safeContact]
        );
        res.status(201).json({ success: true, message: 'Item created.', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating item.' });
    }
});

// PUT update item status
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const { status } = req.body;
    const validStatuses = ['Active', 'Claimed', 'Resolved'];
    if (!validStatuses.includes(status))
        return res.status(400).json({ success: false, message: 'Status must be Active, Claimed, or Resolved.' });

    try {
        const [result] = await db.query(
            'UPDATE items SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Item not found.' });
        res.json({ success: true, message: 'Status updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating item.' });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Item not found.' });
        res.json({ success: true, message: 'Item deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting item.' });
    }
});

module.exports = router;
