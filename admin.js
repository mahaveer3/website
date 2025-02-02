//script .js

let products = JSON.parse(localStorage.getItem('products')) || [];
let sidebarState = localStorage.getItem('sidebarState') === 'collapsed';

// Remove all form-related functions (showAddForm, hideAddForm, handleFiles, etc.)

// Keep the following functions:
async function loadProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) {
        console.error('Products list element not found');
        return; // Exit if element doesn't exist
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/products');
        const productsData = await response.json();
        if (Array.isArray(productsData)) {
            products = productsData; // Update global products array
            displayProducts(productsData);
            updateStats(productsData.length); // Update stats after products are loaded
            updateCategoryCount(); // Add this line to update category counts
        } else {
            productsList.innerHTML = '<p>No products available</p>';
            updateStats(0); // Still update stats even if no products
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productsList.innerHTML = '<p>Error loading products</p>';
        updateStats(0); // Update stats even on error
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/products/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            alert('Product deleted successfully!');
            await loadProducts(); // Wait for products to load
            updateCategoryCount(); // Update category counts
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to delete product');
        }
    }
}

function displayProducts(productsData) {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    if (!productsData || productsData.length === 0) {
        productsList.innerHTML = '<p>No products available</p>';
        updateStats(0);
        return;
    }

    // Display all products
    productsData.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item fade-in';
        productDiv.setAttribute('data-product-id', product._id); // Add this line
        productDiv.setAttribute('data-category', product.category || 'general');
        
        // Handle multiple images or fallback to single image
        const images = product.images && product.images.length > 0 ? product.images : [product.image];
        const imageGallery = images.map(img => `<img src="${img}" alt="${product.name}" class="product-image">`).join('') || '<div class="no-image">No Image</div>';

        // Format price with commas for Indian currency
        const formattedPrice = product.price.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });

        // Create a truncated description
        const shortDescription = product.description.length > 150 
            ? product.description.substring(0, 150) + '...' 
            : product.description;

        // Add category class for styling
        const categoryClass = product.category ? `category-${product.category}` : '';
        const categoryIcon = categoryIcons[product.category] || categoryIcons[''];

        productDiv.innerHTML = `
            <div class="product-images">
                ${imageGallery}
            </div>
            <div class="product-info">
                <div class="product-category ${categoryClass}">
                    <span class="category-icon">${categoryIcon}</span>
                    ${product.category || 'General'}
                </div>
                <h3>${product.name}</h3>
                <p class="product-description">${shortDescription}</p>
                <div class="product-meta">
                    <span class="product-price">₹${formattedPrice}</span>
                    <span class="product-link">
                        <a href="${product.amazonLink}" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 1 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            View on Amazon
                        </a>
                    </span>
                </div>
            </div>
            <div class="product-actions">
                <button onclick="editProduct('${product._id}')" class="edit-btn">
                    <span class="btn-icon">✏️</span> Edit
                </button>
                <button onclick="deleteProduct('${product._id}')" class="delete-btn">
                    <span class="btn-icon">🗑️</span> Delete
                </button>
            </div>
        `;
        productsList.appendChild(productDiv);

        // Add staggered animation
        setTimeout(() => {
            productDiv.classList.add('visible');
        }, index * 100);
    });

    updateStats(productsData.length);
}

