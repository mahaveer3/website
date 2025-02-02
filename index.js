let products = [];
let filteredProducts = [];
let currentCategory = 'all';

async function loadProducts() {
    toggleSkeletonLoader(true);
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorContainer = document.getElementById('errorContainer');
    const productsList = document.getElementById('productsList');

    loadingSpinner.style.display = 'block';
    errorContainer.style.display = 'none';
    productsList.innerHTML = '';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        products = data;
        filteredProducts = [...products];
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        errorContainer.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
        toggleSkeletonLoader(false);
    }
}

function displayProducts(productsData) {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    if (!productsData || productsData.length === 0) {
        productsList.innerHTML = '<div class="no-products">No products found</div>';
        return;
    }

    productsData.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Handle both single image and images array
        const images = getProductImages(product);
        const mainImage = images.length > 0 
            ? images[0] 
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${mainImage}" class="product-img" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='">
            </div>
            <div class="product-details">
                <div class="product-category">${product.category || 'General'}</div>
                <h3 class="product-title" title="${product.name}">${product.name}</h3>
                <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn">Add to Cart</button>
                    <button class="wishlist-btn">♥</button>
                </div>
            </div>
        `;
        
        productCard.addEventListener('click', () => showProductPopup(product));
        productsList.appendChild(productCard);
    });
}

function showProductPopup(product) {
    const popup = document.querySelector('.product-popup');
    const overlay = document.querySelector('.popup-overlay');

    if (!popup || !overlay) return;

    // Get all images
    const images = getProductImages(product);
    
    // Update gallery thumbs
    const galleryThumbs = popup.querySelector('.gallery-thumbs');
    galleryThumbs.innerHTML = images.map((img, index) => `
        <div class="gallery-thumb ${index === 0 ? 'active' : ''}" data-image="${img}">
            <img src="${img}" alt="${product.name} - Image ${index + 1}">
        </div>
    `).join('');

    // Add click handlers to thumbs
    galleryThumbs.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Update main image
            document.getElementById('productZoomImage').src = thumb.dataset.image;
            // Update active state
            galleryThumbs.querySelector('.active')?.classList.remove('active');
            thumb.classList.add('active');
        });
    });

    // Update other content
    const zoomImage = document.getElementById('productZoomImage');
    const popupCategory = popup.querySelector('.product-category');
    const popupTitle = popup.querySelector('.product-name');
    const popupPrice = popup.querySelector('.price');
    const popupDescription = popup.querySelector('.description');
    const popupBuyButton = popup.querySelector('.buy-btn');

    if (zoomImage) zoomImage.src = images[0];
    if (zoomImage) zoomImage.alt = product.name;
    if (popupCategory) popupCategory.textContent = product.category || 'General';
    if (popupTitle) popupTitle.textContent = product.name;
    if (popupPrice) popupPrice.textContent = `₹${product.price.toLocaleString('en-IN')}`;
    if (popupDescription) popupDescription.textContent = product.description || '';
    if (popupBuyButton) popupBuyButton.href = product.amazonLink || '#';

    const descriptionBlock = popup.querySelector('.description-block');
    const description = product.description || 'No description available';
    
    // Update description content with enhanced structure
    descriptionBlock.innerHTML = `
        <h3>Product Description</h3>
        <div class="description-content">
            <p class="description">${description}</p>
            ${product.features ? `
                <div class="features-section">
                    <h4>Key Features</h4>
                    <ul class="features-list">
                        ${product.features.map(feature => `
                            <li><span class="feature-icon">•</span>${feature}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            ${product.specifications ? `
                <div class="specs-section">
                    <h4>Specifications</h4>
                    <ul class="specs-list">
                        ${Object.entries(product.specifications).map(([key, value]) => `
                            <li><strong>${key}:</strong> ${value}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    // Show popup
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    
    document.body.style.overflow = 'hidden';

    // Add event listeners for closing
    const closeBtn = popup.querySelector('.close-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProductPopup);
    }

    // Add event listener for Escape key
    document.addEventListener('keydown', handleEscKey);
    
    document.body.style.overflow = 'hidden';
    initializeZoom();
}

function closeProductPopup() {
    const popup = document.querySelector('.product-popup');
    const overlay = document.querySelector('.popup-overlay');
    
    if (popup && overlay) {
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';
        
        document.body.style.overflow = '';
        
        // Remove Escape key event listener
        document.removeEventListener('keydown', handleEscKey);
    }
}

// Handle Escape key press
function handleEscKey(event) {
    if (event.key === 'Escape') {
        closeProductPopup();
    }
}

// Add click event for overlay to close popup
document.querySelector('.popup-overlay')?.addEventListener('click', closeProductPopup);

function showProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalMainImage = document.getElementById('modalMainImage');
    const modalProductName = document.getElementById('modalProductName');
    const modalProductPrice = document.getElementById('modalProductPrice');
    const modalProductDescription = document.getElementById('modalProductDescription');
    const modalAmazonLink = document.getElementById('modalAmazonLink');

    // Update modal content
    modalMainImage.src = product.image;
    modalProductName.textContent = product.name;
    modalProductPrice.textContent = `₹${product.price.toLocaleString('en-IN')}`;
    modalProductDescription.textContent = product.description;
    modalAmazonLink.href = product.amazonLink;

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close modal functionality
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close on click outside
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// Helper function to get image URL with fallback
function getProductImageUrl(product) {
    if (!product) return '';
    
    const images = getProductImages(product);
    return images.length > 0 ? images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
}

function initializeZoom() {
    const container = document.getElementById('productZoomContainer');
    const image = document.getElementById('productZoomImage');
    const popup = document.querySelector('.zoom-popup');
    const zoomArea = document.createElement('div');
    zoomArea.className = 'zoom-area';
    container.appendChild(zoomArea);

    if (!container || !image || !popup) return;

    let imageLoaded = false;
    let naturalWidth, naturalHeight;

    image.addEventListener('load', function() {
        imageLoaded = true;
        naturalWidth = this.naturalWidth;
        naturalHeight = this.naturalHeight;

        // Set the background image of the popup
        popup.style.backgroundImage = `url('${this.src}')`;
        
        // Calculate zoom ratio based on natural image dimensions
        const zoomRatio = 2;
        const aspectRatio = naturalWidth / naturalHeight;
        
        // Use natural dimensions for background size to prevent blurriness
        if (aspectRatio > 1) {
            // Landscape image
            popup.style.backgroundSize = `${naturalWidth * zoomRatio}px auto`;
        } else {
            // Portrait image
            popup.style.backgroundSize = `auto ${naturalHeight * zoomRatio}px`;
        }
    });

    container.addEventListener('mousemove', function(e) {
        if (!imageLoaded) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Show zoom elements when mouse is over the container
        if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
            zoomArea.style.display = 'block';
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';

            // Position the zoom area
            const zoomAreaWidth = zoomArea.offsetWidth;
            const zoomAreaHeight = zoomArea.offsetHeight;
            
            let newX = mouseX - (zoomAreaWidth / 2);
            let newY = mouseY - (zoomAreaHeight / 2);

            // Constrain zoom area to container bounds
            newX = Math.max(0, Math.min(newX, rect.width - zoomAreaWidth));
            newY = Math.max(0, Math.min(newY, rect.height - zoomAreaHeight));

            zoomArea.style.transform = `translate(${newX}px, ${newY}px)`;

            // Calculate the position for the zoomed image
            const xPercentage = (newX / (rect.width - zoomAreaWidth)) * 100;
            const yPercentage = (newY / (rect.height - zoomAreaHeight)) * 100;

            // Update the background position of the popup
            popup.style.backgroundPosition = `${xPercentage}% ${yPercentage}%`;
        } else {
            hideZoom();
        }
    });

    function hideZoom() {
        zoomArea.style.display = 'none';
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
    }

    container.addEventListener('mouseleave', hideZoom);
}

// Add this helper function to handle both image formats
function getProductImages(product) {
    // Check if product has images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        return product.images;
    }
    // Check if product has single image
    if (product.image) {
        return [product.image];
    }
    // Return empty array if no images found
    return [];
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    sortProducts();
    displayProducts(filteredProducts);
}

function sortProducts() {
    const sortSelect = document.getElementById('sortBy');
    const sortBy = sortSelect.value;

    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            filteredProducts = [...products];
    }

    displayProducts(filteredProducts);
}

function toggleBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;

    if (window.scrollY > 300) {
        backToTopButton.style.display = 'flex';
    } else {
        backToTopButton.style.display = 'none';
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide skeleton loader
function toggleSkeletonLoader(show) {
    const skeleton = document.getElementById('skeletonLoader');
    const productsList = document.getElementById('productsList');
    
    if (show) {
        skeleton.style.display = 'block';
        productsList.style.display = 'none';
    } else {
        skeleton.style.display = 'none';
        productsList.style.display = 'grid';
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href').substring(1);
        const element = document.getElementById(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortBy');
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', sortProducts);
    }
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            filterProducts();
        });
    });

    window.addEventListener('scroll', toggleBackToTop);
    
    loadProducts();
});