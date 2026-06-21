import { injectNavbar } from '../../shared/js/layout.js';

/**
 * Logic for Screen 1: Authentication (Login / Registration)
 * Features client-side mocking for testing flow control.
 * All comments are strictly in English.
 */

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const uiMessage = document.getElementById('uiMessage');

function showMessage(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

function toggleTabs(activeTab, inactiveTab, showForm, hideForm) {
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    showForm.classList.remove('hidden');
    hideForm.classList.add('hidden');
    uiMessage.style.display = 'none';
}

// Tab click listeners
tabLogin.addEventListener('click', () => toggleTabs(tabLogin, tabRegister, loginForm, registerForm));
tabRegister.addEventListener('click', () => toggleTabs(tabRegister, tabLogin, registerForm, loginForm));

/**
 * Mock Login Submit Handler
 */
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    
    showMessage('התחברות בוצעה בהצלחה! מנתב לגלריה...');
    
    // Set mock user metadata state in storage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, username: username }));

    setTimeout(() => {
        window.location.href = '../gallery/index.html';
    }, 1200);
});

/**
 * Mock Registration Submit Handler
 */
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;

    showMessage('החשבון נוצר בהצלחה! מבצע התחברות...');
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, username: username }));

    setTimeout(() => {
        window.location.href = '../gallery/index.html';
    }, 1200);
});

// Initialize shared layout components
document.addEventListener('DOMContentLoaded', injectNavbar);