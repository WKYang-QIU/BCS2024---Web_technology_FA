
// ── Load shared footer ───────────────────────────────────────
async function loadFooter() {
    try {
        const res = await fetch('/footer.html');
        const html = await res.text();
        const footer = document.getElementById('main-footer');
        if (footer) footer.innerHTML = html;
    } catch (err) {
        console.error('Failed to load footer:', err);
    }
}


// ── Load shared navigation ───────────────────────────────────
async function loadNav() {
    try {
        const res = await fetch('/nav.html');
        const html = await res.text();
        const header = document.getElementById('main-nav');
        if (header) {
            header.innerHTML = html;
            // Set active nav link based on current page
            const page = window.location.pathname.split('/').pop() || 'index.html';
            const map = {
                'index.html': 'nav-home',
                '': 'nav-home',
                'lost.html': 'nav-lost',
                'found.html': 'nav-found',
                'admin.html': 'nav-admin',
                'report.html': 'nav-report-link'
            };
            const activeId = map[page];
            if (activeId) {
                const el = document.getElementById(activeId);
                if (el) el.classList.add('active');
            }
        }
    } catch (err) {
        console.error('Failed to load nav:', err);
    }
}


// ── My Dashboard Modal ───────────────────────────────────────
async function showDashboard() {
    toggleDropdown(); // close dropdown
    const modal = document.getElementById('dashboard-modal');
    const content = document.getElementById('dashboard-content');
    if (!modal) return;

    content.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">Loading...</p>';
    modal.style.display = 'flex';

    try {
        const res = await fetch('/api/items');
        const json = await res.json();
        if (!json.success) return;

        const myItems = json.data.filter(i => i.canEdit && i.user_id !== null);

        if (myItems.length === 0) {
            content.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="font-size:1rem;">My Reports</h3>
                    <button onclick="closeDashboard()" style="background:none; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <p style="color:var(--text-muted); text-align:center; padding:24px;">You have no reports yet.</p>
            `;
            return;
        }

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:1rem;">My Reports <span style="color:var(--text-muted); font-weight:400;">(${myItems.length})</span></h3>
                <button onclick="closeDashboard()" style="background:none; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:grid; gap:10px;">
                ${myItems.map(item => `
                    <div style="background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:14px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                            <div>
                                <div style="font-weight:500; margin-bottom:4px;">${sanitize(item.title)}</div>
                                <div style="display:flex; gap:6px;">${categoryBadge(item.category)} ${statusBadge(item.status)}</div>
                            </div>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-secondary" onclick="closeDashboard(); showDetail(${item.id})">Edit</button>
                                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                            </div>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${sanitize(item.location)} · ${new Date(item.date_occurred).toLocaleDateString()}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch {
        content.innerHTML = '<p style="color:var(--lost); text-align:center; padding:24px;">Failed to load your reports.</p>';
    }
}

function closeDashboard() {
    const modal = document.getElementById('dashboard-modal');
    if (modal) modal.style.display = 'none';
}


async function updateStatusAndRefresh(id, status) {
    try {
        const res = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const json = await res.json();
        if (json.success) {
            closeModal();
            location.reload();
        } else {
            alert(json.message);
        }
    } catch {
        alert('Server error. Please try again.');
    }
}


// ── Show item detail modal ───────────────────────────────────
let allItemsCache = [];

async function showDetail(id) {
    let item = allItemsCache.find(i => i.id === id);
    if (!item) {
        try {
            const res = await fetch(`/api/items/${id}`);
            const json = await res.json();
            if (!json.success) return;
            item = json.data;
        } catch { return; }
    }

    const dateStr = item.date_occurred
        ? new Date(item.date_occurred).toLocaleDateString()
        : '-';

    const canEdit = item.canEdit !== undefined ? item.canEdit : false;

    document.getElementById('modal-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
            <div>
                <h3 style="font-size:1.1rem; margin-bottom:6px;">${sanitize(item.title)}</h3>
                <div style="display:flex; gap:8px;">
                    ${categoryBadge(item.category)} ${statusBadge(item.status)}
                </div>
            </div>
            <button onclick="closeModal()" style="background:none; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
        </div>
        <div style="display:grid; gap:12px; font-size:0.875rem;">
            <div><span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">Description</span>${sanitize(item.description)}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div><span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">Location</span>${sanitize(item.location)}</div>
                <div><span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">Date</span>${dateStr}</div>
            </div>
            <div><span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">Contact</span>${sanitize(item.contact_name)}${item.contact_email ? ' · ' + sanitize(item.contact_email) : ''}${item.contact_phone ? ' · ' + sanitize(item.contact_phone) : ''}</div>
            <div><span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">Reported</span>${new Date(item.created_at).toLocaleString()}</div>
            ${canEdit ? `
            <div style="border-top:1px solid var(--border); padding-top:14px; margin-top:4px;">
                <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">Update Status</span>
                <div style="display:flex; gap:8px;">
                    <button onclick="updateStatusAndRefresh(${item.id}, 'Active')" 
                        style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); cursor:pointer; font-size:0.8rem; font-weight:600;
                        background:${item.status === 'Active' ? 'rgba(47,129,247,0.2)' : 'transparent'}; 
                        color:${item.status === 'Active' ? 'var(--active)' : 'var(--text-muted)'}; 
                        border-color:${item.status === 'Active' ? 'var(--active)' : 'var(--border)'};">
                        Active
                    </button>
                    <button onclick="updateStatusAndRefresh(${item.id}, 'Claimed')"
                        style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); cursor:pointer; font-size:0.8rem; font-weight:600;
                        background:${item.status === 'Claimed' ? 'rgba(210,153,34,0.2)' : 'transparent'}; 
                        color:${item.status === 'Claimed' ? 'var(--claimed)' : 'var(--text-muted)'}; 
                        border-color:${item.status === 'Claimed' ? 'var(--claimed)' : 'var(--border)'};">
                        Claimed
                    </button>
                    <button onclick="updateStatusAndRefresh(${item.id}, 'Resolved')"
                        style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); cursor:pointer; font-size:0.8rem; font-weight:600;
                        background:${item.status === 'Resolved' ? 'rgba(125,133,144,0.2)' : 'transparent'}; 
                        color:${item.status === 'Resolved' ? 'var(--resolved)' : 'var(--text-muted)'}; 
                        border-color:${item.status === 'Resolved' ? 'var(--resolved)' : 'var(--border)'};">
                        Resolved
                    </button>
                </div>
            </div>` : ''}
        </div>
    `;
    document.getElementById('item-modal').style.display = 'flex';
    return false;
}

function closeModal() {
    document.getElementById('item-modal').style.display = 'none';
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('item-modal');
    if (modal && e.target === modal) closeModal();
});


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

        allItemsCache = items;
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
                    <td><a href="#" onclick="showDetail(${item.id})" style="color:var(--accent); text-decoration:none; font-weight:500;">${sanitize(item.title)}</a></td>
                    <td>${categoryBadge(item.category)}</td>
                    <td>${sanitize(item.location)}</td>
                    <td>${dateStr}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>
                        <div class="td-actions">
                            ${item.canEdit ? `
                                <button class="btn btn-secondary" onclick="showDetail(${item.id})">Edit</button>
                                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>`;
        } else {
            return `
                <tr>
                    <td><a href="#" onclick="showDetail(${item.id})" style="color:var(--accent); text-decoration:none; font-weight:500;">${sanitize(item.title)}</a></td>
                    <td>${sanitize(item.description)}</td>
                    <td>${sanitize(item.location)}</td>
                    <td>${dateStr}</td>
                    <td>${sanitize(item.contact_name)}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>
                        <div class="td-actions">
                            ${item.canEdit ? `
                                <button class="btn btn-secondary" onclick="showDetail(${item.id})">Edit</button>
                                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                            ` : ''}
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

// ── Auto-initialize based on current page ───────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadNav();
    await loadFooter();

    const page = window.location.pathname.split('/').pop() || 'index.html';

    if (page === 'index.html' || page === '') {
        loadAllItems();
    } else if (page === 'lost.html') {
        loadItemsByCategory('Lost');
    } else if (page === 'found.html') {
        loadItemsByCategory('Found');
    } else if (page === 'report.html') {
        loadReportPage();
        const params = new URLSearchParams(window.location.search);
        if (params.get('category')) {
            document.getElementById('f-category').value = params.get('category');
        }
        document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
    } else if (page === 'admin.html') {
        checkAuth().then(() => loadUsers());
    }
});
