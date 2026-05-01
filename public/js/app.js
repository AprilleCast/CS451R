const ThemeManager = {
  init() {
    const saved = localStorage.getItem("theme") || "light";
    this.apply(saved);
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    // Icon update
    const icon = document.getElementById("themeIcon");
    if (icon) {
      icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
  },

  toggle() {
    const current = localStorage.getItem("theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    this.apply(next);
    API.put("/api/user/theme", { theme: next }).catch(() => {});
  },

  async loadFromServer() {
    try {
      const res = await API.get("/api/user/profile");
      if (res.success && res.data.theme_preference) {
        this.apply(res.data.theme_preference);
      }
    } catch (_) {}
  },
};

const Auth = {
  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    localStorage.setItem("token", token);
  },

  setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/login.html";
  },

  requireAuth() {
    if (!this.getToken()) {
      window.location.href = "/pages/login.html";
      return false;
    }
    return true;
  },

  redirectIfLoggedIn() {
    if (this.getToken()) {
      // dashboard redirect removed
    }
  },
};

const API = {
  baseURL: "",
  async request(method, url, body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = Auth.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(this.baseURL + url, options);
    const data = await res.json();

    if (res.status === 401 && data.message?.includes("expired")) {
      Auth.logout();
      return;
    }
    return data;
  },

  get(url)         { return this.request("GET", url); },
  post(url, body)  { return this.request("POST", url, body); },
  put(url, body)   { return this.request("PUT", url, body); },
  delete(url)      { return this.request("DELETE", url); },
};

const UI = {
  // Button loading state
  setLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Please wait...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.original;
    }
  },

  // Alert show/hide
  showAlert(id, message, type = "error") {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.innerHTML = `<i class="fas fa-${type === "error" ? "circle-xmark" : "circle-check"}"></i> ${message}`;
  },

  hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.className = "alert";
  },

  // Field error
  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "Error");
    if (field) field.classList.add("error");
    if (error) { error.textContent = message; error.classList.add("show"); }
  },

  clearFieldErrors() {
    document.querySelectorAll(".form-input.error").forEach(el => el.classList.remove("error"));
    document.querySelectorAll(".form-error.show").forEach(el => el.classList.remove("show"));
  },

  // User initials avatar
  getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  },

  // Format date
  formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  },
};

const Layout = {
  init() {
    // User info
    const user = Auth.getUser();
    if (user) {
      const avatarEl = document.getElementById("userAvatar");
      const nameEl   = document.getElementById("userName");
      if (avatarEl) avatarEl.textContent = UI.getInitials(user.name);
      if (nameEl)   nameEl.textContent   = user.name;
    }

    // Theme init
    ThemeManager.init();
    ThemeManager.loadFromServer();

    // Theme toggle button
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", () => ThemeManager.toggle());

    // Logout
    const logoutBtn = document.querySelector("button#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
      });
    }

    // Mobile sidebar
    const hamburger = document.getElementById("hamburger");
    const sidebar    = document.getElementById("sidebar");
    const overlay    = document.getElementById("sidebarOverlay");
    if (hamburger && sidebar) {
      hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
      });
    }
    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      });
    }

    // User dropdown
    const avatarBtn  = document.getElementById("userAvatar");
    const dropdownEl = document.getElementById("userDropdown");
    if (avatarBtn && dropdownEl) {
      avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownEl.classList.toggle("show");
      });
      document.addEventListener("click", () => dropdownEl.classList.remove("show"));
    }
  },
};
document.addEventListener("DOMContentLoaded", () => Layout.init());