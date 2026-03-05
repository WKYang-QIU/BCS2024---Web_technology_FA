
// ── Avatar dropdown toggle ───────────────────────────────────
function toggleDropdown() {
    const dropdown = document.getElementById('nav-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const avatar = document.getElementById('nav-avatar');
    const dropdown = document.getElementById('nav-dropdown');
    if (dropdown && avatar && !avatar.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ── Check login on every page ────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check');
        const json = await res.json();
        if (!json.success) {
            window.location.href = 'login.html';
        } else {
            // Show username and avatar
            const usernameEl = document.getElementById('nav-username');
            if (usernameEl) usernameEl.textContent = json.user.username;

            const avatarEl = document.getElementById('nav-avatar');
            if (avatarEl) avatarEl.textContent = json.user.username.charAt(0).toUpperCase();

            // Show Admin link only for admin role
            const adminLink = document.getElementById('nav-admin');
            if (adminLink) {
                adminLink.style.display = json.user.role === 'admin' ? 'inline' : 'none';
            }
        }
    } catch {
        window.location.href = 'login.html';
    }
}

// ── Logout ───────────────────────────────────────────────────
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = 'login.html';
    } catch {
        window.location.href = 'login.html';
    }
}

// ── Sanitize to prevent XSS ──────────────────────────────────
function sanitize(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Badges ───────────────────────────────────────────────────
function statusBadge(status) {
    return `<span class="badge badge-${status.toLowerCase()}">${status}</span>`;
}

function categoryBadge(category) {
    return `<span class="badge badge-${category.toLowerCase()}">${category}</span>`;
}

// ── Load all items (index.html) ──────────────────────────────
async function loadAllItems() {
    await checkAuth();
    try {
        const res = await fetch('/api/items');
        const json = await res.json();
        if (!json.success) return;

        const items = json.data;

        document.getElementById('stat-total').textContent = items.length;
        document.getElementById('stat-lost').textContent = items.filter(i => i.category === 'Lost').length;
        document.getElementById('stat-found').textContent = items.filter(i => i.category === 'Found').length;
        document.getElementById('stat-active').textContent = items.filter(i => i.status === 'Active').length;

        renderTable(items, 'all');

    } catch (err) {
        document.getElementById('items-tbody').innerHTML =
            '<tr><td colspan="6" class="empty">Failed to load items.</td></tr>';
    }
}

// ── Load items by category (lost.html / found.html) ──────────
async function loadItemsByCategory(category) {
    await checkAuth();
    try {
        const res = await fetch('/api/items');
        const json = await res.json();
        if (!json.success) return;

        const items = json.data.filter(i => i.category === category);
        renderTable(items, 'category');

    } catch (err) {
        document.getElementById('items-tbody').innerHTML =
            '<tr><td colspan="7" class="empty">Failed to load items.</td></tr>';
    }
}

// ── Load report page ─────────────────────────────────────────
async function loadReportPage() {
    await checkAuth();
}

// ── Render table rows ────────────────────────────────────────
function renderTable(items, mode) {
    const tbody = document.getElementById('items-tbody');
    const colspan = mode === 'all' ? 6 : 7;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty">No items found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const dateStr = item.date_occurred
            ? new Date(item.date_occurred).toLocaleDateString()
            : '-';

        if (mode === 'all') {
            return `
                <tr>
                    <td>${sanitize(item.title)}</td>
                    <td>${categoryBadge(item.category)}</td>
                    <td>${sanitize(item.location)}</td>
                    <td>${dateStr}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>
                        <div class="td-actions">
                            ${item.status === 'Active'
                                ? `<button class="btn btn-secondary" onclick="updateStatus(${item.id}, 'Claimed')">Claimed</button>`
                                : `<button class="btn btn-secondary" onclick="updateStatus(${item.id}, 'Resolved')">Resolved</button>`
                            }
                            <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>`;
        } else {
            return `
                <tr>
                    <td>${sanitize(item.title)}</td>
                    <td>${sanitize(item.description)}</td>
                    <td>${sanitize(item.location)}</td>
                    <td>${dateStr}</td>
                    <td>${sanitize(item.contact_name)}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>
                        <div class="td-actions">
                            ${item.status === 'Active'
                                ? `<button class="btn btn-secondary" onclick="updateStatus(${item.id}, 'Claimed')">Claimed</button>`
                                : `<button class="btn btn-secondary" onclick="updateStatus(${item.id}, 'Resolved')">Resolved</button>`
                            }
                            <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>`;
        }
    }).join('');
}

// ── Update item status ───────────────────────────────────────
async function updateStatus(id, status) {
    if (!confirm(`Mark this item as "${status}"?`)) return;
    try {
        const res = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const json = await res.json();
        if (json.success) location.reload();
        else alert(json.message);
    } catch {
        alert('Server error. Please try again.');
    }
}

// ── Delete item ──────────────────────────────────────────────
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
        const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) location.reload();
        else alert(json.message);
    } catch {
        alert('Server error. Please try again.');
    }
}

// ── Submit report form ───────────────────────────────────────
async function submitReport() {
    const title = document.getElementById('f-title').value.trim();
    const description = document.getElementById('f-desc').value.trim();
    const category = document.getElementById('f-category').value;
    const location = document.getElementById('f-location').value.trim();
    const date_occurred = document.getElementById('f-date').value;
    const contact_name = document.getElementById('f-contact').value.trim();

    const errorEl = document.getElementById('form-error');
    const successEl = document.getElementById('form-success');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!title || title.length < 3) return showError('Title must be at least 3 characters.');
    if (!description || description.length < 5) return showError('Description must be at least 5 characters.');
    if (!location) return showError('Location is required.');
    if (!date_occurred) return showError('Date is required.');
    if (!contact_name || contact_name.length < 5) return showError('Contact name is required (min 5 characters).');

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, category, location, date_occurred, contact_name })
        });
        const json = await res.json();
        if (json.success) {
            successEl.style.display = 'block';
            ['f-title', 'f-desc', 'f-location', 'f-contact'].forEach(id => {
                document.getElementById(id).value = '';
            });
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            showError(json.errors ? json.errors.join(' ') : json.message);
        }
    } catch {
        showError('Server error. Please try again.');
    }
}

function showError(msg) {
    const el = document.getElementById('form-error');
    el.textContent = msg;
    el.style.display = 'block';
}
