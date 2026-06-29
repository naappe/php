// ============================================
// STATE
// ============================================
const state = {
    bills: [],
    filtered: [],
    search: '',
    filter: 'all',
    sortField: 'Date',
    sortDir: 'desc',
    totalAmount: 0,
    loading: false
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
    message: $('message')
};

// ============================================
// HELPERS
// ============================================
function formatMVR(amount) {
    return new Intl.NumberFormat('dv-MV', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount) || 0);
}

function getHeaders() {
    return {
        'Authorization': `Token ${BASEROW_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json'
    };
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

function showLoading(show) {
    DOM.loading.style.display = show ? 'flex' : 'none';
    state.loading = show;
}

// ============================================
// FETCH BILLS (FAST)
// ============================================
async function fetchBills() {
    showLoading(true);
    try {
        const url = `${BASEROW_CONFIG.BASE_URL}/api/database/rows/table/${BASEROW_CONFIG.TABLE_ID}/?user_field_names=true&size=200`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        state.bills = data.results || [];
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        
        applyFilters();
        render();
        showMsg(`✅ ${state.bills.length} bills loaded`, 'success');
    } catch (e) {
        showMsg(`❌ Error: ${e.message}`, 'error');
        DOM.content.innerHTML = `<div class="empty"><div class="empty-icon">🔌</div><h3>Error</h3><p>${e.message}</p><button class="btn btn-primary" onclick="fetchBills()">Retry</button></div>`;
    } finally {
        showLoading(false);
    }
}

// ============================================
// FILTERS
// ============================================
function applyFilters() {
    let filtered = [...state.bills];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Date filter
    if (state.filter === 'today') {
        filtered = filtered.filter(b => b.Date && new Date(b.Date) >= today);
    } else if (state.filter === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        filtered = filtered.filter(b => b.Date && new Date(b.Date) >= weekStart);
    } else if (state.filter === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = filtered.filter(b => b.Date && new Date(b.Date) >= monthStart);
    }
    
    // Search
    if (state.search) {
        const s = state.search.toLowerCase();
        filtered = filtered.filter(b => 
            String(b.Vendor || '').toLowerCase().includes(s) ||
            String(b['Bill No'] || '').toLowerCase().includes(s) ||
            String(b.Location || '').toLowerCase().includes(s) ||
            String(b.id).includes(s)
        );
    }
    
    // Sort
    filtered.sort((a, b) => {
        let va = a[state.sortField] || '';
        let vb = b[state.sortField] || '';
        if (state.sortField === 'Amount') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
        if (state.sortField === 'Date') { va = new Date(va) || 0; vb = new Date(vb) || 0; }
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        return state.sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    
    state.filtered = filtered;
}

function setFilter(type) {
    state.filter = type;
    state.search = '';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    applyFilters();
    render();
}

// ============================================
// RENDER
// ============================================
function render() {
    const bills = state.filtered;
    const total = bills.length;
    const amount = bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
    const avg = total > 0 ? amount / total : 0;
    const grandTotal = state.totalAmount;
    
    // Stats
    DOM.stats.innerHTML = `
        <div class="stat"><span>📄</span><div><div class="sv">${total}</div><div class="sl">Bills</div></div></div>
        <div class="stat highlight"><span>💰</span><div><div class="sv">${formatMVR(amount)}</div><div class="sl">Filtered</div></div></div>
        <div class="stat"><span>📊</span><div><div class="sv">${formatMVR(avg)}</div><div class="sl">Average</div></div></div>
        <div class="stat info"><span>🏦</span><div><div class="sv">${formatMVR(grandTotal)}</div><div class="sl">Grand Total</div></div></div>
    `;
    
    // Filter buttons
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
        <div style="margin-top:8px;">
            <input id="searchInput" class="search-input" placeholder="🔍 Search..." oninput="handleSearch(this.value)">
        </div>
    `;
    
    // Content
    if (bills.length === 0) {
        DOM.content.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📭</div>
                <h3>No Bills</h3>
                <p>${state.bills.length > 0 ? 'Try different filters' : 'Add your first bill'}</p>
                ${state.bills.length > 0 ? `<button class="btn btn-secondary" onclick="setFilter('all')">Show All</button>` : ''}
            </div>
        `;
        return;
    }
    
    const isMobile = window.innerWidth < 768;
    
    let html = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-actions">
                    <button class="btn btn-primary" onclick="openCreate()">➕ Add</button>
                    <button class="btn btn-secondary" onclick="exportCSV()">📥 CSV</button>
                </div>
            </div>
    `;
    
    if (isMobile) {
        html += '<div class="card-list">';
        bills.forEach(b => {
            const date = b.Date ? new Date(b.Date).toLocaleDateString() : 'N/A';
            const isToday = b.Date && new Date(b.Date).toDateString() === new Date().toDateString();
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
                        <th onclick="sort('id')">ID ${getSortIcon('id')}</th>
                        <th onclick="sort('Vendor')">Vendor ${getSortIcon('Vendor')}</th>
                        <th onclick="sort('Amount')">Amount ${getSortIcon('Amount')}</th>
                        <th onclick="sort('Date')">Date ${getSortIcon('Date')}</th>
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
                        <button class="btn-icon" onclick="event.stopPropagation(); viewBill(${b.id})">👁️</button>
                        <button class="btn-icon" onclick="event.stopPropagation(); openEdit(${b.id})">✏️</button>
                        <button class="btn-icon del" onclick="event.stopPropagation(); deleteBill(${b.id})">🗑️</button>
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
    </div>`;
    
    DOM.content.innerHTML = html;
}

function getSortIcon(field) {
    if (state.sortField !== field) return '↕';
    return state.sortDir === 'asc' ? '↑' : '↓';
}

function sort(field) {
    if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortField = field;
        state.sortDir = 'desc';
    }
    applyFilters();
    render();
}

function handleSearch(value) {
    state.search = value;
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
    if (!confirm(`Delete bill #${id}?`)) return;
    showLoading(true);
    try {
        const url = `${BASEROW_CONFIG.BASE_URL}/api/database/rows/table/${BASEROW_CONFIG.TABLE_ID}/${id}/`;
        const res = await fetch(url, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.bills = state.bills.filter(b => b.id !== id);
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        applyFilters();
        render();
        showMsg(`🗑️ Bill #${id} deleted`, 'warning');
    } catch (e) {
        showMsg(`❌ Error: ${e.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// CREATE / EDIT
// ============================================
function openCreate() {
    openModal(`
        <div class="modal-header"><h2>➕ New Bill</h2><button class="modal-close" onclick="closeModal()">×</button></div>
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
        <div class="modal-header"><h2>✏️ Edit #${id}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
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
    showLoading(true);
    try {
        const url = `${BASEROW_CONFIG.BASE_URL}/api/database/rows/table/${BASEROW_CONFIG.TABLE_ID}/?user_field_names=true`;
        const res = await fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bill = await res.json();
        state.bills.unshift(bill);
        state.totalAmount += parseFloat(bill.Amount || 0);
        applyFilters();
        render();
        closeModal();
        showMsg(`✅ Bill #${bill.id} created`, 'success');
    } catch (e) {
        showMsg(`❌ Error: ${e.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleUpdate(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
    showLoading(true);
    try {
        const url = `${BASEROW_CONFIG.BASE_URL}/api/database/rows/table/${BASEROW_CONFIG.TABLE_ID}/${id}/?user_field_names=true`;
        const res = await fetch(url, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bill = await res.json();
        const idx = state.bills.findIndex(b => b.id === id);
        if (idx > -1) state.bills[idx] = bill;
        state.totalAmount = state.bills.reduce((s, b) => s + parseFloat(b.Amount || 0), 0);
        applyFilters();
        render();
        closeModal();
        showMsg(`✅ Bill #${id} updated`, 'success');
    } catch (e) {
        showMsg(`❌ Error: ${e.message}`, 'error');
    } finally {
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
DOM.modal.addEventListener('click', e => { if (e.target === DOM.modal) closeModal(); });

// ============================================
// EXPORT CSV
// ============================================
function exportCSV() {
    const bills = state.filtered;
    if (!bills.length) { showMsg('No bills to export', 'warning'); return; }
    const headers = ['ID','Vendor','Amount (MVR)','Date','Bill No','Location','TIN'];
    const rows = bills.map(b => [
        b.id, `"${(b.Vendor||'').replace(/"/g,'""')}"`, b.Amount||0, b.Date||'',
        `"${(b['Bill No']||'').replace(/"/g,'""')}"`,
        `"${(b.Location||'').replace(/"/g,'""')}"`,
        `"${(b.TIN||'').replace(/"/g,'""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bills_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showMsg(`📥 Exported ${bills.length} bills`, 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
});

// ============================================
// RESIZE HANDLER
// ============================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.bills.length) render(); }, 300);
});

// ============================================
// START
// ============================================
console.log('🚀 Bill Manager Started');
document.addEventListener('DOMContentLoaded', fetchBills);