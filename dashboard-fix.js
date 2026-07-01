// Dashboard improvements: clear back button, latest bill, and this month summary.
(function () {
  function getBillDateValue(bill) {
    return bill.Date || bill['Created Date'] || bill['Created'] || bill['Created At'] || bill.created_at || '';
  }

  function billDateKey(bill) {
    return bill._dateKey || normalizeToUTCKey(getBillDateValue(bill));
  }

  function latestBill() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills) || !state.bills.length) return null;
    return [...state.bills].sort((a, b) => {
      const dateA = billDateKey(a) || '';
      const dateB = billDateKey(b) || '';
      if (dateA !== dateB) return dateA < dateB ? 1 : -1;
      return (b.id || 0) - (a.id || 0);
    })[0];
  }

  function thisMonthBills() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills)) return [];
    const start = normalizeToUTCKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const today = getTodayUTC();
    return state.bills.filter(bill => {
      const key = billDateKey(bill);
      return key && key >= start && key <= today;
    });
  }

  function injectFrontSummary() {
    if (typeof state === 'undefined' || !state.loaded || !DOM || !DOM.content) return;
    if (DOM.content.querySelector('.front-summary')) return;

    const latest = latestBill();
    const monthBills = thisMonthBills();
    const monthTotal = monthBills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);

    const latestHtml = latest ? `
      <button class="summary-card latest-card" onclick="viewBill(${latest.id})">
        <span class="summary-label">Latest Bill Added</span>
        <strong>${latest.Vendor || 'Unnamed vendor'}</strong>
        <small>${formatMVR(latest.Amount)} · ${formatBillDate(getBillDateValue(latest))} · #${latest.id}</small>
      </button>
    ` : `
      <div class="summary-card">
        <span class="summary-label">Latest Bill Added</span>
        <strong>No bills yet</strong>
        <small>Add your first bill to see it here.</small>
      </div>
    `;

    const summary = document.createElement('div');
    summary.className = 'front-summary';
    summary.innerHTML = `
      ${latestHtml}
      <div class="summary-card">
        <span class="summary-label">This Month</span>
        <strong>${formatMVR(monthTotal)}</strong>
        <small>${monthBills.length} bills recorded this month</small>
      </div>
    `;

    DOM.content.prepend(summary);
  }

  if (typeof render === 'function') {
    const originalRender = render;
    render = function () {
      originalRender.apply(this, arguments);
      injectFrontSummary();
    };
    window.render = render;
  }

  if (typeof viewBill === 'function') {
    viewBill = function (id) {
      const bill = state.bills.find(b => b.id === id);
      if (!bill) return;
      const dateValue = getBillDateValue(bill);
      const date = formatBillDate(dateValue);

      DOM.content.innerHTML = `
        <div class="detail-view">
          <div class="detail-topbar">
            <button class="btn btn-secondary btn-sm" onclick="render()">Back to Bills</button>
            <span>Bill #${bill.id}</span>
          </div>
          <div class="detail-header">
            <h2>Bill #${bill.id}</h2>
            <div class="detail-actions">
              <button class="btn btn-secondary btn-sm" onclick="openEdit(${bill.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteBill(${bill.id})">Delete</button>
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
              <label>Date / Created Date</label>
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
    };
    window.viewBill = viewBill;
  }
})();
