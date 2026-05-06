import { injectNavbar } from '../../shared/js/layout.js';
import { getItemById, placeBid } from '../../shared/js/api.js';

/**
 * Logic for Screen 3: Item Details and Bidding
 * All comments in English.
 */

// UI Elements
const uiMessage = document.getElementById('uiMessage');
const submitBidBtn = document.getElementById('submitBidBtn');

let currentItem = null;
let countdownInterval = null;

/**
 * Utility to display UI messages
 */
function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

/**
 * Extracts product ID from the URL query string
 */
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Calculates and updates the countdown timer
 */
function updateTimer(endTimeStr) {
    const endTime = new Date(endTimeStr).getTime();
    const now = new Date().getTime();
    const diff = endTime - now;

    const timerDisplay = document.getElementById('countdown');

    if (diff <= 0) {
        timerDisplay.textContent = "המכרז נסגר";
        submitBidBtn.disabled = true;
        clearInterval(countdownInterval);
        return;
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Renders the fetched product data to the UI
 */
function renderProduct(item) {
    document.getElementById('itemTitle').textContent = item.title;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('currentPrice').textContent = item.currentPrice.toLocaleString();
    
    if (item.imagePaths && item.imagePaths.length > 0) {
        document.getElementById('itemImage').src = item.imagePaths[0];
    }

    // Render Bid History
    const historyTable = document.getElementById('bidsHistoryTable');
    historyTable.innerHTML = item.lastBids.map(bid => `
        <tr>
            <td>${bid.username}</td>
            <td>${bid.amount.toLocaleString()} ש"ח ${bid.isProxy ? '(אוטומטי)' : ''}</td>
            <td>${new Date(bid.bidTime).toLocaleTimeString()}</td>
        </tr>
    `).join('');
}

/**
 * Handles bid submission (Manual and Proxy)
 */
async function onBidSubmit(event) {
    event.preventDefault();
    
    const manualAmount = parseFloat(document.getElementById('manualAmount').value);
    const proxyAmount = parseFloat(document.getElementById('proxyAmount').value);

    // Validation: At least one amount must be provided
    if (isNaN(manualAmount) && isNaN(proxyAmount)) {
        showStatus('אנא הזן סכום הצעה או מקסימום אוטומטי', true);
        return;
    }

    submitBidBtn.disabled = true;
    submitBidBtn.textContent = 'מעבד הצעה...';

    try {
        const bidData = {
            itemId: currentItem.id,
            amount: manualAmount || 0,
            maxProxyAmount: proxyAmount || null
        };

        await placeBid(bidData);
        showStatus('ההצעה התקבלה בהצלחה!');
        
        // Refresh page data to show new current price and history
        setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
        console.error('Bidding error:', err);
        showStatus(`שגיאה: ${err.message}`, true);
    } finally {
        submitBidBtn.disabled = false;
        submitBidBtn.textContent = 'בצע הצעה';
    }
}

/**
 * Page Initialization
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
        
        // Start live countdown
        updateTimer(currentItem.endTime);
        countdownInterval = setInterval(() => updateTimer(currentItem.endTime), 1000);

    } catch (err) {
        console.error('Init failure:', err);
        showStatus('טעינת המוצר נכשלה. וודא שהשרת פועל.', true);
    }
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('bidForm').addEventListener('submit', onBidSubmit);