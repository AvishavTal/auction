import { injectNavbar } from '../../shared/js/layout.js';
import { getItemById, placeBid, getImageUrl } from '../../shared/js/api.js';

/**
 * @fileoverview Controller module for Screen 3 (Item Details, Live Bidding, and Watchlist).
 * Tracks dynamic bidding transactions and synchronizes local identities dynamic contexts.
 * Fully refactored to terminate static simulation metadata payloads securely.
 * @requires ../../shared/js/layout.js:injectNavbar
 * @requires ../../shared/js/api.js:getItemById
 * @requires ../../shared/js/api.js:placeBid
 * @requires ../../shared/js/api.js:getImageUrl
 */

// ==========================================
// UI DOM Element References
// ==========================================
const uiMessage = document.getElementById('uiMessage');
const submitBidBtn = document.getElementById('submitBidBtn');
const bidForm = document.getElementById('bidForm');
const watchlistBtn = document.getElementById('watchlistBtn');

// ==========================================
// Module State Management
// ==========================================
/** @type {Object|null} Stores the active product entity retrieved from the backend. */
let currentItem = null;

/** @type {number|null} Reference ID for the countdown interval loop to prevent memory leaks. */
let countdownInterval = null;

// ==========================================
// Core Functions & Business Logic
// ==========================================

/**
 * Displays status alerts or operational error messages to the end-user.
 * @param {string} text - The informative message or error description to render.
 * @param {boolean} [isError=false] - If true, applies error styling; otherwise applies success styling.
 * @returns {void}
 */
function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

/**
 * Extracts the target product ID directly from the active URL query string parameters.
 * URL pattern expected: /item.html?id=XYZ
 * @returns {string|null} The product identifier string, or null if the parameter is absent.
 */
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Calculates remaining time against the target timestamp and updates the UI countdown ticker.
 * Automatically locks the bidding interface immediately upon auction expiration.
 * @param {string} endTimeStr - ISO 8601 compliant datetime string indicating when the auction terminates.
 * @returns {void}
 */
