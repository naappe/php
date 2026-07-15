class MobileAppAlgorithm {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl ?? null,
      cacheTTL: config.cacheTTL ?? 300000,
      healthCheckInterval: config.healthCheckInterval ?? 60000
    };

    this.state = {
      status: "starting",
      data: null,
      error: null,
      performanceLogs: [],
      userConsent: config.consent === true,
      networkType: "unknown"
    };

    this.cache = new Map();
    this._healthCheckInterval = null;
    this._requestController = null;
    this._destroyed = false;
  }

  // 1. KINDNESS — consent and user feedback
  hasAnalyticsConsent() {
    return this.state.userConsent;
  }

  setAnalyticsConsent(consent) {
    this.state.userConsent = consent === true;
  }

  safeReadArray(key) {
    try {
      const value = globalThis.localStorage?.getItem(key);
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async gatherUserFeedback() {
    if (!this.hasAnalyticsConsent()) {
      return { consent: false, crashes: [], complaints: [] };
    }

    return {
      consent: true,
      crashes: this.safeReadArray("crashReports"),
      complaints: this.safeReadArray("userComplaints")
    };
  }

  // 2. TIME — measure named tasks without mixing unrelated timings
  measurePerformance(task, startedAt, type = "duration") {
    const entry = {
      task,
      type,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      timestamp: new Date().toISOString(),
      networkType: this.state.networkType
    };

    this.state.performanceLogs.push(entry);
    if (entry.durationMs > 2000) {
      console.warn(`Slow task: ${task} took ${entry.durationMs} ms`);
    }
    return entry;
  }

  getAverageDuration(task) {
    const matches = this.state.performanceLogs.filter(log => log.task === task);
    if (!matches.length) return null;
    return matches.reduce((sum, log) => sum + log.durationMs, 0) / matches.length;
  }

  // 3. HONESTY — show real states and limitations
  showStatus(status, error = null) {
    this.state.status = status;
    this.state.error = error;

    const update = {
      status,
      error: error instanceof Error ? error.message : error ? String(error) : null,
      networkType: this.state.networkType,
      timestamp: new Date().toISOString()
    };

    this.renderStatus(update);
    return update;
  }

  renderStatus(update) {
    console.log(`Status: ${update.status}`);
    if (update.error) console.error(`Error: ${update.error}`);
  }

  detectNetworkType() {
    if (typeof navigator === "undefined") return "unknown";
    if (!navigator.onLine) return "offline";

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    return connection?.effectiveType || "online-unknown";
  }

  showNetworkStatus() {
    this.state.networkType = this.detectNetworkType();
    const labels = {
      "slow-2g": "Slow 2G",
      "2g": "2G",
      "3g": "3G",
      "4g": "4G or better",
      offline: "Offline",
      "online-unknown": "Online (type unavailable)",
      unknown: "Unavailable"
    };
    const label = labels[this.state.networkType] || this.state.networkType;
    console.log(`Network: ${label}`);
    return { type: this.state.networkType, label };
  }

  // 4. DESIGN — render defensively and responsively
  renderUI(data) {
    if (data == null) {
      this.showStatus("No data available");
      return null;
    }
    return this.renderResponsiveLayout(data);
  }

  renderResponsiveLayout(data) {
    const width = globalThis.innerWidth ?? 1024;
    const layout = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
    console.log(`Rendering ${layout} layout`);
    return { data, layout };
  }

  // 5. BUILD — cache, fetch and cancellation
  async readCache(key = "default") {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  async writeCache(data, key = "default") {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }

  async requestData(url = this.config.apiUrl) {
    if (!url) throw new Error("No API URL configured");

    this._requestController?.abort();
    this._requestController = new AbortController();
    const startedAt = performance.now();

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: this._requestController.signal
    });

    this.measurePerformance("Network request", startedAt, "network");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }
    return response.json();
  }

  async fetchFreshData() {
    try {
      const data = await this.requestData();
      if (this._destroyed) return null;
      await this.writeCache(data);
      this.state.data = data;
      this.renderUI(data);
      return data;
    } catch (error) {
      if (error.name !== "AbortError") console.warn("Background refresh failed", error);
      return null;
    }
  }

  async fetchData() {
    const cacheStartedAt = performance.now();
    const cached = await this.readCache();

    if (cached != null) {
      this.measurePerformance("Cache read", cacheStartedAt, "cache");
      void this.fetchFreshData();
      return { data: cached, source: "cache" };
    }

    const data = await this.requestData();
    await this.writeCache(data);
    return { data, source: "network" };
  }

  // 6. TEST — actual assertions; no manufactured passes
  async runUnitTests() {
    const tests = [];
    const test = async (name, assertion) => {
      try {
        await assertion();
        tests.push({ name, pass: true });
      } catch (error) {
        tests.push({ name, pass: false, error: error.message });
      }
    };

    await test("Cache read/write", async () => {
      await this.writeCache({ ok: true }, "unit-test");
      const result = await this.readCache("unit-test");
      this.cache.delete("unit-test");
      if (result?.ok !== true) throw new Error("Cached value did not round-trip");
    });

    await test("Performance measurement", async () => {
      const entry = this.measurePerformance("Unit test", performance.now());
      if (!Number.isFinite(entry.durationMs)) throw new Error("Duration is not numeric");
    });

    await test("Status rendering", async () => {
      const previous = this.state.status;
      const result = this.showStatus("Testing");
      this.state.status = previous;
      if (result.status !== "Testing") throw new Error("Status was not updated");
    });

    return {
      total: tests.length,
      passed: tests.filter(test => test.pass).length,
      failed: tests.filter(test => !test.pass).length,
      details: tests
    };
  }

  runAccessibilityAudit(root = globalThis.document) {
    if (!root) {
      return { status: "not-run", reason: "DOM unavailable" };
    }

    const imagesWithoutAlt = [...root.querySelectorAll("img")]
      .filter(image => !image.hasAttribute("alt")).length;
    const unnamedButtons = [...root.querySelectorAll("button")]
      .filter(button => !button.textContent.trim() && !button.getAttribute("aria-label")).length;
    const inputsWithoutLabels = [...root.querySelectorAll("input, select, textarea")]
      .filter(input => {
        const id = input.id;
        const escapedId = globalThis.CSS?.escape ? CSS.escape(id) : id?.replace(/["\\]/g, "\\$&");
        return !input.getAttribute("aria-label") && !(id && root.querySelector(`label[for="${escapedId}"]`));
      }).length;

    const issues = { imagesWithoutAlt, unnamedButtons, inputsWithoutLabels };
    return {
      status: Object.values(issues).every(count => count === 0) ? "pass" : "issues-found",
      issues
    };
  }

  async runDevelopmentTests() {
    return {
      unit: await this.runUnitTests(),
      accessibility: this.runAccessibilityAudit(),
      integration: {
        status: this.config.apiUrl ? "requires live API test" : "not-run",
        reason: this.config.apiUrl ? null : "No API URL configured"
      }
    };
  }

  // 7. IMPROVE — create evidence-based priorities
  async createImprovementPlan(feedback) {
    const priorities = [];
    if (!feedback.consent) priorities.push("Ask for analytics consent without blocking the app");
    if (feedback.crashes?.length > 5) priorities.push("Investigate repeated crashes");

    const networkAverage = this.getAverageDuration("Network request");
    if (networkAverage != null && networkAverage > 1000) {
      priorities.push(`Reduce average network time (${networkAverage.toFixed(0)} ms)`);
    }

    if (feedback.complaints?.length) {
      const first = feedback.complaints[0];
      priorities.push(`Review user complaint: ${typeof first === "string" ? first : JSON.stringify(first)}`);
    }

    return priorities.map((description, index) => ({
      id: index + 1,
      description,
      priority: index < 2 ? "high" : "medium"
    }));
  }

  async reviewAndImprove() {
    const feedback = await this.gatherUserFeedback();
    const actionItems = await this.createImprovementPlan(feedback);
    return { actionItems, generatedAt: new Date().toISOString() };
  }

  async start() {
    if (this._destroyed) throw new Error("This app instance has been destroyed");
    const startedAt = performance.now();

    try {
      this.showNetworkStatus();
      this.showStatus("Loading");
      const result = await this.fetchData();
      if (this._destroyed) return { status: "destroyed" };

      this.state.data = result.data;
      this.renderUI(result.data);
      this.showStatus("Ready");
      this.measurePerformance("Initial load", startedAt);
      this.scheduleHealthCheck();
      return { ...this.state, source: result.source };
    } catch (error) {
      if (error.name === "AbortError") return { status: "cancelled" };
      this.showStatus("Unable to load data", error);
      return { status: "error", error: error.message };
    }
  }

  scheduleHealthCheck() {
    clearInterval(this._healthCheckInterval);
    this._healthCheckInterval = setInterval(() => this.checkHealth(), this.config.healthCheckInterval);
  }

  checkHealth() {
    this.showNetworkStatus();
    const averageNetworkMs = this.getAverageDuration("Network request");
    return {
      healthy: this.state.status === "Ready" && this.state.networkType !== "offline",
      averageNetworkMs,
      status: this.state.status,
      networkType: this.state.networkType
    };
  }

  destroy() {
    this._destroyed = true;
    clearInterval(this._healthCheckInterval);
    this._healthCheckInterval = null;
    this._requestController?.abort();
    this._requestController = null;
  }
}

// Example — provide a real JSON endpoint before starting:
// const app = new MobileAppAlgorithm({
//   apiUrl: "https://example.com/api/data",
//   consent: false
// });
// await app.start();
// console.log(await app.runDevelopmentTests());

globalThis.MobileAppAlgorithm = MobileAppAlgorithm;
