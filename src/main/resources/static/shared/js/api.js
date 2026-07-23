/**
 * ============================================================================
 * REST API Client Service Module
 * ============================================================================
 *
 * @file api.js
 * @module shared/api
 * @description Centralized HTTP API client abstraction layer. Encapsulates all
 *              asynchronous fetch communication with backend REST endpoints (`/api/*`),
 *              handling categories retrieval, binary media upload/resolution,
 *              item CRUD operations, filtering, user activity datasets, and bid placement.
 */

/**
 * Base URL endpoint for REST API calls.
 * @constant {string}
 */
const API_BASE_URL = 'http://localhost:8080/api';

/* ============================================================================
   Category Management API
   ============================================================================ */

/**
 * Asynchronously retrieves the complete collection of product categories.
 *
 * @async
 * @function getCategories
 * @returns {Promise<Array<{id: number, name: string}>>} Array of category entity objects.
 * @throws {Error} Throws an error if HTTP response status is not OK (`200-299`).
 */
export async function getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`Categories fetch failed: ${response.status}`);
    return response.json();
}

/* ============================================================================
   Media & File Asset Services
   ============================================================================ */

/**
 * Resolves the fully-qualified backend URL for a relative media filename,
 * or returns a fallback placeholder path if the filename is omitted/falsy.
 *
 * @function getImageUrl
 * @param {string} [filename] - Relative file path or image identifier.
 * @returns {string} Complete backend endpoint URL for media asset or placeholder relative path.
 */
export function getImageUrl(filename) {
    if (!filename) return '../../shared/components/placeholder.png';
    return `${API_BASE_URL}/media/${filename}`;
}

/**
 * Uploads a raw image file to the backend media service via `multipart/form-data`.
 *
 * @async
 * @function uploadImage
 * @param {File} file - Native browser `File` object selected via input element.
 * @returns {Promise<{imagePath: string}>} JSON response containing relative uploaded asset path.
 * @throws {Error} Throws an error if upload HTTP request fails.
 */
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
}

/* ============================================================================
   Auction Item API Services
   ============================================================================ */

/**
 * Posts a new auction item record payload to the backend repository.
 *
 * @async
 * @function createItem
 * @param {Object} itemData - Item entity DTO containing title, description, starting price, end date, and seller metadata.
 * @returns {Promise<Response>} Raw Fetch API `Response` object on success.
 * @throws {Error} Throws an error if item creation fails.
 */
export async function createItem(itemData) {
    const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    if (!response.ok) throw new Error(`Creation failed: ${response.status}`);
    return response;
}

/**
 * Fetches a list of auction items matching optional filter criteria (keyword, category, price constraints).
 *
 * @async
 * @function getItems
 * @param {Object} [filters={}] - Optional filter key-value map.
 * @param {string} [filters.keyword] - Search string for matching title or description.
 * @param {number|string} [filters.categoryId] - Specific category ID filter.
 * @param {number} [filters.minPrice] - Minimum active price threshold.
 * @param {number} [filters.maxPrice] - Maximum active price threshold.
 * @returns {Promise<Array<Object>>} Array of item objects.
 * @throws {Error} Throws an error if items retrieval fails.
 */
export async function getItems(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}/items?${queryParams}` : `${API_BASE_URL}/items`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Items fetch failed: ${response.status}`);
    return response.json();
}

/**
 * Fetches comprehensive details for a single auction item by unique identifier.
 *
 * @async
 * @function getItemById
 * @param {number|string} id - Unique primary key identifier of target item.
 * @returns {Promise<Object>} Detailed item DTO including images, bids history, and seller details.
 * @throws {Error} Throws an error if the item cannot be found or server fails.
 */
export async function getItemById(id) {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch item ${id}`);
    return response.json();
}

/* ============================================================================
   User Activity API Services
   ============================================================================ */

/**
 * Retrieves historical activity dataset for a given user ID (`bids`, `sales`, and `wins`).
 *
 * @async
 * @function getActivity
 * @param {number|string} userId - Unique identifier of target authenticated user.
 * @returns {Promise<{bids: Array<Object>, sales: Array<Object>, wins: Array<Object>}>} User activity map.
 * @throws {Error} Throws an error if activity fetching fails.
 */
export async function getActivity(userId) {
    const response = await fetch(`${API_BASE_URL}/activity?userId=${userId}`);
    if (!response.ok) throw new Error(`Activity fetch failed: ${response.status}`);
    return response.json();
}

/* ============================================================================
   Bidding Transaction API Services
   ============================================================================ */

/**
 * Submits a new manual or proxy bid transaction payload for an active auction item.
 *
 * @async
 * @function placeBid
 * @param {Object} bidData - Bid payload structure.
 * @param {number|string} bidData.itemId - Target item primary key ID.
 * @param {number|string} bidData.userId - Bidding user primary key ID.
 * @param {number} [bidData.amount] - Manual bid value in currency units.
 * @param {number|null} [bidData.maxProxyAmount] - Maximum automatic proxy bid ceiling.
 * @returns {Promise<Object>} JSON confirmation object of placed bid response.
 * @throws {Error} Throws an error with backend failure message or generic HTTP status error.
 */
export async function placeBid(bidData) {
    const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `שגיאה בהגשת הצעה (${response.status})`);
    }

    return response.json();
}