function editProduct(id) {
    // Find product in either regular products list or highlighted products
    const product = products.find(p => p._id === id);
    if (!product) {
        console.error('Product not found:', id);
        return;
    }

    const modal = document.getElementById('addProductForm');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    // Show the modal
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    const modalContent = modal.querySelector('.modal-content');
    const submitBtn = modal.querySelector('.submit-btn');
    const modalTitle = modal.querySelector('.modal-header h2');

    // Update modal title and button text
    modalTitle.innerHTML = '<span class="form-icon">✏️</span> Edit Product';
    submitBtn.textContent = 'Update Product';
    
    // Fill form fields
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('amazonLink').value = product.amazonLink || '';
    
    // Handle image
    uploadedImages = product.image ? [{ 
        id: Date.now(), 
        url: product.image, 
        name: 'Current Image' 
    }] : [];
    updateImagePreviews();
    
    editingProductId = id;

    // Center the modal in viewport
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    modalContent.style.top = `${scrollTop + (viewportHeight / 2.50)}px`;
    
    requestAnimationFrame(() => {
        modal.classList.add('active');
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translate(-50%, 0) scale(1)';
    });

    // Update edit product to handle formatted description
    if (product) {
        document.querySelector('.editor-content').innerHTML = product.description;
        document.getElementById('descriptionHtml').value = product.description;
    }

    // Set category
    const categorySelect = document.getElementById('productCategory');
    const categoryIcon = document.getElementById('categoryIcon');
    if (categorySelect && categoryIcon) {
        categorySelect.value = product.category || '';
        categoryIcon.textContent = categoryIcons[product.category] || categoryIcons[''];
    }

    setTimeout(initDescriptionEditor, 100); // Initialize after modal is shown
}

// Keep update prices functionality
async function updateAllPrices(event) {
    if (event) event.preventDefault();
    
    const updateButton = document.querySelector('.update-prices-btn');
    if (!updateButton || updateButton.classList.contains('loading')) return;
    
    const loader = updateButton.querySelector('.loader');
    const btnText = updateButton.querySelector('.btn-text');
    
    if (!btnText || !loader) {
        console.error('Required button elements not found');
        return;
    }
    
    updateButton.classList.add('loading');
    loader.style.display = 'block';
    btnText.textContent = 'Updating...';
    btnText.style.color = 'white';

    // Show initial progress alert
    const currentAlert = showCustomAlert('Price Update', 'Starting price update...', [], true);
    updateProgressBar(0);
    updateProgressText(0);

    try {
        const response = await fetch('http://127.0.0.1:5000/api/update-prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.progress !== undefined) {
                            updateProgressBar(data.progress);
                            updateProgressText(data.progress);
                        }
                        
                        if (data.complete) {
                            if (currentAlert) {
                                closeCustomAlert(currentAlert);
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }

                            const message = data.updates.length > 0
                                ? `Updated ${data.updates.length} out of ${data.totalProducts} products`
                                : 'All prices are up to date!';

                            showCustomAlert(
                                data.updates.length > 0 ? 'Update Successful' : 'No Updates Needed',
                                message,
                                data.updates
                            );
                            
                            await loadProducts();
                            break;
                        }

                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } catch (error) {
                        console.error('Error parsing SSE data:', error);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Price update error:', error);
        showCustomAlert('Error', `Failed to update prices: ${error.message}`);
    } finally {
        updateButton.classList.remove('loading');
        loader.style.display = 'none';
        btnText.textContent = 'Update All Prices';
        btnText.style.color = 'white';
    }
}

// ...existing code...

