Auth.redirectIfLoggedIn();

ThemeManager.init();
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  ThemeManager.apply(next);
});

// Password toggle helpers
function toggleVisibility(inputId, toggleId) {
  document.getElementById(toggleId).addEventListener("click", function () {
    const input = document.getElementById(inputId);
    const icon  = this.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.className = "fas fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fas fa-eye";
    }
  });
}
toggleVisibility("password", "togglePassword");
toggleVisibility("confirmPassword", "toggleConfirm");

// Password strength checker
document.getElementById("password").addEventListener("input", function () {
  const val    = this.value;
  const bar    = document.getElementById("strengthBar");
  const fill   = document.getElementById("strengthFill");
  const label  = document.getElementById("strengthLabel");

  if (!val) { bar.style.display = "none"; return; }
  bar.style.display = "block";

  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: "25%",  cls: "danger",  text: "Weak",   color: "var(--danger)" },
    { pct: "50%",  cls: "warning", text: "Fair",   color: "var(--warning)" },
    { pct: "75%",  cls: "warning", text: "Good",   color: "var(--warning)" },
    { pct: "100%", cls: "",        text: "Strong", color: "var(--success)" },
  ];

  const lvl = levels[score - 1] || levels[0];
  fill.style.width            = lvl.pct;
  fill.style.backgroundColor  = lvl.color;
  label.textContent           = lvl.text;
  label.style.color           = lvl.color;
});

// Register handler
async function handleRegister() {
  UI.clearFieldErrors();
  UI.hideAlert("alertMsg");
  const name            = document.getElementById("name").value.trim();
  const email           = document.getElementById("email").value.trim();
  const password        = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn             = document.getElementById("registerBtn");

  let hasError = false;

  if (!name) {
    UI.showFieldError("name", "Full name is required.");
    hasError = true;
  }
  if (!email) {
    UI.showFieldError("email", "Email is required.");
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    UI.showFieldError("email", "Invalid email format.");
    hasError = true;
  }
  if (!password) {
    UI.showFieldError("password", "Password is required.");
    hasError = true;
  } else if (password.length < 8) {
    UI.showFieldError("password", "Password must be at least 8 characters.");
    hasError = true;
  } else if (!/[A-Z]/.test(password)) {
    UI.showFieldError("password", "Password must contain at least one uppercase letter.");
    hasError = true;
  } else if (!/[0-9]/.test(password)) {
    UI.showFieldError("password", "Password must contain at least one number.");
    hasError = true;
  }

  if (!confirmPassword) {
    UI.showFieldError("confirmPassword", "Please confirm your password.");
    hasError = true;
  } else if (password !== confirmPassword) {
    UI.showFieldError("confirmPassword", "Passwords do not match.");
    hasError = true;
  }
  if (hasError) return;
  UI.setLoading(btn, true);
  try {
    const res = await API.post("/api/auth/register", { name, email, password });
    if (res.success) {
      Auth.setToken(res.data.token);
      Auth.setUser(res.data.user);
      window.location.href = "/pages/dashboard.html";
    } else {
      // Server validation errors
      if (res.errors && res.errors.length) {
        res.errors.forEach(err => {
          UI.showFieldError(err.path, err.msg);
        });
      } else {
        UI.showAlert("alertMsg", res.message || "Registration failed.", "error");
      }
    }
  } catch (err) {
    UI.showAlert("alertMsg", "Something went wrong. Please try again.", "error");
  } finally {
    UI.setLoading(btn, false);
  }
}

document.getElementById("registerBtn").addEventListener("click", handleRegister);
document.getElementById("confirmPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleRegister();
});