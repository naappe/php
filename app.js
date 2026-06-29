// ============================================
// BILL MANAGER - Full Application with Smart Search
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
    filterType: 'all',
    filterDateRange: {
        start: null,
        end: null
    },
    totalPages: 1,
    currentPage: 1,
    allLoaded: false,
    totalAmount: 0,
    loadStartTime: 0,
    loadEndTime: 0,
    smartSearchQuery: ''
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
// OPTIMIZED: FAST LOAD ALL BILLS
// ============================================
async function fetchAllBills() {
    showLoading(true);
    state.loadStartTime = performance.now();
    state.allLoaded = false;
    state.bills = [];
    
    try {
        const pageSize = 200;
        
        const url = getApiUrl('/api/database/rows/table/{table_id}/', {
            user_field_names: 'true',
            size: pageSize,
            page: 1
        });
        
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const totalCount = data.count || 0;
        const firstPageBills = data.results || [];
        
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
        
        state.totalPages = Math.ceil(totalCount / pageSize);
        
        let allBills = [...firstPageBills];
        let totalAmount = firstPageBills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
        
        if (state.totalPages > 1) {
            showMessage(`📥 Loading ${totalCount} bills...`, 'info', 2000);
            
            const pagePromises = [];
            for (let page = 2; page <= state.totalPages; page++) {
                const pageUrl = getApiUrl('/api/database/rows/table/{table_id}/', {
                    user_field_names: 'true',
                    size: pageSize,
                    page: page
                });
                pagePromises.push(
                    fetch(pageUrl, { headers: getHeaders() })
                        .then(res => res.json())
                        .then(pageData => {
                            const bills = pageData.results || [];
                            const pageTotal = bills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
                            return { bills, pageTotal };
                        })
                );
            }
            
            const results = await Promise.all(pagePromises);
            
            results.forEach(result => {
                allBills = allBills.concat(result.bills);
                totalAmount += result.pageTotal;
            });
        }
        
        state.bills = allBills;
        state.totalAmount = totalAmount;
        state.allLoaded = true;
        
        state.loadEndTime = performance.now();
        const loadTime = ((state.loadEndTime - state.loadStartTime) / 1000).toFixed(2);
        
        console.log(`✅ Loaded ${state.bills.length} bills in ${loadTime}s`);
        console.log(`💰 Total Amount: ${formatMVR(totalAmount)}`);
        
        applyFilters();
        updateStats();
        renderTable();
        renderFilterOptions();
        showMessage(`✅ Loaded ${state.bills.length} bills in ${loadTime}s | Total: ${formatMVR(totalAmount)}`, 'success', 4000);
        
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

// ============================================
// CACHE: Load from localStorage if available
// ============================================
function loadFromCache() {
    try {
        const cached = localStorage.getItem('bills_cache');
        if (cached) {
            const data = JSON.parse(cached);
            const cacheAge = Date.now() - (data.timestamp || 0);
            
            if (cacheAge < 5 * 60 * 1000 && data.bills && data.bills.length > 0) {
                state.bills = data.bills;
                state.totalAmount = data.totalAmount || 0;
                state.allLoaded = true;
                
                console.log(`📦 Loaded ${state.bills.length} bills from cache`);
                applyFilters();
                updateStats();
                renderTable();
                renderFilterOptions();
                
                setTimeout(() => {
                    console.log('🔄 Refreshing data in background...');
                    fetchAllBills();
                }, 1000);
                
                return true;
            }
        }
    } catch (e) {
        console.log('Cache error:', e);
    }
    return false;
}

function saveToCache() {
    try {
        localStorage.setItem('bills_cache', JSON.stringify({
            bills: state.bills,
            totalAmount: state.totalAmount,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.log('Cache save error:', e);
    }
}

// ============================================
// API CALLS - Create/Update/Delete
// ============================================
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
        saveToCache();
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
        
        const oldBill = state.bills.find(b => b.id === id);
        if (oldBill) {
            state.totalAmount -= parseFloat(oldBill.Amount || 0);
            state.totalAmount += parseFloat(updatedBill.Amount || 0);
        }
        
        const index = state.bills.findIndex(b => b.id === id);
        if (index !== -1) state.bills[index] = updatedBill;
        
        saveToCache();
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
        saveToCache();
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
// SMART SEARCH ENGINE
// ============================================
class SmartSearch {
    constructor() {
        this.searchHistory = [];
        this.suggestions = [];
        this.isOpen = false;
        this.operators = {
            '>': 'greater than',
            '<': 'less than', 
            '>=': 'greater than or equal',
            '<=': 'less than or equal',
            '=': 'equals',
            '!=': 'not equals',
            'contains': 'contains',
            'starts': 'starts with',
            'ends': 'ends with',
            'between': 'between',
            'in': 'in list',
            'notin': 'not in list',
            'is': 'is',
            'isnot': 'is not',
            'has': 'has value',
            'hasnot': 'does not have value'
        };
        this.fieldTypes = {
            'Vendor': 'text',
            'Amount': 'number',
            'Date': 'date',
            'Bill No': 'text',
            'Location': 'text',
            'TIN': 'text',
            'id': 'number'
        };
        this.searchCache = new Map();
        this.debounceTimer = null;
    }

    parseQuery(query) {
        if (!query || query.trim() === '') {
            return { type: 'all', filters: [], searchTerm: '' };
        }

        const tokens = this.tokenize(query);
        const parsed = this.parseTokens(tokens);
        
        return {
            type: parsed.type || 'all',
            filters: parsed.filters || [],
            searchTerm: parsed.searchTerm || '',
            dateRange: parsed.dateRange || null
        };
    }

    tokenize(query) {
        const tokens = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < query.length) {
            const char = query[i];

            if (char === '"') {
                inQuotes = !inQuotes;
                i++;
                continue;
            }

            if (char === ' ' && !inQuotes) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                i++;
                continue;
            }

            current += char;
            i++;
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    parseTokens(tokens) {
        const result = {
            type: 'all',
            filters: [],
            searchTerm: '',
            dateRange: null
        };

        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i].toLowerCase();

            if (token === 'today' || token === 'yesterday' || token === 'thisweek' || 
                token === 'thismonth' || token === 'thisyear') {
                result.type = token;
                result.filters.push({
                    field: 'Date',
                    operator: 'is',
                    value: token
                });
                i++;
                continue;
            }

            if (token === 'between' && i + 3 < tokens.length) {
                const field = tokens[i + 1];
                const start = tokens[i + 2];
                const end = tokens[i + 3];
                if (this.isValidField(field)) {
                    result.filters.push({
                        field: field,
                        operator: 'between',
                        value: { start, end }
                    });
                    result.dateRange = { start, end };
                    i += 4;
                    continue;
                }
            }

            if (token.includes(':')) {
                const parts = token.split(':');
                if (parts.length === 3) {
                    const field = parts[0];
                    const operator = parts[1];
                    const value = parts[2];
                    if (this.isValidField(field) && this.isValidOperator(operator)) {
                        result.filters.push({
                            field: field,
                            operator: operator,
                            value: value
                        });
                        i++;
                        continue;
                    }
                }
                if (parts.length === 2) {
                    const field = parts[0];
                    const value = parts[1];
                    if (this.isValidField(field)) {
                        result.filters.push({
                            field: field,
                            operator: '=',
                            value: value
                        });
                        i++;
                        continue;
                    }
                }
            }

            const operatorMatch = token.match(/^([><]=?|!=|=)(.+)$/);
            if (operatorMatch) {
                const operator = operatorMatch[1];
                const value = operatorMatch[2];
                if (i > 0 && this.isValidField(tokens[i - 1])) {
                    result.filters.push({
                        field: tokens[i - 1],
                        operator: operator,
                        value: value
                    });
                    result.filters = result.filters.filter(f => f.field !== tokens[i - 1] || f.operator !== operator);
                    i++;
                    continue;
                }
            }

            if (result.searchTerm) {
                result.searchTerm += ' ' + token;
            } else {
                result.searchTerm = token;
            }
            i++;
        }

        if (result.filters.length > 0) {
            result.type = 'filtered';
        }

        return result;
    }

    search(bills, query) {
        if (!query || query.trim() === '') {
            return bills;
        }

        const cacheKey = query + JSON.stringify(bills.map(b => b.id).slice(0, 10));
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        const parsed = this.parseQuery(query);
        let results = [...bills];

        results = this.applyDateFilters(results, parsed);
        results = this.applyFieldFilters(results, parsed);

        if (parsed.searchTerm) {
            const term = parsed.searchTerm.toLowerCase();
            results = results.filter(bill => {
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

        if (this.searchCache.size > 100) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(cacheKey, results);

        return results;
    }

    applyDateFilters(bills, parsed) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let filtered = [...bills];

        parsed.filters.forEach(filter => {
            if (filter.field === 'Date') {
                switch (filter.operator) {
                    case 'today':
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date >= today;
                        });
                        break;
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date >= yesterday && date < today;
                        });
                        break;
                    case 'thisweek':
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay());
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date >= startOfWeek;
                        });
                        break;
                    case 'thismonth':
                        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date >= startOfMonth;
                        });
                        break;
                    case 'thisyear':
                        const startOfYear = new Date(today.getFullYear(), 0, 1);
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date >= startOfYear;
                        });
                        break;
                    case 'between':
                        if (filter.value && filter.value.start && filter.value.end) {
                            const start = new Date(filter.value.start);
                            const end = new Date(filter.value.end);
                            end.setHours(23, 59, 59);
                            filtered = filtered.filter(bill => {
                                const date = bill.Date ? new Date(bill.Date) : null;
                                return date && date >= start && date <= end;
                            });
                        }
                        break;
                    case '>':
                        const afterDate = new Date(filter.value);
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date > afterDate;
                        });
                        break;
                    case '<':
                        const beforeDate = new Date(filter.value);
                        filtered = filtered.filter(bill => {
                            const date = bill.Date ? new Date(bill.Date) : null;
                            return date && date < beforeDate;
                        });
                        break;
                }
            }
        });

        return filtered;
    }

    applyFieldFilters(bills, parsed) {
        let filtered = [...bills];

        parsed.filters.forEach(filter => {
            if (filter.field === 'Date') return;

            const field = filter.field;
            const operator = filter.operator;
            const value = filter.value;

            filtered = filtered.filter(bill => {
                const fieldValue = bill[field];
                const numValue = parseFloat(fieldValue);
                const strValue = String(fieldValue || '').toLowerCase();
                const searchValue = String(value || '').toLowerCase();

                switch (operator) {
                    case '=':
                        return String(fieldValue).toLowerCase() === searchValue;
                    case '!=':
                        return String(fieldValue).toLowerCase() !== searchValue;
                    case '>':
                        return numValue > parseFloat(value);
                    case '<':
                        return numValue < parseFloat(value);
                    case '>=':
                        return numValue >= parseFloat(value);
                    case '<=':
                        return numValue <= parseFloat(value);
                    case 'contains':
                        return strValue.includes(searchValue);
                    case 'starts':
                        return strValue.startsWith(searchValue);
                    case 'ends':
                        return strValue.endsWith(searchValue);
                    case 'is':
                        return fieldValue !== null && fieldValue !== undefined;
                    case 'isnot':
                        return fieldValue === null || fieldValue === undefined;
                    case 'has':
                        return fieldValue && fieldValue.length > 0;
                    case 'hasnot':
                        return !fieldValue || fieldValue.length === 0;
                    default:
                        return true;
                }
            });
        });

        return filtered;
    }

    getSuggestions(query, bills) {
        if (!query || query.length < 1) {
            return this.getRecentSearches();
        }

        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        const fields = Object.keys(this.fieldTypes);
        fields.forEach(field => {
            if (field.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'field',
                    label: `${field}`,
                    description: `Search by ${field}`,
                    insert: `${field}:`
                });
            }
        });

        Object.keys(this.operators).forEach(op => {
            if (op.includes(lowerQuery)) {
                suggestions.push({
                    type: 'operator',
                    label: op,
                    description: this.operators[op],
                    insert: op
                });
            }
        });

        if (query.includes(':')) {
            const parts = query.split(':');
            const field = parts[0];
            const value = parts[1] || '';
            
            if (this.isValidField(field)) {
                const uniqueValues = new Set();
                bills.forEach(bill => {
                    const val = bill[field];
                    if (val) {
                        const strVal = String(val).toLowerCase();
                        if (strVal.includes(value.toLowerCase()) && uniqueValues.size < 5) {
                            uniqueValues.add(val);
                        }
                    }
                });
                
                uniqueValues.forEach(val => {
                    suggestions.push({
                        type: 'value',
                        label: val,
                        description: `Value for ${field}`,
                        insert: `${field}:${val}`
                    });
                });
            }
        }

        if (query.includes('date') || query.includes('today') || query.includes('week')) {
            const dateSuggestions = [
                { label: 'today', description: 'Bills from today', insert: 'today' },
                { label: 'yesterday', description: 'Bills from yesterday', insert: 'yesterday' },
                { label: 'thisweek', description: 'Bills from this week', insert: 'thisweek' },
                { label: 'thismonth', description: 'Bills from this month', insert: 'thismonth' },
                { label: 'thisyear', description: 'Bills from this year', insert: 'thisyear' }
            ];
            
            dateSuggestions.forEach(s => {
                if (s.label.includes(lowerQuery)) {
                    suggestions.push({
                        type: 'date',
                        label: s.label,
                        description: s.description,
                        insert: s.label
                    });
                }
            });
        }

        if (lowerQuery.includes('amount')) {
            suggestions.push({
                type: 'smart',
                label: 'Amount > 1000',
                description: 'Find bills over MVR 1,000',
                insert: 'Amount:>1000'
            });
            suggestions.push({
                type: 'smart',
                label: 'Amount between 500-1000',
                description: 'Find bills in range',
                insert: 'between Amount 500 1000'
            });
        }

        if (lowerQuery.includes('vendor')) {
            suggestions.push({
                type: 'smart',
                label: 'Vendor contains "tech"',
                description: 'Find vendors with "tech"',
                insert: 'Vendor:contains:tech'
            });
        }

        return suggestions.slice(0, 10);
    }

    isValidField(field) {
        return Object.keys(this.fieldTypes).includes(field);
    }

    isValidOperator(operator) {
        return Object.keys(this.operators).includes(operator);
    }

    getRecentSearches() {
        return this.searchHistory.slice(0, 5).map(item => ({
            type: 'recent',
            label: item,
            description: 'Recent search',
            insert: item
        }));
    }

    addToHistory(query) {
        if (query && query.trim()) {
            this.searchHistory = this.searchHistory.filter(h => h !== query);
            this.searchHistory.unshift(query);
            if (this.searchHistory.length > 20) {
                this.searchHistory.pop();
            }
        }
    }
}

