import { injectNavbar, requireLogin } from '../../shared/js/layout.js';
import { getActivity } from '../../shared/js/api.js';

const activityGrid = document.getElementById('activityGrid');
const tabBids = document.getElementById('tabBids');
const tabSales = document.getElementById('tabSales');
const tabWins = document.getElementById('tabWins');

let activityData = { bids: [], sales: [], wins: [] };
let currentActiveTab = 'bids';

function switchTab(tabKey, activeBtn, inactiveBtn1, inactiveBtn2) {
    currentActiveTab = tabKey;
    activeBtn.classList.add('active');
    inactiveBtn1.classList.remove('active');
    inactiveBtn2.classList.remove('active');
    renderActivityView();
}

function itemCard(item, bodyHtml, badgeClass, badgeText, linkText) {
    const isClosed = new Date(item.endTime) < new Date();
    return `
        <div class="activity-card">
            <h3>${item.title}</h3>
            ${bodyHtml}
            <span class="status-badge ${badgeClass}">${badgeText}</span>
            <a href="../item-details/index.html?id=${item.id}" class="btn-action-link">${linkText}</a>
        </div>
    `;
}

function renderActivityView() {
    activityGrid.innerHTML = '';
    const now = new Date();

    if (currentActiveTab === 'bids') {
        const items = activityData.bids;
        if (items.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">טרם הגשת הצעות מחיר במערכת.</p>`;
            return;
        }
        activityGrid.innerHTML = items.map(item => {
            const isClosed = new Date(item.endTime) < now;
            const price = item.currentPrice ? item.currentPrice.toLocaleString() : item.startingPrice.toLocaleString();
            return itemCard(item,
                `<p>מחיר שוק נוכחי: <strong>${price} ש"ח</strong></p>`,
                isClosed ? 'closed' : 'active',
                isClosed ? 'המכרז נסגר' : 'מכרז פעיל',
                'עבור לדף פריט'
            );
        }).join('');

    } else if (currentActiveTab === 'sales') {
        const items = activityData.sales;
        if (items.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">טרם פרסמת מוצרים למכירה במערכת.</p>`;
            return;
        }
        activityGrid.innerHTML = items.map(item => {
            const isClosed = new Date(item.endTime) < now;
            const current = item.currentPrice ? `${item.currentPrice.toLocaleString()} ש"ח` : 'אין הצעות';
            return itemCard(item,
                `<p>מחיר פתיחה: ${item.startingPrice.toLocaleString()} ש"ח</p>
                 <p>מחיר נוכחי: ${current}</p>`,
                isClosed ? 'closed' : 'active',
                isClosed ? 'המכרז נסגר' : 'מכרז פעיל',
                'נהל מכירה'
            );
        }).join('');

    } else if (currentActiveTab === 'wins') {
        const items = activityData.wins;
        if (items.length === 0) {
            activityGrid.innerHTML = `<p class="no-activity-message">אין זכיות רשומות כרגע. המשך להציע במכרזים!</p>`;
            return;
        }
        activityGrid.innerHTML = items.map(item => {
            const price = (item.currentPrice || item.startingPrice).toLocaleString();
            return itemCard(item,
                `<p>מחיר זכייה סופי: <strong>${price} ש"ח</strong></p>`,
                'winning',
                'זכית במוצר! 🎉',
                'פרטי יצירת קשר עם המוכר'
            );
        }).join('');
    }
}

async function init() {
    if (!requireLogin()) return;
    await injectNavbar();

    tabBids.addEventListener('click', () => switchTab('bids', tabBids, tabSales, tabWins));
    tabSales.addEventListener('click', () => switchTab('sales', tabSales, tabBids, tabWins));
    tabWins.addEventListener('click', () => switchTab('wins', tabWins, tabBids, tabSales));

    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        activityData = await getActivity(currentUser.id);
        renderActivityView();
    } catch (err) {
        console.error('Failed to load activity:', err);
        activityGrid.innerHTML = `<p class="no-activity-message">שגיאה בטעינת נתונים. וודא ששרת ה-Java פועל.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