function showCustomAlert(title, message, updates = [], showProgressBar = false) {
    const existingAlerts = document.querySelectorAll('.alert-overlay');
    existingAlerts.forEach(alert => alert.parentNode?.removeChild(alert));

    const alertOverlay = document.createElement('div');
    alertOverlay.className = 'alert-overlay';
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';

    const content = `
        <div class="alert-header">
            <span class="alert-icon">${showProgressBar ? '🔄' : '✨'}</span>
            <span class="alert-title">${title}</span>
        </div>
        <div class="alert-content">
            <div class="alert-message">${message}</div>
            ${showProgressBar ? `
                <div class="progress-wrapper">
                    <div class="progress-bar">
                        <div class="progress"></div>
                    </div>
                    <div class="progress-text">Starting update...</div>
                </div>
            ` : ''}
            ${updates.length > 0 ? `
                <ul>
                    ${updates.map((update, index) => `
                        <li style="animation-delay: ${index * 100}ms">
                            <span class="product-name">${update.name}</span>
                            <span class="price-change">
                                <span class="old-price">₹${update.oldPrice}</span>
                                <span class="arrow">→</span>
                                <span class="new-price">₹${update.newPrice}</span>
                            </span>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
        </div>
        <div class="alert-buttons">
            <button class="alert-btn alert-btn-primary">Close</button>
        </div>
    `;

    alertBox.innerHTML = content;
    
    // Add close button functionality
    const closeButton = alertBox.querySelector('.alert-btn');
    closeButton.onclick = () => closeCustomAlert(alertOverlay);

    // Add ESC key functionality
    document.addEventListener('keydown', function escHandler(event) {
        if (event.key === 'Escape') {
            closeCustomAlert(alertOverlay);
            document.removeEventListener('keydown', escHandler);
        }
    });

    alertOverlay.appendChild(alertBox);
    document.body.appendChild(alertOverlay);

    // Trigger animations
    requestAnimationFrame(() => {
        alertOverlay.classList.add('show');
        alertBox.classList.add('show');
    });

    return alertOverlay;
}

// Keep search and filter functionality
// ...existing code...

async function loadHighlightedProducts() {
    const highlightedProductsList = document.getElementById('highlightedProductsList');
    try {
        const response = await fetch('http://127.0.0.1:5000/api/products');
        const productsData = await response.json();
        if (Array.isArray(productsData)) {
            // Update the global products array
            products = productsData;
            // Update stats before displaying products
            updateStats(products.length);
            // Shuffle and limit the products for display
            const shuffledProducts = [...productsData].sort(() => 0.5 - Math.random());
            const limitedProductsData = shuffledProducts.slice(0, 6);
            displayHighlightedProducts(limitedProductsData);
        } else {
            highlightedProductsList.innerHTML = '<p>No highlighted products available</p>';
            updateStats(0);
        }
    } catch (error) {
        console.error('Error loading highlighted products:', error);
        highlightedProductsList.innerHTML = '<p>Error loading highlighted products</p>';
        updateStats(0);
    }
}

function displayHighlightedProducts(productsData) {
    const highlightedProductsList = document.getElementById('highlightedProductsList');
    highlightedProductsList.innerHTML = '';

    if (!productsData || productsData.length === 0) {
        highlightedProductsList.innerHTML = '<p>No highlighted products available</p>';
        return;
    }

    // Display highlighted products
    productsData.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item fade-in';
        productDiv.setAttribute('data-product-id', product._id); // Add this line
        
        // Handle multiple images or fallback to single image
        const images = product.images && product.images.length > 0 ? product.images : [product.image];
        const imageGallery = images.map(img => `<img src="${img}" alt="${product.name}" class="product-image">`).join('') || '<div class="no-image">No Image</div>';

        // Format price with commas for Indian currency
        const formattedPrice = product.price.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });

        // Create a truncated description
        const shortDescription = product.description.length > 150 
            ? product.description.substring(0, 150) + '...' 
            : product.description;

        // Add category class for styling
        const categoryClass = product.category ? `category-${product.category}` : '';
        const categoryIcon = categoryIcons[product.category] || categoryIcons[''];

        productDiv.innerHTML = `
            <div class="product-images">
                ${imageGallery}
            </div>
            <div class="product-info">
                <div class="product-category ${categoryClass}">
                    <span class="category-icon">${categoryIcon}</span>
                    ${product.category || 'General'}
                </div>
                <h3>${product.name}</h3>
                <p class="product-description">${shortDescription}</p>
                <div class="product-meta">
                    <span class="product-price">₹${formattedPrice}</span>
                    <span class="product-link">
                        <a href="${product.amazonLink}" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 1 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            View on Amazon
                        </a>
                    </span>
                </div>
            </div>
            <div class="product-actions">
                <button onclick="editProduct('${product._id}')" class="edit-btn">
                    <span class="btn-icon">✏️</span> Edit
                </button>
                <button onclick="deleteProduct('${product._id}')" class="delete-btn">
                    <span class="btn-icon">🗑️</span> Delete
                </button>
            </div>
        `;
        highlightedProductsList.appendChild(productDiv);

        // Add staggered animation
        setTimeout(() => {
            productDiv.classList.add('visible');
        }, index * 100);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'admin.html') {
        loadHighlightedProducts();
        updateStats(products.length);
    } else if (currentPage === 'products.html' || currentPage === '') {
        // Added check for empty page name (index page)
        loadProducts();
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            const filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            );
            displayProducts(filteredProducts);
        });
    }

    // Remove or modify the Enter key handler
    document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('addProductForm');
        if (event.key === 'Enter' && modal.classList.contains('active')) {
            // Only prevent default and close if not in an input, textarea, or contenteditable
            if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && 
                !document.activeElement.hasAttribute('contenteditable')) {
                event.preventDefault();
                hideAddForm();
            }
        }
    });

    // Initialize editor on form show
    const addProductBtn = document.querySelector('.add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            setTimeout(initDescriptionEditor, 100); // Initialize after modal is shown
        });
    }
});

