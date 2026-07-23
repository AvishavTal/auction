/**
 * @file publish.js
 * @module publish-item
 * @description Item Publishing Controller Module.
 *              Handles the lifecycle for creating and publishing new auction items,
 *              including authentication enforcement, dynamic category loading,
 *              custom date/time split picker population, temporal validation,
 *              binary image upload processing, and API payload submission.
 * @requires ../../shared/js/layout.js:injectNavbar,requireLogin
 * @requires ../../shared/js/api.js:getCategories,uploadImage,createItem
 */

import { injectNavbar, requireLogin } from '../../shared/js/layout.js';
import { getCategories, uploadImage, createItem } from '../../shared/js/api.js';

/* ============================================================================
   DOM Element References
   ============================================================================ */

/** @type {HTMLFormElement} Primary form element for publishing items. */
const form = document.getElementById('publishItemForm');

/** @type {HTMLSelectElement} Dropdown element for category selection. */
const categorySelect = document.getElementById('categoryId');

/** @type {HTMLButtonElement} Primary submit action button. */
const submitBtn = document.getElementById('submitBtn');

/** @type {HTMLButtonElement} Cancellation button resetting form inputs. */
const cancelBtn = document.getElementById('cancelBtn');

/** @type {HTMLElement} Alert message banner container. */
const uiMessage = document.getElementById('uiMessage');

// Split DateTime UI Elements
/** @type {HTMLInputElement} Date input element for auction end date. */
const endDateInput = document.getElementById('endDate');

/** @type {HTMLSelectElement} Dropdown element for selecting expiration hour. */
const endHourSelect = document.getElementById('endHour');

/** @type {HTMLSelectElement} Dropdown element for selecting expiration minute. */
const endMinuteSelect = document.getElementById('endMinute');

/* ============================================================================
   UI Helper & Initializer Functions
   ============================================================================ */

/**
 * Renders status alerts or operational error messages in the UI notification bar.
 * Automatically clears displayed messages after a 5-second delay.
 *
 * @param {string} text - The message content to present.
 * @param {boolean} [isError=false] - If true, applies error styling; otherwise success styling.
 * @returns {void}
 */
function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
    setTimeout(() => { uiMessage.style.display = 'none'; }, 5000);
}

/**
 * Programmatically constructs `<option>` tags for hour (00-23) and minute (00-59) select dropdowns.
 * Guarantees click-only interaction across modern browser vendors.
 *
 * @returns {void}
 */
function populateTimeDropdowns() {
    if (!endHourSelect || !endMinuteSelect) return;

    // Populate Hours (00 - 23)
    let hourOptions = '<option value="" disabled selected>שעה</option>';
    for (let h = 0; h < 24; h++) {
        const hourString = h.toString().padStart(2, '0');
        hourOptions += `<option value="${hourString}">${hourString}</option>`;
    }
    endHourSelect.innerHTML = hourOptions;

    // Populate Minutes (00 - 59)
    let minuteOptions = '<option value="" disabled selected>דקות</option>';
    for (let m = 0; m < 60; m++) {
        const minuteString = m.toString().padStart(2, '0');
        minuteOptions += `<option value="${minuteString}">${minuteString}</option>`;
    }
    endMinuteSelect.innerHTML = minuteOptions;
}

/**
 * Programmatically triggers the native browser date picker interface if supported.
 *
 * @param {HTMLInputElement} inputEl - Target date input DOM element.
 * @returns {void}
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

/* ============================================================================
   Lifecycle Initialization & Event Handling
   ============================================================================ */

/**
 * Initializes the view on load. Validates user authentication, injects navbar,
 * populates time select lists, restricts past calendar dates, and retrieves category options from API.
 *
 * @async
 * @returns {Promise<void>}
 */
async function initialize() {
    if (!requireLogin()) return;
    await injectNavbar();

    // Dynamically build hours and minutes dropdowns
    populateTimeDropdowns();

    // Restrict date input to prevent selecting past calendar days
    if (endDateInput) {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        endDateInput.min = formattedToday;
    }

    // Fetch dynamic categories list
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

    // Bind click handler to launch native calendar dialog
    if (endDateInput) {
        endDateInput.addEventListener('click', () => forceNativeDatePicker(endDateInput));
    }
}

/**
 * Handles form submission: validates file uploads and end-times, uploads image binary,
 * constructs ISO 8601 payload, and posts new auction item record to API.
 *
 * @async
 * @param {SubmitEvent} event - Native DOM form submission event.
 * @returns {Promise<void>}
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'מעבד פרסום...';
    uiMessage.style.display = 'none';

    try {
        const fileInput = document.getElementById('imageFile');
        if (!fileInput.files[0]) throw new Error('אנא בחר קובץ תמונה להעלאה.');

        // Extract date and time parameters
        const rawDate = endDateInput.value;   
        const rawHour = endHourSelect.value;   
        const rawMinute = endMinuteSelect.value; 

        if (!rawDate || !rawHour || !rawMinute) {
            throw new Error('אנא מלא את כל שדות התאריך והשעה של סיום המכרז.');
        }
        
        // Construct ISO-8601 string: "YYYY-MM-DDTHH:MM:00"
        const combinedIsoDateTime = `${rawDate}T${rawHour}:${rawMinute}:00`;

        // Temporal Validation: Ensure expiration timestamp is in the future
        const targetDateTime = new Date(combinedIsoDateTime);
        const currentDateTime = new Date();

        if (targetDateTime <= currentDateTime) {
            throw new Error('מועד סיום המכרז חייב להיות זמן עתידי בלבד (מאוחר יותר מהשעה הנוכחית).');
        }

        // Binary Image Upload
        const uploadResponse = await uploadImage(fileInput.files[0]);
        const uploadedImagePath = uploadResponse.imagePath;

        // Map Payload Object
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            startingPrice: parseFloat(document.getElementById('startingPrice').value),
            endTime: combinedIsoDateTime,
            sellerId: currentUser?.id,
            category: { id: parseInt(categorySelect.value, 10) },
            images: [
                { imageUrl: uploadedImagePath }
            ]
        };

        // Post new item entity
        await createItem(payload);

        showStatus('המוצר פורסם בהצלחה!', false);
        form.reset();
        
        // Reset dropdown selectors to default state
        populateTimeDropdowns();
        
    } catch (err) {
        console.error('Submission transaction failure:', err);
        showStatus(`פרסום המכירה נכשל: ${err.message}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'פרסם מכירה עכשיו';
    }
}

/* ============================================================================
   Event Listener Registrations
   ============================================================================ */

document.addEventListener('DOMContentLoaded', initialize);
form.addEventListener('submit', handleFormSubmit);

cancelBtn.addEventListener('click', () => {
    form.reset();
    populateTimeDropdowns();
    uiMessage.style.display = 'none';
});