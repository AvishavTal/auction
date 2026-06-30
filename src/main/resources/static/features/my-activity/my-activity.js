import { injectNavbar } from '../../shared/js/layout.js';
import { getItems, getImageUrl } from '../../shared/js/api.js';

/**
 * Logic for Screen 5: My Activity and Actions Logs Tracker
 * Cross-references backend catalogs with client session data.
 * All comments are strictly in English.
 */

const activityGrid = document.getElementById('activityGrid');
const tabBids = document.getElementById('tabBids');
const tabSales = document.getElementById('tabSales');
const tabWins = document.getElementById('tabWins');

let allItems = [];
let currentActiveTab = 'bids';

/**
 * Triggers switching view states and updates tabs highlights
 */
function switchTab(tabKey, activeBtn, inactiveBtn1, inactiveBtn2) {
    currentActiveTab = tabKey;
    activeBtn.classList.add('active');
    inactiveBtn1.classList.remove('active');
    inactiveBtn2.classList.remove('active');
    renderActivityView();
}

/**
 * Renders targeted lists depending on selected tab filter
 */
function renderActivityView() {
    activityGrid.innerHTML = '';
    const now = new Date();

    // Context check: scan for bids placed locally under simulated session
    let itemsToRender = [];

    if (currentActiveTab === 'bids') {
        // Tab 1: Find all backend items where user has local bids recorded
        itemsToRender = allItems.filter(item => {
            const hasLocalBids = localStorage.getItem(`mock_bids_${item.id}`);
            return !!hasLocalBids;
        });

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
                    <p>מחיר שוק נוכחי: ${item.currentPrice ? item.currentPrice.toLocaleString() : item.startingPrice.toLocaleString()} ש"ח</p>
                    <span class="status-badge ${isClosed ? 'closed' : 'active'}">${isClosed ? 'המכרז נסגר' : 'מכרז פעיל'}</span>
                    <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">עבור לדף פריט</a>
                </div>
            `;
        }).join('');

    } else if (currentActiveTab === 'sales') {
        // Tab 2: Simulated items published by this user 
        // Real logic filter will use (item.sellerId === 1) once authentication is integrated.
        // For now, we fetch items with null sellerIds or mock tracking
        itemsToRender = allItems.filter(item => item.sellerId === null || item.sellerId === 1);

        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">טרם פרסמת מוצרים למכירה במערכת.</p>`;
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
        // Tab 3: Auctions that ended where user's local bid matches or defines the highest bid
        itemsToRender = allItems.filter(item => {
            const isClosed = new Date(item.endTime) < now;
            if (!isClosed) return false;

            const localBids = JSON.parse(localStorage.getItem(`mock_bids_${item.id}`)) || [];
            if (localBids.length === 0) return false;

            const myBid = localBids[0].amount;
            const marketPrice = item.currentPrice || item.startingPrice;
            return myBid >= marketPrice;
        });

        if (itemsToRender.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">אין זכיות רשומות כרגע. המשך להציע במכרזים!</p>`;
            return;
        }

        activityGrid.innerHTML = itemsToRender.map(item => `
            <div class="activity-card">
                <h3>${item.title}</h3>
                <p>מחיר זכייה סופי: <strong>${(item.currentPrice || item.startingPrice).toLocaleString()} ש"ח</strong></p>
                <span class="status-badge winning">זכית במוצר! 🎉</span>
                <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">פרטי יצירת קשר עם המוכר</a>
            </div>
        `).join('');
    }
}

/**
 * Orchestrator application initialization pipeline
 */
async function init() {
    await injectNavbar();

    // Tab view routers attach listeners
    tabBids.addEventListener('click', () => switchTab('bids', tabBids, tabSales, tabWins));
    tabSales.addEventListener('click', () => switchTab('sales', tabSales, tabBids, tabWins));
    tabWins.addEventListener('click', () => switchTab('wins', tabWins, tabBids, tabSales));

    try {
        // Load items globally from backend database catalog
        allItems = await getItems();
        renderActivityView();
    } catch (err) {
        console.error('Failed to load activity logs data stream:', err);
        activityGrid.innerHTML = `<p class="no-activity-message">שגיאה בטעינת נתונים. וודא ששרת ה-Java פועל.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', init);