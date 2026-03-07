const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Cloudinary Config ────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Multer + Cloudinary Storage ──────────────────────────────
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'campus-lost-found',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 800, crop: 'limit' }] // resize large images
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ── Helper: escape HTML to prevent XSS ──────────────────────
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ── Helper: server-side validation ──────────────────────────
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

// ── Helper: delete image from Cloudinary ────────────────────
async function deleteCloudinaryImage(imageUrl) {
    if (!imageUrl) return;
    try {
        // Extract public_id from URL
        const parts = imageUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err);
    }
}

// GET all items
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY created_at DESC');
        const currentUser = req.session.user;
        const data = rows.map(item => ({
            ...item,
            canEdit: currentUser.role === 'admin' || item.user_id === currentUser.id
        }));
        res.json({ success: true, data });
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

// POST create new item (with optional image)
router.post('/', upload.single('image'), async (req, res) => {
    const { title, description, category, location, date_occurred, contact_name } = req.body;

    const errors = validateItem(req.body);
    if (errors.length > 0) {
        if (req.file) await deleteCloudinaryImage(req.file.path);
        return res.status(400).json({ success: false, errors });
    }

    const safeTitle = escapeHtml(title.trim());
    const safeDesc = escapeHtml(description.trim());
    const safeLoc = escapeHtml(location.trim());
    const safeContact = escapeHtml(contact_name.trim());
    const userId = req.session.user.id;
    const imagePath = req.file ? req.file.path : null; // Cloudinary returns URL in path

    try {
        const [result] = await db.query(
            'INSERT INTO items (title, description, category, location, date_occurred, contact_name, user_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [safeTitle, safeDesc, category, safeLoc, date_occurred, safeContact, userId, imagePath]
        );
        res.status(201).json({ success: true, message: 'Item created.', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating item.' });
    }
});

// PUT update item — only owner or admin
router.put('/:id', upload.single('image'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Item not found.' });

        const currentUser = req.session.user;
        if (currentUser.role !== 'admin' && rows[0].user_id !== currentUser.id)
            return res.status(403).json({ success: false, message: 'You do not have permission to edit this item.' });

        const { status } = req.body;

        // Status-only update (from detail modal buttons)
        if (status && Object.keys(req.body).length === 1 && !req.file) {
            const validStatuses = ['Active', 'Claimed', 'Resolved'];
            if (!validStatuses.includes(status))
                return res.status(400).json({ success: false, message: 'Invalid status.' });
            await db.query('UPDATE items SET status = ? WHERE id = ?', [status, id]);
            return res.json({ success: true, message: 'Status updated.' });
        }

        // Full update (from edit form)
        const { title, description, category, location, date_occurred, contact_name } = req.body;
        const errors = validateItem(req.body);
        if (errors.length > 0) {
            if (req.file) await deleteCloudinaryImage(req.file.path);
            return res.status(400).json({ success: false, errors });
        }

        const safeTitle = escapeHtml(title.trim());
        const safeDesc = escapeHtml(description.trim());
        const safeLoc = escapeHtml(location.trim());
        const safeContact = escapeHtml(contact_name.trim());

        let imagePath = rows[0].image_path; // keep existing image by default
        if (req.file) {
            // Delete old image from Cloudinary
            await deleteCloudinaryImage(rows[0].image_path);
            imagePath = req.file.path;
        }

        await db.query(
            'UPDATE items SET title=?, description=?, category=?, location=?, date_occurred=?, contact_name=?, status=?, image_path=? WHERE id=?',
            [safeTitle, safeDesc, category, safeLoc, date_occurred, safeContact, status || rows[0].status, imagePath, id]
        );
        res.json({ success: true, message: 'Item updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating item.' });
    }
});

// DELETE item — only owner or admin
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    try {
        const [rows] = await db.query('SELECT user_id, image_path FROM items WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Item not found.' });

        const currentUser = req.session.user;
        if (currentUser.role !== 'admin' && rows[0].user_id !== currentUser.id)
            return res.status(403).json({ success: false, message: 'You do not have permission to delete this item.' });

        // Delete image from Cloudinary
        await deleteCloudinaryImage(rows[0].image_path);

        await db.query('DELETE FROM items WHERE id = ?', [id]);
        res.json({ success: true, message: 'Item deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting item.' });
    }
});

module.exports = router;