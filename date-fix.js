// Adds safer date fallback behavior without rewriting the existing app.
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

  function improveBillDates() {
    if (typeof state === 'undefined' || !Array.isArray(state.bills)) return;
    state.bills.forEach(bill => {
      const rawDate = firstDateValue(bill);
      if (!bill.Date && rawDate) bill.Date = rawDate;
      bill._dateKey = normalizeToUTCKey(rawDate || bill.Date);
    });
  }

  if (typeof fetchAllBills === 'function') {
    const originalFetchAllBills = fetchAllBills;
    fetchAllBills = async function (...args) {
      const result = await originalFetchAllBills.apply(this, args);
      improveBillDates();
      if (typeof applyFilters === 'function') applyFilters();
      if (typeof render === 'function') render();
      return result;
    };
    window.fetchAllBills = fetchAllBills;
  }

  if (typeof handleCreate === 'function') {
    const originalHandleCreate = handleCreate;
    handleCreate = async function (event) {
      const form = event && event.target;
      const dateInput = form ? form.querySelector('[name="Date"]') : null;
      if (dateInput && !dateInput.value) dateInput.value = getTodayUTC();
      return originalHandleCreate.apply(this, arguments);
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      improveBillDates();
      if (typeof applyFilters === 'function') applyFilters();
      if (typeof render === 'function') render();
    }, 1500);
  });
})();
