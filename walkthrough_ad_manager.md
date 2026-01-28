# Enhanced Ad Manager Walkthrough

This update introduces a robust, industry-standard advertising management system for EV Analytics. Businesses can now manage multiple campaigns, and admins have granular control over where and how ads are displayed.

## 1. Business Dashboard: Multiple Campaigns
Businesses are no longer limited to a single ad. The "Advertising" section has been refactored:
- **Campaign History**: A new table shows all past and current ad requests, their status (Pending, Active, Expired), and payment details.
- **Create New Campaign**: Businesses can submit new ads by entering a title, description, image URL, and target link.
- **Active Ad Management**: If an ad is active or pending, businesses can edit its content or cancel it directly from the dashboard.

## 2. Admin Dashboard: Precision Targeting & Live Preview
The Ad Manager in the Admin Dashboard has been significantly enhanced:
- **Enhanced Review Modal**: When reviewing a pending ad, admins now see a dual-pane interface.
- **Live Preview Simulation**: A "What You See Is What You Get" (WYSIWYG) preview on the right updates in real-time as the admin edits the ad's content.
- **Target Page Selection**: Admins can now choose specific pages where the ad will appear (Home, About, Pricing, Dashboard, Store).
- **Custom Duration**: Admins can set the exact number of days the ad will remain active.
- **One-Click Publishing**: The "Publish & Go Live" button instantly activates the ad on the selected pages and updates the `global_ad` configuration.

## 3. Dynamic Ad Component
A new, lightweight `ad-component.js` powers the frontend experience:
- **Smart Rendering**: The component automatically detects the current page and checks if it matches the admin's targeting criteria.
- **Premium Aesthetics**: Ads are rendered as elegant, animated popups with backdrop blur (glassmorphism), vibrant gradients, and smooth entry/exit transitions.
- **Automatic Expiry**: The component respects the `expiresAt` timestamp, ensuring no expired ads are ever shown to users.
- **Zero-Config Integration**: The component is integrated across all major pages (`index.html`, `about.html`, `pricing.html`, etc.), making it easy to scale the ad network.

## 4. Technical Implementation Details
- **Firestore Schema**: Enhanced `ads_requests` with `targetPages`, `publishedAt`, and `status`.
- **Global Settings**: The `site_settings/global_ad` document acts as the single source of truth for the currently active promotion.
- **Animations**: CSS keyframes (`fadeIn`, `slideUp`, `fadeOut`) provide a high-end feel.
- **Responsiveness**: All new UI elements are fully responsive and work across mobile and desktop.

---
**Ad Manager Status: DEPLOYED & OPTIMIZED**
