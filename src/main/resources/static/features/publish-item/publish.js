import { injectNavbar, requireLogin } from '../../shared/js/layout.js';
import { getCategories, uploadImage, createItem } from '../../shared/js/api.js';

const form = document.getElementById('publishItemForm');
const categorySelect = document.getElementById('categoryId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const uiMessage = document.getElementById('uiMessage');

function showStatus(text, isError = false) {
    uiMessage.textContent = text;
    uiMessage.className = `ui-message ${isError ? 'error' : 'success'}`;
    uiMessage.style.display = 'block';
    setTimeout(() => { uiMessage.style.display = 'none'; }, 5000);
}

async function initialize() {
    if (!requireLogin()) return;
    await injectNavbar();

    try {
        const categories = await getCategories();
        categorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Initialization error:', err);
        categorySelect.innerHTML = '<option value="" disabled>Error loading categories</option>';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    uiMessage.style.display = 'none';

    try {
        const fileInput = document.getElementById('imageFile');
        if (!fileInput.files[0]) throw new Error('Please select an image file.');

        // Step 1: Upload the file
        const uploadResponse = await uploadImage(fileInput.files[0]);
        const uploadedImagePath = uploadResponse.imagePath;

        // Step 2: Build the payload exactly as the API expects
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            startingPrice: parseFloat(document.getElementById('startingPrice').value),
            endTime: document.getElementById('endTime').value,
            sellerId: currentUser?.id,
            category: { id: parseInt(categorySelect.value, 10) },
            images: [
                { imageUrl: uploadedImagePath }
            ]
        };

        // Step 3: Create the item
        await createItem(payload);

        showStatus('Product successfully published!', false);
        form.reset();
    } catch (err) {
        console.error('Submission error:', err);
        showStatus(`Failed to publish: ${err.message}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'פרסם מכירה עכשיו';
    }
}

document.addEventListener('DOMContentLoaded', initialize);
form.addEventListener('submit', handleFormSubmit);

cancelBtn.addEventListener('click', () => {
    form.reset();
    uiMessage.style.display = 'none';
});
