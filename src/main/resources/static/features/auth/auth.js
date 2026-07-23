/**
 * @file auth.js
 * @module auth
 * @description Authentication Module.
 *              Manages client-side user authentication workflows including tab switching between
 *              login and registration forms, payload validation, asynchronous communication with
 *              the backend REST API (`/api/auth/*`), local storage session persistence, and UI notifications.
 * @requires ../../shared/js/layout.js:injectNavbar
 */

import { injectNavbar } from '../../shared/js/layout.js';

/**
 * Base URL for API requests.
 * @constant {string}
 */
const API_BASE_URL = 'http://localhost:8080/api';

/* ============================================================================
   DOM Element References
   ============================================================================ */

/** @type {HTMLElement} Navigation tab button for switching to the Login view. */
const tabLogin = document.getElementById('tabLogin');

/** @type {HTMLElement} Navigation tab button for switching to the Registration view. */
const tabRegister = document.getElementById('tabRegister');

/** @type {HTMLFormElement} Form element handling user authentication/login. */
const loginForm = document.getElementById('loginForm');

/** @type {HTMLFormElement} Form element handling new user registration. */
const registerForm = document.getElementById('registerForm');

/** @type {HTMLElement} Container element for rendering system alert and message popups. */
const uiMessage = document.getElementById('uiMessage');

/* ============================================================================
   UI Helper Functions
   ============================================================================ */

/**
 * Renders operational status alerts or error messages into the global UI notification area.
 *
 * @param {string} text - The message content to present to the user.
 * @param {boolean} [isError=false] - Toggles between success and error visual styling.
 * @returns {void}
 */
function showMessage(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

/**
 * Toggles UI view states between the login and registration forms.
 * Updates CSS active states and clears ongoing system messages.
 *
 * @param {HTMLElement} activeTab - The tab button to set as active.
 * @param {HTMLElement} inactiveTab - The tab button to set as inactive.
 * @param {HTMLElement} showForm - The form container to make visible.
 * @param {HTMLElement} hideForm - The form container to hide.
 * @returns {void}
 */
function toggleTabs(activeTab, inactiveTab, showForm, hideForm) {
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    showForm.classList.remove('hidden');
    hideForm.classList.add('hidden');
    uiMessage.style.display = 'none';
}

/* ============================================================================
   Event Listeners & Controller Logic
   ============================================================================ */

// Tab navigation listeners
tabLogin.addEventListener('click', () => toggleTabs(tabLogin, tabRegister, loginForm, registerForm));
tabRegister.addEventListener('click', () => toggleTabs(tabRegister, tabLogin, registerForm, loginForm));

/**
 * Event listener for handling Login form submissions.
 * Asynchronously posts user credentials to the authentication endpoint and updates local storage on success.
 *
 * @param {SubmitEvent} e - The native DOM submit event object.
 * @returns {Promise<void>}
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uiMessage.style.display = 'none';

    /**
     * Payload containing trimmed username and plain password.
     * @type {{username: string, password: string}}
     */
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
        
        // Persist session variables in client storage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({ id: data.id, username: data.username, fullName: data.fullName }));

        // Delayed redirect to gallery view
        setTimeout(() => {
            window.location.href = '../gallery/index.html';
        }, 1200);

    } catch (err) {
        console.error('Authentication login error:', err);
        showMessage(`שגיאה: ${err.message}`, true);
    }
});

/**
 * Event listener for handling Registration form submissions.
 * Asynchronously posts new account data to the registration endpoint and authenticates the user upon creation.
 *
 * @param {SubmitEvent} e - The native DOM submit event object.
 * @returns {Promise<void>}
 */
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uiMessage.style.display = 'none';

    /**
     * Payload containing full user registration details.
     * @type {{fullName: string, username: string, email: string, password: string}}
     */
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
        
        // Persist session variables in client storage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({ id: data.id, username: data.username, fullName: data.fullName }));

        // Delayed redirect to gallery view
        setTimeout(() => {
            window.location.href = '../gallery/index.html';
        }, 1200);

    } catch (err) {
        console.error('Authentication registration error:', err);
        showMessage(`שגיאה: ${err.message}`, true);
    }
});

/**
 * Injects shared application layout elements upon DOM readiness.
 */
document.addEventListener('DOMContentLoaded', injectNavbar);