function updateStats(count) {
    const totalProductsElement = document.getElementById('totalProducts');
    if (totalProductsElement) {
        // Animate number counting from 0 to final count
        const duration = 1500; // Animation duration in milliseconds
        const start = parseInt(totalProductsElement.textContent) || 0;
        const end = count || 0;
        const range = end - start;
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuad for smoother animation
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const currentCount = Math.floor(start + (range * easeProgress));
            
            totalProductsElement.textContent = currentCount;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        }

        requestAnimationFrame(updateCount);
    }
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// ...existing code...

// Add category icons mapping
const categoryIcons = {
    electronics: '🔌',
    fashion: '👕',
    home: '🏠',
    books: '📚',
    beauty: '✨',
    sports: '⚽',
    '': '📱' // default icon
};

// Update showAddForm to include category initialization
function showAddForm() {
    const modal = document.getElementById('addProductForm');
    const modalContent = modal.querySelector('.modal-content');
    const submitBtn = modal.querySelector('.submit-btn');
    const modalTitle = modal.querySelector('.modal-header h2');
    
    // Reset form and prepare modal
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    uploadedImages = [];
    editingProductId = null;

    // Update modal title and button text
    modalTitle.innerHTML = '<span class="form-icon">✨</span> Add New Product';
    submitBtn.textContent = 'Add Product';

    // Show modal with animation
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Ensure the modal stays at the top
    modalContent.style.top = '320px';
    modalContent.style.transform = 'translate(-50%, 0) scale(0.9)';
    
    requestAnimationFrame(() => {
        modal.classList.add('active');
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translate(-50%, 0) scale(1)';
        
        // Scroll window to top of form with smooth animation
        window.scrollTo({
            top: modalContent.offsetTop = 30,
            behavior: 'smooth'
        });
    });

    // Initialize editor when form is shown
    setTimeout(initDescriptionEditor, 100); // Initialize after modal is shown

    // Reset category select and icon
    const categorySelect = document.getElementById('productCategory');
    const categoryIcon = document.getElementById('categoryIcon');
    if (categorySelect && categoryIcon) {
        categorySelect.value = '';
        categoryIcon.textContent = categoryIcons[''];
    }
}

function hideAddForm() {
    const modal = document.getElementById('addProductForm');
    const modalContent = modal.querySelector('.modal-content');
    
    // Add closing animation
    modalContent.style.transform = 'translate(-50%, -50%) scale(0.95)';
    modalContent.style.opacity = '0';
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.getElementById('productForm').reset();
        uploadedImages = [];
        updateImagePreviews();
    }, 300); // Match CSS transition duration
}

let uploadedImages = [];
let editingProductId = null; // Add this at the top level

