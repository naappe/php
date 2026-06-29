// ============================================
// APP - FAST LOADING WITH CACHE
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

function showMsg(text, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    DOM.message.innerHTML = `
        <div class="notif notif-${type}">
            <span>${icons[type] || 'ℹ️'}</span>
            <span>${text}</span>
            <button onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    if (duration) setTimeout(() => { DOM.message.innerHTML = ''; }, duration);
}

function showLoading(show, text = 'Loading...') {
    const overlay = DOM.loading;
    overlay.style.display = show ? 'flex' : 'none';
    if (show) {
        const spinner = overlay.querySelector('.spinner');
        if (spinner) {
            const label = spinner.nextElementSibling || document.createElement('p');
            if (!label.tagName) {
                label.style.cssText = 'color: #6b7280; font-size: 14px; margin-top: 12px;';
                spinner.parentNode.appendChild(label);
            }
            label.textContent = text;
        }
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
            console.log('📦 Cache expired, reloading...');
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
// FETCH ALL BILLS - OPTIMIZED
// ============================================
async function fetchAllBills(forceRefresh = false) {
    if (state.loading) return;
    
    // Check cache first (unless forced refresh)
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
            showMsg('📦 Loaded ' + state.bills.length + ' bills from cache', 'success', 2000);
            
            // Refresh in background
            setTimeout(() => {
                console.log('🔄 Refreshing data in background...');
                fetchAllBills(true);
            }, 3000);
            
            return;
        }
    }
    
    // Load fresh
    state.usingCache = false;
    showLoading(true, 'Loading bills...');
    state.loaded = false;
    state.bills = [];
    state.totalCount = 0;
    state.loadedCount = 0;
    
    try {
        const pageSize = 200; // Increased to 200 for faster loading
        let allBills = [];
        let totalAmount = 0;

        // First, get total count
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
        
        // Load pages in parallel batches (3 at a time)
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
                        .then(data => ({
                            page: page,
                            bills: data.results || []
                        }))
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
            
            // Update progress
            const progress = Math.round((loadedPages / totalPages) * 100);
            showLoading(true, 'Loading bills... ' + progress + '% (' + allBills.length + ' loaded)');
        }

        state.bills = allBills;
        state.totalAmount = totalAmount;
        state.loaded = true;

        console.log('✅ Loaded:', state.bills.length, 'bills');
        console.log('💰 Total:', formatMVR(totalAmount));

        // Save to cache
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
    if (type === 'all' || !bills || !bills.length) {
        return bills;
    }

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
// RENDER - OPTIMIZED
// ============================================
function render() {
    const bills = state.filtered || [];
    const total = bills.length;
    const amount = bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
    const avg = total > 0 ? amount / total : 0;

    // Stats
    DOM.stats.innerHTML = `
        <div class="stat"><span class="icon">📄</span><div><div class="value">${total}</div><div class="label">Showing</div></div></div>
        <div class="stat highlight"><span class="icon">💰</span><div><div class="value">${formatMVR(amount)}</div><div class="label">Amount</div></div></div>
        <div class="stat"><span class="icon">📊</span><div><div class="value">${formatMVR(avg)}</div><div class="label">Average</div></div></div>
        <div class="stat info"><span class="icon">🏦</span><div><div class="value">${formatMVR(state.totalAmount)}</div><div class="label">Grand Total</div></div></div>
        <div class="stat info"><span class="icon">📦</span><div><div class="value">${state.bills.length}</div><div class="label">Total Bills</div></div></div>
        ${state.usingCache ? `<div class="stat" style="background:#fef3c7;"><span class="icon">💾</span><div><div class="value" style="font-size:12px;">Cached</div><div class="label">Data from cache</div></div></div>` : ''}
    `;

    // Filters
    DOM.filter.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                ${['all','today','week','month'].map(f => `
                    <button class="fb ${state.filter === f ? 'active' : ''}" onclick="setFilter('${f}')">
                        ${f === 'all' ? '📋 All' : f === 'today' ? '📅 Today' : f === 'week' ? '📆 Week' : '🗓️ Month'}
                    </button>
                `).join('')}
            </div>
            <div class="filter-info">${total} bills</div>
        </div>
    `;

    // Content
    if (!state.loaded) {
        DOM.content.innerHTML = `
            <div class="empty">
                <div class="icon">⏳</div>
                <h3>Loading...</h3>
                <p>${state.totalCount > 0 ? 'Loading ' + state.loadedCount + ' of ' + state.totalCount + ' bills...' : 'Fetching your bills'}</p>
            </div>
        `;
        return;
    }

    if (bills.length === 0) {
        DOM.content.innerHTML = `
            <div class="empty">
                <div class="icon">📭</div>
                <h3>No Bills Found</h3>
                <p>${state.bills.length > 0 ? 'No bills match your filters' : 'No bills in your table'}</p>
                ${state.bills.length > 0 ? `<button class="btn btn-secondary" onclick="resetFilters()">Show All Bills</button>` : ''}
                ${state.bills.length === 0 ? `<button class="btn btn-primary" onclick="openCreate()">➕ Add Bill</button>` : ''}
            </div>
        `;
        return;
    }

    const isMobile = window.innerWidth < 768;

    let html = `
        <div class="table-container">
            <div class="table-header">
                <button class="btn btn-primary" onclick="openCreate()">➕ Add</button>
                <button class="btn btn-secondary" onclick="exportCSV()">📥 CSV</button>
                <button class="btn btn-secondary" onclick="fetchAllBills(true)">🔄 Refresh</button>
                <span style="font-size:12px; color:#6b7280; margin-left:auto;">
                    ${bills.length} of ${state.bills.length} bills
                </span>
            </div>
    `;

    if (isMobile) {
        html += '<div class="card-list">';
        bills.forEach(b => {
            const date = b.Date ? new Date(b.Date).toLocaleDateString() : 'N/A';
            const isToday = b._dateKey === getTodayUTC();
            html += `
                <div class="card ${isToday ? 'today' : ''}" onclick="viewBill(${b.id})">
                    <div class="card-header">
                        <span class="card-id">#${b.id}</span>
                        <span class="card-amount">${formatMVR(b.Amount)}</span>
                    </div>
                    <div class="card-vendor">${b.Vendor || 'N/A'}</div>
                    <div class="card-details">
                        <div><span class="cdl">Date</span><span>${date}</span></div>
                        <div><span class="cdl">Bill No</span><span>${b['Bill No'] || 'N/A'}</span></div>
                        <div><span class="cdl">Location</span><span>${b.Location || 'N/A'}</span></div>
                        <div><span class="cdl">TIN</span><span>${b.TIN || 'N/A'}</span></div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); viewBill(${b.id})">👁️</button>
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); openEdit(${b.id})">✏️</button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteBill(${b.id})">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr>
                        <th onclick="sort('id')">ID</th>
                        <th onclick="sort('Vendor')">Vendor</th>
                        <th onclick="sort('Amount')">Amount</th>
                        <th onclick="sort('Date')">Date</th>
                        <th>Bill No</th>
                        <th>Location</th>
                        <th>TIN</th>
                        <th>Actions</th>
                    </tr></thead>
                    <tbody>
        `;
        bills.forEach(b => {
            const date = b.Date ? new Date(b.Date).toLocaleDateString() : 'N/A';
            html += `
                <tr onclick="viewBill(${b.id})">
                    <td><span class="bid">#${b.id}</span></td>
                    <td><strong>${b.Vendor || 'N/A'}</strong></td>
                    <td class="amt">${formatMVR(b.Amount)}</td>
                    <td>${date}</td>
                    <td>${b['Bill No'] || 'N/A'}</td>
                    <td>${b.Location || 'N/A'}</td>
                    <td>${b.TIN || 'N/A'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewBill(${b.id})">👁️</button>
                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEdit(${b.id})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteBill(${b.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
    }

    html += `
            <div class="table-footer">
                <span>${bills.length} of ${state.bills.length} bills</span>
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
        <div class="detail">
            <div class="detail-header">
                <h2>📄 Bill #${bill.id}</h2>
                <div class="detail-actions">
                    <button class="btn btn-secondary" onclick="openEdit(${bill.id})">✏️</button>
                    <button class="btn btn-danger" onclick="deleteBill(${bill.id})">🗑️</button>
                    <button class="btn btn-secondary" onclick="render()">← Back</button>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item"><label>Vendor</label><div>${bill.Vendor || 'N/A'}</div></div>
                <div class="detail-item"><label>Amount</label><div class="amt">${formatMVR(bill.Amount)}</div></div>
                <div class="detail-item"><label>Date</label><div>${date}</div></div>
                <div class="detail-item"><label>Bill No</label><div>${bill['Bill No'] || 'N/A'}</div></div>
                <div class="detail-item"><label>Location</label><div>${bill.Location || 'N/A'}</div></div>
                <div class="detail-item"><label>TIN</label><div>${bill.TIN || 'N/A'}</div></div>
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
                <div class="form-group"><label>Vendor *</label><input type="text" name="Vendor" required></div>
                <div class="form-group"><label>Amount (MVR) *</label><input type="number" name="Amount" step="0.01" required></div>
                <div class="form-group"><label>Date</label><input type="datetime-local" name="Date" id="dateInput"></div>
                <div class="form-group"><label>Bill No</label><input type="text" name="Bill No"></div>
                <div class="form-group"><label>Location</label><input type="text" name="Location"></div>
                <div class="form-group"><label>TIN</label><input type="text" name="TIN"></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">✅ Create</button>
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
            <h2>✏️ Edit #${id}</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <form id="billForm" onsubmit="handleUpdate(event, ${id})">
                <div class="form-group"><label>Vendor</label><input type="text" name="Vendor" value="${bill.Vendor || ''}"></div>
                <div class="form-group"><label>Amount (MVR)</label><input type="number" name="Amount" step="0.01" value="${bill.Amount || ''}"></div>
                <div class="form-group"><label>Date</label><input type="datetime-local" name="Date" value="${date}"></div>
                <div class="form-group"><label>Bill No</label><input type="text" name="Bill No" value="${bill['Bill No'] || ''}"></div>
                <div class="form-group"><label>Location</label><input type="text" name="Location" value="${bill.Location || ''}"></div>
                <div class="form-group"><label>TIN</label><input type="text" name="TIN" value="${bill.TIN || ''}"></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Update</button>
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
});

// ============================================
// START
// ============================================
console.log('🚀 App Started - Optimized with Cache');

document.addEventListener('DOMContentLoaded', function() {
    DOM.searchInput = document.getElementById('searchInput');
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', function(e) {
            handleSearch(e.target.value);
        });
    }
    fetchAllBills();
});