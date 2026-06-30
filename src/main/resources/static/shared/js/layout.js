/**
 * Shared Layout Engine - Dynamic Global Navbar
 * Generates navbar links based on authentication state and handles logout events.
 * All comments are strictly in English.
 */

export function requireLogin() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../auth/index.html';
        return false;
    }
    return true;
}

/**
 * Shared Layout Engine - Dynamic Global Navbar
 * Updated to include the "My Activity" link for logged-in users.
 * All comments are strictly in English.
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