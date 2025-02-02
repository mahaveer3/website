document.addEventListener('DOMContentLoaded', function() {
    // Initialize editor when page loads
    initDescriptionEditor();
    
    // Re-initialize editor when adding new product
    const addProductBtn = document.querySelector('.add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            setTimeout(initDescriptionEditor, 100);
        });
    }
});

// Copy the initDescriptionEditor function from admin.js
// ...copy the entire initDescriptionEditor function here...
