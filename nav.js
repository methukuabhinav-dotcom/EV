/**
 * NAV.JS
 * Handles dynamic navbar updates based on login status
 */

import { handleLogout } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();

    // ── Hamburger menu toggle ──
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navLinks = document.getElementById("nav-links");

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener("click", () => {
            hamburgerBtn.classList.toggle("open");
            navLinks.classList.toggle("open");
        });

        // Close menu when any nav link is clicked
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                hamburgerBtn.classList.remove("open");
                navLinks.classList.remove("open");
            });
        });
    }
});

export function updateNavbar() {
    const isAuth = sessionStorage.getItem("isAuth") === "true";
    const userRole = sessionStorage.getItem("userRole");
    const userName = sessionStorage.getItem("userName") || "User";
    const userInitial = userName.charAt(0).toUpperCase();

    const dashboardLink = document.getElementById("nav-dashboard-link");
    const authContainer = document.getElementById("nav-auth-container");

    if (isAuth) {
        // Show Dashboard link but handle locking
        if (dashboardLink) {
            dashboardLink.classList.remove("hidden");
            const dashboardUrl = userRole === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
            dashboardLink.querySelector("a").href = dashboardUrl;
        }

        // --- NAVIGATION LOCKING LOGIC ---
        const mlLink = document.querySelector('a[href="ml_models.html"]');
        const dashLinkAnchor = dashboardLink ? dashboardLink.querySelector("a") : null;
        const userPlan = sessionStorage.getItem("userPlan");

        // Helper to lock a link
        const lockLink = (linkElement) => {
            if (!linkElement) return;
            linkElement.classList.add('nav-locked');
            linkElement.innerHTML += ' <span style="font-size:12px">🔒</span>';
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                alert("🔒 This feature is locked. Please upgrade your plan to access.");
            });
        };

        // Reset locks (in case of page reload/state change on SPA)
        if (mlLink) mlLink.classList.remove('nav-locked');
        if (dashLinkAnchor) dashLinkAnchor.classList.remove('nav-locked');

        if (userRole === 'user') {
            // Flexible check for plan names (handles "Standard", "Standard Plan", etc.)
            if (userPlan && userPlan.includes('Standard')) {
                // Unlock Dashboard, Lock ML
                if (mlLink) lockLink(mlLink);
            } else if (userPlan && userPlan.includes('Premium')) {
                // Unlock All - Do nothing
            } else {
                // Free/No Plan - Lock Both
                if (dashLinkAnchor) lockLink(dashLinkAnchor);
                if (mlLink) lockLink(mlLink);
            }
        }
        // --------------------------------

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

    // Footer Dashboard Link Logic
    const footerDashboardLink = document.getElementById("footer-dashboard-link");
    if (footerDashboardLink) {
        if (isAuth) {
            let targetUrl = "user-dashboard.html";
            if (userRole === "admin") targetUrl = "admin-dashboard.html";
            else if (userRole === "business") targetUrl = "business-dashboard.html";

            footerDashboardLink.href = targetUrl;
        } else {
            footerDashboardLink.href = "login.html";
        }
    }
}

// Inject CSS for Locked State
const style = document.createElement('style');
style.innerHTML = `
  .nav-locked {
    opacity: 0.6;
    cursor: not-allowed !important;
    pointer-events: auto; /* Ensure click event fires for alert */
  }
  .nav-locked:hover {
    color: #cbd5f5 !important; /* Prevent hover color change */
  }
`;
document.head.appendChild(style);

// Make logout available globally for the dropdown button
window.handleLogout = handleLogout;
