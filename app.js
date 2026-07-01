const state = {
  bills: [],
  filtered: [],
  range: 'all',
  search: ''
};

const $ = id => document.getElementById(id);
const DOM = {
  content: $('content'),
  stats: $('stats'),
  search: $('searchInput'),
  modalLayer: $('modalLayer'),
  modal: $('modal'),
  toast: $('toastArea')
};

function apiHeaders() {
  return {
    Authorization: 'Token ' + CONFIG.API_TOKEN,
    'Content-Type': 'application/json'
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function displayDate(value) {
  const key = toDateKey(value);
  if (!key) return 'N/A';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

function billDateValue(bill) {
  return bill.Date || bill['Created Date'] || bill.Created || bill['Created At'] || bill.created_at || '';
}

function normalizeBill(bill) {
  const date = billDateValue(bill);
  return {
    ...bill,
    Date: bill.Date || date,
    _dateKey: toDateKey(date),
    _enteredBy: localStorage.getItem(`bill_by_${bill.id}`) || localStorage.getItem('ws_user') || 'Admin'
  };
}

function mvr(value) {
  const n = parseFloat(value) || 0;
  return 'MVR ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function clean(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

function notify(text, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = text;
  DOM.toast.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function loadBills() {
  DOM.content.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading bills...</p></div>`;
  try {
    let page = 1;
    let all = [];
    let hasNext = true;
    while (hasNext) {
      const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/?user_field_names=true&size=200&page=${page}`;
      const res = await fetch(url, { headers: apiHeaders() });
      if (!res.ok) throw new Error('Could not load bills: ' + res.status);
      const data = await res.json();
      all = all.concat((data.results || []).map(normalizeBill));
      hasNext = Boolean(data.next);
      page += 1;
    }
    state.bills = all.sort((a, b) => (b.id || 0) - (a.id || 0));
    applyFilters();
    render();
  } catch (error) {
    DOM.content.innerHTML = `<div class="empty"><h2>Could not load bills</h2><p>${clean(error.message)}</p></div>`;
    notify(error.message, 'error');
  }
}

function rangeDates(type) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = '';
  if (type === 'today') from = today;
  if (type === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
  if (type === 'last30') {
    from = new Date(today);
    from.setDate(today.getDate() - 29);
  }
  return { from: from ? toDateKey(from) : '', to: todayKey() };
}

function applyFilters() {
  const q = state.search.toLowerCase().trim();
  const range = rangeDates(state.range);
  state.filtered = state.bills.filter(bill => {
    if (range.from && (!bill._dateKey || bill._dateKey < range.from || bill._dateKey > range.to)) return false;
    if (!q) return true;
    return [bill.id, bill.Vendor, bill.Amount, bill.Date, bill['Bill No'], bill.Location, bill.TIN, bill._enteredBy]
      .some(v => String(v || '').toLowerCase().includes(q));
  });
}

function billsIn(type) {
  const range = rangeDates(type);
  return state.bills.filter(b => b._dateKey && (!range.from || (b._dateKey >= range.from && b._dateKey <= range.to)));
}

function latestBill() {
  return [...state.bills].sort((a, b) => {
    if (a._dateKey !== b._dateKey) return a._dateKey < b._dateKey ? 1 : -1;
    return (b.id || 0) - (a.id || 0);
  })[0];
}

function totalOf(bills) {
  return bills.reduce((sum, b) => sum + (parseFloat(b.Amount) || 0), 0);
}

function updateHome() {
  const latest = latestBill();
  const month = billsIn('month');
  const today = billsIn('today');
  $('latestTitle').textContent = latest ? latest.Vendor || 'N/A' : 'No bills yet';
  $('latestInfo').textContent = latest ? `${mvr(latest.Amount)} | ${displayDate(latest.Date)} | #${latest.id}` : 'Add your first bill';
  $('latestBox').onclick = latest ? () => viewBill(latest.id) : () => openBillForm();
  $('monthTotal').textContent = mvr(totalOf(month));
  $('monthCount').textContent = `${month.length} bills`;
  $('todayTotal').textContent = mvr(totalOf(today));
  $('todayCount').textContent = `${today.length} bills`;
}

function renderStats() {
  const amount = totalOf(state.filtered);
  const avg = state.filtered.length ? amount / state.filtered.length : 0;
  DOM.stats.innerHTML = `
    ${stat('Showing', state.filtered.length, 'Bills in current view')}
    ${stat('Total', mvr(amount), 'Current view total')}
    ${stat('Average', mvr(avg), 'Average bill')}
    ${stat('All Bills', state.bills.length, 'Loaded records')}
  `;
}

function stat(label, value, note) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function render() {
  updateHome();
  renderStats();

  if (!state.filtered.length) {
    DOM.content.innerHTML = `<div class="empty"><h2>No bills found</h2><p>Try another filter or add a bill.</p><button class="primary-btn" onclick="openBillForm()">Add Bill</button></div>`;
    return;
  }

  DOM.content.innerHTML = `
    <div class="content-head">
      <h2>Bills</h2>
      <span>${state.filtered.length} records</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Bill No</th>
            <th>Location</th>
            <th>Entered By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${state.filtered.slice(0, 500).map(row).join('')}</tbody>
      </table>
      <div class="cards">${state.filtered.slice(0, 150).map(card).join('')}</div>
    </div>
    <div class="footer">
      <span>Showing ${state.filtered.length} bills</span>
      <span>Total ${mvr(totalOf(state.filtered))}</span>
    </div>
  `;
}

function row(b) {
  return `
    <tr onclick="viewBill(${b.id})">
      <td><span class="pill">#${b.id}</span></td>
      <td><strong>${clean(b.Vendor || 'N/A')}</strong></td>
      <td class="amount">${mvr(b.Amount)}</td>
      <td>${displayDate(b.Date)}</td>
      <td>${clean(b['Bill No'] || 'N/A')}</td>
      <td>${clean(b.Location || 'N/A')}</td>
      <td>${clean(b._enteredBy || 'Admin')}</td>
      <td><div class="row-actions">
        <button class="mini-btn" onclick="event.stopPropagation(); openBillForm(${b.id})">Edit</button>
        <button class="mini-btn danger" onclick="event.stopPropagation(); deleteBill(${b.id})">Delete</button>
      </div></td>
    </tr>
  `;
}

function card(b) {
  return `
    <article class="bill-card" onclick="viewBill(${b.id})">
      <div class="bill-card-top">
        <span class="pill">#${b.id}</span>
        <strong class="amount">${mvr(b.Amount)}</strong>
      </div>
      <h3>${clean(b.Vendor || 'N/A')}</h3>
      <div class="card-grid">
        ${info('Date', displayDate(b.Date))}
        ${info('Bill No', b['Bill No'] || 'N/A')}
        ${info('Location', b.Location || 'N/A')}
        ${info('Entered By', b._enteredBy || 'Admin')}
      </div>
    </article>
  `;
}

function info(label, value) {
  return `<div class="info-box"><label>${label}</label><div>${clean(value)}</div></div>`;
}

function viewBill(id) {
  const b = state.bills.find(x => x.id === id);
  if (!b) return;
  DOM.content.innerHTML = `
    <div class="detail">
      <div class="back-row">
        <button class="light-btn" onclick="render()">Back to Home</button>
        <span class="pill">#${b.id}</span>
      </div>
      <div class="detail-top">
        <div>
          <h2>${clean(b.Vendor || 'Bill Detail')}</h2>
          <p>${displayDate(b.Date)} | ${mvr(b.Amount)}</p>
        </div>
        <div class="row-actions">
          <button class="light-btn" onclick="openBillForm(${b.id})">Edit</button>
          <button class="light-btn danger-text" onclick="deleteBill(${b.id})">Delete</button>
        </div>
      </div>
      <div class="detail-grid">
        ${info('Vendor', b.Vendor || 'N/A')}
        ${info('Amount', mvr(b.Amount))}
        ${info('Date / Created Date', displayDate(b.Date))}
        ${info('Bill Number', b['Bill No'] || 'N/A')}
        ${info('Location', b.Location || 'N/A')}
        ${info('TIN', b.TIN || 'N/A')}
        ${info('Entered By', b._enteredBy || 'Admin')}
        ${info('Record ID', '#' + b.id)}
      </div>
    </div>
  `;
}

function openBillForm(id = null) {
  const b = id ? state.bills.find(x => x.id === id) : {};
  const edit = Boolean(id);
  openModal(`
    <div class="modal-head">
      <h2>${edit ? 'Edit Bill' : 'Add Bill'}</h2>
      <button class="mini-btn" onclick="closeModal()">Close</button>
    </div>
    <div class="modal-body">
      <form class="form" id="billForm">
        <div class="warning" id="dupeBox">Possible duplicate bill found. Check before saving.</div>
        <label>Vendor *<input name="Vendor" required value="${clean(b.Vendor || '')}"></label>
        <label>Amount *<input name="Amount" type="number" step="0.01" required value="${clean(b.Amount || '')}"></label>
        <label>Date *<input name="Date" type="date" required value="${toDateKey(b.Date) || todayKey()}"></label>
        <label>Bill No<input name="Bill No" value="${clean(b['Bill No'] || '')}"></label>
        <label>Location<input name="Location" value="${clean(b.Location || '')}"></label>
        <label>TIN<input name="TIN" value="${clean(b.TIN || '')}"></label>
        <label>Entered By<input name="EnteredBy" value="${clean(b._enteredBy || localStorage.getItem('ws_user') || 'Admin')}"></label>
        <div class="form-actions">
          <button type="button" class="light-btn" onclick="closeModal()">Cancel</button>
          <button class="primary-btn" type="submit">${edit ? 'Update' : 'Save'}</button>
        </div>
      </form>
    </div>
  `);
  const form = $('billForm');
  form.addEventListener('input', () => checkDuplicate(form, id));
  form.addEventListener('submit', event => saveBill(event, id));
  checkDuplicate(form, id);
}

function dataFromForm(form) {
  const raw = Object.fromEntries(new FormData(form));
  const enteredBy = raw.EnteredBy || 'Admin';
  delete raw.EnteredBy;
  raw.Date = toDateKey(raw.Date) || todayKey();
  Object.keys(raw).forEach(k => {
    if (raw[k] === '') delete raw[k];
  });
  return { raw, enteredBy };
}

function duplicateExists(data, currentId) {
  return state.bills.some(b => {
    if (currentId && b.id === currentId) return false;
    return String(b.Vendor || '').trim().toLowerCase() === String(data.Vendor || '').trim().toLowerCase()
      && Number(parseFloat(b.Amount || 0).toFixed(2)) === Number(parseFloat(data.Amount || 0).toFixed(2))
      && toDateKey(b.Date) === toDateKey(data.Date)
      && String(b['Bill No'] || '').trim().toLowerCase() === String(data['Bill No'] || '').trim().toLowerCase();
  });
}

function checkDuplicate(form, id) {
  const { raw } = dataFromForm(form);
  const dupe = duplicateExists(raw, id);
  $('dupeBox').classList.toggle('show', dupe);
}

async function saveBill(event, id) {
  event.preventDefault();
  const { raw, enteredBy } = dataFromForm(event.target);
  if (duplicateExists(raw, id) && !confirm('Possible duplicate. Save anyway?')) return;
  try {
    const method = id ? 'PATCH' : 'POST';
    const path = id ? `/${id}/` : '/';
    const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}${path}?user_field_names=true`;
    const res = await fetch(url, { method, headers: apiHeaders(), body: JSON.stringify(raw) });
    if (!res.ok) throw new Error('Save failed: ' + res.status);
    const saved = normalizeBill(await res.json());
    localStorage.setItem(`bill_by_${saved.id}`, enteredBy);
    saved._enteredBy = enteredBy;
    const index = state.bills.findIndex(b => b.id === saved.id);
    if (index >= 0) state.bills[index] = saved;
    else state.bills.unshift(saved);
    closeModal();
    state.range = 'all';
    setActiveChip('all');
    state.search = '';
    DOM.search.value = '';
    applyFilters();
    render();
    notify(editText(id));
  } catch (error) {
    notify(error.message, 'error');
  }
}

function editText(id) {
  return id ? 'Bill updated. Back to home.' : 'Bill added. Back to home.';
}

async function deleteBill(id) {
  if (!confirm('Delete bill #' + id + '?')) return;
  try {
    const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/${id}/`;
    const res = await fetch(url, { method: 'DELETE', headers: apiHeaders() });
    if (!res.ok) throw new Error('Delete failed: ' + res.status);
    state.bills = state.bills.filter(b => b.id !== id);
    applyFilters();
    render();
    notify('Bill deleted. Back to home.');
  } catch (error) {
    notify(error.message, 'error');
  }
}

function openModal(html) {
  DOM.modal.innerHTML = html;
  DOM.modalLayer.style.display = 'flex';
}

function closeModal() {
  DOM.modalLayer.style.display = 'none';
  DOM.modal.innerHTML = '';
}

function setActiveChip(range) {
  state.range = range;
  document.querySelectorAll('.chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
}

function exportCsv() {
  const rows = [['id', 'Vendor', 'Amount', 'Date', 'Bill No', 'Location', 'TIN', 'Entered By']];
  state.filtered.forEach(b => rows.push([b.id, b.Vendor || '', b.Amount || '', b.Date || '', b['Bill No'] || '', b.Location || '', b.TIN || '', b._enteredBy || '']));
  const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'whitesaffron-bills.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

DOM.search.addEventListener('input', event => {
  state.search = event.target.value;
  applyFilters();
  render();
});

document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveChip(btn.dataset.range);
    applyFilters();
    render();
  });
});

$('addMainBtn').addEventListener('click', () => openBillForm());
$('refreshBtn').addEventListener('click', loadBills);
$('exportBtn').addEventListener('click', exportCsv);
$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('ws_logged_in');
  window.location.href = 'login.html';
});

DOM.modalLayer.addEventListener('click', event => {
  if (event.target === DOM.modalLayer) closeModal();
});

window.openBillForm = openBillForm;
window.viewBill = viewBill;
window.deleteBill = deleteBill;
window.closeModal = closeModal;
window.render = render;

loadBills();