// ============================================
// INITIALIZE SMART SEARCH
// ============================================
const smartSearch = new SmartSearch();

// ============================================
// SMART SEARCH UI FUNCTIONS
// ============================================
function renderSmartSearch() {
    const searchContainer = document.getElementById('smartSearchContainer');
    if (!searchContainer) return;

    searchContainer.innerHTML = `
        <div class="smart-search-wrapper">
            <div class="smart-search-input-container">
                <span class="search-icon">🔍</span>
                <input type="text" 
                       id="smartSearchInput"
                       class="smart-search-input"
                       placeholder="Search bills... Try 'Amount > 1000' or 'today'"
                       autocomplete="off"
                       oninput="handleSmartSearchInput(this.value)"
                       onfocus="openSuggestions()"
                       onkeydown="handleSmartSearchKeydown(event)">
                <button class="search-clear" onclick="clearSmartSearch()">✕</button>
                <div class="search-shortcuts">
                    <span class="shortcut-hint">⌘K</span>
                </div>
            </div>
            <div id="suggestionsContainer" class="suggestions-container" style="display:none;">
                <div id="suggestionsList"></div>
                <div class="suggestions-footer">
                    <span>Press Enter to search</span>
                    <span>ESC to close</span>
                </div>
            </div>
            <div class="search-active-filters" id="activeFilters"></div>
        </div>
    `;
}

