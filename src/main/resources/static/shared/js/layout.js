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

export async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    // Check authentication state from localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    let navLinks = '';

    if (isLoggedIn) {
        // Links visible ONLY to logged-in users
        navLinks = `
            <a href="../gallery/index.html">גלריית מכירות</a>
            <a href="../publish-item/index.html">פרסם מוצר חדש</a>
            <span class="user-greeting">שלום, <strong>${currentUser ? currentUser.username : 'משתמש'}</strong></span>
            <button id="logoutBtn" class="nav-logout-btn">התנתק</button>
        `;
    } else {
        // Links visible ONLY to guests / logged-out users
        navLinks = `
            <a href="../gallery/index.html">גלריית מכירות</a>
            <a href="../auth/index.html" class="nav-login-highlight">התחברות / הרשמה</a>
        `;
    }

    // Inject the structured HTML into the placeholder
    placeholder.innerHTML = `
        <nav class="global-navbar">
            <div class="nav-logo" onclick="window.location.href='../gallery/index.html'">AuctionSystem</div>
            <div class="nav-links">
                ${navLinks}
            </div>
        </nav>
    `;

    // Attach event listener for the logout button if it exists on the screen
    if (isLoggedIn) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Clear authentication state data
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                
                // Redirect user back to the authentication screen immediately
                window.location.href = '../auth/index.html';
            });
        }
    }
}