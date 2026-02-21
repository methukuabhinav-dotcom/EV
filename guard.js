/**
 * GUARD.JS - Route Protection Logic
 */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Protects a page based on authentication, role, and subscription plan
 * @param {string} requiredRole - 'admin' or 'user'
 * @param {Array<string>} allowedPlans - Optional: ['Standard', 'Premium']
 */
export async function protectRoute(requiredRole, allowedPlans = []) {
    // Connection Check
    if (!auth || !db) {
        console.error("❌ Firebase SDK not initialized. Routing blocked.");
        return;
    }
    console.log("🛠️ Guard checking authentication state...");

    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            const loginTime = sessionStorage.getItem("loginTime");
            const now = Date.now();
            const TIMEOUT = 30 * 60000;

            if (!user || (loginTime && (now - parseInt(loginTime)) > TIMEOUT)) {
                // Not logged in or session expired
                sessionStorage.clear();
                window.location.href = "login.html";
                return;
            }

            try {
                // Fetch role from Firestore to ensure security
                const userDoc = await getDoc(doc(db, "users", user.uid));

                if (!userDoc.exists()) {
                    window.location.href = "login.html";
                    return;
                }

                const userData = userDoc.data();

                // 1. Role Check
                if (requiredRole && userData.role !== requiredRole) {
                    // Unauthorized role
                    alert("Unauthorized access attempt. Incorrect Role.");
                    if (userData.role === "admin") {
                        window.location.href = "admin-dashboard.html";
                    } else if (userData.role === "business") {
                        window.location.href = "business-dashboard.html";
                    } else {
                        window.location.href = "user-dashboard.html";
                    }
                    return;
                }

                // 2. Plan Check (if allowedPlans provided)
                if (allowedPlans && allowedPlans.length > 0) {
                    const userPlan = userData.plan || 'Free'; // Default to Free if undefined
                    if (!allowedPlans.includes(userPlan)) {
                        alert(`Access Restricted. This page requires a ${allowedPlans.join(" or ")} plan.`);
                        window.location.href = "index.html#pricing"; // Redirect to pricing or home
                        return;
                    }
                }

                // Auth, Role, and Plan verified
                resolve(userData);
            } catch (error) {
                console.error("Guard Error:", error);
                window.location.href = "login.html";
            }
        });
    });
}