function updateTimer(endTimeStr) {
    const endTime = new Date(endTimeStr).getTime();
    const now = new Date().getTime();
    const diff = endTime - now;
    const timerDisplay = document.getElementById('countdown');

    if (diff <= 0) {
        timerDisplay.textContent = "המכרז נסגר";
        if (submitBidBtn) submitBidBtn.disabled = true;
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        return;
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Evaluates item presence in local storage watchlist and updates the visual state of the trigger button.
 * @param {number|string} itemId - The unique identifier of the active item.
 * @returns {void}
 */
function renderWatchlistButton(itemId) {
    const watchlist = JSON.parse(localStorage.getItem('user_watchlist')) || [];
    const isWatched = watchlist.includes(String(itemId));
    
    if (isWatched) {
        watchlistBtn.textContent = '❌ הסר מרשימת מעקב';
        watchlistBtn.classList.add('watching');
    } else {
        watchlistBtn.textContent = '⭐ הוסף לרשימת מעקב';
        watchlistBtn.classList.remove('watching');
    }
}

/**
 * Toggles the presence of the active item inside the client-side persistent watchlist array.
 * Triggered via the UI watchlist button action listener.
 * @returns {void}
 */
function handleWatchlistToggle() {
    if (!currentItem) return;
    let watchlist = JSON.parse(localStorage.getItem('user_watchlist')) || [];
    const idStr = String(currentItem.id);
    const index = watchlist.indexOf(idStr);

    if (index > -1) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push(idStr);
    }

    localStorage.setItem('user_watchlist', JSON.stringify(watchlist));
    renderWatchlistButton(currentItem.id);
}

/**
 * Binds active item metadata properties and historical bid collections onto corresponding HTML DOM elements.
 * @param {Object} item - The active product object structure received from the API layer.
 */
function renderProduct(item) {
    const activePrice = item.currentPrice || item.startingPrice;
    document.getElementById('itemTitle').textContent = item.title;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('currentPrice').textContent = activePrice.toLocaleString();
    
    if (item.images && item.images.length > 0) {
        document.getElementById('itemImage').src = getImageUrl(item.images[0].imageUrl);
    } else {
        document.getElementById('itemImage').src = '../../shared/components/placeholder.png';
    }

    const historyTable = document.getElementById('bidsHistoryTable');
    if (item.lastBids && item.lastBids.length > 0) {
        historyTable.innerHTML = item.lastBids.map(bid => `
            <tr>
                <td>${bid.username || 'משתמש'}</td>
                <td>${bid.amount.toLocaleString()} ש"ח ${bid.isProxy ? '(אוטומטי)' : ''}</td>
                <td>${new Date(bid.bidTime).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    } else {
        historyTable.innerHTML = '<tr><td colspan="3" style="text-align:center;">אין הצעות עדיין</td></tr>';
    }
}

/**
 * Intercepts the form submission event, performs input data sanity checks,
 * extracts true dynamic context tokens from persistent stores, and commits transaction payloads.
 * @async
 * @param {SubmitEvent} event - The native browser form submit event context.
 * @returns {Promise<void>}
 */
async function onBidSubmit(event) {
    event.preventDefault();

    // 1. Session verification assertion logic
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
        showStatus('עליך להיות מחובר למערכת על מנת לבצע הצעה במכרז.', true);
        setTimeout(() => window.location.href = '../auth/index.html', 2000);
        return;
    }

    const manualAmount = parseFloat(document.getElementById('manualAmount').value);
    const proxyAmount = parseFloat(document.getElementById('proxyAmount').value);
    const activePrice = currentItem.currentPrice || currentItem.startingPrice;

    // Validation Check: Ensure at least one input field contains values
    if (isNaN(manualAmount) && isNaN(proxyAmount)) {
        showStatus('אנא הזן סכום הצעה או מקסימום אוטומטי', true);
        return;
    }
    
    // Validation Check: Prevent submissions below or equal to the active top value
    if (!isNaN(manualAmount) && manualAmount <= activePrice) {
        showStatus(`סכום ההצעה חייב להיות גבוה מהמחיר הנוכחי (${activePrice.toLocaleString()} ש"ח)`, true);
        return;
    }

    // Secure UI transition states to prevent multi-submit race conditions
    submitBidBtn.disabled = true;
    submitBidBtn.textContent = 'מעבד הצעה...';
    uiMessage.style.display = 'none';

    try {
        /**
         * API Contract Compliance Payload Map Configuration.
         * Dynamically populated utilizing true session identities to correct multi-account routing failures.
         */
        const bidPayload = {
            itemId: String(currentItem.id),
            userId: String(currentUser.id),         // Dynamic identity parsed directly from auth state context
            username: String(currentUser.username), // Dynamic identifier parsed directly from auth state context
            amount: manualAmount || 0,
            maxProxyAmount: proxyAmount || null
        };

        await placeBid(bidPayload);
        showStatus('ההצעה התקבלה בהצלחה!');
        
        // Refresh interface layout to fetch and display the updated bid sequence from the DB
        setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
        console.error('Bidding orchestration transaction failed:', err);
        showStatus(`שגיאה: ${err.message}`, true);
        submitBidBtn.disabled = false;
        submitBidBtn.textContent = 'בצע הצעה';
    }
}

/**
 * Orchestrates the full initialization sequence of Screen 3 on module insertion.
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    await injectNavbar();
    const id = getProductId();
    if (!id) {
        showStatus('מזהה מוצר חסר', true);
        return;
    }

    try {
        currentItem = await getItemById(id);
        renderProduct(currentItem);
        renderWatchlistButton(currentItem.id);
        
        // Boot active countdown calculation runtime tickers
        updateTimer(currentItem.endTime);
        countdownInterval = setInterval(() => updateTimer(currentItem.endTime), 1000);
    } catch (err) {
        console.error('Screen 3 component initialization failure state:', err);
        showStatus('טעינת המוצר נכשלה. וודא שהשרת פועל.', true);
    }
}

// ==========================================
// Operational Event Listeners Declarations
// ==========================================
document.addEventListener('DOMContentLoaded', init);
if (bidForm) {
    bidForm.addEventListener('submit', onBidSubmit);
}
if (watchlistBtn) {
    watchlistBtn.addEventListener('click', handleWatchlistToggle);
}