function handleSmartSearchInput(value) {
    const suggestions = smartSearch.getSuggestions(value, state.bills);
    const container = document.getElementById('suggestionsContainer');
    const list = document.getElementById('suggestionsList');

    if (suggestions.length > 0 && value.length > 0) {
        container.style.display = 'block';
        list.innerHTML = suggestions.map((s, index) => `
            <div class="suggestion-item" 
                 onclick="applySuggestion('${s.insert.replace(/'/g, "\\'")}')"
                 data-index="${index}">
                <div class="suggestion-icon">${getSuggestionIcon(s.type)}</div>
                <div class="suggestion-content">
                    <div class="suggestion-label">${s.label}</div>
                    <div class="suggestion-description">${s.description}</div>
                </div>
                <div class="suggestion-insert">${s.insert}</div>
            </div>
        `).join('');
    } else if (value.length === 0) {
        const recent = smartSearch.getRecentSearches();
        if (recent.length > 0) {
            container.style.display = 'block';
            list.innerHTML = recent.map(s => `
                <div class="suggestion-item" onclick="applySuggestion('${s.insert.replace(/'/g, "\\'")}')">
                    <div class="suggestion-icon">🕐</div>
                    <div class="suggestion-content">
                        <div class="suggestion-label">${s.label}</div>
                        <div class="suggestion-description">${s.description}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.style.display = 'none';
        }
    } else {
        container.style.display = 'none';
    }

    updateActiveFilters(value);
}

function getSuggestionIcon(type) {
    const icons = {
        'field': '📋',
        'operator': '⚡',
        'value': '📌',
        'date': '📅',
        'smart': '💡',
        'recent': '🕐'
    };
    return icons[type] || '🔍';
}

function applySuggestion(value) {
    const input = document.getElementById('smartSearchInput');
    if (!input) return;

    let insertValue = value;
    if (value.includes(':')) {
        const currentValue = input.value;
        const parts = currentValue.split(':');
        if (parts.length > 0 && value.startsWith(parts[0] + ':')) {
            const fieldPart = parts[0] + ':';
            const remaining = currentValue.substring(fieldPart.length);
            if (remaining.includes(' ') || remaining === '') {
                insertValue = value;
            }
        }
    }

    input.value = insertValue;
    input.focus();
    document.getElementById('suggestionsContainer').style.display = 'none';
    
    performSmartSearch(insertValue);
    smartSearch.addToHistory(insertValue);
}

function handleSmartSearchKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('smartSearchInput');
        const value = input.value;
        performSmartSearch(value);
        smartSearch.addToHistory(value);
        document.getElementById('suggestionsContainer').style.display = 'none';
    }
    
    if (event.key === 'Escape') {
        document.getElementById('suggestionsContainer').style.display = 'none';
    }
    
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const suggestions = document.querySelectorAll('.suggestion-item');
        let currentIndex = -1;
        suggestions.forEach((s, i) => {
            if (s.classList.contains('active')) {
                currentIndex = i;
                s.classList.remove('active');
            }
        });
        
        let newIndex = event.key === 'ArrowDown' ? 
            Math.min(currentIndex + 1, suggestions.length - 1) : 
            Math.max(currentIndex - 1, 0);
        
        if (newIndex >= 0 && suggestions[newIndex]) {
            suggestions[newIndex].classList.add('active');
            suggestions[newIndex].scrollIntoView({ block: 'nearest' });
        }
    }
}

function openSuggestions() {
    const container = document.getElementById('suggestionsContainer');
    const input = document.getElementById('smartSearchInput');
    if (input && input.value.length >= 0) {
        handleSmartSearchInput(input.value);
    }
}

function clearSmartSearch() {
    const input = document.getElementById('smartSearchInput');
    if (input) {
        input.value = '';
        performSmartSearch('');
        document.getElementById('suggestionsContainer').style.display = 'none';
        updateActiveFilters('');
        input.focus();
    }
}

function updateActiveFilters(query) {
    const container = document.getElementById('activeFilters');
    if (!container) return;

    if (!query || query.trim() === '') {
        container.innerHTML = '';
        return;
    }

    const parsed = smartSearch.parseQuery(query);
    const filters = parsed.filters;

    if (filters.length === 0 && !parsed.searchTerm) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="filter-tags">';
    
    if (parsed.searchTerm) {
        html += `
            <span class="filter-tag">
                🔍 ${parsed.searchTerm}
                <span class="filter-tag-remove" onclick="removeFilter('search')">×</span>
            </span>
        `;
    }

    filters.forEach((filter, index) => {
        const displayValue = typeof filter.value === 'object' ? 
            `${filter.value.start} → ${filter.value.end}` : 
            filter.value;
        
        const colorClass = filter.field.toLowerCase();
        
        html += `
            <span class="filter-tag filter-tag-${colorClass}">
                ${filter.field}: ${displayValue}
                <span class="filter-tag-remove" onclick="removeFilter(${index})">×</span>
            </span>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function removeFilter(index) {
    const input = document.getElementById('smartSearchInput');
    if (!input) return;

    const query = input.value;
    const parsed = smartSearch.parseQuery(query);
    
    if (index === 'search' && parsed.searchTerm) {
        const newQuery = query.replace(parsed.searchTerm, '').trim();
        input.value = newQuery;
        performSmartSearch(newQuery);
        updateActiveFilters(newQuery);
        return;
    }

    if (typeof index === 'number' && parsed.filters[index]) {
        const filter = parsed.filters[index];
        const filterPattern = `${filter.field}:${filter.operator}:${filter.value}`;
        const newQuery = query.replace(filterPattern, '').trim();
        input.value = newQuery;
        performSmartSearch(newQuery);
        updateActiveFilters(newQuery);
    }
}

function performSmartSearch(query) {
    state.smartSearchQuery = query;
    const results = smartSearch.search(state.bills, query);
    state.filteredBills = results;
    updateStats();
    renderTable();
    
    const countEl = document.querySelector('.search-result-count');
    if (countEl) {
        countEl.textContent = `${results.length} results`;
    }
}

// ============================================
// FILTER FUNCTIONS
// ============================================
function applyFilters() {
    let filtered = [...state.bills];
    
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
            
        default:
            break;
    }
    
    // Apply smart search if active
    if (state.smartSearchQuery) {
        filtered = smartSearch.search(filtered, state.smartSearchQuery);
    }
    
    // Apply search term (legacy)
    if (state.searchTerm && !state.smartSearchQuery) {
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
    state.smartSearchQuery = ''; // Clear smart search when using quick filters
    
    const input = document.getElementById('smartSearchInput');
    if (input) input.value = '';
    
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

    container.innerHTML = `
        <div id="smartSearchContainer"></div>
        <div class="filter-bar" style="margin-top: 10px;">
            <div class="filter-group">
                <span class="filter-label">⏰ Quick Filters:</span>
                ${['all', 'today', 'thisWeek', 'thisMonth'].map(type => `
                    <button class="filter-btn ${state.filterType === type ? 'active' : ''}" 
                            onclick="setFilter('${type}')">
                        ${getFilterEmoji(type)} ${getFilterLabel(type)}
                    </button>
                `).join('')}
            </div>
            <div class="filter-info">
                <span class="filter-count">${state.filteredBills.length} bills</span>
                <span class="search-result-count">${state.smartSearchQuery ? state.filteredBills.length + ' results' : ''}</span>
            </div>
        </div>
    `;

    renderSmartSearch();
}

function getFilterEmoji(type) {
    const emojis = {
        'all': '📋',
        'today': '📅',
        'thisWeek': '📆',
        'thisMonth': '🗓️'
    };
    return emojis[type] || '📋';
}

function updateStats() {
    const bills = state.filteredBills;
    const total = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBills = bills.filter(b => {
        const date = b.Date ? new Date(b.Date) : null;
        return date && date >= today;
    });
    
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

// ============================================
// RENDER MOBILE CARDS
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
// RENDER DESKTOP TABLE
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
// RENDER TABLE
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
    
    const isMobile = window.innerWidth < 768;
    
    let html = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-search">
                    <input type="text" 
                           class="search-input" 
                           placeholder="🔍 Search bills..." 
                           oninput="handleLegacySearch(this.value)"
                           id="legacySearchInput"
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
        html += renderMobileCards(bills);
    } else {
        html += renderDesktopTable(bills);
    }
    
    html += `
            <div class="table-footer">
                <span>${bills.length} of ${state.bills.length} bills</span>
                ${state.filterType !== 'all' ? `<span class="filter-badge">${getFilterLabel(state.filterType)}</span>` : ''}
                ${state.smartSearchQuery ? `<span class="filter-badge">🔍 Search</span>` : ''}
                <span class="filter-badge">Total: ${formatMVR(state.totalAmount)}</span>
            </div>
        </div>
    `;
    
    DOM.content.innerHTML = html;
}

function handleLegacySearch(value) {
    state.searchTerm = value;
    state.smartSearchQuery = ''; // Clear smart search when using legacy search
    
    const smartInput = document.getElementById('smartSearchInput');
    if (smartInput) smartInput.value = '';
    
    applyFilters();
    updateStats();
    renderTable();
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
                    <button class="btn btn-secondary" onclick="renderTable()">← Back</button>
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
                    <span class="timeline-value">${isToday ? '🟢 Today' : '📅 Past'}</span>
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
    if (e.key === 'Escape') {
        closeModal();
        document.getElementById('suggestionsContainer').style.display = 'none';
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('smartSearchInput');
        if (input) {
            input.focus();
            input.select();
            openSuggestions();
        }
    }
    
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

// ============================================
// INITIALIZATION
// ============================================
console.log('🚀 Smart Bill Manager App Started');
console.log('⚡ Features:');
console.log('  - Smart Search with suggestions');
console.log('  - Parallel page loading');
console.log('  - Local cache (5 min)');
console.log('  - Mobile-first responsive UI');
console.log('📋 Available functions:');
console.log('  - fetchAllBills()    : Load ALL bills from Baserow');
console.log('  - setFilter(type)    : Filter bills (all/today/thisWeek/thisMonth/custom)');
console.log('  - openCreateModal()  : Add new bill');
console.log('  - exportCSV()        : Export to CSV');
console.log('  - viewBill(id)       : View bill details');
console.log('💰 Currency: MVR (Maldivian Rufiyaa)');
console.log('⌨️ Keyboard Shortcuts:');
console.log('  - Ctrl+K : Focus Smart Search');
console.log('  - Ctrl+R : Refresh All');
console.log('  - Ctrl+N : New Bill');
console.log('  - ESC    : Close modal / suggestions');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded...');
    
    const cached = loadFromCache();
    
    if (!cached) {
        fetchAllBills();
    }
});