import { injectNavbar } from '../../shared/js/layout.js';
import { getItemById, placeBid, getImageUrl } from '../../shared/js/api.js';

/**
 * Logic for Screen 3: Item Details, Bidding, and Watchlist Flows
 * Reverted to standard default browser input configurations. All comments are strictly in English.
 */

const uiMessage = document.getElementById('uiMessage');
const submitBidBtn = document.getElementById('submitBidBtn');
const bidForm = document.getElementById('bidForm');
const watchlistBtn = document.getElementById('watchlistBtn');

let currentItem = null;
let countdownInterval = null;

function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
}

function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

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

async function onBidSubmit(event) {
    event.preventDefault();
    const manualAmount = parseFloat(document.getElementById('manualAmount').value);
    const proxyAmount = parseFloat(document.getElementById('proxyAmount').value);
    const activePrice = currentItem.currentPrice || currentItem.startingPrice;

    if (isNaN(manualAmount) && isNaN(proxyAmount)) {
        showStatus('אנא הזן סכום הצעה או מקסימום אוטומטי', true);
        return;
    }
    if (!isNaN(manualAmount) && manualAmount <= activePrice) {
        showStatus(`סכום ההצעה חייב להיות גבוה מהמחיר הנוכחי (${activePrice.toLocaleString()} ש"ח)`, true);
        return;
    }

    submitBidBtn.disabled = true;
    submitBidBtn.textContent = 'מעבד הצעה...';
    uiMessage.style.display = 'none';

    try {
        const bidData = {
            item: { id: currentItem.id }, 
            amount: manualAmount || 0,
            maxProxyAmount: proxyAmount || null,
            userId: 1, 
            username: "TestUser" 
        };

        await placeBid(bidData);
        showStatus('ההצעה התקבלה בהצלחה!');
        setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
        console.error('Bidding error:', err);
        showStatus(`שגיאה: ${err.message}`, true);
    } finally {
        submitBidBtn.disabled = false;
        submitBidBtn.textContent = 'בצע הצעה';
    }
}

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
        
        updateTimer(currentItem.endTime);
        countdownInterval = setInterval(() => updateTimer(currentItem.endTime), 1000);
    } catch (err) {
        console.error('Init failure:', err);
        showStatus('טעינת המוצר נכשלה. וודא שהשרת פועל.', true);
    }
}

document.addEventListener('DOMContentLoaded', init);
bidForm.addEventListener('submit', onBidSubmit);
watchlistBtn.addEventListener('click', handleWatchlistToggle);