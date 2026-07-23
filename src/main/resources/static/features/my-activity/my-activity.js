/**
 * @file my-activity.js
 * @module my-activity
 * @description User Activity Controller Module.
 *              Manages user activity views, including submitted bids, published listings,
 *              won auctions, and watchlists. Handles asynchronous data fetching from backend APIs,
 *              session storage state persistence for active tabs, image URL normalization,
 *              and dynamic card grid rendering.
 * @requires ../../shared/js/layout.js:injectNavbar
 * @requires ../../shared/js/api.js:getImageUrl
 */

import { injectNavbar } from '../../shared/js/layout.js';
import { getImageUrl } from '../../shared/js/api.js';

/**
 * Base URL for REST API requests.
 * @constant {string}
 */
const API_BASE_URL = 'http://localhost:8080/api';

/* ============================================================================
   Module State Management
   ============================================================================ */

/**
 * In-memory data cache holding activity categories fetched from the server and local storage.
 * @type {{bids: Array<Object>, sales: Array<Object>, wins: Array<Object>, watchlist: Array<Object>}}
 */
let activityCache = {
    bids: [],
    sales: [],
    wins: [],
    watchlist: []
};

/** @type {HTMLElement|null} Container node where activity card grids are rendered. */
let activityGridContainer = null;

/** @type {Array<HTMLButtonElement>} Collection of tab button elements for switching views. */
let tabButtons = [];

/* ============================================================================
   Authentication & Data Fetching Helpers
   ============================================================================ */

/**
 * Retrieves and validates the authenticated user session object from `localStorage`.
 *
 * @returns {{id: (number|string), username: string, fullName: string}|null} Authenticated user session or `null` if invalid/absent.
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
 * Reads bookmarked item IDs from `localStorage` (`user_watchlist`) and performs a batch 
 * fetch to retrieve full item entities for the watchlist cache.
 *
 * @async
 * @returns {Promise<void>}
 */
async function loadLocalWatchlist() {
    try {
        const ids = JSON.parse(localStorage.getItem('user_watchlist') || '[]');
        if (ids.length === 0) { 
            activityCache.watchlist = []; 
            return; 
        }
        const response = await fetch(`${API_BASE_URL}/items/batch?ids=${ids.join(',')}`);
        activityCache.watchlist = response.ok ? await response.json() : [];
    } catch (error) {
        activityCache.watchlist = [];
    }
}

/**
 * Formats ISO 8601 or date-parseable strings into a full date and time string (`DD/MM/YYYY, HH:MM`) using Hebrew locale conventions.
 *
 * @param {string} dateString - Target date string to format.
 * @returns {string} Formatted date and time string or fallback string on parsing errors.
 */
function formatDateString(dateString) {
    if (!dateString) return '--/--/---- --:--';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

/* ============================================================================
   UI Component Renderers & Grid Controllers
   ============================================================================ */

/**
 * Constructs an HTML card string for an individual item based on its status and active tab context.
 *
 * @param {Object} item - Item object containing listing details.
 * @param {number|string} item.id - Unique item ID.
 * @param {string} [item.title] - Item title.
 * @param {number} [item.currentPrice] - Current highest bid.
 * @param {number} [item.startingPrice] - Initial starting price.
 * @param {string} [item.endTime] - Auction end date string.
 * @param {string} [item.status] - Listing status indicator (e.g., 'SOLD', 'ACTIVE').
 * @param {Array<{imageUrl: string}>} [item.images] - Media assets array.
 * @param {string} tabContext - The active context identifier ('bids', 'sales', 'wins', or 'watchlist').
 * @returns {string} HTML string representing the item card component.
 */
function createItemCardHTML(item, tabContext) {
    const secureBase64Fallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    const hasImage = item.images && item.images.length > 0 && item.images[0].imageUrl;
    const imageUrl = hasImage ? getImageUrl(item.images[0].imageUrl) : secureBase64Fallback;
    const resolvedPrice = item.currentPrice !== undefined ? item.currentPrice : item.startingPrice;

    let badgeClass = 'active';
    let badgeText = 'פעיל';

    if (tabContext === 'wins') {
        badgeClass = 'winning';
        badgeText = 'זכייה במכרז';
    } else if (item.status === 'SOLD' || new Date(item.endTime) < new Date()) {
        badgeClass = 'closed';
        badgeText = 'נסגר';
    }

    return `
        <div class="activity-card" data-id="${item.id}">
            <h3>${item.title || 'מוצר ללא כותרת'}</h3>
            
            ${hasImage ? `
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
 * Clears and populates the main activity grid container with item cards or an empty state warning.
 *
 * @param {Array<Object>} list - Collection of item entities to render.
 * @param {string} tabContext - Context string identifying current active tab category.
 * @returns {void}
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

/* ============================================================================
   Tab Navigation & State Persistence
   ============================================================================ */

/**
 * Restores visual active state on tab buttons based on key saved in `sessionStorage`.
 *
 * @returns {void}
 */
function restoreActiveTab() {
    const savedTabId = sessionStorage.getItem('activeActivityTab');
    if (savedTabId) {
        const targetTab = document.getElementById(savedTabId);
        if (targetTab) {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            targetTab.classList.add('active');
        }
    }
}

/**
 * Binds event listeners to tab navigation buttons and commits active selection changes to `sessionStorage`.
 *
 * @returns {void}
 */
function bindTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Persist selected tab ID in session storage
            sessionStorage.setItem('activeActivityTab', button.id);

            let targetKey = 'bids';
            if (button.id === 'tabSales') targetKey = 'sales';
            if (button.id === 'tabWins') targetKey = 'wins';
            if (button.id === 'tabWatchlist') targetKey = 'watchlist';

            renderGrid(activityCache[targetKey], targetKey);
        });
    });
}

/* ============================================================================
   Data Synchronization & Lifecycle Orchestration
   ============================================================================ */

/**
 * Asynchronously retrieves user activity datasets (`bids`, `sales`, `wins`) from backend API,
 * loads local watchlists, and triggers initial grid rendering based on active tab state.
 *
 * @async
 * @returns {Promise<void>}
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

        // Assign response arrays to internal cache
        activityCache.bids = data.bids || [];
        activityCache.sales = data.sales || [];
        activityCache.wins = data.wins || [];
        
        await loadLocalWatchlist();

        // Identify currently active tab button to resolve initial key
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

/* ============================================================================
   DOM Initialization
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    activityGridContainer = document.getElementById('activityGrid');
    tabButtons = document.querySelectorAll('.activity-tabs .tab-btn');

    restoreActiveTab();
    injectNavbar();
    bindTabNavigation();
    fetchUserActivityData();
});