document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    
    productForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('descriptionHtml').value,
            category: document.getElementById('productCategory').value, // Add category
            image: uploadedImages.map(img => img.url), // Convert array of image objects to array of URLs
            amazonLink: document.getElementById('amazonLink').value,
        };

        const errors = validateForm(formData);
        
        if (errors.length > 0) {
            showCustomAlert('Validation Error', errors.join('<br>'));
            return;
        }

        try {
            const url = editingProductId 
                ? `http://127.0.0.1:5000/api/products/${editingProductId}`
                : 'http://127.0.0.1:5000/api/products';
                
            const method = editingProductId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${editingProductId ? 'update' : 'add'} product`);
            }

            showCustomAlert('Success', `Product ${editingProductId ? 'updated' : 'added'} successfully!`);
            hideAddForm();
            await loadProducts(); // Wait for products to load
            updateCategoryCount(); // Update category counts
            editingProductId = null; // Reset editing state
            
        } catch (error) {
            console.error('Error:', error);
            showCustomAlert('Error', error.message);
        }
    });

    // Add drag and drop functionality
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('productImage');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('drop', handleDrop, false);
    imageInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Add ESC key functionality to close the "Add New Product" form
    document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('addProductForm');
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            hideAddForm();
        }
    });

    // Add click outside functionality to close the "Add New Product" form
    const modalOverlay = document.getElementById('addProductForm');
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            hideAddForm();
        }
    });

    // Add Enter key functionality to close the form
    document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('addProductForm');
        if (event.key === 'Enter' && modal.classList.contains('active')) {
            // Only close if not typing in an input or textarea
            if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                hideAddForm();
            }
        }
    });

    // Add category change handler
    document.getElementById('productCategory')?.addEventListener('change', function() {
        const icon = categoryIcons[this.value] || categoryIcons[''];
        const categoryIcon = document.getElementById('categoryIcon');
        if (categoryIcon) {
            categoryIcon.textContent = icon;
        }
    });

    // ...existing code...
});

// Add these functions if they don't exist
async function handleFiles(files) {
    for (let file of files) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('http://127.0.0.1:5000/api/uploads', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            
            if (!data.imageUrl) {
                throw new Error('No image URL received from server');
            }

            uploadedImages.push({
                id: Date.now(),
                url: data.imageUrl,
                name: file.name
            });
            
            updateImagePreviews();
        } catch (error) {
            console.error('Error uploading file:', error);
            showCustomAlert('Upload Error', `Failed to upload ${file.name}: ${error.message}`);
        }
    }
}

// Update image preview grid to handle multiple images better
function updateImagePreviews() {
    const imagePreview = document.getElementById('imagePreview');
    
    if (uploadedImages.length === 0) {
        imagePreview.innerHTML = `
            <div class="no-images">
                <span style="font-size: 24px">📷</span>
                <p>No images selected</p>
            </div>`;
        return;
    }

    imagePreview.innerHTML = uploadedImages.map((img, index) => `
        <div class="preview-item fade-in" style="animation-delay: ${index * 100}ms">
            <div class="image-container">
                <img src="${img.url}" alt="${img.name}" onerror="this.src='path/to/fallback-image.jpg';">
            </div>
            <button class="remove-btn" onclick="removeImage('${img.id}')">×</button>
            <div class="image-info">${index === 0 ? 'Main Image' : `Image ${index + 1}`}</div>
        </div>
    `).join('');
}

function removeImage(id) {
    try {
        // Find the image by id and get its URL
        const imageToRemove = uploadedImages.find(img => img.id == id);
        if (!imageToRemove) {
            console.error('Image not found');
            return;
        }

        // Remove image from array first
        uploadedImages = uploadedImages.filter(img => img.id != id);

        // Update the preview immediately
        updateImagePreviews();

        // If it's a server uploaded image (URL contains 'uploads'), remove it from server
        if (imageToRemove.url.includes('/uploads/')) {
            // Extract filename from URL
            const filename = imageToRemove.url.split('/').pop();
            
            // Call server to delete file
            fetch(`http://127.0.0.1:5000/api/uploads/${filename}`, {
                method: 'DELETE'
            }).catch(error => {
                console.error('Error deleting image from server:', error);
            });
        }
    } catch (error) {
        console.error('Error removing image:', error);
    }
}

