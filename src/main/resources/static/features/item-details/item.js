import { injectNavbar, requireLogin } from '../../shared/js/layout.js';
import { getItemById, placeBid, getImageUrl } from '../../shared/js/api.js';

const uiMessage = document.getElementById('uiMessage');
const submitBidBtn = document.getElementById('submitBidBtn');

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

/**
 * Renders the fetched product data to the UI
 */
function renderProduct(item) {
    document.getElementById('itemTitle').textContent = item.title;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('currentPrice').textContent = item.currentPrice ? item.currentPrice.toLocaleString() : item.startingPrice.toLocaleString();

    const fallbackImage = 'https://picsum.photos/400/300?random=' + (item.id || 1);

    if (item.images && item.images.length > 0) {
        const imgName = item.images[0].imageUrl;
        document.getElementById('itemImage').src = imgName.startsWith('http') ? imgName : getImageUrl(imgName);

        document.getElementById('itemImage').onerror = function() {
            this.onerror = null;
            this.src = fallbackImage;
        };
    } else {
        document.getElementById('itemImage').src = fallbackImage;
    }

    // Render Bid History
    const historyTable = document.getElementById('bidsHistoryTable');
    if (item.lastBids && item.lastBids.length > 0) {
        historyTable.innerHTML = item.lastBids.map(bid => `
            <tr>
                <td>${bid.username}</td>
                <td>${bid.amount.toLocaleString()} ש"ח ${bid.isProxy ? '(אוטומטי)' : ''}</td>
                <td>${new Date(bid.bidTime).toLocaleString('he-IL')}</td>
            </tr>
        `).join('');
    } else {
        historyTable.innerHTML = '<tr><td colspan="3" style="text-align:center;">אין הצעות עדיין</td></tr>';
    }
}

async function onBidSubmit(event) {
    event.preventDefault();
    if (!requireLogin()) return;

    const manualAmount = parseFloat(document.getElementById('manualAmount').value);
    const proxyAmount = parseFloat(document.getElementById('proxyAmount').value);

    if (isNaN(manualAmount) && isNaN(proxyAmount)) {
        showStatus('אנא הזן סכום הצעה או מקסימום אוטומטי', true);
        return;
    }

    submitBidBtn.disabled = true;
    submitBidBtn.textContent = 'מעבד הצעה...';

    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const bidData = {
            itemId: currentItem.id,
            userId: currentUser.id,
            amount: manualAmount || null,
            maxProxyAmount: proxyAmount || null
        };

        await placeBid(bidData);
        showStatus('ההצעה התקבלה בהצלחה!');
        setTimeout(() => window.location.reload(), 1500); // wait for proxy resolution via JMS

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

        updateTimer(currentItem.endTime);
        countdownInterval = setInterval(() => updateTimer(currentItem.endTime), 1000);

        if (localStorage.getItem('isLoggedIn') !== 'true') {
            submitBidBtn.disabled = true;
            submitBidBtn.textContent = 'יש להתחבר כדי להציע מחיר';
        }
    } catch (err) {
        console.error('Init failure:', err);
        showStatus('טעינת המוצר נכשלה. וודא שהשרת פועל.', true);
    }
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('bidForm').addEventListener('submit', onBidSubmit);
