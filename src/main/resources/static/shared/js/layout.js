/**
 * ============================================================================
 * Shared Layout Engine & Navigation Manager
 * ============================================================================
 *
 * @file layout.js
 * @module shared/layout
 * @description Shared layout engine module. Provides client-side route protection
 *              guards (`requireLogin`) and dynamic navbar injection (`injectNavbar`)
 *              that adapts navigation links based on user authentication state in `localStorage`.
 */

/* ============================================================================
   1. Route Protection & Auth Guards
   ============================================================================ */

/**
 * Asserts user authentication status via `localStorage`.
 * If the user is unauthenticated, redirects the browser to the authentication view (`../auth/index.html`).
 *
 * @function requireLogin
 * @returns {boolean} Returns `true` if the session is authenticated; otherwise redirects and returns `false`.
 */
export function requireLogin() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../auth/index.html';
        return false;
    }
    return true;
}

/* ============================================================================
   2. Dynamic Layout Injection Services
   ============================================================================ */

/**
 * Dynamically builds and injects the global navigation header into `#navbar-placeholder`.
 * Renders user greeting, activity links, and logout controls for authenticated users,
 * or login/registration prompts for guest users. Attaches session termination event listeners.
 *
 * @async
 * @function injectNavbar
 * @returns {Promise<void>}
 */
export async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    let navLinks = '';

    if (isLoggedIn) {
        navLinks = `
            <a href="../gallery/index.html">גלריית מכירות</a>
            <a href="../publish-item/index.html">פרסם מוצר חדש</a>
            <a href="../my-activity/index.html">הפעילות שלי</a>
            <span class="user-greeting">שלום, <strong>${currentUser ? currentUser.username : 'משתמש'}</strong></span>
            <button id="logoutBtn" class="nav-logout-btn">התנתק</button>
        `;
    } else {
        navLinks = `
            <a href="../gallery/index.html">גלריית מכירות</a>
            <a href="../auth/index.html" class="nav-login-highlight">התחברות / הרשמה</a>
        `;
    }

    placeholder.innerHTML = `
        <nav class="global-navbar">
            <div class="nav-logo" onclick="window.location.href='../gallery/index.html'">AuctionSystem</div>
            <div class="nav-links">
                ${navLinks}
            </div>
        </nav>
    `;

    if (isLoggedIn) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                window.location.href = '../auth/index.html';
            });
        }
    }
}