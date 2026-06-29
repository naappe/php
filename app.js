// ============================================
// APP - PROFESSIONAL VERSION
// ============================================

// ============================================
// STATE
// ============================================
const state = {
    bills: [],
    filtered: [],
    totalAmount: 0,
    loaded: false,
    search: '',
    filter: 'all',
    loading: false,
    totalCount: 0,
    loadedCount: 0,
    usingCache: false
};

// ============================================
// DOM REFS
// ============================================
const $ = id => document.getElementById(id);
const DOM = {
    content: $('content'),
    stats: $('stats'),
    modal: $('modal'),
    modalContent: $('modalContent'),
    loading: $('loadingOverlay'),
    loadingText: $('loadingText'),
    filter: $('filterContainer'),
    message: $('message'),
    searchInput: $('searchInput')
};

// ============================================
// HELPERS
// ============================================
function formatMVR(amount) {
    const num = parseFloat(amount) || 0;
    return 'MVR ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showMsg(text, type = 'info', duration = 3500) {
    const types = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    DOM.message.innerHTML = `
        <div class="notification ${types[type] || 'info'}">
            <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
            <span class="notification-text">${text}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    
    if (duration) {
        setTimeout(() => {
            if (DOM.message.firstChild) {
                DOM.message.innerHTML = '';
            }
        }, duration);
    }
}

function showLoading(show, text = 'Loading...') {
    const overlay = DOM.loading;
    overlay.style.display = show ? 'flex' : 'none';
    if (DOM.loadingText) {
        DOM.loadingText.textContent = text;
    }
}

function getHeaders() {
    return {
        'Authorization': 'Token ' + window.CONFIG.API_TOKEN,
        'Content-Type': 'application/json'
    };
}

// ============================================
// CACHE HELPERS
// ============================================
function saveToCache(key, data) {
    try {
        const cacheData = {
            timestamp: Date.now(),
            bills: data.bills,
            totalAmount: data.totalAmount,
            totalCount: data.totalCount,
            billsCount: data.bills.length
        };
        localStorage.setItem('bills_cache_' + key, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Cache save failed:', e);
    }
}

function loadFromCache(key) {
    try {
        const raw = localStorage.getItem('bills_cache_' + key);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const age = Date.now() - data.timestamp;
        // Cache valid for 5 minutes
        if (age > 5 * 60 * 1000) {
            console.log('📦 Cache expired');
            return null;
        }
        console.log('📦 Cache hit! Age:', Math.round(age / 1000), 'seconds');
        return data;
    } catch (e) {
        return null;
    }
}

// ============================================
// UTC NORMALIZER
// ============================================
function normalizeToUTCKey(dateInput) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayUTC() {
    return normalizeToUTCKey(new Date());
}

// ============================================
// FETCH ALL BILLS
// ============================================
async function fetchAllBills(forceRefresh = false) {
    if (state.loading) return;
    
    if (!forceRefresh) {
        const cached = loadFromCache('all_bills');
        if (cached) {
            state.bills = cached.bills;
            state.totalAmount = cached.totalAmount;
            state.totalCount = cached.totalCount;
            state.loaded = true;
            state.usingCache = true;
            
            state.filtered = [...state.bills];
            state.filter = 'all';
            state.search = '';
            
            render();
            showMsg('📦 Loaded ' + state.bills.length + ' bills from cache', 'info', 2000);
            
            setTimeout(() => {
                console.log('🔄 Refreshing in background...');
                fetchAllBills(true);
            }, 3000);
            
            return;
        }
    }
    
    state.usingCache = false;
    showLoading(true, 'Loading bills...');
    state.loaded = false;
    state.bills = [];
    state.totalCount = 0;
    state.loadedCount = 0;
    
    try {
        const pageSize = 200;
        let allBills = [];
        let totalAmount = 0;

        // Get total count
        const countUrl = window.CONFIG.BASE_URL + '/api/database/rows/table/' + window.CONFIG.TABLE_ID + '/?user_field_names=true&size=1';
        const countRes = await fetch(countUrl, { headers: getHeaders() });
        if (!countRes.ok) throw new Error('HTTP ' + countRes.status);
        const countData = await countRes.json();
        state.totalCount = countData.count || 0;
        
        console.log('📊 Total bills:', state.totalCount);

        if (state.totalCount === 0) {
            state.loaded = true;
            render();
            showLoading(false);
            showMsg('📭 No bills found', 'warning');
            return;
        }

        const totalPages = Math.ceil(state.totalCount / pageSize);
        const batchSize = 3;
        let loadedPages = 0;
        
        for (let batchStart = 1; batchStart <= totalPages; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize - 1, totalPages);
            const promises = [];
            
            for (let page = batchStart; page <= batchEnd; page++) {
                const url = window.CONFIG.BASE_URL + '/api/database/rows/table/' + window.CONFIG.TABLE_ID + '/?user_field_names=true&size=' + pageSize + '&page=' + page;
                promises.push(
                    fetch(url, { headers: getHeaders() })
                        .then(res => res.json())
                        .then(data => ({ page: page, bills: data.results || [] }))
                        .catch(err => ({ page: page, bills: [], error: err }))
                );
            }
            
            const results = await Promise.all(promises);
            
            results.forEach(result => {
                if (result.bills && result.bills.length > 0) {
                    const normalized = result.bills.map(b => ({
                        ...b,
                        _dateKey: normalizeToUTCKey(b.Date)
                    }));
                    allBills = allBills.concat(normalized);
                    const pageTotal = normalized.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
                    totalAmount += pageTotal;
                }
                loadedPages++;
            });
            
            state.loadedCount = allBills.length;
            const progress = Math.round((loadedPages / totalPages) * 100);
            showLoading(true, 'Loading bills... ' + progress + '% (' + allBills.length + ' loaded)');
        }

        state.bills = allBills;
        state.totalAmount = totalAmount;
        state.loaded = true;

        console.log('✅ Loaded:', state.bills.length, 'bills');
        console.log('💰 Total:', formatMVR(totalAmount));

        saveToCache('all_bills', {
            bills: state.bills,
            totalAmount: state.totalAmount,
            totalCount: state.totalCount
        });

        state.filtered = [...state.bills];
        state.filter = 'all';
        state.search = '';

        if (DOM.searchInput) DOM.searchInput.value = '';

        render();
        showLoading(false);
        showMsg('✅ Loaded ' + state.bills.length + ' bills | Total: ' + formatMVR(state.totalAmount), 'success', 4000);

    } catch (error) {
        console.error('❌ Error:', error);
        showMsg('❌ Error: ' + error.message, 'error');
        state.loaded = false;
        render();
        showLoading(false);
    }
}

// ============================================
// DATE FILTER
// ============================================
function filterByDate(bills, type) {
    if (type === 'all' || !bills || !bills.length) return bills;

    const today = getTodayUTC();

    if (type === 'today') {
        return bills.filter(b => b._dateKey === today);
    }

    if (type === 'week') {
        const now = new Date();
        const start = new Date(now);
        start.setUTCDate(now.getUTCDate() - now.getUTCDay());
        const startKey = normalizeToUTCKey(start);
        return bills.filter(b => b._dateKey >= startKey);
    }

    if (type === 'month') {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const startKey = normalizeToUTCKey(start);
        return bills.filter(b => b._dateKey >= startKey);
    }

    return bills;
}

// ============================================
// APPLY FILTERS
// ============================================
function applyFilters() {
    if (!state.bills.length) {
        state.filtered = [];
        return;
    }

    let filtered = [...state.bills];
    filtered = filterByDate(filtered, state.filter);

    if (state.search && state.search.trim()) {
        const s = state.search.toLowerCase().trim();
        filtered = filtered.filter(b =>
            (b.Vendor || '').toLowerCase().includes(s) ||
            (b['Bill No'] || '').toLowerCase().includes(s) ||
            (b.Location || '').toLowerCase().includes(s) ||
            String(b.id || '').includes(s)
        );
    }

    state.filtered = filtered;
}

// ============================================
// RENDER - PROFESSIONAL
// ============================================
function render() {
    const bills = state.filtered || [];
    const total = bills.length;
    const amount = bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
    const avg = total > 0 ? amount / total : 0;

    // ============================================
    // STATS
    // ============================================
    DOM.stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue">📄</div>
            <div class="stat-info">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Bills</div>
            </div>
            ${state.usingCache ? '<span class="stat-badge">💾 Cached</span>' : ''}
        </div>
        <div class="stat-card">
            <div class="stat-icon green">💰</div>
            <div class="stat-info">
                <div class="stat-value accent">${formatMVR(amount)}</div>
                <div class="stat-label">Filtered Amount</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon yellow">📊</div>
            <div class="stat-info">
                <div class="stat-value">${formatMVR(avg)}</div>
                <div class="stat-label">Average Bill</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">🏦</div>
            <div class="stat-info">
                <div class="stat-value success">${formatMVR(state.totalAmount)}</div>
                <div class="stat-label">Grand Total</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue">📦</div>
            <div class="stat-info">
                <div class="stat-value">${state.bills.length}</div>
                <div class="stat-label">Total Bills</div>
            </div>
        </div>
    `;

    // ============================================
    // FILTERS
    // ============================================
    DOM.filter.innerHTML = `
        <button class="filter-btn ${state.filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">📋 All</button>
        <button class="filter-btn ${state.filter === 'today' ? 'active' : ''}" onclick="setFilter('today')">📅 Today</button>
        <button class="filter-btn ${state.filter === 'week' ? 'active' : ''}" onclick="setFilter('week')">📆 Week</button>
        <button class="filter-btn ${state.filter === 'month' ? 'active' : ''}" onclick="setFilter('month')">🗓️ Month</button>
        <span class="filter-count">${total} bills</span>
    `;

    // ============================================
    // CONTENT
    // ============================================
    if (!state.loaded) {
        DOM.content.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${state.totalCount > 0 ? 'Loading ' + state.loadedCount + ' of ' + state.totalCount + ' bills...' : 'Fetching your bills...'}</p>
            </div>
        `;
        return;
    }

    if (bills.length === 0) {
        DOM.content.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>No Bills Found</h3>
                <p>${state.bills.length > 0 ? 'No bills match your filters' : 'No bills in your table'}</p>
                ${state.bills.length > 0 ? `<button class="btn btn-primary" onclick="resetFilters()">Show All Bills</button>` : ''}
                ${state.bills.length === 0 ? `<button class="btn btn-primary" onclick="openCreate()">➕ Add Your First Bill</button>` : ''}
            </div>
        `;
        return;
    }

    const isMobile = window.innerWidth < 1024;

    // ============================================
    // TABLE HEADER
    // ============================================
    let html = `
        <div class="table-wrapper">
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                <button class="btn btn-primary" onclick="openCreate()">➕ Add Bill</button>
                <button class="btn btn-secondary" onclick="exportCSV()">📥 Export CSV</button>
                <button class="btn btn-secondary" onclick="fetchAllBills(true)">🔄 Refresh</button>
                <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">${bills.length} of ${state.bills.length} bills</span>
            </div>
    `;

    // ============================================
    // TABLE (Desktop)
    // ============================================
    if (!isMobile) {
        html += `
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="sort('id')">ID</th>
                        <th onclick="sort('Vendor')">Vendor</th>
                        <th onclick="sort('Amount')">Amount</th>
                        <th onclick="sort('Date')">Date</th>
                        <th>Bill No</th>
                        <th>Location</th>
                        <th style="text-align:center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        bills.slice(0, 500).forEach(b => {
            const date = b.Date ? new Date(b.Date).toLocaleDateString() : 'N/A';
            const isToday = b._dateKey === getTodayUTC();
            html += `
                <tr class="${isToday ? 'row-today' : ''}" onclick="viewBill(${b.id})">
                    <td><span class="bill-id">#${b.id}</span></td>
                    <td><span class="bill-vendor">${b.Vendor || 'N/A'}</span></td>
                    <td><span class="bill-amount">${formatMVR(b.Amount)}</span></td>
                    <td>${date}</td>
                    <td>${b['Bill No'] || 'N/A'}</td>
                    <td>${b.Location || 'N/A'}</td>
                    <td style="text-align:center;">
                        <button class="btn-ghost-sm" onclick="event.stopPropagation(); viewBill(${b.id})" title="View">👁️</button>
                        <button class="btn-ghost-sm" onclick="event.stopPropagation(); openEdit(${b.id})" title="Edit">✏️</button>
                        <button class="btn-ghost-sm danger" onclick="event.stopPropagation(); deleteBill(${b.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        if (bills.length > 500) {
            html += `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">Showing first 500 of ${bills.length} bills</td></tr>`;
        }
        
        html += `
                </tbody>
            </table>
        `;
    }

    // ============================================
    // CARDS (Mobile)
    // ============================================
    if (isMobile) {
        html += `<div class="card-list">`;
        bills.slice(0, 100).forEach(b => {
            const date = b.Date ? new Date(b.Date).toLocaleDateString() : 'N/A';
            const isToday = b._dateKey === getTodayUTC();
            html += `
                <div class="bill-card ${isToday ? 'today' : ''}" onclick="viewBill(${b.id})">
                    <div class="card-header">
                        <span class="card-id">#${b.id}</span>
                        <span class="card-amount">${formatMVR(b.Amount)}</span>
                    </div>
                    <div class="card-vendor">${b.Vendor || 'N/A'}</div>
                    <div class="card-details">
                        <div><span class="card-label">Date</span><span class="card-value">${date}</span></div>
                        <div><span class="card-label">Bill No</span><span class="card-value">${b['Bill No'] || 'N/A'}</span></div>
                        <div><span class="card-label">Location</span><span class="card-value">${b.Location || 'N/A'}</span></div>
                        <div><span class="card-label">TIN</span><span class="card-value">${b.TIN || 'N/A'}</span></div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewBill(${b.id})">👁️ View</button>
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEdit(${b.id})">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteBill(${b.id})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
        if (bills.length > 100) {
            html += `<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px;">Showing first 100 of ${bills.length} bills</div>`;
        }
        html += `</div>`;
    }

    // ============================================
    // TABLE FOOTER
    // ============================================
    html += `
            <div class="table-footer">
                <span>Showing ${Math.min(bills.length, isMobile ? 100 : 500)} of ${bills.length} bills</span>
                <span>Total: ${formatMVR(state.totalAmount)}</span>
            </div>
        </div>
    `;

    DOM.content.innerHTML = html;
}

