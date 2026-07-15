import { injectNavbar, requireLogin } from '../../shared/js/layout.js';
import { getCategories, uploadImage, createItem } from '../../shared/js/api.js';

/**
 * @fileoverview Controller module for Screen 4 (Publishing Items).
 * Handles category retrieval and item publishing transaction pipelines.
 * Features automated runtime populating of Hour/Minute select lists to enforce
 * click-only time selection across all modern browsers (including Firefox).
 * @requires ../../shared/js/layout.js:injectNavbar
 * @requires ../../shared/js/layout.js:requireLogin
 * @requires ../../shared/js/api.js:getCategories
 * @requires ../../shared/js/api.js:uploadImage
 * @requires ../../shared/js/api.js:createItem
 */

const form = document.getElementById('publishItemForm');
const categorySelect = document.getElementById('categoryId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const uiMessage = document.getElementById('uiMessage');

// Explicit split datetime UI selectors
const endDateInput = document.getElementById('endDate');
const endHourSelect = document.getElementById('endHour');
const endMinuteSelect = document.getElementById('endMinute');

/**
 * Renders success/error visual state messages.
 */
function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
    setTimeout(() => { uiMessage.style.display = 'none'; }, 5000);
}

/**
 * Programmatically generates option entries for time-picker dropdown selects.
 * Prevents bloated HTML files by constructing option matrices dynamically.
 */
function populateTimeDropdowns() {
    if (!endHourSelect || !endMinuteSelect) return;

    // 1. Populate Hours (00 - 23)
    let hourOptions = '<option value="" disabled selected>שעה</option>';
    for (let h = 0; h < 24; h++) {
        const hourString = h.toString().padStart(2, '0');
        hourOptions += `<option value="${hourString}">${hourString}</option>`;
    }
    endHourSelect.innerHTML = hourOptions;

    // 2. Populate Minutes (00 - 59)
    let minuteOptions = '<option value="" disabled selected>דקות</option>';
    for (let m = 0; m < 60; m++) {
        const minuteString = m.toString().padStart(2, '0');
        minuteOptions += `<option value="${minuteString}">${minuteString}</option>`;
    }
    endMinuteSelect.innerHTML = minuteOptions;
}

/**
 * Forces native browser date dialog widgets on element click.
 * @param {HTMLInputElement} inputEl 
 */
function forceNativeDatePicker(inputEl) {
    if (inputEl && typeof inputEl.showPicker === 'function') {
        try {
            inputEl.showPicker();
        } catch (error) {
            console.warn('Native datepicker interaction blocked:', error);
        }
    }
}

/**
 * Performs screen authentication verification, navbar injections,
 * populates the time picker selects, and retrieves dynamic category options.
 */
async function initialize() {
    if (!requireLogin()) return;
    await injectNavbar();

    // Dynamically build the hours/minutes selectors
    populateTimeDropdowns();

    try {
        const categories = await getCategories();
        categorySelect.innerHTML = '<option value="" disabled selected>בחר קטגוריה</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Initialization error loading dynamic options:', err);
        categorySelect.innerHTML = '<option value="" disabled>שגיאה בטעינת קטגוריות</option>';
    }

    // Bind full element click handlers to trigger native calendar
    if (endDateInput) {
        endDateInput.addEventListener('click', () => forceNativeDatePicker(endDateInput));
    }
}

/**
 * Validates, uploads physical image files, compiles form data,
 * and converts the split date & select dropdown elements into a standardized ISO-8601 payload.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'מעבד פרסום...';
    uiMessage.style.display = 'none';

    try {
        const fileInput = document.getElementById('imageFile');
        if (!fileInput.files[0]) throw new Error('אנא בחר קובץ תמונה להעלאה.');

        // Step 1: Upload the file binary
        const uploadResponse = await uploadImage(fileInput.files[0]);
        const uploadedImagePath = uploadResponse.imagePath;

        // Step 2: Extract split parameters and combine them into ISO-8601 String
        const rawDate = endDateInput.value;   // e.g., "2026-07-15"
        const rawHour = endHourSelect.value;   // e.g., "18"
        const rawMinute = endMinuteSelect.value; // e.g., "30"

        if (!rawDate || !rawHour || !rawMinute) {
            throw new Error('אנא מלא את כל שדות התאריך והשעה של סיום המכרז.');
        }
        
        // Unified format: "YYYY-MM-DDTHH:MM:00"
        const combinedIsoDateTime = `${rawDate}T${rawHour}:${rawMinute}:00`;

        // Step 3: Build payload mapping structure
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            startingPrice: parseFloat(document.getElementById('startingPrice').value),
            endTime: combinedIsoDateTime, // Dynamic reconstructed ISO String
            sellerId: currentUser?.id,
            category: { id: parseInt(categorySelect.value, 10) },
            images: [
                { imageUrl: uploadedImagePath }
            ]
        };

        // Step 4: Dispatch payload and create item record
        await createItem(payload);

        showStatus('המוצר פורסם בהצלחה!', false);
        form.reset();
        
        // Reset dropdown states to default select prompts
        populateTimeDropdowns();
        
    } catch (err) {
        console.error('Submission transaction failure:', err);
        showStatus(`פרסום המכירה נכשל: ${err.message}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'פרסם מכירה עכשיו';
    }
}

document.addEventListener('DOMContentLoaded', initialize);
form.addEventListener('submit', handleFormSubmit);

cancelBtn.addEventListener('click', () => {
    form.reset();
    populateTimeDropdowns();
    uiMessage.style.display = 'none';
});