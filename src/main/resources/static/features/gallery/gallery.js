/**
 * @file gallery.js
 * @module gallery
 * @description Gallery Module.
 *              Handles dynamic rendering of auction item listings, asynchronous filtering by
 *              keywords, categories, and price ranges, real-time countdown timer polling,
 *              and category option initialization from the backend API.
 * @requires ../../shared/js/layout.js:injectNavbar
 * @requires ../../shared/js/api.js:getItems,getCategories,getImageUrl
 */

import { injectNavbar } from '../../shared/js/layout.js';
import { getItems, getCategories, getImageUrl } from '../../shared/js/api.js';

/* ============================================================================
   DOM Element References
   ============================================================================ */

/** @type {HTMLElement} Main CSS grid container for dynamic rendering of item cards. */
const itemsGrid = document.getElementById('itemsGrid');

/** @type {HTMLSelectElement} Dropdown element for filtering items by category. */
const categoryFilter = document.getElementById('categoryFilter');

/* ============================================================================
   Component Renderers & Helpers
   ============================================================================ */

/**
 * Generates an HTML string template for an individual auction item card.
 * Handles fallback image generation, image URL parsing, price formatting,
 * and countdown timer initial state.
 *
 * @param {Object} item - Data object representing an auction item.
 * @param {number} [item.id] - Unique item identifier.
 * @param {string} item.title - Item title/headline.
 * @param {number} [item.currentPrice] - Current highest bid amount.
 * @param {number} item.startingPrice - Initial listing price.
 * @param {string} item.endTime - ISO 8601 string or date parseable string for auction expiry.
 * @param {Array<{imageUrl: string}>} [item.images] - Array of image objects associated with the item.
 * @returns {string} Formatted HTML representation of the item card.
 */
function createItemCard(item) {
    const timeRemaining = calculateTimeRemaining(item.endTime);

    // Dynamic random placeholder image if image resolution fails
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

/**
 * Computes remaining time between current timestamp and auction end date.
 * Formats duration into `HH:MM:SS` standard notation.
 *
 * @param {string|number|Date} endTime - Auction end timestamp parseable by `Date.parse()`.
 * @returns {string} Formatted time string ("HH:MM:SS") or expiration message ("המכרז נסגר").
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
 * Iterates through all active `.item-timer` elements in the DOM and updates
 * their displayed text node with freshly computed countdown values.
 *
 * @returns {void}
 */
function updateTimers() {
    document.querySelectorAll('.item-timer').forEach(timer => {
        const endTime = timer.getAttribute('data-endtime');
        timer.textContent = `זמן נותר: ${calculateTimeRemaining(endTime)}`;
    });
}

/* ============================================================================
   Data Fetching & Lifecycle Management
   ============================================================================ */

/**
 * Asynchronously fetches auction items from backend matching active UI filters
 * (search text, selected category, price constraints) and updates the DOM grid.
 *
 * @returns {Promise<void>}
 */
async function loadItems() {
    /** @type {Object} Query parameter map for API filtering */
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

/**
 * Main module initialization function.
 * Injects global layout, populates category filter options, loads initial item set,
 * starts 1-second interval timer tick, and registers user input listeners.
 *
 * @returns {Promise<void>}
 */
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

    // Schedule continuous countdown timer refresh (1 second cadence)
    setInterval(updateTimers, 1000);

    // Event bindings for real-time filtering updates
    document.getElementById('searchInput').addEventListener('input', loadItems);
    categoryFilter.addEventListener('change', loadItems);
    document.getElementById('priceFilter').addEventListener('change', loadItems);
}

// Kickstart gallery controller on DOM readiness
document.addEventListener('DOMContentLoaded', initializeGallery);