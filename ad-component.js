import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * AD-COMPONENT.JS
 * Dynamically renders the active promotion on selected pages.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Determine current page name
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    
    // Map page filenames to logical names used in Admin Dashboard
    const pageMap = {
        "index.html": "Home",
        "about.html": "About",
        "pricing.html": "Pricing",
        "user-dashboard.html": "Dashboard",
        "vehicle-selection.html": "Store"
    };

    const currentPageName = pageMap[page] || "Other";

    try {
        const snap = await getDoc(doc(db, "site_settings", "global_ad"));
        if (snap.exists()) {
            const ad = snap.data();
            const now = new Date();
            
            // 2. Check Expiry and Target Pages
            const expiry = ad.expiresAt?.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
            const isTargetPage = ad.targetPages && ad.targetPages.includes(currentPageName);

            if (expiry > now && isTargetPage) {
                renderAdPopup(ad);
            }
        }
    } catch (e) {
        console.error("Ad retrieval failed", e);
    }
});

function renderAdPopup(ad) {
    // Create Modal Element
    const modal = document.createElement("div");
    modal.id = "dynamicAdModal";
    modal.className = "ad-modal-overlay";
    
    modal.innerHTML = `
        <div class="ad-modal-content">
            <button class="ad-close-btn">&times;</button>
            <div class="ad-badge">Featured Partner</div>
            <div class="ad-body">
                <div class="ad-image-container">
                    <img src="${ad.imageUrl || 'https://via.placeholder.com/600x400'}" alt="Promotion">
                </div>
                <div class="ad-text-container">
                    <h2 class="ad-title">${ad.title || 'Special Offer'}</h2>
                    <p class="ad-desc">${ad.description || 'Check out the latest from our partner.'}</p>
                    <a href="${ad.targetLink || '#'}" class="ad-cta-btn">Learn More</a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Style the modal (Injecting CSS directly for portability)
    const style = document.createElement("style");
    style.textContent = `
        .ad-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.4s ease;
        }
        .ad-modal-content {
            background: #111827;
            border: 1px solid #374151;
            border-radius: 24px;
            max-width: 600px;
            width: 90%;
            position: relative;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ad-close-btn {
            position: absolute;
            top: 20px; right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            font-size: 24px;
            width: 40px; height: 40px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.3s;
        }
        .ad-close-btn:hover { background: #ef4444; }
        .ad-badge {
            position: absolute;
            top: 20px; left: 20px;
            background: #6366f1;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            z-index: 5;
        }
        .ad-image-container img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-bottom: 2px solid #6366f1;
        }
        .ad-text-container {
            padding: 30px;
            text-align: center;
        }
        .ad-title {
            color: white;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 12px;
        }
        .ad-desc {
            color: #9ca3af;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .ad-cta-btn {
            display: inline-block;
            background: linear-gradient(90deg, #6366f1, #3b82f6);
            color: white;
            padding: 14px 40px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .ad-cta-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
        }
        .fade-out {
            animation: fadeOut 0.4s forwards;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp { 
            from { transform: translateY(50px) scale(0.9); opacity: 0; } 
            to { transform: translateY(0) scale(1); opacity: 1; } 
        }
    `;
    document.head.appendChild(style);

    // Close logic
    modal.querySelector(".ad-close-btn").onclick = () => {
        modal.classList.add("fade-out");
        setTimeout(() => modal.remove(), 400);
    };

    // Auto-close overlay click
    modal.onclick = (e) => {
        if (e.target === modal) modal.querySelector(".ad-close-btn").click();
    };
}
