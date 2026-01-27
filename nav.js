/**
 * NAV.JS
 * Handles dynamic navbar updates based on login status
 */

import { handleLogout } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
});

export function updateNavbar() {
    const isAuth = sessionStorage.getItem("isAuth") === "true";
    const userRole = sessionStorage.getItem("userRole");
    const userName = sessionStorage.getItem("userName") || "User";
    const userInitial = userName.charAt(0).toUpperCase();

    const dashboardLink = document.getElementById("nav-dashboard-link");
    const authContainer = document.getElementById("nav-auth-container");

    if (isAuth) {
        // Show Dashboard link in nav links
        if (dashboardLink) {
            dashboardLink.classList.remove("hidden");
            const dashboardUrl = userRole === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
            dashboardLink.querySelector("a").href = dashboardUrl;
        }

        // Replace Login button with Profile Icon
        if (authContainer) {
            const dashboardUrl = userRole === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
            authContainer.innerHTML = `
                <div class="nav-profile" id="profile-container">
                    <div class="profile-icon">${userInitial}</div>
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div style="padding: 12px 20px; border-bottom: 1px solid #374151;">
                            <p style="margin: 0; font-size: 14px; color: white; font-weight: 600;">${userName}</p>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">${userRole}</p>
                        </div>
                        <a href="${dashboardUrl}">Dashboard</a>
                        <button id="nav-logout-btn" class="logout-item">Logout</button>
                    </div>
                </div>
            `;

            // Setup dropdown toggle logic
            const container = document.getElementById("profile-container");
            const dropdown = document.getElementById("profile-dropdown");
            const logoutBtn = document.getElementById("nav-logout-btn");

            if (container && dropdown) {
                container.addEventListener("click", (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle("show");
                });

                logoutBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    handleLogout();
                });

                // Close dropdown when clicking outside
                document.addEventListener("click", () => {
                    dropdown.classList.remove("show");
                });
            }
        }
    } else {
        // Hide Dashboard link
        if (dashboardLink) {
            dashboardLink.classList.add("hidden");
        }
    }
}

// Make logout available globally for the dropdown button
window.handleLogout = handleLogout;
