import { injectNavbar } from '../../shared/js/layout.js';

/**
 * @fileoverview Authentication Controller Module (Screen 1).
 * Handles user login and registration by communicating with UserController.java.
 * Synchronized with the exact DOM elements defined in auth.html.
 * @requires ../../shared/js/layout.js:injectNavbar
 */

const API_BASE_URL = 'http://localhost:8080/api';

// UI DOM Element References
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const uiMessage = document.getElementById('uiMessage');

/**
 * Renders operational alerts or error logs into the global UI notification area.
 * @param {string} text - Message copy to display.
 * @param {boolean} [isError=false] - Conditional styling toggle.
 */
function showMessage(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

/**
 * Manages view states when toggling between login and registration form layouts.
 */
function toggleTabs(activeTab, inactiveTab, showForm, hideForm) {
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    showForm.classList.remove('hidden');
    hideForm.classList.add('hidden');
    uiMessage.style.display = 'none';
}

tabLogin.addEventListener('click', () => toggleTabs(tabLogin, tabRegister, loginForm, registerForm));
tabRegister.addEventListener('click', () => toggleTabs(tabRegister, tabLogin, registerForm, loginForm));

/**
 * Event Listener tracking Login Form submissions against Shai's backend /api/auth/login map keys.
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uiMessage.style.display = 'none';

    const payload = {
        username: document.getElementById('loginUsername').value.trim(),
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'התחברות נכשלה');
        }

        showMessage('התחברות בוצעה בהצלחה! מנתב לגלריה...');
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({ id: data.id, username: data.username, fullName: data.fullName }));

        setTimeout(() => {
            window.location.href = '../gallery/index.html';
        }, 1200);

    } catch (err) {
        console.error('Authentication login error:', err);
        showMessage(`שגיאה: ${err.message}`, true);
    }
});

/**
 * Event Listener tracking Registration submissions against Shai's backend /api/auth/register map keys.
 */
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uiMessage.style.display = 'none';

    // Synchronized with exact input IDs from auth.html (regName, regUsername, regEmail, regPassword)
    const payload = {
        fullName: document.getElementById('regName').value.trim(),
        username: document.getElementById('regUsername').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'הרשמה נכשלה');
        }

        showMessage('החשבון נוצר בהצלחה! מבצע התחברות...');
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({ id: data.id, username: data.username, fullName: data.fullName }));

        setTimeout(() => {
            window.location.href = '../gallery/index.html';
        }, 1200);

    } catch (err) {
        console.error('Authentication registration error:', err);
        showMessage(`שגיאה: ${err.message}`, true);
    }
});

document.addEventListener('DOMContentLoaded', injectNavbar);