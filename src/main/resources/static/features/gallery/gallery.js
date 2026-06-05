import { injectNavbar } from '../../shared/js/layout.js';
import { getItems, getCategories, getImageUrl } from '../../shared/js/api.js';

const itemsGrid = document.getElementById('itemsGrid');
const categoryFilter = document.getElementById('categoryFilter');

/**
 * Renders a single item card HTML string.
 */
function createItemCard(item) {
    const timeRemaining = calculateTimeRemaining(item.endTime);

    const fallbackImage = 'https://picsum.photos/280/180?random=' + (item.id || 1);

    let imageUrl = fallbackImage;
    if (item.images && item.images.length > 0) {
        const imgName = item.images[0].imageUrl;
        imageUrl = imgName.startsWith('http') ? imgName : getImageUrl(imgName);
    }

    const currentPrice = item.currentPrice ? item.currentPrice : item.startingPrice;

    return `
        <article class="item-card">
            <img src="${imageUrl}" alt="${item.title}" class="item-image" onerror="this.onerror=null; this.src='${fallbackImage}';">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-price">מחיר נוכחי: <strong>${currentPrice.toLocaleString()} ש"ח</strong></p>
            <p class="item-timer" data-endtime="${item.endTime}">זמן נותר: ${timeRemaining}</p>
            <button class="btn-view" onclick="location.href='../item-details/index.html?id=${item.id}'">צפה והצע מחיר</button>
        </article>
    `;
}

function calculateTimeRemaining(endTime) {
    const total = Date.parse(endTime) - Date.parse(new Date());
    if (total <= 0) return "המכרז נסגר";

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimers() {
    document.querySelectorAll('.item-timer').forEach(timer => {
        const endTime = timer.getAttribute('data-endtime');
        timer.textContent = `זמן נותר: ${calculateTimeRemaining(endTime)}`;
    });
}

async function loadItems() {
    const filters = {};
    const keyword = document.getElementById('searchInput').value.trim();
    const categoryId = categoryFilter.value;
    const priceRange = document.getElementById('priceFilter').value;

    if (keyword)    filters.keyword    = keyword;
    if (categoryId) filters.categoryId = categoryId;
    if (priceRange === 'under100')   { filters.maxPrice = 100; }
    if (priceRange === '100to500')   { filters.minPrice = 100; filters.maxPrice = 500; }
    if (priceRange === 'over500')    { filters.minPrice = 500; }

    try {
        const items = await getItems(filters);
        if (items.length === 0) {
            itemsGrid.innerHTML = '<p>לא נמצאו מכרזים.</p>';
            return;
        }
        itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
    } catch (err) {
        console.error('Gallery Error:', err);
        itemsGrid.innerHTML = '<p>שגיאה בטעינת המכרזים. וודא שהשרת פעיל.</p>';
    }
}

async function initializeGallery() {
    await injectNavbar();

    try {
        const categories = await getCategories();
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            categoryFilter.appendChild(opt);
        });
    } catch (err) {
        console.error('Gallery Error:', err);
    }

    await loadItems();
    setInterval(updateTimers, 1000);

    document.getElementById('searchInput').addEventListener('input', loadItems);
    categoryFilter.addEventListener('change', loadItems);
    document.getElementById('priceFilter').addEventListener('change', loadItems);
}

document.addEventListener('DOMContentLoaded', initializeGallery);
