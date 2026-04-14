Auth.redirectIfLoggedIn();

// Password show/hide
document.getElementById("togglePassword").addEventListener("click", function () {
  const input = document.getElementById("password");
  const icon  = this.querySelector("i");
  if (input.type === "password") {
    input.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    input.type = "password";
    icon.className = "fas fa-eye";
  }
});

// Enter key submit
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
document.getElementById("email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

// Login handler
async function handleLogin() {
  UI.clearFieldErrors();
  UI.hideAlert("alertMsg");

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("loginBtn");

  // Client-side validation
  let hasError = false;

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
  }

  if (hasError) return;

  // API call
  UI.setLoading(btn, true);

  try {
    const res = await API.post("/api/auth/login", { email, password });

    if (res.success) {
      Auth.setToken(res.data.token);
      Auth.setUser(res.data.user);
      window.location.href = "/pages/dashboard.html";
      
    } else {
      UI.showAlert("alertMsg", res.message || "Login failed.", "error");
    }
  }catch (err) {
  console.error("LOGIN ERROR:", err);
  UI.showAlert("alertMsg", err.message || "Something went wrong.", "error");

  } finally {
    UI.setLoading(btn, false);
  }
}

document.getElementById("loginBtn").addEventListener("click", handleLogin);