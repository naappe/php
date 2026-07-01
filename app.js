const state = {
  bills: [],
  filtered: [],
  search: '',
  range: 'all',
  loaded: false,
  sortField: 'Date',
  sortDir: 'desc'
};

const $ = id => document.getElementById(id);
const DOM = {
  content: $('content'),
  stats: $('statsGrid'),
  search: $('searchInput'),
  range: $('rangeFilter'),
  modal: $('modalLayer'),
  modalContent: $('modalContent'),
  toast: $('toastWrap')
};

function headers() {
  return {
    Authorization: 'Token ' + CONFIG.API_TOKEN,
    'Content-Type': 'application/json'
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateKey(value) {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value)) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayKey() {
  return dateKey(new Date());
}

function displayDate(value) {
  const key = dateKey(value);
  if (!key) return 'N/A';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

function billRawDate(bill) {
  return bill.Date || bill['Created Date'] || bill.Created || bill['Created At'] || bill.created_at || '';
}

function normalizeBill(bill) {
  const rawDate = billRawDate(bill);
  return {
    ...bill,
    Date: bill.Date || rawDate,
    _dateKey: dateKey(rawDate),
    _enteredBy: getBillMeta(bill.id).enteredBy || localStorage.getItem('ws_user') || 'Admin'
  };
}

function mvr(value) {
  const n = parseFloat(value) || 0;
  return 'MVR ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  DOM.toast.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function metaKey(id) {
  return 'ws_bill_meta_' + id;
}

function getBillMeta(id) {
  try {
    return JSON.parse(localStorage.getItem(metaKey(id)) || '{}');
  } catch {
    return {};
  }
}

function setBillMeta(id, data) {
  localStorage.setItem(metaKey(id), JSON.stringify({
    ...getBillMeta(id),
    ...data
  }));
}

function rangeBounds(type) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = null;
  let to = today;

  if (type === 'today') from = today;
  if (type === 'week') {
    from = new Date(today);
    from.setDate(today.getDate() - today.getDay());
  }
  if (type === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
  if (type === 'last30') {
    from = new Date(today);
    from.setDate(today.getDate() - 29);
  }
  if (type === 'all') return { from: '', to: '' };
  return { from: dateKey(from), to: dateKey(to) };
}

async function loadBills(force = false) {
  DOM.content.innerHTML = loadingHtml('Loading bills...');
  try {
    const pageSize = 200;
    let page = 1;
    let all = [];
    let next = true;

    while (next) {
      const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/?user_field_names=true&size=${pageSize}&page=${page}`;
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) throw new Error('Baserow error ' + res.status);
      const data = await res.json();
      all = all.concat((data.results || []).map(normalizeBill));
      next = !!data.next;
      page += 1;
    }

    state.bills = all.sort(compareBills);
    state.loaded = true;
    applyFilters();
    render();
    if (force) toast('Bills refreshed');
  } catch (error) {
    DOM.content.innerHTML = emptyHtml('Could not load bills', error.message);
    toast(error.message, 'error');
  }
}

function compareBills(a, b) {
  const field = state.sortField;
  let av = field === 'Date' ? a._dateKey : a[field];
  let bv = field === 'Date' ? b._dateKey : b[field];
  if (field === 'Amount') {
    av = parseFloat(av) || 0;
    bv = parseFloat(bv) || 0;
  }
  if (typeof av === 'string') av = av.toLowerCase();
  if (typeof bv === 'string') bv = bv.toLowerCase();
  const result = av > bv ? 1 : av < bv ? -1 : 0;
  return state.sortDir === 'asc' ? result : -result;
}

function applyFilters() {
  const query = state.search.toLowerCase().trim();
  const { from, to } = rangeBounds(state.range);

  state.filtered = state.bills.filter(bill => {
    if (from && (!bill._dateKey || bill._dateKey < from || bill._dateKey > to)) return false;
    if (!query) return true;
    return [
      bill.Vendor,
      bill.Amount,
      bill.Date,
      bill['Bill No'],
      bill.Location,
      bill.TIN,
      bill.id,
      bill._enteredBy
    ].some(v => String(v || '').toLowerCase().includes(query));
  });
}

function latestBill() {
  return [...state.bills].sort((a, b) => {
    if (a._dateKey !== b._dateKey) return a._dateKey < b._dateKey ? 1 : -1;
    return (b.id || 0) - (a.id || 0);
  })[0] || null;
}

function billsForRange(type) {
  const { from, to } = rangeBounds(type);
  return state.bills.filter(b => b._dateKey && (!from || (b._dateKey >= from && b._dateKey <= to)));
}

function updateFrontSummary() {
  const latest = latestBill();
  const month = billsForRange('month');
  const last30 = billsForRange('last30');
  const monthTotal = month.reduce((s, b) => s + (parseFloat(b.Amount) || 0), 0);
  const last30Total = last30.reduce((s, b) => s + (parseFloat(b.Amount) || 0), 0);

  $('latestVendor').textContent = latest ? latest.Vendor || 'Unnamed vendor' : 'No bills yet';
  $('latestMeta').textContent = latest ? `${mvr(latest.Amount)} | ${displayDate(latest.Date)} | Entered by ${latest._enteredBy}` : 'Add your first bill';
  $('latestCard').onclick = latest ? () => viewBill(latest.id) : null;
  $('monthTotal').textContent = mvr(monthTotal);
  $('monthCount').textContent = `${month.length} bills this month`;
  $('last30Total').textContent = mvr(last30Total);
  $('last30Count').textContent = `${last30.length} bills in last 30 days`;
}

function renderStats() {
  const total = state.filtered.length;
  const amount = state.filtered.reduce((s, b) => s + (parseFloat(b.Amount) || 0), 0);
  const avg = total ? amount / total : 0;
  const topVendor = topVendorName(state.filtered);
  DOM.stats.innerHTML = `
    ${statCard('Filtered Bills', total, 'Current list count')}
    ${statCard('Filtered Total', mvr(amount), 'Total amount shown')}
    ${statCard('Average Bill', mvr(avg), 'Average from filter')}
    ${statCard('Top Vendor', topVendor || 'N/A', 'Highest total vendor')}
  `;
}

function statCard(label, value, note) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function topVendorName(bills) {
  const map = {};
  bills.forEach(b => {
    const vendor = b.Vendor || 'Unknown';
    map[vendor] = (map[vendor] || 0) + (parseFloat(b.Amount) || 0);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function render() {
  updateFrontSummary();
  renderStats();
  const bills = state.filtered;
  if (!bills.length) {
    DOM.content.innerHTML = emptyHtml('No bills found', 'Try another filter or add a new bill.');
    return;
  }

  DOM.content.innerHTML = `
    <div class="panel-head">
      <h2 class="panel-title">Bills</h2>
      <span class="muted">${bills.length} of ${state.bills.length} records</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th onclick="sortBy('id')">ID</th>
            <th onclick="sortBy('Vendor')">Vendor</th>
            <th onclick="sortBy('Amount')">Amount</th>
            <th onclick="sortBy('Date')">Date</th>
            <th>Bill No</th>
            <th>Location</th>
            <th>Entered By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${bills.slice(0, 500).map(rowHtml).join('')}</tbody>
      </table>
      <div class="cards">${bills.slice(0, 150).map(cardHtml).join('')}</div>
    </div>
    <div class="footer-row">
      <span>Showing ${Math.min(bills.length, window.innerWidth < 940 ? 150 : 500)} of ${bills.length}</span>
      <span>Total ${mvr(bills.reduce((s, b) => s + (parseFloat(b.Amount) || 0), 0))}</span>
    </div>
  `;
}

function rowHtml(b) {
  return `
    <tr onclick="viewBill(${b.id})">
      <td><span class="id-pill">#${b.id}</span></td>
      <td><strong>${safe(b.Vendor || 'N/A')}</strong></td>
      <td class="amount">${mvr(b.Amount)}</td>
      <td>${displayDate(b.Date)}</td>
      <td>${safe(b['Bill No'] || 'N/A')}</td>
      <td>${safe(b.Location || 'N/A')}</td>
      <td>${safe(b._enteredBy || 'Admin')}</td>
      <td>
        <div class="actions">
          <button class="mini-btn" onclick="event.stopPropagation(); viewBill(${b.id})">View</button>
          <button class="mini-btn" onclick="event.stopPropagation(); openForm(${b.id})">Edit</button>
          <button class="mini-btn danger" onclick="event.stopPropagation(); deleteBill(${b.id})">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function cardHtml(b) {
  return `
    <article class="bill-card" onclick="viewBill(${b.id})">
      <div class="bill-card-top">
        <span class="id-pill">#${b.id}</span>
        <strong class="amount">${mvr(b.Amount)}</strong>
      </div>
      <h3>${safe(b.Vendor || 'N/A')}</h3>
      <div class="bill-card-grid">
        ${fieldBox('Date', displayDate(b.Date))}
        ${fieldBox('Bill No', b['Bill No'] || 'N/A')}
        ${fieldBox('Location', b.Location || 'N/A')}
        ${fieldBox('Entered By', b._enteredBy || 'Admin')}
      </div>
      <div class="form-actions">
        <button class="secondary-btn" onclick="event.stopPropagation(); openForm(${b.id})">Edit</button>
        <button class="danger-btn" onclick="event.stopPropagation(); deleteBill(${b.id})">Delete</button>
      </div>
    </article>
  `;
}

function fieldBox(label, value) {
  return `<div class="field-box"><label>${label}</label><div>${safe(value)}</div></div>`;
}

function viewBill(id) {
  const bill = state.bills.find(b => b.id === id);
  if (!bill) return;
  DOM.content.innerHTML = `
    <div class="detail-view">
      <div class="detail-back">
        <button class="secondary-btn" onclick="goHome()">Back to Bills</button>
        <span>Bill #${bill.id}</span>
      </div>
      <div class="detail-top">
        <div class="detail-title">
          <h2>${safe(bill.Vendor || 'Bill Detail')}</h2>
          <p class="muted">${displayDate(bill.Date)} | ${safe(bill['Bill No'] || 'No bill number')}</p>
        </div>
        <div class="actions">
          <button class="secondary-btn" onclick="openForm(${bill.id})">Edit</button>
          <button class="danger-btn" onclick="deleteBill(${bill.id})">Delete</button>
        </div>
      </div>
      <div class="detail-grid">
        ${fieldBox('Vendor', bill.Vendor || 'N/A')}
        ${fieldBox('Amount', mvr(bill.Amount))}
        ${fieldBox('Date / Created Date', displayDate(bill.Date))}
        ${fieldBox('Bill Number', bill['Bill No'] || 'N/A')}
        ${fieldBox('Location', bill.Location || 'N/A')}
        ${fieldBox('TIN', bill.TIN || 'N/A')}
        ${fieldBox('Entered By', bill._enteredBy || 'Admin')}
        ${fieldBox('Record ID', '#' + bill.id)}
      </div>
    </div>
  `;
}

function goHome() {
  applyFilters();
  render();
}

function sortBy(field) {
  if (state.sortField === field) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  else {
    state.sortField = field;
    state.sortDir = 'desc';
  }
  state.bills.sort(compareBills);
  applyFilters();
  render();
}

function openForm(id = null) {
  const bill = id ? state.bills.find(b => b.id === id) : {};
  const isEdit = !!id;
  const today = todayKey();
  openModal(`
    <div class="modal-head">
      <h2>${isEdit ? 'Edit Bill #' + id : 'Add New Bill'}</h2>
      <button class="mini-btn" onclick="closeModal()">Close</button>
    </div>
    <div class="modal-body">
      <form id="billForm" class="form-grid">
        <div class="duplicate-warning" id="duplicateWarning">Possible duplicate bill found. Please check before saving.</div>
        <label>Vendor *
          <input name="Vendor" value="${attr(bill.Vendor || '')}" required>
        </label>
        <label>Amount (MVR) *
          <input name="Amount" type="number" step="0.01" min="0" value="${attr(bill.Amount || '')}" required>
        </label>
        <label>Date *
          <input name="Date" type="date" value="${attr(dateKey(bill.Date) || today)}" required>
        </label>
        <label>Bill Number
          <input name="Bill No" value="${attr(bill['Bill No'] || '')}">
        </label>
        <label>Location
          <input name="Location" value="${attr(bill.Location || '')}">
        </label>
        <label>TIN
          <input name="TIN" value="${attr(bill.TIN || '')}">
        </label>
        <label>Entered By
          <input name="EnteredByLocal" value="${attr(bill._enteredBy || localStorage.getItem('ws_user') || 'Admin')}">
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button>
          <button class="primary-btn" type="submit">${isEdit ? 'Update Bill' : 'Create Bill'}</button>
        </div>
      </form>
    </div>
  `);

  const form = $('billForm');
  form.addEventListener('input', () => showDuplicateWarning(form, id));
  form.addEventListener('submit', event => saveBill(event, id));
  showDuplicateWarning(form, id);
}

function formData(form) {
  const raw = Object.fromEntries(new FormData(form));
  const enteredBy = raw.EnteredByLocal || 'Admin';
  delete raw.EnteredByLocal;
  raw.Date = dateKey(raw.Date) || todayKey();
  Object.keys(raw).forEach(k => {
    if (raw[k] === '') delete raw[k];
  });
  return { api: raw, enteredBy };
}

function isDuplicate(data, currentId = null) {
  return state.bills.some(b => {
    if (currentId && b.id === currentId) return false;
    return String(b.Vendor || '').trim().toLowerCase() === String(data.Vendor || '').trim().toLowerCase()
      && Number(parseFloat(b.Amount || 0).toFixed(2)) === Number(parseFloat(data.Amount || 0).toFixed(2))
      && dateKey(b.Date) === dateKey(data.Date)
      && String(b['Bill No'] || '').trim().toLowerCase() === String(data['Bill No'] || '').trim().toLowerCase();
  });
}

function showDuplicateWarning(form, currentId) {
  const { api } = formData(form);
  const warning = $('duplicateWarning');
  if (!warning) return;
  warning.classList.toggle('show', isDuplicate(api, currentId));
}

async function saveBill(event, id = null) {
  event.preventDefault();
  const { api, enteredBy } = formData(event.target);
  const duplicate = isDuplicate(api, id);
  if (duplicate && !confirm('Possible duplicate bill found. Save anyway?')) return;

  try {
    const method = id ? 'PATCH' : 'POST';
    const path = id ? `/${id}/` : '/';
    const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}${path}?user_field_names=true`;
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(api) });
    if (!res.ok) throw new Error('Save failed ' + res.status);
    const saved = normalizeBill(await res.json());
    setBillMeta(saved.id, { enteredBy, savedAt: new Date().toISOString() });
    saved._enteredBy = enteredBy;

    const index = state.bills.findIndex(b => b.id === saved.id);
    if (index >= 0) state.bills[index] = saved;
    else state.bills.unshift(saved);

    state.bills.sort(compareBills);
    closeModal();
    state.range = 'all';
    DOM.range.value = 'all';
    state.search = '';
    DOM.search.value = '';
    applyFilters();
    render();
    toast(id ? 'Bill updated. Back to list.' : 'Bill created. Back to list.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function deleteBill(id) {
  if (!confirm('Delete bill #' + id + '?')) return;
  try {
    const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/${id}/`;
    const res = await fetch(url, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Delete failed ' + res.status);
    state.bills = state.bills.filter(b => b.id !== id);
    applyFilters();
    render();
    toast('Bill deleted. Back to list.', 'warning');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function exportCsv() {
  const rows = [['id', 'Vendor', 'Amount', 'Date', 'Bill No', 'Location', 'TIN', 'Entered By']];
  state.filtered.forEach(b => rows.push([
    b.id,
    b.Vendor || '',
    b.Amount || '',
    b.Date || '',
    b['Bill No'] || '',
    b.Location || '',
    b.TIN || '',
    b._enteredBy || ''
  ]));
  const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'whitesaffron-bills.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function openModal(html) {
  DOM.modalContent.innerHTML = html;
  DOM.modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  DOM.modal.style.display = 'none';
  DOM.modalContent.innerHTML = '';
  document.body.style.overflow = '';
}

function loadingHtml(message) {
  return `<div class="loading-state"><div class="spinner"></div><p>${safe(message)}</p></div>`;
}

function emptyHtml(title, note) {
  return `<div class="empty-state"><h2>${safe(title)}</h2><p>${safe(note)}</p><button class="primary-btn" onclick="openForm()">Add Bill</button></div>`;
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

function attr(value) {
  return safe(value);
}

DOM.search.addEventListener('input', event => {
  state.search = event.target.value;
  applyFilters();
  render();
});

DOM.range.addEventListener('change', event => {
  state.range = event.target.value;
  applyFilters();
  render();
});

$('addBtn').addEventListener('click', () => openForm());
$('refreshBtn').addEventListener('click', () => loadBills(true));
$('exportBtn').addEventListener('click', exportCsv);
$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('ws_auth');
  location.href = 'login.html';
});

DOM.modal.addEventListener('click', event => {
  if (event.target === DOM.modal) closeModal();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

window.openForm = openForm;
window.viewBill = viewBill;
window.deleteBill = deleteBill;
window.sortBy = sortBy;
window.goHome = goHome;
window.closeModal = closeModal;

loadBills();
