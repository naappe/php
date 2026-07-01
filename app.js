const state = {
      bills: [],
      filtered: [],
      filter: 'all',
      search: '',
      loaded: false
    };

    const $ = id => document.getElementById(id);
    const DOM = {
      app: $('app'),
      loginLayer: $('loginLayer'),
      loginForm: $('loginForm'),
      loginError: $('loginError'),
      content: $('content'),
      modalLayer: $('modalLayer'),
      modal: $('modal'),
      toast: $('toastArea'),
      search: $('searchInput')
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
      const raw = String(value).trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}-${match[3]}`;
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return '';
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }

    function todayKey() {
      return dateKey(new Date());
    }

    function displayDate(value) {
      const key = dateKey(value);
      if (!key) return 'N/A';
      const [year, month, day] = key.split('-');
      return `${day}/${month}/${year}`;
    }

    function billDateValue(bill) {
      return bill.Date || bill['Created Date'] || bill.Created || bill['Created At'] || bill.created_at || '';
    }

    function normalizeBill(bill) {
      const rawDate = billDateValue(bill);
      return {
        ...bill,
        Date: bill.Date || rawDate,
        _dateKey: dateKey(rawDate),
        _enteredBy: localStorage.getItem(`ws_bill_by_${bill.id}`) || localStorage.getItem('ws_user') || 'Admin'
      };
    }

    function mvr(value) {
      const amount = parseFloat(value) || 0;
      return 'MVR ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

    function toast(message, type = 'success') {
      const item = document.createElement('div');
      item.className = `toast ${type}`;
      item.textContent = message;
      DOM.toast.appendChild(item);
      setTimeout(() => item.remove(), 3000);
    }

    function isLoggedIn() {
      return localStorage.getItem('ws_bill_login') === 'yes';
    }

    function showLoginIfNeeded() {
      DOM.loginLayer.style.display = isLoggedIn() ? 'none' : 'flex';
      DOM.app.style.display = isLoggedIn() ? 'block' : 'none';
      if (isLoggedIn()) loadBills();
    }

    DOM.loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const user = $('loginUser').value.trim();
      const pass = $('loginPass').value.trim();
      if (user === CONFIG.LOGIN_USER && pass === CONFIG.LOGIN_PASS) {
        localStorage.setItem('ws_bill_login', 'yes');
        localStorage.setItem('ws_user', user);
        DOM.loginError.classList.remove('show');
        showLoginIfNeeded();
      } else {
        DOM.loginError.classList.add('show');
        $('loginPass').value = '';
      }
    });

    async function loadBills() {
      DOM.content.innerHTML = loadingHtml('Loading bills...');
      try {
        let page = 1;
        let all = [];
        let keepGoing = true;

        while (keepGoing) {
          const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/?user_field_names=true&size=200&page=${page}`;
          const response = await fetch(url, { headers: headers() });
          if (!response.ok) throw new Error('Could not load bills: ' + response.status);
          const data = await response.json();
          all = all.concat((data.results || []).map(normalizeBill));
          keepGoing = Boolean(data.next);
          page += 1;
        }

        state.bills = all.sort((a, b) => (b.id || 0) - (a.id || 0));
        state.loaded = true;
        applyFilters();
        render();
      } catch (error) {
        DOM.content.innerHTML = emptyHtml('Could not load bills', error.message);
        toast(error.message, 'error');
      }
    }

    function filterRange(type) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let from = '';
      if (type === 'today') from = today;
      if (type === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
      if (type === 'last30') {
        from = new Date(today);
        from.setDate(today.getDate() - 29);
      }
      return { from: from ? dateKey(from) : '', to: todayKey() };
    }

    function inRange(bill, type) {
      const range = filterRange(type);
      if (!range.from) return true;
      return bill._dateKey && bill._dateKey >= range.from && bill._dateKey <= range.to;
    }

    function applyFilters() {
      const query = state.search.toLowerCase().trim();
      state.filtered = state.bills.filter(bill => {
        if (!inRange(bill, state.filter)) return false;
        if (!query) return true;
        return [bill.id, bill.Vendor, bill.Amount, bill.Date, bill['Bill No'], bill.Location, bill.TIN, bill._enteredBy]
          .some(value => String(value || '').toLowerCase().includes(query));
      });
    }

    function billsFor(type) {
      return state.bills.filter(bill => inRange(bill, type));
    }

    function totalOf(bills) {
      return bills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);
    }

    function latestBill() {
      return [...state.bills].sort((a, b) => {
        if ((a._dateKey || '') !== (b._dateKey || '')) return (a._dateKey || '') < (b._dateKey || '') ? 1 : -1;
        return (b.id || 0) - (a.id || 0);
      })[0] || null;
    }

    function updateDashboard() {
      const latest = latestBill();
      const month = billsFor('month');
      const today = billsFor('today');

      $('latestVendor').textContent = latest ? latest.Vendor || 'N/A' : 'No bills yet';
      $('latestMeta').textContent = latest ? `${mvr(latest.Amount)} | ${displayDate(latest.Date)} | #${latest.id}` : 'Add your first bill';
      $('latestCard').onclick = latest ? () => viewBill(latest.id) : () => openForm();

      $('monthTotal').textContent = mvr(totalOf(month));
      $('monthCount').textContent = `${month.length} bills`;
      $('todayTotal').textContent = mvr(totalOf(today));
      $('todayCount').textContent = `${today.length} bills`;
      $('viewTotal').textContent = mvr(totalOf(state.filtered));
      $('viewCount').textContent = `${state.filtered.length} bills shown`;
    }

    function render() {
      updateDashboard();
      if (!state.filtered.length) {
        DOM.content.innerHTML = emptyHtml('No bills found', 'Try another filter or add a bill.');
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
            <tbody>${state.filtered.slice(0, 500).map(rowHtml).join('')}</tbody>
          </table>
          <div class="cards">${state.filtered.slice(0, 150).map(cardHtml).join('')}</div>
        </div>
        <div class="footer">
          <span>Showing ${state.filtered.length} bills</span>
          <span>Total ${mvr(totalOf(state.filtered))}</span>
        </div>
      `;
    }

    function rowHtml(bill) {
      return `
        <tr onclick="viewBill(${bill.id})">
          <td><span class="id-pill">#${bill.id}</span></td>
          <td><strong>${safe(bill.Vendor || 'N/A')}</strong></td>
          <td class="amount">${mvr(bill.Amount)}</td>
          <td>${displayDate(bill.Date)}</td>
          <td>${safe(bill['Bill No'] || 'N/A')}</td>
          <td>${safe(bill.Location || 'N/A')}</td>
          <td>${safe(bill._enteredBy || 'Admin')}</td>
          <td>
            <div class="row-actions">
              <button class="btn mini" onclick="event.stopPropagation(); openForm(${bill.id})">Edit</button>
              <button class="btn mini danger" onclick="event.stopPropagation(); deleteBill(${bill.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }

    function cardHtml(bill) {
      return `
        <article class="bill-card" onclick="viewBill(${bill.id})">
          <div class="bill-card-top">
            <span class="id-pill">#${bill.id}</span>
            <strong class="amount">${mvr(bill.Amount)}</strong>
          </div>
          <h3>${safe(bill.Vendor || 'N/A')}</h3>
          <div class="grid-2">
            ${info('Date', displayDate(bill.Date))}
            ${info('Bill No', bill['Bill No'] || 'N/A')}
            ${info('Location', bill.Location || 'N/A')}
            ${info('Entered By', bill._enteredBy || 'Admin')}
          </div>
        </article>
      `;
    }

    function info(label, value) {
      return `<div class="info"><label>${label}</label><div>${safe(value)}</div></div>`;
    }

    function viewBill(id) {
      const bill = state.bills.find(item => item.id === id);
      if (!bill) return;
      DOM.content.innerHTML = `
        <div class="detail">
          <div class="back-row">
            <button class="btn" onclick="render()">Back to Bills</button>
            <span class="id-pill">#${bill.id}</span>
          </div>
          <div class="detail-top">
            <div>
              <h2>${safe(bill.Vendor || 'Bill Detail')}</h2>
              <p>${displayDate(bill.Date)} | ${mvr(bill.Amount)}</p>
            </div>
            <div class="row-actions">
              <button class="btn" onclick="openForm(${bill.id})">Edit</button>
              <button class="btn danger" onclick="deleteBill(${bill.id})">Delete</button>
            </div>
          </div>
          <div class="detail-grid">
            ${info('Vendor', bill.Vendor || 'N/A')}
            ${info('Amount', mvr(bill.Amount))}
            ${info('Date / Created Date', displayDate(bill.Date))}
            ${info('Bill Number', bill['Bill No'] || 'N/A')}
            ${info('Location', bill.Location || 'N/A')}
            ${info('TIN', bill.TIN || 'N/A')}
            ${info('Entered By', bill._enteredBy || 'Admin')}
            ${info('Record ID', '#' + bill.id)}
          </div>
        </div>
      `;
    }

    function openForm(id = null) {
      const bill = id ? state.bills.find(item => item.id === id) : {};
      const isEdit = Boolean(id);
      DOM.modal.innerHTML = `
        <div class="modal-head">
          <h2>${isEdit ? 'Edit Bill' : 'Add Bill'}</h2>
          <button class="btn mini" onclick="closeModal()">Close</button>
        </div>
        <div class="modal-body">
          <form class="form" id="billForm">
            <div class="warning" id="duplicateBox">Possible duplicate bill found. Check before saving.</div>
            ${field('Vendor', 'Vendor', bill.Vendor || '', true)}
            ${field('Amount', 'Amount', bill.Amount || '', true, 'number', '0.01')}
            ${field('Date', 'Date', dateKey(bill.Date) || todayKey(), true, 'date')}
            ${field('Bill No', 'Bill No', bill['Bill No'] || '')}
            ${field('Location', 'Location', bill.Location || '')}
            ${field('TIN', 'TIN', bill.TIN || '')}
            ${field('Entered By', 'EnteredBy', bill._enteredBy || localStorage.getItem('ws_user') || 'Admin')}
            <div class="form-actions">
              <button type="button" class="btn" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      `;
      DOM.modalLayer.style.display = 'flex';
      const form = $('billForm');
      form.addEventListener('input', () => showDuplicate(form, id));
      form.addEventListener('submit', event => saveBill(event, id));
      showDuplicate(form, id);
    }

    function field(label, name, value, required = false, type = 'text', step = '') {
      return `
        <label class="form-field">${label}
          <input name="${safe(name)}" type="${type}" value="${safe(value)}" ${required ? 'required' : ''} ${step ? `step="${step}"` : ''}>
        </label>
      `;
    }

    function readForm(form) {
      const data = Object.fromEntries(new FormData(form));
      const enteredBy = data.EnteredBy || 'Admin';
      delete data.EnteredBy;
      data.Date = dateKey(data.Date) || todayKey();
      Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
      });
      return { data, enteredBy };
    }

    function isDuplicate(data, currentId) {
      return state.bills.some(bill => {
        if (currentId && bill.id === currentId) return false;
        return String(bill.Vendor || '').trim().toLowerCase() === String(data.Vendor || '').trim().toLowerCase()
          && Number(parseFloat(bill.Amount || 0).toFixed(2)) === Number(parseFloat(data.Amount || 0).toFixed(2))
          && dateKey(bill.Date) === dateKey(data.Date)
          && String(bill['Bill No'] || '').trim().toLowerCase() === String(data['Bill No'] || '').trim().toLowerCase();
      });
    }

    function showDuplicate(form, id) {
      const { data } = readForm(form);
      $('duplicateBox').classList.toggle('show', isDuplicate(data, id));
    }

    async function saveBill(event, id) {
      event.preventDefault();
      const { data, enteredBy } = readForm(event.target);
      if (isDuplicate(data, id) && !confirm('Possible duplicate. Save anyway?')) return;

      try {
        const method = id ? 'PATCH' : 'POST';
        const path = id ? `/${id}/` : '/';
        const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}${path}?user_field_names=true`;
        const response = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) });
        if (!response.ok) throw new Error('Save failed: ' + response.status);

        const saved = normalizeBill(await response.json());
        localStorage.setItem(`ws_bill_by_${saved.id}`, enteredBy);
        saved._enteredBy = enteredBy;

        const index = state.bills.findIndex(bill => bill.id === saved.id);
        if (index >= 0) state.bills[index] = saved;
        else state.bills.unshift(saved);

        closeModal();
        state.filter = 'all';
        state.search = '';
        DOM.search.value = '';
        setActiveFilter('all');
        applyFilters();
        render();
        toast(id ? 'Bill updated. Back to list.' : 'Bill added. Back to list.');
      } catch (error) {
        toast(error.message, 'error');
      }
    }

    async function deleteBill(id) {
      if (!confirm('Delete bill #' + id + '?')) return;
      try {
        const url = `${CONFIG.BASE_URL}/api/database/rows/table/${CONFIG.TABLE_ID}/${id}/`;
        const response = await fetch(url, { method: 'DELETE', headers: headers() });
        if (!response.ok) throw new Error('Delete failed: ' + response.status);
        state.bills = state.bills.filter(bill => bill.id !== id);
        applyFilters();
        render();
        toast('Bill deleted. Back to list.');
      } catch (error) {
        toast(error.message, 'error');
      }
    }

    function closeModal() {
      DOM.modalLayer.style.display = 'none';
      DOM.modal.innerHTML = '';
    }

    function setActiveFilter(filter) {
      state.filter = filter;
      document.querySelectorAll('.chip').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === filter);
      });
    }

    function exportCsv() {
      const rows = [['id', 'Vendor', 'Amount', 'Date', 'Bill No', 'Location', 'TIN', 'Entered By']];
      state.filtered.forEach(bill => {
        rows.push([bill.id, bill.Vendor || '', bill.Amount || '', bill.Date || '', bill['Bill No'] || '', bill.Location || '', bill.TIN || '', bill._enteredBy || '']);
      });
      const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'whitesaffron-bills.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    }

    function loadingHtml(message) {
      return `<div class="loading"><div class="spinner"></div><p>${safe(message)}</p></div>`;
    }

    function emptyHtml(title, note) {
      return `<div class="empty"><h2>${safe(title)}</h2><p>${safe(note)}</p><button class="btn primary" onclick="openForm()">Add Bill</button></div>`;
    }

    $('addBtn').addEventListener('click', () => openForm());
    $('refreshBtn').addEventListener('click', loadBills);
    $('exportBtn').addEventListener('click', exportCsv);
    $('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('ws_bill_login');
      showLoginIfNeeded();
    });

    DOM.search.addEventListener('input', event => {
      state.search = event.target.value;
      applyFilters();
      render();
    });

    document.querySelectorAll('.chip').forEach(button => {
      button.addEventListener('click', () => {
        setActiveFilter(button.dataset.filter);
        applyFilters();
        render();
      });
    });

    DOM.modalLayer.addEventListener('click', event => {
      if (event.target === DOM.modalLayer) closeModal();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });

    window.openForm = openForm;
    window.viewBill = viewBill;
    window.deleteBill = deleteBill;
    window.closeModal = closeModal;
    window.render = render;

    showLoginIfNeeded();