async function fetchAmazonDetails() {
    const amazonLink = document.getElementById('amazonLink').value;
    const fetchBtn = document.querySelector('.fetch-btn');
    
    if (!amazonLink || !(amazonLink.includes('amazon') || amazonLink.includes('amzn.to'))) {
        showCustomAlert('Error', 'Please enter a valid Amazon product URL');
        return;
    }

    fetchBtn.classList.add('loading');

    try {
        const response = await fetch('http://127.0.0.1:5000/api/fetch-amazon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amazonUrl: amazonLink })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch product details');
        }

        // Populate form fields
        document.getElementById('productName').value = data.name || '';
        document.getElementById('productPrice').value = data.price ? parseFloat(data.price) : '';

        // Format description with bullet points
        const editorContent = document.querySelector('.editor-content');
        const descriptionHtml = document.getElementById('descriptionHtml');
        
        if (editorContent && descriptionHtml && data.description) {
            const lines = data.description
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const formattedDescription = `
                <p>${lines[0]}</p>
                <ul>
                    ${lines.slice(1).map(line => `<li>${line}</li>`).join('')}
                </ul>
            `;

            editorContent.innerHTML = formattedDescription;
            descriptionHtml.value = formattedDescription;
        }
        
        // Handle images
        uploadedImages = []; // Clear existing images
        if (data.images && data.images.length > 0) {
            // Filter out any invalid URLs and convert URLs to uploadedImages format
            const validImages = data.images
                .filter(url => url && url.startsWith('http'))
                .map((url, index) => ({
                    id: Date.now() + index,
                    url: url,
                    name: `Amazon Product Image ${index + 1}`
                }));

            if (validImages.length > 0) {
                uploadedImages = validImages;
                updateImagePreviews();
            } else {
                throw new Error('No valid images found');
            }
        } else {
            throw new Error('No images found in product data');
        }

    } catch (error) {
        console.error('Error:', error);
        showCustomAlert('Error', error.message || 'Failed to fetch product details. Please try again or enter details manually.');
    } finally {
        fetchBtn.classList.remove('loading');
    }
}

// ...existing code...

