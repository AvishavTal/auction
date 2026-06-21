import { injectNavbar } from '../../shared/js/layout.js';

const API_BASE_URL = 'http://localhost:8080/api';

const tabLogin     = document.getElementById('tabLogin');
const tabRegister  = document.getElementById('tabRegister');
const loginForm    = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const uiMessage    = document.getElementById('uiMessage');

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

tabLogin.addEventListener('click', () => toggleTabs(tabLogin, tabRegister, loginForm, registerForm));
tabRegister.addEventListener('click', () => toggleTabs(tabRegister, tabLogin, registerForm, loginForm));

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(data));
        showMessage('התחברות בוצעה בהצלחה! מנתב לגלריה...');
        setTimeout(() => { window.location.href = '../gallery/index.html'; }, 1200);
    } catch (err) {
        showMessage(err.message, true);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: document.getElementById('regName').value,
                username: document.getElementById('regUsername').value,
                email:    document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(data));
        showMessage('החשבון נוצר בהצלחה! מבצע התחברות...');
        setTimeout(() => { window.location.href = '../gallery/index.html'; }, 1200);
    } catch (err) {
        showMessage(err.message, true);
    }
});

document.addEventListener('DOMContentLoaded', injectNavbar);
