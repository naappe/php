// ============================================
// BILL MANAGER - Main Application
// ============================================

// Check if config is loaded
if (typeof BASEROW_CONFIG === 'undefined') {
    console.error('❌ BASEROW_CONFIG not found! Make sure config.js is loaded first.');
}

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    bills: [],
    filteredBills: [],
    currentView: 'table',
    selectedBill: null,
    isLoading: false,
    searchTerm: '',
    sortField: 'Date',
    sortDirection: 'desc',
    filterType: 'all', // 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'
    filterDateRange: {
        start: null,
        end: null
    },
    totalPages: 1,
    currentPage: 1,
    allLoaded: false,
    totalAmount: 0
};

// ============================================
// DOM REFERENCES
// ============================================
const DOM = {
    content: document.getElementById('content'),
    message: document.getElementById('message'),
    stats: document.getElementById('stats'),
    modal: document.getElementById('modal'),
    modalContent: document.getElementById('modalContent'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    filterContainer: document.getElementById('filterContainer')
};

// ============================================
// API HELPERS
// ============================================
function getHeaders() {
    return {
        'Authorization': `Token ${BASEROW_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json'
    };
}

function getApiUrl(endpoint, params = {}) {
    const { BASE_URL, TABLE_ID } = BASEROW_CONFIG;
    let url = `${BASE_URL}${endpoint}`;
    url = url.replace(/\{table_id\}/g, TABLE_ID);
    
    const queryParams = new URLSearchParams(params);
    if (queryParams.toString()) {
        url += (url.includes('?') ? '&' : '?') + queryParams.toString();
    }
    
    return url;
}

// ============================================
// CURRENCY FORMATTING (MVR)
// ============================================
function formatMVR(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('dv-MV', {
        style: 'currency',
        currency: 'MVR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showMessage(text, type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    DOM.message.innerHTML = `
        <div class="notification notification-${type}">
            <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
            <span class="notification-text">${text}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    
    if (duration > 0) {
        setTimeout(() => {
            const msg = DOM.message;
            if (msg.firstChild) msg.innerHTML = '';
        }, duration);
    }
}

function showLoading(show = true) {
    DOM.loadingOverlay.style.display = show ? 'flex' : 'none';
    state.isLoading = show;
}

// ============================================
// API CALLS - LOAD ALL BILLS (Pagination)
// ============================================
async function fetchAllBills() {
    showLoading(true);
    state.allLoaded = false;
    state.bills = [];
    state.currentPage = 1;
    
    try {
        // First, get the total count
        const countUrl = getApiUrl('/api/database/rows/table/{table_id}/', {
            user_field_names: 'true',
            size: 1
        });
        
        const countResponse = await fetch(countUrl, { headers: getHeaders() });
        if (!countResponse.ok) throw new Error(`HTTP ${countResponse.status}`);
        
        const countData = await countResponse.json();
        const totalCount = countData.count || 0;
        
        if (totalCount === 0) {
            state.bills = [];
            applyFilters();
            updateStats();
            renderTable();
            renderFilterOptions();
            showLoading(false);
            showMessage('📭 No bills found in the table', 'warning');
            return;
        }
        
        // Calculate total pages (100 per page)
        const pageSize = 100;
        state.totalPages = Math.ceil(totalCount / pageSize);
        
        showMessage(`📥 Loading ${totalCount} bills from ${state.totalPages} pages...`, 'info', 3000);
        
        // Load all pages
        let allBills = [];
        let totalAmount = 0;
        
        for (let page = 1; page <= state.totalPages; page++) {
            const url = getApiUrl('/api/database/rows/table/{table_id}/', {
                user_field_names: 'true',
                size: pageSize,
                page: page
            });
            
            const response = await fetch(url, { headers: getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const pageBills = data.results || [];
            allBills = allBills.concat(pageBills);
            
            // Calculate running total
            pageBills.forEach(bill => {
                totalAmount += parseFloat(bill.Amount || 0);
            });
            
            // Update progress
            const progress = Math.round((page / state.totalPages) * 100);
            showMessage(`📥 Loading bills... ${progress}% (${allBills.length} of ${totalCount})`, 'info', 2000);
        }
        
        state.bills = allBills;
        state.totalAmount = totalAmount;
        state.allLoaded = true;
        
        console.log(`✅ Loaded ${state.bills.length} bills from ${state.totalPages} pages`);
        console.log(`💰 Total Amount: ${formatMVR(totalAmount)}`);
        
        applyFilters();
        updateStats();
        renderTable();
        renderFilterOptions();
        showMessage(`✅ Loaded ${state.bills.length} bills | Total: ${formatMVR(totalAmount)}`, 'success', 5000);
        
    } catch (error) {
        console.error('Error fetching bills:', error);
        showMessage(`❌ Failed to load bills: ${error.message}`, 'error');
        DOM.content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔌</div>
                <h3>Connection Error</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="fetchAllBills()">🔄 Retry</button>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

async function createBill(data) {
    showLoading(true);
    
    try {
        const url = getApiUrl('/api/database/rows/table/{table_id}/', {
            user_field_names: 'true'
        });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        const newBill = await response.json();
        state.bills.unshift(newBill);
        state.totalAmount += parseFloat(newBill.Amount || 0);
        applyFilters();
        updateStats();
        renderTable();
        closeModal();
        showMessage(`✅ Bill #${newBill.id} created successfully!`, 'success');
        
    } catch (error) {
        console.error('Error creating bill:', error);
        showMessage(`❌ Failed to create bill: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function updateBill(id, data) {
    showLoading(true);
    
    try {
        const url = getApiUrl(`/api/database/rows/table/{table_id}/${id}/`, {
            user_field_names: 'true'
        });
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        const updatedBill = await response.json();
        
        // Update total amount
        const oldBill = state.bills.find(b => b.id === id);
        if (oldBill) {
            state.totalAmount -= parseFloat(oldBill.Amount || 0);
            state.totalAmount += parseFloat(updatedBill.Amount || 0);
        }
        
        const index = state.bills.findIndex(b => b.id === id);
        if (index !== -1) state.bills[index] = updatedBill;
        
        applyFilters();
        updateStats();
        renderTable();
        closeModal();
        showMessage(`✅ Bill #${id} updated successfully!`, 'success');
        
    } catch (error) {
        console.error('Error updating bill:', error);
        showMessage(`❌ Failed to update bill: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteBill(id) {
    if (!confirm(`Are you sure you want to delete bill #${id}? This cannot be undone.`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const url = getApiUrl(`/api/database/rows/table/{table_id}/${id}/`);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        const deletedBill = state.bills.find(b => b.id === id);
        if (deletedBill) {
            state.totalAmount -= parseFloat(deletedBill.Amount || 0);
        }
        
        state.bills = state.bills.filter(b => b.id !== id);
        applyFilters();
        updateStats();
        renderTable();
        showMessage(`🗑️ Bill #${id} deleted successfully`, 'warning');
        
    } catch (error) {
        console.error('Error deleting bill:', error);
        showMessage(`❌ Failed to delete bill: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// FILTER FUNCTIONS
// ============================================
function applyFilters() {
    let filtered = [...state.bills];
    
    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    switch (state.filterType) {
        case 'today':
            filtered = filtered.filter(bill => {
                const date = bill.Date ? new Date(bill.Date) : null;
                return date && date >= today;
            });
            break;
            
        case 'thisWeek':
            filtered = filtered.filter(bill => {
                const date = bill.Date ? new Date(bill.Date) : null;
                return date && date >= startOfWeek;
            });
            break;
            
        case 'thisMonth':
            filtered = filtered.filter(bill => {
                const date = bill.Date ? new Date(bill.Date) : null;
                return date && date >= startOfMonth && date <= endOfMonth;
            });
            break;
            
        case 'custom':
            if (state.filterDateRange.start) {
                const start = new Date(state.filterDateRange.start);
                filtered = filtered.filter(bill => {
                    const date = bill.Date ? new Date(bill.Date) : null;
                    return date && date >= start;
                });
            }
            if (state.filterDateRange.end) {
                const end = new Date(state.filterDateRange.end);
                end.setHours(23, 59, 59);
                filtered = filtered.filter(bill => {
                    const date = bill.Date ? new Date(bill.Date) : null;
                    return date && date <= end;
                });
            }
            break;
            
        default: // 'all'
            break;
    }
    
    // Apply search filter
    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        filtered = filtered.filter(bill => {
            const searchable = [
                bill.Vendor,
                bill['Bill No'],
                bill.Location,
                bill.TIN,
                String(bill.id)
            ].map(s => (s || '').toLowerCase());
            return searchable.some(s => s.includes(term));
        });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        let valA = a[state.sortField] || '';
        let valB = b[state.sortField] || '';
        
        if (state.sortField === 'Amount' || state.sortField === 'id') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }
        
        if (state.sortField === 'Date') {
            valA = new Date(valA) || 0;
            valB = new Date(valB) || 0;
        }
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    state.filteredBills = filtered;
}

function setFilter(type) {
    state.filterType = type;
    if (type === 'custom') {
        showCustomDatePicker();
        return;
    }
    applyFilters();
    updateStats();
    renderTable();
    renderFilterOptions();
    showMessage(`Showing ${getFilterLabel(type)}`, 'info', 2000);
}

function getFilterLabel(type) {
    const labels = {
        'all': 'All Bills',
        'today': "Today's Bills",
        'thisWeek': 'This Week',
        'thisMonth': 'This Month',
        'custom': 'Custom Range'
    };
    return labels[type] || 'All Bills';
}

function showCustomDatePicker() {
    const html = `
        <div class="custom-date-picker">
            <h4>📅 Custom Date Range</h4>
            <div class="date-range-inputs">
                <div class="form-group">
                    <label>From</label>
                    <input type="date" id="dateStart" value="${state.filterDateRange.start || ''}">
                </div>
                <div class="form-group">
                    <label>To</label>
                    <input type="date" id="dateEnd" value="${state.filterDateRange.end || ''}">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeCustomDatePicker()">Cancel</button>
                <button class="btn btn-primary" onclick="applyCustomDateRange()">Apply Filter</button>
            </div>
        </div>
    `;
    
    const filterContainer = document.getElementById('filterContainer');
    const existing = filterContainer.querySelector('.custom-date-picker');
    if (existing) existing.remove();
    
    const picker = document.createElement('div');
    picker.innerHTML = html;
    filterContainer.appendChild(picker.firstElementChild);
}

function closeCustomDatePicker() {
    const picker = document.querySelector('.custom-date-picker');
    if (picker) picker.remove();
    state.filterType = 'all';
    applyFilters();
    updateStats();
    renderTable();
    renderFilterOptions();
}

function applyCustomDateRange() {
    const start = document.getElementById('dateStart').value;
    const end = document.getElementById('dateEnd').value;
    
    state.filterDateRange.start = start || null;
    state.filterDateRange.end = end || null;
    state.filterType = 'custom';
    
    applyFilters();
    updateStats();
    renderTable();
    renderFilterOptions();
    closeCustomDatePicker();
    showMessage(`Showing bills from ${start || 'any date'} to ${end || 'any date'}`, 'info', 2000);
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderFilterOptions() {
    const container = document.getElementById('filterContainer') || DOM.filterContainer;
    if (!container) return;
    
    const filters = [
        { type: 'all', label: '📋 All', icon: '📋' },
        { type: 'today', label: '📅 Today', icon: '📅' },
        { type: 'thisWeek', label: '📆 This Week', icon: '📆' },
        { type: 'thisMonth', label: '🗓️ This Month', icon: '🗓️' },
        { type: 'custom', label: '✏️ Custom', icon: '✏️' }
    ];
    
    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <span class="filter-label">⏰ Date Filter:</span>
                ${filters.map(f => `
                    <button class="filter-btn ${state.filterType === f.type ? 'active' : ''}" 
                            onclick="setFilter('${f.type}')">
                        ${f.icon} ${f.label}
                    </button>
                `).join('')}
            </div>
            <div class="filter-info">
                <span class="filter-count">${state.filteredBills.length} bills shown</span>
                ${state.filterType !== 'all' ? `<span class="filter-active">(${getFilterLabel(state.filterType)})</span>` : ''}
                ${state.bills.length > 0 ? `<span class="filter-total">of ${state.bills.length} total</span>` : ''}
            </div>
        </div>
    `;
}

function updateStats() {
    const bills = state.filteredBills;
    const total = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    
    // Get today's bills count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBills = bills.filter(b => {
        const date = b.Date ? new Date(b.Date) : null;
        return date && date >= today;
    });
    
    // Get this month's bills count
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthBills = bills.filter(b => {
        const date = b.Date ? new Date(b.Date) : null;
        return date && date >= monthStart;
    });
    
    DOM.stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📄</div>
            <div class="stat-info">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Filtered Bills</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
                <div class="stat-value">${formatMVR(totalAmount)}</div>
                <div class="stat-label">Filtered Amount</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
                <div class="stat-value">${formatMVR(avgAmount)}</div>
                <div class="stat-label">Average Bill</div>
            </div>
        </div>
        <div class="stat-card highlight">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
                <div class="stat-value">${todayBills.length}</div>
                <div class="stat-label">Today's Bills</div>
            </div>
        </div>
        <div class="stat-card highlight">
            <div class="stat-icon">🗓️</div>
            <div class="stat-info">
                <div class="stat-value">${monthBills.length}</div>
                <div class="stat-label">This Month</div>
            </div>
        </div>
        <div class="stat-card info">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
                <div class="stat-value">${state.bills.length}</div>
                <div class="stat-label">Total in Database</div>
            </div>
        </div>
        <div class="stat-card info">
            <div class="stat-icon">🏦</div>
            <div class="stat-info">
                <div class="stat-value">${formatMVR(state.totalAmount)}</div>
                <div class="stat-label">Grand Total (All Bills)</div>
            </div>
        </div>
    `;
}

function renderTable() {
    const bills = state.filteredBills;
    
    if (bills.length === 0 && state.bills.length === 0) {
        DOM.content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No Bills Found</h3>
                <p>Your bills table is empty. Click "Add New Bill" to get started!</p>
                <button class="btn btn-primary" onclick="openCreateModal()">➕ Add Your First Bill</button>
            </div>
        `;
        return;
    }
    
    if (bills.length === 0 && state.bills.length > 0) {
        DOM.content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Bills Match Your Filters</h3>
                <p>Try adjusting your search or date filters.</p>
                <button class="btn btn-secondary" onclick="setFilter('all')">📋 Show All Bills</button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-search">
                    <input type="text" 
                           class="search-input" 
                           placeholder="🔍 Search bills..." 
                           oninput="handleSearch(this.value)"
                           id="searchInput"
                           value="${state.searchTerm}">
                </div>
                <div class="table-actions">
                    <button class="btn btn-primary" onclick="openCreateModal()">➕ Add New Bill</button>
                    <button class="btn btn-secondary" onclick="exportCSV()">📥 Export CSV</button>
                    <button class="btn btn-secondary" onclick="fetchAllBills()">🔄 Refresh All</button>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="bill-table">
                    <thead>
                        <tr>
                            <th onclick="sortBills('id')">ID ${getSortIcon('id')}</th>
                            <th onclick="sortBills('Vendor')">Vendor ${getSortIcon('Vendor')}</th>
                            <th onclick="sortBills('Amount')">Amount ${getSortIcon('Amount')}</th>
                            <th onclick="sortBills('Date')" class="sort-active">Date ${getSortIcon('Date')}</th>
                            <th>Bill No</th>
                            <th>Location</th>
                            <th>TIN</th>
                            <th class="actions-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    bills.forEach((bill, index) => {
        const date = bill.Date ? new Date(bill.Date) : null;
        const dateStr = date ? date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'N/A';
        
        const timeStr = date ? date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
        
        const isToday = date && new Date().toDateString() === date.toDateString();
        const isThisWeek = date && getWeekNumber(date) === getWeekNumber(new Date());
        
        html += `
            <tr class="bill-row ${isToday ? 'today-row' : ''} ${isThisWeek && !isToday ? 'this-week-row' : ''}" 
                onclick="viewBill(${bill.id})">
                <td><span class="bill-id">#${bill.id}</span></td>
                <td><strong>${bill.Vendor || 'N/A'}</strong></td>
                <td class="amount">${formatMVR(bill.Amount || 0)}</td>
                <td>
                    <div class="date-cell">
                        <span class="date-main">${dateStr}</span>
                        ${timeStr ? `<span class="date-time">${timeStr}</span>` : ''}
                        ${isToday ? '<span class="badge badge-today">Today</span>' : ''}
                        ${!isToday && isThisWeek ? '<span class="badge badge-week">This Week</span>' : ''}
                    </div>
                </td>
                <td>${bill['Bill No'] || 'N/A'}</td>
                <td>${bill.Location || 'N/A'}</td>
                <td>${bill.TIN || 'N/A'}</td>
                <td class="actions-column">
                    <button class="btn-icon" onclick="event.stopPropagation(); viewBill(${bill.id})" title="View">👁️</button>
                    <button class="btn-icon" onclick="event.stopPropagation(); openEditModal(${bill.id})" title="Edit">✏️</button>
                    <button class="btn-icon delete" onclick="event.stopPropagation(); deleteBill(${bill.id})" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="table-footer">
                <span>Showing ${bills.length} of ${state.bills.length} bills</span>
                ${state.filterType !== 'all' ? `<span class="filter-badge">Filter: ${getFilterLabel(state.filterType)}</span>` : ''}
                ${state.totalPages > 1 ? `<span class="filter-badge">Loaded from ${state.totalPages} pages</span>` : ''}
                <span class="filter-badge">Total: ${formatMVR(state.totalAmount)}</span>
            </div>
        </div>
    `;
    
    DOM.content.innerHTML = html;
}

function renderBillDetail(bill) {
    const date = bill.Date ? new Date(bill.Date) : null;
    const dateStr = date ? date.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    }) : 'N/A';
    
    const isToday = date && new Date().toDateString() === date.toDateString();
    
    const html = `
        <div class="detail-view">
            <div class="detail-header">
                <h2>📄 Bill #${bill.id} ${isToday ? '<span class="badge badge-today">Today</span>' : ''}</h2>
                <div class="detail-actions">
                    <button class="btn btn-secondary" onclick="openEditModal(${bill.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteBill(${bill.id})">🗑️ Delete</button>
                    <button class="btn btn-secondary" onclick="renderTable()">← Back to List</button>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Vendor</label>
                    <div class="detail-value">${bill.Vendor || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Amount</label>
                    <div class="detail-value amount">${formatMVR(bill.Amount || 0)}</div>
                </div>
                <div class="detail-item">
                    <label>Date</label>
                    <div class="detail-value">${dateStr}</div>
                </div>
                <div class="detail-item">
                    <label>Bill Number</label>
                    <div class="detail-value">${bill['Bill No'] || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Location</label>
                    <div class="detail-value">${bill.Location || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>TIN</label>
                    <div class="detail-value">${bill.TIN || 'N/A'}</div>
                </div>
            </div>
            <div class="detail-timeline">
                <div class="timeline-item">
                    <span class="timeline-label">Created</span>
                    <span class="timeline-value">${dateStr}</span>
                </div>
                <div class="timeline-item">
                    <span class="timeline-label">Status</span>
                    <span class="timeline-value">
                        ${isToday ? '🟢 Today' : '📅 Past'}
                    </span>
                </div>
                <div class="timeline-item">
                    <span class="timeline-label">Total Bills</span>
                    <span class="timeline-value">${state.bills.length}</span>
                </div>
                <div class="timeline-item">
                    <span class="timeline-label">Grand Total</span>
                    <span class="timeline-value amount">${formatMVR(state.totalAmount)}</span>
                </div>
            </div>
        </div>
    `;
    
    DOM.content.innerHTML = html;
    state.selectedBill = bill;
    state.currentView = 'detail';
}

// ============================================
// FILTER & SORT HELPERS
// ============================================
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function handleSearch(value) {
    state.searchTerm = value;
    applyFilters();
    updateStats();
    renderTable();
}

function sortBills(field) {
    if (state.sortField === field) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortField = field;
        state.sortDirection = 'desc';
    }
    
    applyFilters();
    renderTable();
}

function getSortIcon(field) {
    if (state.sortField !== field) return '↕';
    return state.sortDirection === 'asc' ? '↑' : '↓';
}

// ============================================
// VIEW FUNCTIONS
// ============================================
function viewBill(id) {
    const bill = state.bills.find(b => b.id === id);
    if (bill) renderBillDetail(bill);
}

// ============================================
// MODAL FUNCTIONS
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

DOM.modal.addEventListener('click', (e) => {
    if (e.target === DOM.modal) closeModal();
});

function openCreateModal() {
    const html = `
        <div class="modal-header">
            <h2>➕ Add New Bill</h2>
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
    `;
    
    openModal(html);
    
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const now = new Date();
        dateInput.value = now.toISOString().slice(0, 16);
    }
}

function openEditModal(id) {
    const bill = state.bills.find(b => b.id === id);
    if (!bill) return;
    
    const date = bill.Date ? new Date(bill.Date).toISOString().slice(0, 16) : '';
    
    const html = `
        <div class="modal-header">
            <h2>✏️ Edit Bill #${id}</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <form id="billForm" onsubmit="handleUpdate(event, ${id})">
                <div class="form-group">
                    <label>Vendor</label>
                    <input type="text" name="Vendor" value="${bill.Vendor || ''}">
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
    `;
    
    openModal(html);
}

// ============================================
// FORM HANDLERS
// ============================================
async function handleCreate(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
    });
    
    await createBill(data);
}

async function handleUpdate(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
    });
    
    await updateBill(id, data);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
function exportCSV() {
    const bills = state.filteredBills;
    
    if (bills.length === 0) {
        showMessage('No bills to export!', 'warning');
        return;
    }
    
    const headers = ['ID', 'Vendor', 'Amount (MVR)', 'Date', 'Bill No', 'Location', 'TIN'];
    const rows = bills.map(b => [
        b.id,
        `"${(b.Vendor || '').replace(/"/g, '""')}"`,
        b.Amount || 0,
        b.Date || '',
        `"${(b['Bill No'] || '').replace(/"/g, '""')}"`,
        `"${(b.Location || '').replace(/"/g, '""')}"`,
        `"${(b.TIN || '').replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_${state.filterType}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage(`📥 Exported ${bills.length} bills to CSV`, 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        fetchAllBills();
    }
    
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openCreateModal();
    }
});

// ============================================
// INITIALIZATION
// ============================================
console.log('🚀 Bill Manager App Started');
console.log('📋 Available functions:');
console.log('  - fetchAllBills()    : Load ALL bills from Baserow');
console.log('  - setFilter(type)    : Filter bills (all/today/thisWeek/thisMonth/custom)');
console.log('  - openCreateModal()  : Add new bill');
console.log('  - exportCSV()        : Export to CSV');
console.log('  - viewBill(id)       : View bill details');
console.log('💰 Currency: MVR (Maldivian Rufiyaa)');
console.log('📌 Keyboard Shortcuts:');
console.log('  - Ctrl+R : Refresh All');
console.log('  - Ctrl+N : New Bill');
console.log('  - ESC    : Close modal');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, loading all bills...');
    fetchAllBills();
});