function showCustomAlert(title, message, updates = [], showProgressBar = false) {
    const existingAlerts = document.querySelectorAll('.alert-overlay');
    existingAlerts.forEach(alert => alert.parentNode?.removeChild(alert));

    const alertOverlay = document.createElement('div');
    alertOverlay.className = 'alert-overlay';
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';

    const content = `
        <div class="alert-header">
            <span class="alert-icon">${showProgressBar ? '🔄' : '✨'}</span>
            <span class="alert-title">${title}</span>
        </div>
        <div class="alert-content">
            <div class="alert-message">${message}</div>
            ${showProgressBar ? `
                <div class="progress-wrapper">
                    <div class="progress-bar">
                        <div class="progress"></div>
                    </div>
                    <div class="progress-text">Starting update...</div>
                </div>
            ` : ''}
            ${updates.length > 0 ? `
                <ul>
                    ${updates.map((update, index) => `
                        <li style="animation-delay: ${index * 100}ms">
                            <span class="product-name">${update.name}</span>
                            <span class="price-change">
                                <span class="old-price">₹${update.oldPrice}</span>
                                <span class="arrow">→</span>
                                <span class="new-price">₹${update.newPrice}</span>
                            </span>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
        </div>
        <div class="alert-buttons">
            <button class="alert-btn alert-btn-primary">Close</button>
        </div>
    `;

    alertBox.innerHTML = content;
    
    // Add close button functionality
    const closeButton = alertBox.querySelector('.alert-btn');
    closeButton.onclick = () => closeCustomAlert(alertOverlay);

    // Add ESC key functionality
    document.addEventListener('keydown', function escHandler(event) {
        if (event.key === 'Escape') {
            closeCustomAlert(alertOverlay);
            document.removeEventListener('keydown', escHandler);
        }
    });

    alertOverlay.appendChild(alertBox);
    document.body.appendChild(alertOverlay);

    // Trigger animations
    requestAnimationFrame(() => {
        alertOverlay.classList.add('show');
        alertBox.classList.add('show');
    });

    return alertOverlay;
}

function updateProgressBar(progress) {
    const progressBar = document.querySelector('.progress-bar .progress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function updateProgressText(progress) {
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.innerHTML = `${Math.round(progress)}%`;
    }
}

// ...existing code...

function closeCustomAlert(alertOverlay) {
    if (alertOverlay && alertOverlay.parentNode) {
        alertOverlay.classList.remove('show');
        setTimeout(() => {
            if (alertOverlay.parentNode) {
                alertOverlay.parentNode.removeChild(alertOverlay);
            }
        }, 300);
    }
}

// ...existing code...

function validateForm(formData) {
    const errors = [];
    
    if (!formData.name.trim()) {
        errors.push('Product name is required');
    }
    
    if (isNaN(formData.price) || formData.price <= 0) {
        errors.push('Please enter a valid price');
    }
    
    if (!formData.description.trim()) {
        errors.push('Product description is required');
    }
    
    if (!formData.category) {
        errors.push('Please select a category');
    }
    
    if (!formData.amazonLink.trim() || 
        !(formData.amazonLink.includes('amazon') || formData.amazonLink.includes('amzn.to'))) {
        errors.push('Please enter a valid Amazon product URL');
    }
    
    return errors;
}

document.addEventListener('DOMContentLoaded', (event) => {
    // ...existing code...
    const element = document.querySelector('#yourElementId');
    if (element) {
        element.addEventListener('click', function() {
            // ...existing code...
        });
    }
    // ...existing code...
});

// Initialize description editor
function initDescriptionEditor() {
    const editor = document.querySelector('.editor-content');
    const toolbar = document.querySelector('.editor-toolbar');
    const hiddenInput = document.getElementById('descriptionHtml');

    if (!editor || !toolbar || !hiddenInput) return;

    // Make editor div focusable
    editor.setAttribute('contenteditable', 'true');

    function updateHiddenInput() {
        hiddenInput.value = editor.innerHTML;
    }

    toolbar.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('button');
        if (!button) return;

        const format = button.dataset.format;
        if (!format) return;

        editor.focus();

        switch (format) {
            case 'bullet-list':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'number-list':
                document.execCommand('insertOrderedList', false, null);
                break;
            case 'bold':
                document.execCommand('bold', false);
                break;
            case 'italic':
                document.execCommand('italic', false);
                break;
            case 'underline':
                document.execCommand('underline', false);
                break;
            case 'heading':
                const level = button.dataset.level || '2';
                document.execCommand('formatBlock', false, `h${level}`);
                break;
        }

        button.classList.toggle('active');
        updateHiddenInput();
    });

    // Handle font and color changes
    const fontFamily = toolbar.querySelector('.font-family');
    const fontSize = toolbar.querySelector('.font-size');
    const textColor = toolbar.querySelector('#textColor');

    if (fontFamily) {
        fontFamily.addEventListener('change', (e) => {
            editor.focus();
            document.execCommand('fontName', false, e.target.value);
            updateHiddenInput();
        });
    }

    if (fontSize) {
        fontSize.addEventListener('change', (e) => {
            editor.focus();
            document.execCommand('fontSize', false, e.target.value);
            updateHiddenInput();
        });
    }

    if (textColor) {
        textColor.addEventListener('change', (e) => {
            editor.focus();
            document.execCommand('foreColor', false, e.target.value);
            updateHiddenInput();
        });
    }

    // Handle Enter key in editor
    editor.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            // Prevent default only if Shift is not pressed
            if (!e.shiftKey) {
                e.preventDefault();
                document.execCommand('insertLineBreak', false);
            }
            updateHiddenInput();
        }
    });

    // Handle paste events
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        updateHiddenInput();
    });

    // Handle input events
    editor.addEventListener('input', updateHiddenInput);

    // Set initial content if exists
    if (editor.innerHTML.trim()) {
        updateHiddenInput();
    }
}