// ============================================
// ACTIONS
// ============================================
function setFilter(type) {
    state.filter = type;
    applyFilters();
    render();
}

function handleSearch(value) {
    state.search = value;
    applyFilters();
    render();
}

function resetFilters() {
    state.filter = 'all';
    state.search = '';
    if (DOM.searchInput) DOM.searchInput.value = '';
    applyFilters();
    render();
}

let sortField = 'Date';
let sortDir = 'desc';

function sort(field) {
    if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDir = 'desc';
    }
    
    state.bills.sort((a, b) => {
        let va = a[field] || '';
        let vb = b[field] || '';
        if (field === 'Amount') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
        if (field === 'Date') { va = new Date(va) || 0; vb = new Date(vb) || 0; }
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    
    applyFilters();
    render();
}

// ============================================
// BILL ACTIONS
// ============================================
function viewBill(id) {
    const bill = state.bills.find(b => b.id === id);
    if (!bill) return;
    const date = bill.Date ? new Date(bill.Date).toLocaleString() : 'N/A';
    
    DOM.content.innerHTML = `
        <div class="detail-view">
            <div class="detail-header">
                <h2>📄 Bill #${bill.id}</h2>
                <div class="detail-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEdit(${bill.id})">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBill(${bill.id})">🗑️ Delete</button>
                    <button class="btn btn-secondary btn-sm" onclick="render()">← Back</button>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Vendor</label>
                    <div class="value">${bill.Vendor || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Amount</label>
                    <div class="value amount">${formatMVR(bill.Amount)}</div>
                </div>
                <div class="detail-item">
                    <label>Date</label>
                    <div class="value">${date}</div>
                </div>
                <div class="detail-item">
                    <label>Bill Number</label>
                    <div class="value">${bill['Bill No'] || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Location</label>
                    <div class="value">${bill.Location || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>TIN</label>
                    <div class="value">${bill.TIN || 'N/A'}</div>
                </div>
            </div>
        </div>
    `;
}

async function deleteBill(id) {
    if (!confirm('Delete bill #' + id + '?')) return;
    showLoading(true, 'Deleting...');
    try {
        const url = window.CONFIG.BASE_URL + '/api/database/rows/table/' + window.CONFIG.TABLE_ID + '/' + id + '/';
        const res = await fetch(url, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        state.bills = state.bills.filter(b => b.id !== id);
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        applyFilters();
        render();
        showLoading(false);
        showMsg('🗑️ Bill #' + id + ' deleted', 'warning');
    } catch (e) {
        showMsg('❌ Error: ' + e.message, 'error');
        showLoading(false);
    }
}

// ============================================
// CREATE / EDIT
// ============================================
function openCreate() {
    openModal(`
        <div class="modal-header">
            <h2>➕ New Bill</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <form id="billForm" onsubmit="handleCreate(event)">
                <div class="form-group">
                    <label>Vendor *</label>
                    <input type="text" name="Vendor" required placeholder="Enter vendor name">
                </div>
                <div class="form-group">
                    <label>Amount (MVR) *</label>
                    <input type="number" name="Amount" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="datetime-local" name="Date" id="dateInput">
                </div>
                <div class="form-group">
                    <label>Bill Number</label>
                    <input type="text" name="Bill No" placeholder="e.g., INV-2024-001">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="Location" placeholder="Enter location">
                </div>
                <div class="form-group">
                    <label>TIN</label>
                    <input type="text" name="TIN" placeholder="Enter TIN">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">✅ Create Bill</button>
                </div>
            </form>
        </div>
    `);
    const d = document.getElementById('dateInput');
    if (d) d.value = new Date().toISOString().slice(0, 16);
}

function openEdit(id) {
    const bill = state.bills.find(b => b.id === id);
    if (!bill) return;
    const date = bill.Date ? new Date(bill.Date).toISOString().slice(0, 16) : '';
    
    openModal(`
        <div class="modal-header">
            <h2>✏️ Edit Bill #${id}</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <form id="billForm" onsubmit="handleUpdate(event, ${id})">
                <div class="form-group">
                    <label>Vendor</label>
                    <input type="text" name="Vendor" value="${bill.Vendor || ''}" placeholder="Enter vendor name">
                </div>
                <div class="form-group">
                    <label>Amount (MVR)</label>
                    <input type="number" name="Amount" step="0.01" value="${bill.Amount || ''}" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="datetime-local" name="Date" value="${date}">
                </div>
                <div class="form-group">
                    <label>Bill Number</label>
                    <input type="text" name="Bill No" value="${bill['Bill No'] || ''}" placeholder="e.g., INV-2024-001">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="Location" value="${bill.Location || ''}" placeholder="Enter location">
                </div>
                <div class="form-group">
                    <label>TIN</label>
                    <input type="text" name="TIN" value="${bill.TIN || ''}" placeholder="Enter TIN">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Update Bill</button>
                </div>
            </form>
        </div>
    `);
}

async function handleCreate(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
    showLoading(true, 'Creating...');
    try {
        const url = window.CONFIG.BASE_URL + '/api/database/rows/table/' + window.CONFIG.TABLE_ID + '/?user_field_names=true';
        const res = await fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const bill = await res.json();
        bill._dateKey = normalizeToUTCKey(bill.Date);
        state.bills.unshift(bill);
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        state.filter = 'all';
        state.search = '';
        if (DOM.searchInput) DOM.searchInput.value = '';
        applyFilters();
        render();
        closeModal();
        showLoading(false);
        showMsg('✅ Bill #' + bill.id + ' created', 'success');
    } catch (e) {
        showMsg('❌ Error: ' + e.message, 'error');
        showLoading(false);
    }
}

async function handleUpdate(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
    showLoading(true, 'Updating...');
    try {
        const url = window.CONFIG.BASE_URL + '/api/database/rows/table/' + window.CONFIG.TABLE_ID + '/' + id + '/?user_field_names=true';
        const res = await fetch(url, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const bill = await res.json();
        bill._dateKey = normalizeToUTCKey(bill.Date);
        const idx = state.bills.findIndex(b => b.id === id);
        if (idx > -1) state.bills[idx] = bill;
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        applyFilters();
        render();
        closeModal();
        showLoading(false);
        showMsg('✅ Bill #' + id + ' updated', 'success');
    } catch (e) {
        showMsg('❌ Error: ' + e.message, 'error');
        showLoading(false);
    }
}

// ============================================
// MODAL
// ============================================
function openModal(html) {
    DOM.modalContent.innerHTML = html;
    DOM.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    DOM.modal.style.display = 'none';
    document.body.style.overflow = '';
}
DOM.modal.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ============================================
// EXPORT CSV
// ============================================
function exportCSV() {
    const bills = state.filtered;
    if (!bills || !bills.length) {
        showMsg('No bills to export', 'warning');
        return;
    }
    const headers = ['ID', 'Vendor', 'Amount (MVR)', 'Date', 'Bill No', 'Location', 'TIN'];
    const rows = bills.map(b => [
        b.id,
        '"' + (b.Vendor || '').replace(/"/g, '""') + '"',
        b.Amount || 0,
        b.Date || '',
        '"' + (b['Bill No'] || '').replace(/"/g, '""') + '"',
        '"' + (b.Location || '').replace(/"/g, '""') + '"',
        '"' + (b.TIN || '').replace(/"/g, '""') + '"'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bills_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showMsg('📥 Exported ' + bills.length + ' bills', 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        DOM.searchInput?.focus();
    }
});

// ============================================
// SEARCH INPUT HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    DOM.searchInput = document.getElementById('searchInput');
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', function(e) {
            handleSearch(e.target.value);
        });
    }
    fetchAllBills();
});

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.fetchAllBills = fetchAllBills;
window.exportCSV = exportCSV;
window.openCreate = openCreate;
window.setFilter = setFilter;
window.resetFilters = resetFilters;
window.viewBill = viewBill;
window.deleteBill = deleteBill;
window.openEdit = openEdit;
window.sort = sort;
window.render = render;