/**
 * @file item.js
 * @module item-details
 * @description Item Details & Live Bidding Controller.
 *              Manages detailed product view rendering, active auction countdown tickers,
 *              client-side watchlist persistence, manual and proxy bid submission workflows,
 *              and recent bidding history rendering via backend REST APIs.
 * @requires ../../shared/js/layout.js:injectNavbar
 * @requires ../../shared/js/api.js:getItemById,placeBid,getImageUrl
 */

import { injectNavbar } from '../../shared/js/layout.js';
import { getItemById, placeBid, getImageUrl } from '../../shared/js/api.js';

/* ============================================================================
   DOM Element References
   ============================================================================ */

/** @type {HTMLElement} Container element for status and validation alert messages. */
const uiMessage = document.getElementById('uiMessage');

/** @type {HTMLButtonElement} Submit button control for bid form submission. */
const submitBidBtn = document.getElementById('submitBidBtn');

/** @type {HTMLFormElement} Form element capturing manual and proxy bid inputs. */
const bidForm = document.getElementById('bidForm');

/** @type {HTMLButtonElement} Toggle button for adding/removing items from watchlist. */
const watchlistBtn = document.getElementById('watchlistBtn');

/* ============================================================================
   Module State Management
   ============================================================================ */

/** 
 * Stores the active product entity retrieved from the API.
 * @type {Object|null} 
 */
let currentItem = null;

/** 
 * Interval timer handle for continuous countdown clock updates.
 * @type {number|null} 
 */
let countdownInterval = null;

/* ============================================================================
   Core Functions & Business Logic
   ============================================================================ */

/**
 * Displays operational status alerts or error messages to the end-user.
 *
 * @param {string} text - The informative text or error message to display.
 * @param {boolean} [isError=false] - Toggles error visual state vs. success state.
 * @returns {void}
 */
function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

/**
 * Extracts the product identifier from URL query string parameters (`?id=XYZ`).
 *
 * @returns {string|null} The product ID if found, otherwise `null`.
 */
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Calculates time remaining until auction expiration and updates the countdown display node.
 * Automatically disables bidding controls once time expires.
 *
 * @param {string} endTimeStr - ISO date string specifying the auction end timestamp.
 * @returns {void}
 */
function updateTimer(endTimeStr) {
    const endTime = new Date(endTimeStr).getTime();
    const now = new Date().getTime();
    const diff = endTime - now;
    const timerDisplay = document.getElementById('countdown');

    // Handle auction expiration state
    if (diff <= 0) {
        timerDisplay.textContent = "המכרז נסגר";
        if (submitBidBtn) submitBidBtn.disabled = true;
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        return;
    }

    // Convert millisecond delta into HH:MM:SS format
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Evaluates item presence in local storage watchlist and updates button labels and visual states.
 *
 * @param {number|string} itemId - The unique identifier of the active auction item.
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
 * Toggles presence of the active item inside local storage watchlist array.
 *
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
 * Renders product details, media assets, current prices, and bid history table into DOM.
 *
 * @param {Object} item - Detailed product entity retrieved from API.
 * @param {number} item.id - Product unique ID.
 * @param {string} item.title - Product title.
 * @param {string} item.description - Product detailed description.
 * @param {number} [item.currentPrice] - Current highest bid amount.
 * @param {number} item.startingPrice - Default starting price.
 * @param {Array<{imageUrl: string}>} [item.images] - Product image collection.
 * @param {Array<{username: string, amount: number, isProxy: boolean, bidTime: string}>} [item.lastBids] - Recent bid history records.
 * @returns {void}
 */
function renderProduct(item) {
    const activePrice = item.currentPrice || item.startingPrice;
    document.getElementById('itemTitle').textContent = item.title;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('currentPrice').textContent = activePrice.toLocaleString();
    
    // Resolve product media URL or populate placeholder
    if (item.images && item.images.length > 0) {
        document.getElementById('itemImage').src = getImageUrl(item.images[0].imageUrl);
    } else {
        document.getElementById('itemImage').src = '../../shared/components/placeholder.png';
    }

    // Populate bid history table
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
 * Handles bid form submission, validating input parameters, verifying active session state,
 * and dispatching the bidding transaction payload to the API.
 *
 * @async
 * @param {SubmitEvent} event - The native DOM submit event object.
 * @returns {Promise<void>}
 */
async function onBidSubmit(event) {
    event.preventDefault();

    // Session validation check
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
        showStatus('עליך להיות מחובר למערכת על מנת לבצע הצעה במכרז.', true);
        setTimeout(() => window.location.href = '../auth/index.html', 2000);
        return;
    }

    const manualAmount = parseFloat(document.getElementById('manualAmount').value);
    const proxyAmount = parseFloat(document.getElementById('proxyAmount').value);
    const activePrice = currentItem.currentPrice || currentItem.startingPrice;

    // Validation: Require at least one amount input
    if (isNaN(manualAmount) && isNaN(proxyAmount)) {
        showStatus('אנא הזן סכום הצעה או מקסימום אוטומטי', true);
        return;
    }
    
    // Validation: Manual bid must exceed current active price
    if (!isNaN(manualAmount) && manualAmount <= activePrice) {
        showStatus(`סכום ההצעה חייב להיות גבוה מהמחיר הנוכחי (${activePrice.toLocaleString()} ש"ח)`, true);
        return;
    }

    // Disable submission button during network request
    submitBidBtn.disabled = true;
    submitBidBtn.textContent = 'מעבד הצעה...';
    uiMessage.style.display = 'none';

    try {
        /**
         * Bid payload structured according to backend API specifications.
         * @type {{itemId: number, userId: number, amount: number, maxProxyAmount: (number|null)}}
         */
        const bidPayload = {
            itemId: currentItem.id,
            userId: currentUser.id,
            amount: manualAmount || 0,
            maxProxyAmount: proxyAmount || null
        };

        await placeBid(bidPayload);
        showStatus('ההצעה התקבלה בהצלחה!');
        
        // Refresh page to sync view with updated state
        setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
        console.error('Bidding orchestration transaction failed:', err);
        showStatus(`שגיאה: ${err.message}`, true);
        submitBidBtn.disabled = false;
        submitBidBtn.textContent = 'בצע הצעה';
    }
}

/**
 * Initializes item view components on page load.
 *
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
        
        // Start live countdown ticker
        updateTimer(currentItem.endTime);
        countdownInterval = setInterval(() => updateTimer(currentItem.endTime), 1000);
    } catch (err) {
        console.error('Screen 3 component initialization failure state:', err);
        showStatus('טעינת המוצר נכשלה. וודא שהשרת פועל.', true);
    }
}

/* ============================================================================
   Event Listener Registrations
   ============================================================================ */

document.addEventListener('DOMContentLoaded', init);

if (bidForm) {
    bidForm.addEventListener('submit', onBidSubmit);
}

if (watchlistBtn) {
    watchlistBtn.addEventListener('click', handleWatchlistToggle);
}