// Update product form submission to include formatted description
document.getElementById('productForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = {
        // ...existing form data...
        description: document.getElementById('descriptionHtml').value,
        // ...existing form data...
    };

    // ...existing submission code...
});

// Update the document keydown handler to ignore Enter key when in editor
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('addProductForm');
    if (event.key === 'Enter' && modal.classList.contains('active')) {
        const activeElement = document.activeElement;
        // Check if we're in the editor or its children
        if (activeElement.closest('.editor-content') || 
            activeElement.closest('.editor-toolbar')) {
            return; // Don't close form when in editor
        }
        
        // Only prevent default and close if not in an input or textarea
        if (!['INPUT', 'TEXTAREA'].includes(activeElement.tagName) && 
            !activeElement.hasAttribute('contenteditable')) {
            event.preventDefault();
            hideAddForm();
        }
    }
});

function initDescriptionEditor() {
    const editor = document.querySelector('.editor-content');
    const toolbar = document.querySelector('.editor-toolbar');
    const hiddenInput = document.getElementById('descriptionHtml');

    if (!editor || !toolbar || !hiddenInput) return;

    // Make editor div focusable
    editor.setAttribute('contenteditable', 'true');

    function updateHiddenInput() {
        hiddenInput.value = editor.innerHTML;
    }

    toolbar.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation(); // Stop event bubbling
        
        const button = e.target.closest('button');
        if (!button) return;

        const format = button.dataset.format;
        if (!format) return;

        editor.focus();

        switch (format) {
            case 'bullet-list':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'number-list':
                document.execCommand('insertOrderedList', false, null);
                break;
            case 'bold':
                document.execCommand('bold', false);
                break;
            case 'italic':
                document.execCommand('italic', false);
                break;
            case 'underline':
                document.execCommand('underline', false);
                break;
            case 'heading':
                const level = button.dataset.level || '2';
                document.execCommand('formatBlock', false, `h${level}`);
                break;
        }

        button.classList.toggle('active');
        updateHiddenInput();
    });

    // Handle Enter key in editor
    editor.addEventListener('keydown', function(e) {
        e.stopPropagation(); // Stop event from reaching document handler
        
        // Allow natural line breaks
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak', false);
            updateHiddenInput();
        }
    });

    // Rest of your existing editor code...
    // ...existing code...
}

// ...existing code...

function updateCategoryCount() {
    const categories = {};
    const allCategories = ['electronics', 'fashion', 'home', 'books', 'beauty', 'sports'];

    // Initialize all categories with 0
    allCategories.forEach(category => {
        categories[category] = 0;
    });

    // Count products in each category
    products.forEach(product => {
        if (product && product.category) {
            const category = product.category.toLowerCase();
            if (categories.hasOwnProperty(category)) {
                categories[category]++;
            }
        }
    });

    // Update category cards
    const categoryCards = document.querySelectorAll('.category-card');
    if (categoryCards) {
        categoryCards.forEach(card => {
            if (card && card.dataset.category) {
                const category = card.dataset.category.toLowerCase();
                const count = categories[category] || 0;
                const countElement = card.querySelector('.item-count');
                if (countElement) {
                    countElement.textContent = `${count} items`;
                    
                    // Add visual feedback when count changes
                    countElement.classList.remove('count-updated');
                    void countElement.offsetWidth; // Trigger reflow
                    countElement.classList.add('count-updated');
                }
            }
        });
    }
}
