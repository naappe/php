// ============================================
// MOBILE CARD RENDERER
// ============================================
function renderMobileCards(bills) {
    let html = '<div class="bill-cards">';
    
    bills.forEach((bill) => {
        const date = bill.Date ? new Date(bill.Date) : null;
        const dateStr = date ? date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'N/A';
        
        const isToday = date && new Date().toDateString() === date.toDateString();
        const isThisWeek = date && getWeekNumber(date) === getWeekNumber(new Date());
        
        let cardClass = 'bill-card';
        if (isToday) cardClass += ' today-card';
        else if (isThisWeek) cardClass += ' week-card';
        
        html += `
            <div class="${cardClass}" onclick="viewBill(${bill.id})">
                <div class="bill-card-header">
                    <span class="bill-card-id">#${bill.id}</span>
                    <span class="bill-card-amount">${formatMVR(bill.Amount || 0)}</span>
                </div>
                <div class="bill-card-vendor">${bill.Vendor || 'N/A'}</div>
                <div class="bill-card-details">
                    <div class="bill-card-detail">
                        <span class="bill-card-detail-label">Date</span>
                        <span class="bill-card-detail-value">${dateStr}</span>
                    </div>
                    <div class="bill-card-detail">
                        <span class="bill-card-detail-label">Bill No</span>
                        <span class="bill-card-detail-value">${bill['Bill No'] || 'N/A'}</span>
                    </div>
                    <div class="bill-card-detail">
                        <span class="bill-card-detail-label">Location</span>
                        <span class="bill-card-detail-value">${bill.Location || 'N/A'}</span>
                    </div>
                    <div class="bill-card-detail">
                        <span class="bill-card-detail-label">TIN</span>
                        <span class="bill-card-detail-value">${bill.TIN || 'N/A'}</span>
                    </div>
                </div>
                ${isToday ? '<div class="bill-card-badges"><span class="badge badge-today">Today</span></div>' : ''}
                ${!isToday && isThisWeek ? '<div class="bill-card-badges"><span class="badge badge-week">This Week</span></div>' : ''}
                <div class="bill-card-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); viewBill(${bill.id})">👁️ View</button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); openEditModal(${bill.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteBill(${bill.id})">🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ============================================
// MODIFIED: renderTable with mobile support
// ============================================
function renderTable() {
    const bills = state.filteredBills;
    
    if (bills.length === 0 && state.bills.length === 0) {
        DOM.content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No Bills Found</h3>
                <p>Your bills table is empty. Tap the + button to get started!</p>
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
    
    // Check if mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768;
    
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
                    <button class="btn btn-primary" onclick="openCreateModal()">➕ Add</button>
                    <button class="btn btn-secondary" onclick="exportCSV()">📥 CSV</button>
                    <button class="btn btn-secondary" onclick="fetchAllBills()">🔄</button>
                </div>
            </div>
    `;
    
    if (isMobile) {
        // Mobile: Show cards
        html += renderMobileCards(bills);
    } else {
        // Desktop/Tablet: Show table
        html += renderDesktopTable(bills);
    }
    
    html += `
            <div class="table-footer">
                <span>${bills.length} of ${state.bills.length} bills</span>
                ${state.filterType !== 'all' ? `<span class="filter-badge">${getFilterLabel(state.filterType)}</span>` : ''}
                <span class="filter-badge">Total: ${formatMVR(state.totalAmount)}</span>
            </div>
        </div>
    `;
    
    DOM.content.innerHTML = html;
}

// ============================================
// DESKTOP TABLE RENDERER
// ============================================
function renderDesktopTable(bills) {
    let html = `
        <div class="table-wrapper">
            <table class="bill-table">
                <thead>
                    <tr>
                        <th onclick="sortBills('id')">ID ${getSortIcon('id')}</th>
                        <th onclick="sortBills('Vendor')">Vendor ${getSortIcon('Vendor')}</th>
                        <th onclick="sortBills('Amount')">Amount ${getSortIcon('Amount')}</th>
                        <th onclick="sortBills('Date')">Date ${getSortIcon('Date')}</th>
                        <th>Bill No</th>
                        <th>Location</th>
                        <th>TIN</th>
                        <th class="actions-column">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    bills.forEach((bill) => {
        const date = bill.Date ? new Date(bill.Date) : null;
        const dateStr = date ? date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'N/A';
        
        const isToday = date && new Date().toDateString() === date.toDateString();
        const isThisWeek = date && getWeekNumber(date) === getWeekNumber(new Date());
        
        html += `
            <tr class="bill-row ${isToday ? 'today-row' : ''} ${isThisWeek && !isToday ? 'this-week-row' : ''}" 
                onclick="viewBill(${bill.id})">
                <td><span class="bill-id">#${bill.id}</span></td>
                <td><strong>${bill.Vendor || 'N/A'}</strong></td>
                <td class="amount">${formatMVR(bill.Amount || 0)}</td>
                <td>${dateStr}</td>
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
    `;
    
    return html;
}

// ============================================
// WINDOW RESIZE HANDLER
// ============================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (state.bills.length > 0) {
            renderTable();
        }
    }, 300);
});
