import { injectNavbar } from '../../shared/js/layout.js';
import { getItems, getCategories } from '../../shared/js/api.js';

const itemsGrid = document.getElementById('itemsGrid');
const categoryFilter = document.getElementById('categoryFilter');

/**
 * Renders a single item card HTML string.
 */
function createItemCard(item) {
    const timeRemaining = calculateTimeRemaining(item.endTime);
    return `
        <article class="item-card">
            <img src="${item.imagePaths[0] || '../../assets/placeholder.png'}" alt="${item.title}" class="item-image">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-price">מחיר נוכחי: <strong>${item.currentPrice.toLocaleString()} ש"ח</strong></p>
            <p class="item-timer" data-endtime="${item.endTime}">זמן נותר: ${timeRemaining}</p>
            <button class="btn-view" onclick="location.href='../item-details/index.html?id=${item.id}'">צפה והצע מחיר</button>
        </article>
    `;
}

/**
 * Calculates remaining time in HH:MM:SS format.
 */
function calculateTimeRemaining(endTime) {
    const total = Date.parse(endTime) - Date.parse(new Date());
    if (total <= 0) return "המכרז נסגר";

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Updates all timers on the screen every second.
 */
function updateTimers() {
    document.querySelectorAll('.item-timer').forEach(timer => {
        const endTime = timer.getAttribute('data-endtime');
        timer.textContent = `זמן נותר: ${calculateTimeRemaining(endTime)}`;
    });
}

async function initializeGallery() {
    await injectNavbar();
    
    try {
        // Load categories for filter
        const categories = await getCategories();
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            categoryFilter.appendChild(opt);
        });

        // Load active items
        const items = await getItems();
        if (items.length === 0) {
            itemsGrid.innerHTML = '<p>אין מכרזים פעילים כרגע.</p>';
            return;
        }

        itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
        
        // Start live countdown
        setInterval(updateTimers, 1000);

    } catch (err) {
        console.error('Gallery Initialization Error:', err);
        itemsGrid.innerHTML = '<p>שגיאה בטעינת המכרזים. וודא שהשרת פעיל.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializeGallery);