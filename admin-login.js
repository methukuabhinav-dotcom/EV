function togglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeOff = document.querySelector(".eye-off");
  const eyeOn = document.querySelector(".eye-on");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeOff.style.display = "none";
    eyeOn.style.display = "block";
  } else {
    passwordInput.type = "password";
    eyeOff.style.display = "block";
    eyeOn.style.display = "none";
  }
}

function adminLogin() {
  const email = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  const errorEl = document.getElementById("error");
  errorEl.innerText = "";

  // Validation
  if (!email || !password) {
    errorEl.innerText = "Please enter email and password";
    return;
  }

  // Get users from localStorage
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Find admin user
  const admin = users.find(
    u => u.email === email && u.password === password && u.role === "admin"
  );

  if (!admin) {
    errorEl.innerText = "Invalid admin credentials";
    return;
  }

  // Save login session
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("role", "admin");
  localStorage.setItem("userEmail", admin.email);

  // Redirect to admin dashboard
  window.location.href = "admin-dashboard.html";
}

