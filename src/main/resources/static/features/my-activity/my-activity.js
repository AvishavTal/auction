import { injectNavbar } from '../../shared/js/layout.js';
import { getItems } from '../../shared/js/api.js';

/**
 * Logic for Screen 5: Multi-Tab Dashboard Tracker including Watchlist Filters
 */

const activityGrid = document.getElementById('activityGrid');
const tabBids = document.getElementById('tabBids');
const tabSales = document.getElementById('tabSales');
const tabWins = document.getElementById('tabWins');
const tabWatchlist = document.getElementById('tabWatchlist');

let allItems = [];
let currentActiveTab = 'bids';

/**
 * Dictates view switching pipeline states and highlights the active button link
 */
function switchTab(tabKey, activeBtn, inactive1, inactive2, inactive3) {
    currentActiveTab = tabKey;
    activeBtn.classList.add('active');
    [inactive1, inactive2, inactive3].forEach(btn => btn.classList.remove('active'));
    renderActivityView();
}

/**
 * Renders filtered grids maps matching selected state criteria
 */
function renderActivityView() {
    activityGrid.innerHTML = '';
    const now = new Date();
    let itemsToRender = [];

    if (currentActiveTab === 'bids') {
        itemsToRender = allItems.filter(item => localStorage.getItem(`mock_bids_${item.id}`));
        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">טרם הגשת הצעות מחיר במערכת.</p>`;
            return;
        }
        activityGrid.innerHTML = itemsToRender.map(item => {
            const localBids = JSON.parse(localStorage.getItem(`mock_bids_${item.id}`)) || [];
            const myHighestBid = localBids[0]?.amount || 0;
            const isClosed = new Date(item.endTime) < now;
            return `
                <div class="activity-card">
                    <h3>${item.title}</h3>
                    <p>ההצעה האחרונה שלך: <strong>${myHighestBid.toLocaleString()} ש"ח</strong></p>
                    <p>מחיר שוק נוכחי: ${(item.currentPrice || item.startingPrice).toLocaleString()} ש"ח</p>
                    <span class="status-badge ${isClosed ? 'closed' : 'active'}">${isClosed ? 'המכרז נסגר' : 'מכרז פעיל'}</span>
                    <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">עבור לדף פריט</a>
                </div>
            `;
        }).join('');

    } else if (currentActiveTab === 'sales') {
        itemsToRender = allItems.filter(item => item.sellerId === null || item.sellerId === 1);
        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">טרם פרסמת מוצרים למכירה.</p>`;
            return;
        }
        activityGrid.innerHTML = itemsToRender.map(item => {
            const isClosed = new Date(item.endTime) < now;
            return `
                <div class="activity-card">
                    <h3>${item.title}</h3>
                    <p>מחיר פתיחה: ${item.startingPrice.toLocaleString()} ש"ח</p>
                    <p>מחיר נוכחי: ${item.currentPrice ? item.currentPrice.toLocaleString() : 'אין הצעות'} ש"ח</p>
                    <span class="status-badge ${isClosed ? 'closed' : 'active'}">${isClosed ? 'המכרז נסגר' : 'מכרז פעיל'}</span>
                    <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">נהל מכירה</a>
                </div>
            `;
        }).join('');

    } else if (currentActiveTab === 'wins') {
        itemsToRender = allItems.filter(item => {
            const isClosed = new Date(item.endTime) < now;
            if (!isClosed) return false;
            const localBids = JSON.parse(localStorage.getItem(`mock_bids_${item.id}`)) || [];
            if (localBids.length === 0) return false;
            return localBids[0].amount >= (item.currentPrice || item.startingPrice);
        });
        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">אין זכיות רשומות כרגע.</p>`;
            return;
        }
        activityGrid.innerHTML = itemsToRender.map(item => `
            <div class="activity-card">
                <h3>${item.title}</h3>
                <p>מחיר זכייה סופי: <strong>${(item.currentPrice || item.startingPrice).toLocaleString()} ש"ח</strong></p>
                <span class="status-badge winning">זכית במוצר! 🎉</span>
                <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">פרטי יצירת קשר</a>
            </div>
        `).join('');

    } else if (currentActiveTab === 'watchlist') {
        // Pull string IDs from localStorage tracking vectors
        const watchlist = JSON.parse(localStorage.getItem('user_watchlist')) || [];
        itemsToRender = allItems.filter(item => watchlist.includes(String(item.id)));

        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">אין מוצרים ברשימת המעקב שלך.</p>`;
            return;
        }
        activityGrid.innerHTML = itemsToRender.map(item => {
            const isClosed = new Date(item.endTime) < now;
            return `
                <div class="activity-card">
                    <h3>${item.title}</h3>
                    <p>מחיר נוכחי: ${(item.currentPrice || item.startingPrice).toLocaleString()} ש"ח</p>
                    <span class="status-badge ${isClosed ? 'closed' : 'active'}">${isClosed ? 'המכרז נסגר' : 'מכרז פעיל'}</span>
                    <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">צפה במוצר וקנה</a>
                </div>
            `;
        }).join('');
    }
}

async function init() {
    await injectNavbar();

    // Map strategic event bindings
    tabBids.addEventListener('click', () => switchTab('bids', tabBids, tabSales, tabWins, tabWatchlist));
    tabSales.addEventListener('click', () => switchTab('sales', tabSales, tabBids, tabWins, tabWatchlist));
    tabWins.addEventListener('click', () => switchTab('wins', tabWins, tabBids, tabSales, tabWatchlist));
    tabWatchlist.addEventListener('click', () => switchTab('watchlist', tabWatchlist, tabBids, tabSales, tabWins));

    try {
        allItems = await getItems();
        renderActivityView();
    } catch (err) {
        console.error('Data stream synchronization loading error:', err);
        activityGrid.innerHTML = `<p class="no-activity-message">שגיאה בטעינת נתונים. וודא ששרת ה-Java פועל.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', init);