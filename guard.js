/**
 * GUARD.JS - Route Protection Logic
 */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Protects a page based on authentication and role
 * @param {string} requiredRole - 'admin' or 'user'
 */
export async function protectRoute(requiredRole) {
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

                if (requiredRole && userData.role !== requiredRole) {
                    // Unauthorized role
                    alert("Unauthorized access attempt.");
                    if (userData.role === "admin") {
                        window.location.href = "admin-dashboard.html";
                    } else if (userData.role === "business") {
                        window.location.href = "business-dashboard.html";
                    } else {
                        window.location.href = "user-dashboard.html";
                    }
                    return;
                }

                // Auth and Role verified
                resolve(userData);
            } catch (error) {
                console.error("Guard Error:", error);
                window.location.href = "login.html";
            }
        });
    });
}
