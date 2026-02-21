/**
 * AUTH.JS - Firebase Implementation
 * Handles Role-Based Signup, Login, and Session Management
 */

import { auth, db } from "./firebase-config.js";

// --- CONFIG ---
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINS = 15;
const SESSION_TIMEOUT_MINS = 30;

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- UTILITIES ---

window.togglePassword = (inputId) => {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
  }
};

window.checkRoleWarning = () => {
  const role = document.getElementById("role").value;
  const warning = document.getElementById("role-warning");
  if (warning) {
    warning.style.display = role === "admin" ? "block" : "none";
  }
};

function clearErrors() {
  document.querySelectorAll(".error-msg").forEach(el => el.innerText = "");
  const mainMsg = document.getElementById("form-message");
  if (mainMsg) {
    mainMsg.innerText = "";
    mainMsg.className = "main-msg";
  }
}

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner");

  btn.disabled = isLoading;
  if (text) text.style.display = isLoading ? "none" : "block";
  if (spinner) spinner.style.display = isLoading ? "block" : "none";
}

// --- SIGNUP LOGIC ---

export const handleSignup = window.handleSignup = async () => {
  clearErrors();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const role = "user"; // Default role
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  let hasError = false;

  if (!name) {
    document.getElementById("name-error").innerText = "Full Name is required";
    hasError = true;
  }
  if (!email) {
    document.getElementById("email-error").innerText = "Email is required";
    hasError = true;
  }

  if (password.length < 8) {
    document.getElementById("password-error").innerText = "Minimum 8 characters required";
    hasError = true;
  }
  if (password !== confirmPassword) {
    document.getElementById("confirm-password-error").innerText = "Passwords do not match";
    hasError = true;
  }

  if (hasError) return;

  setLoading("signup-btn", true);

  try {
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Store Role & Data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      fullName: name,
      email: email,
      role: role,
      createdAt: serverTimestamp(),
      loginCount: 0,
      totalTimeSpent: 0,
      lastLogin: null,
      status: 'Inactive'
    });

    const mainMsg = document.getElementById("form-message");
    mainMsg.innerText = "Registration successful! Redirecting...";
    mainMsg.className = "main-msg success";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);

  } catch (error) {
    console.error("Signup Error:", error);
    let msg = "Signup failed. Please try again.";
    if (error.code === "auth/email-already-in-use") msg = "Email already in use.";

    document.getElementById("form-message").innerText = msg;
    document.getElementById("form-message").className = "main-msg error";
    setLoading("signup-btn", false);
  }
};

// --- LOGIN LOGIC ---

export const handleLogin = window.handleLogin = async () => {
  clearErrors();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  // 0. Simulation: Login Throttling
  let attempts = JSON.parse(localStorage.getItem(`loginAttempts_${email}`)) || { count: 0, lastTry: 0 };
  const now = Date.now();

  if (attempts.count >= MAX_ATTEMPTS && (now - attempts.lastTry) < LOCKOUT_MINS * 60000) {
    const wait = Math.ceil((LOCKOUT_MINS * 60000 - (now - attempts.lastTry)) / 60000);
    document.getElementById("form-message").innerText = `Too many attempts. Try again in ${wait} mins.`;
    document.getElementById("form-message").className = "main-msg error";
    return;
  }

  setLoading("login-btn", true);

  try {
    // 1. Firebase Auth Login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Fetch & Verify Role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }

    const userData = userDoc.data();
    const role = userData.role; // Get role from Firestore


    // Success: Reset attempts
    localStorage.removeItem(`loginAttempts_${email}`);

    // 4. Update Analytics & Create Session
    const loginTimestamp = Date.now();
    await updateDoc(doc(db, "users", user.uid), {
      loginCount: increment(1),
      lastLogin: serverTimestamp(),
      status: 'Active'
    });

    const sessionRef = await addDoc(collection(db, "sessions"), {
      uid: user.uid,
      userName: userData.fullName,
      userEmail: userData.email,
      loginTime: serverTimestamp(),
      logoutTime: null,
      duration: 0,
      status: 'active'
    });

    // 5. Set Session State
    sessionStorage.setItem("isAuth", "true");
    sessionStorage.setItem("userRole", userData.role);
    sessionStorage.setItem("userPlan", userData.plan || 'Free'); // Store Plan
    sessionStorage.setItem("userName", userData.fullName);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("uid", user.uid);
    sessionStorage.setItem("loginTime", loginTimestamp);
    sessionStorage.setItem("sessionId", sessionRef.id);

    // Redirect
    if (userData.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (userData.role === "business") {
      window.location.href = "business-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }

  } catch (error) {
    console.error("Login Error:", error);

    // Increment attempts on standard auth failures
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      attempts.count++;
      attempts.lastTry = Date.now();
      localStorage.setItem(`loginAttempts_${email}`, JSON.stringify(attempts));
    }

    let msg = "Invalid credentials or system error.";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      msg = "Invalid email or password.";
    } else if (error.message.includes("Admin") || error.message.includes("User access denied")) {
      msg = error.message;
    }

    document.getElementById("form-message").innerText = msg;
    document.getElementById("form-message").className = "main-msg error";
    setLoading("login-btn", false);
  }
};

// --- GLOBAL LOGOUT ---
export const handleLogout = window.handleLogout = async () => {
  try {
    const uid = sessionStorage.getItem("uid");
    const sessionId = sessionStorage.getItem("sessionId");
    const loginTime = parseInt(sessionStorage.getItem("loginTime"));

    if (uid && sessionId) {
      const logoutTime = Date.now();
      const duration = logoutTime - loginTime; // ms

      // 1. Update Session Record
      await updateDoc(doc(db, "sessions", sessionId), {
        logoutTime: serverTimestamp(),
        duration: duration,
        status: 'completed'
      });

      // 2. Update User Total Time & Status
      await updateDoc(doc(db, "users", uid), {
        totalTimeSpent: increment(duration),
        status: 'Inactive'
      });
    }

    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout Error:", error);
    // Even if firestore update fails, try to sign out
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "login.html";
  }
};
