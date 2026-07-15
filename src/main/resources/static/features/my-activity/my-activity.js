import { injectNavbar } from '../../shared/js/layout.js';

/**
 * @fileoverview My Activity Controller Module (Screen 5).
 * Precision synced with project architecture styles (.activity-card, #activityGrid).
 * Embedded with deterministic URI safety layers to block loop feedback.
 */

const API_BASE_URL = 'http://localhost:8080/api';

// In-memory runtime data structures
let activityCache = {
    bids: [],
    sales: [],
    wins: [],
    watchlist: []
};

// Explicit DOM target links matching your index.html
let activityGridContainer = null;
let tabButtons = [];

/**
 * Reconstructs the authenticated session metadata.
 */
function getAuthenticatedUser() {
    try {
        const session = localStorage.getItem('currentUser');
        if (!session) return null;
        const parsed = JSON.parse(session);
        return parsed && parsed.id ? parsed : null;
    } catch (error) {
        console.error('Session Extraction Interrupted:', error);
        return null;
    }
}

/**
 * Populates peripheral watch state matrices.
 */
function loadLocalWatchlist() {
    try {
        const payload = localStorage.getItem('user_watchlist') || localStorage.getItem('watchlist') || '[]';
        activityCache.watchlist = JSON.parse(payload);
    } catch (error) {
        activityCache.watchlist = [];
    }
}

/**
 * Formats data timestamps into simple display strings.
 */
function formatDateString(dateString) {
    if (!dateString) return '18:15:00';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
        return '18:15:00';
    }
}

/**
 * Generates card structures compiled using your exact CSS rules (.activity-card).
 * Employs a strict validation pattern to ensure infinite 404 rendering states are impossible.
 */
function createItemCardHTML(item, tabContext) {
    // 100% immune from network asset missing failures
    const secureBase64Fallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    // Fallback detection logic
    const hasValidImage = item.images && item.images.length > 0 && item.images[0].imageUrl;
    const imageUrl = hasValidImage ? item.images[0].imageUrl : secureBase64Fallback;
    const resolvedPrice = item.currentPrice !== undefined ? item.currentPrice : item.startingPrice;

    let badgeClass = 'active';
    let badgeText = 'פעיל';

    if (tabContext === 'wins') {
        badgeClass = 'winning';
        badgeText = 'זכייה במכרז';
    } else if (item.status === 'EXPIRED') {
        badgeClass = 'closed';
        badgeText = 'נסגר';
    }

    return `
        <div class="activity-card" data-id="${item.id}">
            <h3>${item.title || 'מוצר ללא כותרת'}</h3>
            
            ${hasValidImage ? `
            <div class="card-image-wrapper" style="height: 120px; text-align: center; margin-bottom: 10px;">
                <img src="${imageUrl}" alt="Product image" style="max-height: 100%; max-width: 100%; object-fit: contain;"
                     onerror="this.onerror=null; this.src='${secureBase64Fallback}';">
            </div>` : ''}

            <p>מחיר: <strong>${resolvedPrice ? resolvedPrice.toLocaleString() : 0} ש"ח</strong></p>
            <p>סיום: <span>${formatDateString(item.endTime)}</span></p>
            
            <span class="status-badge ${badgeClass}">${badgeText}</span>
            
            <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">צפה בפרטים</a>
        </div>
    `;
}

/**
 * Flushes the isolated container targets cleanly without blowing up external layouts.
 */
function renderGrid(list, tabContext) {
    if (!activityGridContainer) return;

    if (!list || list.length === 0) {
        activityGridContainer.innerHTML = `
            <div class="no-activity-message">
                לא נמצאו רשומות התואמות לקטגוריה זו במסגרת החשבון שלך.
            </div>
        `;
        return;
    }

    activityGridContainer.innerHTML = list.map(item => createItemCardHTML(item, tabContext)).join('');
}

/**
 * Maps triggers directly onto button identities specified inside your index.html
 */
function bindTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            let targetKey = 'bids';
            if (button.id === 'tabSales') targetKey = 'sales';
            if (button.id === 'tabWins') targetKey = 'wins';
            if (button.id === 'tabWatchlist') targetKey = 'watchlist';

            renderGrid(activityCache[targetKey], targetKey);
        });
    });
}

/**
 * Pulls relational matrix configurations straight from ItemController.java
 */
async function fetchUserActivityData() {
    const userSession = getAuthenticatedUser();

    if (!userSession) {
        window.location.href = '../auth/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activity?userId=${userSession.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP transaction breakdown state: ${response.status}`);
        }

        const data = await response.json();

        // Absorb lists returned by Shai's custom Map framework
        activityCache.bids = data.bids || [];
        activityCache.sales = data.sales || [];
        activityCache.wins = data.wins || [];
        
        loadLocalWatchlist();

        // Discover and fall onto whichever button has the 'active' class on page load
        const activeTab = document.querySelector('.activity-tabs .tab-btn.active');
        let initialKey = 'bids';
        if (activeTab) {
            if (activeTab.id === 'tabSales') initialKey = 'sales';
            if (activeTab.id === 'tabWins') initialKey = 'wins';
            if (activeTab.id === 'tabWatchlist') initialKey = 'watchlist';
        }

        renderGrid(activityCache[initialKey], initialKey);

    } catch (error) {
        console.error('Data flow mapping halted:', error);
        if (activityGridContainer) {
            activityGridContainer.innerHTML = `
                <div class="no-activity-message" style="color: red; border-color: red;">
                    תקלה בתקשורת מול השרת בתהליך שליפת הפעילויות שלך.
                </div>
            `;
        }
    }
}

/**
 * Setup hook directly matching explicit element bindings.
 */
document.addEventListener('DOMContentLoaded', () => {
    activityGridContainer = document.getElementById('activityGrid');
    tabButtons = document.querySelectorAll('.activity-tabs .tab-btn');

    injectNavbar();
    bindTabNavigation();
    fetchUserActivityData();
});