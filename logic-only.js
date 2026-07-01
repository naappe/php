// Logic-only upgrade for the existing WhiteSaffron Bill Manager.
// Add this after app.js. It keeps your current design.
(function () {
  const DATE_FIELDS = [
    'Date',
    'Created Date',
    'Created date',
    'Created',
    'Created At',
    'Created at',
    'created_at',
    'Date Created',
    'Created On',
    'Created on'
  ];

  function firstDateValue(bill) {
    if (!bill) return '';
    for (const field of DATE_FIELDS) {
      if (bill[field]) return bill[field];
    }
    return '';
  }

  function fixBillDates() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills)) return;
    state.bills.forEach(bill => {
      const rawDate = firstDateValue(bill);
      if (!bill.Date && rawDate) bill.Date = rawDate;
      bill._dateKey = normalizeToUTCKey(rawDate || bill.Date);
    });
  }

  function monthBills() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills)) return [];
    const start = normalizeToUTCKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const today = getTodayUTC();
    return state.bills.filter(bill => bill._dateKey && bill._dateKey >= start && bill._dateKey <= today);
  }

  function latestBill() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills) || !state.bills.length) return null;
    return [...state.bills].sort((a, b) => {
      if ((a._dateKey || '') !== (b._dateKey || '')) return (a._dateKey || '') < (b._dateKey || '') ? 1 : -1;
      return (b.id || 0) - (a.id || 0);
    })[0];
  }

  function showThisMonthOnHome() {
    if (typeof state === 'undefined' || !state.loaded || !DOM || !DOM.content) return;
    if (DOM.content.querySelector('.logic-month-home')) return;

    const bills = monthBills();
    const total = bills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);
    const latest = latestBill();

    const box = document.createElement('div');
    box.className = 'logic-month-home';
    box.style.cssText = 'padding:14px 16px;border-bottom:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;';
    box.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="showMonthBillsOnly()">This Month Bills: ${bills.length}</button>
      <strong style="font-size:13px;">This Month Total: ${formatMVR(total)}</strong>
      ${latest ? `<button class="btn btn-secondary btn-sm" onclick="viewBill(${latest.id})">Latest: ${escapeHtml(latest.Vendor || 'N/A')} - ${formatMVR(latest.Amount)}</button>` : ''}
    `;

    DOM.content.prepend(box);
  }

  function showMonthBillsOnly() {
    fixBillDates();
    state.dateRange.type = 'month';
    const label = document.getElementById('dateRangeLabel');
    if (label) label.textContent = 'This Month';
    if (typeof applyFilters === 'function') applyFilters();
    if (typeof render === 'function') render();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[ch]));
  }

  // Keep existing design, only add a clearer back action in detail view.
  if (typeof viewBill === 'function') {
    const originalViewBill = viewBill;
    viewBill = function (id) {
      originalViewBill.apply(this, arguments);
      const detail = DOM.content && DOM.content.querySelector('.detail-view');
      if (!detail || detail.querySelector('.logic-back-btn')) return;
      const back = document.createElement('div');
      back.className = 'logic-back-btn';
      back.style.cssText = 'margin-bottom:12px;';
      back.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="render()">← Back to Bills</button>';
      detail.prepend(back);
    };
    window.viewBill = viewBill;
  }

  // After normal render, add the home month/latest strip.
  if (typeof render === 'function') {
    const originalRender = render;
    render = function () {
      fixBillDates();
      originalRender.apply(this, arguments);
      showThisMonthOnHome();
    };
    window.render = render;
  }

  // Auto back to bill list after create/update/delete.
  if (typeof handleCreate === 'function') {
    const originalHandleCreate = handleCreate;
    handleCreate = async function () {
      const result = await originalHandleCreate.apply(this, arguments);
      if (typeof render === 'function') render();
      return result;
    };
    window.handleCreate = handleCreate;
  }

  if (typeof handleUpdate === 'function') {
    const originalHandleUpdate = handleUpdate;
    handleUpdate = async function () {
      const result = await originalHandleUpdate.apply(this, arguments);
      if (typeof render === 'function') render();
      return result;
    };
    window.handleUpdate = handleUpdate;
  }

  if (typeof deleteBill === 'function') {
    const originalDeleteBill = deleteBill;
    deleteBill = async function () {
      const result = await originalDeleteBill.apply(this, arguments);
      if (typeof render === 'function') render();
      return result;
    };
    window.deleteBill = deleteBill;
  }

  window.showMonthBillsOnly = showMonthBillsOnly;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      fixBillDates();
      if (typeof applyFilters === 'function') applyFilters();
      if (typeof render === 'function') render();
    }, 1500);
  });
})();
