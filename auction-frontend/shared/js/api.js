const API_BASE_URL = 'http://localhost:8080/api';

export async function getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`Categories fetch failed: ${response.status}`);
    return response.json();
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


/**
 * Fetches active items from the server.
 * Optional query parameters can be added for filtering/search.
 */
export async function getItems(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/items?${queryParams}`);
    if (!response.ok) throw new Error(`Failed to fetch items. Status: ${response.status}`);
    return response.json();
}


/**
 * Fetch a single product by ID
 */
export async function getItemById(id) {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch item ${id}`);
    return response.json();
}

/**
 * Submit a bid (Manual or Proxy)
 */
export async function placeBid(bidData) {
    const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bid submission failed');
    }
    return response.json();
}