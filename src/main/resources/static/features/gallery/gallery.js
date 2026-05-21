import { injectNavbar } from '../../shared/js/layout.js';
import { getItems, getCategories } from '../../shared/js/api.js';

const itemsGrid = document.getElementById('itemsGrid');
const categoryFilter = document.getElementById('categoryFilter');

/**
 * Renders a single item card HTML string.
 */
function createItemCard(item) {
    const timeRemaining = calculateTimeRemaining(item.endTime);
    
    // Adjusted to the correct API media route serving the images from the Docker volume
    const BACKEND_IMAGE_BASE = 'http://localhost:8080/api/media/'; 
    
    // Using a reliable online placeholder to eliminate relative path breaking
    const fallbackImage = 'https://picsum.photos/280/180?random=' + (item.id || 1);
    
    let imageUrl = fallbackImage; 
    
    if (item.images && item.images.length > 0) {
        const imgName = item.images[0].imageUrl;
        imageUrl = imgName.startsWith('http') ? imgName : `${BACKEND_IMAGE_BASE}${imgName}`;
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

        const items = await getItems();
        if (items.length === 0) {
            itemsGrid.innerHTML = '<p>אין מכרזים פעילים כרגע.</p>';
            return;
        }

        itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
        setInterval(updateTimers, 1000);

    } catch (err) {
        console.error('Gallery Error:', err);
        itemsGrid.innerHTML = '<p>שגיאה בטעינת המכרזים. וודא שהשרת פעיל.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializeGallery);