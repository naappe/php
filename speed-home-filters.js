// Faster loading, stronger refresh, and month-first homepage filters.
(function () {
  const AUTO_REFRESH_MS = 45000;
  const FAST_BATCH_SIZE = 8;
  let autoRefreshTimer = null;

  function key(date) {
    return normalizeToUTCKey(date);
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function rangeFor(type) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = today.getDay();
    const weekStart = addDays(today, -day);
    const weekEnd = addDays(weekStart, 6);
    const lastWeekStart = addDays(weekStart, -7);
    const lastWeekEnd = addDays(weekStart, -1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    if (type === 'week') return { fromKey: key(weekStart), toKey: key(weekEnd), label: 'This Week' };
    if (type === 'last-week') return { fromKey: key(lastWeekStart), toKey: key(lastWeekEnd), label: 'Last Week' };
    if (type === 'month') return { fromKey: key(monthStart), toKey: key(today), label: 'This Month' };
    if (type === 'last-month') return { fromKey: key(lastMonthStart), toKey: key(lastMonthEnd), label: 'Last Month' };
    if (type === 'all') return { fromKey: null, toKey: null, label: 'All Time' };
    if (type === 'custom') {
      return {
        fromKey: state.dateRange.from || null,
        toKey: state.dateRange.to || null,
        label: state.dateRange.from && state.dateRange.to ? `${state.dateRange.from} to ${state.dateRange.to}` : 'Custom'
      };
    }
    return { fromKey: key(monthStart), toKey: key(today), label: 'This Month' };
  }

  function setFilterButtons(activeType) {
    const panel = document.querySelector('.date-range-presets');
    if (!panel) return;
    const filters = [
      ['month', 'This Month'],
      ['week', 'This Week'],
      ['last-week', 'Last Week'],
      ['last-month', 'Last Month'],
      ['all', 'All Time'],
      ['custom', 'Custom']
    ];
    panel.innerHTML = filters.map(([type, label]) => (
      `<button class="preset-btn ${type === activeType ? 'active' : ''}" onclick="setDateRange('${type}')">${label}</button>`
    )).join('');
  }

  getDateRangeKeys = function (type) {
    return rangeFor(type);
  };

  filterByDateRange = function (bills) {
    if (!bills || !bills.length) return bills || [];
    if (state.dateRange.type === 'all') return bills;
    const range = rangeFor(state.dateRange.type || 'month');
    const { fromKey, toKey } = range;
    return bills.filter(bill => {
      const dateKey = bill._dateKey || normalizeToUTCKey(bill.Date || bill['Created Date'] || bill['Created'] || bill.created_at);
      if (!dateKey) return false;
      if (fromKey && toKey) return dateKey >= fromKey && dateKey <= toKey;
      if (fromKey) return dateKey >= fromKey;
      if (toKey) return dateKey <= toKey;
      return true;
    });
  };

  setDateRange = function (type) {
    state.dateRange.type = type;
    if (type === 'custom') {
      document.getElementById('customDateRange').style.display = 'flex';
      setFilterButtons('custom');
      return;
    }

    document.getElementById('customDateRange').style.display = 'none';
    setFilterButtons(type);
    const range = rangeFor(type);
    DOM.dateRangeLabel.textContent = range.label;

    if (window.innerWidth < 480 && DOM.dateRangePanel.style.display !== 'none') {
      toggleDateRange();
    }

    applyFilters();
    render();
  };
  window.setDateRange = setDateRange;

  async function fetchFast(forceRefresh = false) {
    if (state.loading) return;
    state.loading = true;

    if (!forceRefresh) {
      const cached = loadFromCache('all_bills');
      if (cached) {
        state.bills = cached.bills || [];
        state.totalAmount = cached.totalAmount || 0;
        state.totalCount = cached.totalCount || state.bills.length;
        state.loaded = true;
        state.usingCache = true;
        state.loading = false;
        state.bills.sort((a, b) => b.id - a.id);
        applyFilters();
        render();
        setTimeout(() => fetchFast(true), 500);
        return;
      }
    }

    showLoading(true, 'Fast loading bills...');
    state.loaded = false;
    state.usingCache = false;
    state.bills = [];
    state.loadedCount = 0;

    try {
      const pageSize = 200;
      const base = `${window.CONFIG.BASE_URL}/api/database/rows/table/${window.CONFIG.TABLE_ID}/?user_field_names=true`;
      const countRes = await fetch(`${base}&size=1`, { headers: getHeaders() });
      if (!countRes.ok) throw new Error('HTTP ' + countRes.status);
      const countData = await countRes.json();
      state.totalCount = countData.count || 0;

      if (!state.totalCount) {
        state.loaded = true;
        state.loading = false;
        showLoading(false);
        render();
        return;
      }

      const totalPages = Math.ceil(state.totalCount / pageSize);
      let allBills = [];
      let loadedPages = 0;

      for (let start = 1; start <= totalPages; start += FAST_BATCH_SIZE) {
        const end = Math.min(start + FAST_BATCH_SIZE - 1, totalPages);
        const requests = [];
        for (let page = start; page <= end; page++) {
          requests.push(
            fetch(`${base}&size=${pageSize}&page=${page}`, { headers: getHeaders() })
              .then(res => res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status)))
              .then(data => data.results || [])
              .catch(() => [])
          );
        }

        const pages = await Promise.all(requests);
        pages.forEach(rows => {
          rows.forEach(row => {
            const rawDate = row.Date || row['Created Date'] || row['Created'] || row.created_at;
            row._dateKey = normalizeToUTCKey(rawDate);
          });
          allBills = allBills.concat(rows);
          loadedPages++;
        });

        state.loadedCount = allBills.length;
        showLoading(true, `Fast loading... ${Math.round((loadedPages / totalPages) * 100)}%`);
      }

      allBills.sort((a, b) => b.id - a.id);
      state.bills = allBills;
      state.totalAmount = allBills.reduce((sum, bill) => sum + (parseFloat(bill.Amount) || 0), 0);
      state.loaded = true;
      state.loading = false;
      saveToCache('all_bills', {
        bills: state.bills,
        totalAmount: state.totalAmount,
        totalCount: state.totalCount
      });
      applyFilters();
      render();
      showLoading(false);
      showMsg(`Loaded ${state.bills.length} bills. Homepage shows ${rangeFor(state.dateRange.type).label}.`, 'success', 3000);
    } catch (error) {
      state.loading = false;
      state.loaded = false;
      showLoading(false);
      showMsg('Error: ' + error.message, 'error');
      render();
    }
  }

  fetchAllBills = fetchFast;
  window.fetchAllBills = fetchFast;

  document.addEventListener('DOMContentLoaded', function () {
    state.dateRange.type = 'month';
    DOM.dateRangeLabel.textContent = 'This Month';
    setFilterButtons('month');

    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(function () {
      if (!state.loading && document.visibilityState === 'visible') fetchFast(true);
    }, AUTO_REFRESH_MS);
  });
})();
