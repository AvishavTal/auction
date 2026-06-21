const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Shared API Layer with temporary Client-Side Mocking for unfinished backend routes.
 * All comments are in English.
 */

export async function getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`Categories fetch failed: ${response.status}`);
    return response.json();
}

export function getImageUrl(filename) {
    if (!filename) return '../../shared/components/placeholder.png';
    return `${API_BASE_URL}/media/${filename}`;
}

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

export async function createItem(itemData) {
    const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    
    if (!response.ok) throw new Error(`Creation failed: ${response.status}`);
    return response;
}

export async function getItems(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}/items?${queryParams}` : `${API_BASE_URL}/items`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Items fetch failed: ${response.status}`);
    return response.json();
}

/**
 * Fetches item and injects locally stored mock bids to simulate backend tracking
 */
export async function getItemById(id) {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch item ${id}`);
    const item = await response.json();
    
    // Inject client-side mock bids so they persist on page refresh during testing
    const localBids = JSON.parse(localStorage.getItem(`mock_bids_${id}`)) || [];
    if (localBids.length > 0) {
        item.lastBids = [...localBids, ...(item.lastBids || [])].slice(0, 5);
        item.currentPrice = Math.max(item.currentPrice || 0, localBids[0].amount);
    }
    
    return item;
}
/**
 * TEMPORARY MOCK: Simulates backend bid persistence using localStorage.
 * Robust fallback added to support both old and new payload structures.
 */
export async function placeBid(bidData) {
    // Robust check: extract ID whether it's nested (item.id) or flat (itemId)
    const itemId = bidData.item ? bidData.item.id : bidData.itemId;
    
    if (!itemId) {
        throw new Error("Missing item identifier in bid request");
    }

    const localBids = JSON.parse(localStorage.getItem(`mock_bids_${itemId}`)) || [];
    
    const mockNewBid = {
        username: bidData.username || `User_${bidData.userId || 1}`,
        amount: bidData.amount,
        bidTime: new Date().toISOString(),
        isProxy: !!bidData.maxProxyAmount
    };
    
    // Save to local storage array
    localBids.unshift(mockNewBid);
    localStorage.setItem(`mock_bids_${itemId}`, JSON.stringify(localBids));
    
    // Simulate server response latency
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ status: "CREATED", bid: mockNewBid });
        }, 500);
    });
}