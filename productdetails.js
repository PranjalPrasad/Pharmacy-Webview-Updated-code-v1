

// Base API URL - adjust based on your environment
const API_BASE_URL = 'http://localhost:8083/api/products';

// Initialize cart from localStorage or create an empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Logging utility function
function logInfo(message, data = null) {
    console.log(`[INFO] ${message}`, data || '');
}

function logError(message, error = null) {
    console.error(`[ERROR] ${message}`, error || '');
}

function logWarn(message, data = null) {
    console.warn(`[WARN] ${message}`, data || '');
}

// Function to update cart count in the UI
function updateCartCount() {
    try {
        const cartCountElement = document.querySelector('.fa-shopping-cart + span');
        if (cartCountElement) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = totalItems;
            logInfo(`Cart count updated: ${totalItems} items`);
        } else {
            logWarn('Cart count element not found on this page');
        }
    } catch (error) {
        logError('Error updating cart count:', error);
    }
}

// Function to add product to cart
function addToCart(product) {
    try {
        logInfo('Adding product to cart:', { id: product.id, name: product.name });
        
        // Check for existing item based on id, variant, and size
        const existingItem = cart.find(item => 
            item.id === product.id && 
            item.variant === product.variant && 
            item.size === product.size
        );
        
        if (existingItem) {
            existingItem.quantity += 1;
            logInfo(`Incremented quantity for existing item: ${product.name}`, { newQuantity: existingItem.quantity });
        } else {
            cart.push({ ...product, quantity: 1 });
            logInfo(`Added new item to cart: ${product.name}`);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
    } catch (error) {
        logError('Error adding product to cart:', error);
        throw error;
    }
}

// Function to get URL parameters
function getUrlParams() {
    try {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        logInfo('URL parameters parsed:', params);
        return params;
        
    } catch (error) {
        logError('Error parsing URL parameters:', error);
        return {};
    }
}

// Function to render thumbnails
function renderThumbnails(thumbnails, productId) {
    try {
        const thumbnailContainer = document.getElementById('thumbnail-container');
        if (thumbnailContainer) {
            thumbnailContainer.innerHTML = '';
            logInfo(`Rendering ${thumbnails.length} thumbnails for product ${productId}`);
            
            thumbnails.forEach((thumbSrc, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = thumbSrc;
                thumbnail.alt = `Thumbnail ${index + 1}`;
                thumbnail.className = 'w-20 h-20 object-contain border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-pharmacy-blue hover:shadow-md';
                thumbnail.classList.add(index === 0 ? 'border-pharmacy-blue' : 'border-gray-200');
                
                thumbnail.addEventListener('click', () => {
                    document.getElementById('main-product-image').src = thumbnail.src;
                    document.querySelectorAll('#thumbnail-container img').forEach(img => {
                        img.classList.remove('border-pharmacy-blue');
                        img.classList.add('border-gray-200');
                    });
                    thumbnail.classList.add('border-pharmacy-blue');
                    thumbnail.classList.remove('border-gray-200');
                    logInfo(`Switched to thumbnail ${index}`);
                });
                
                thumbnailContainer.appendChild(thumbnail);
            });
        } else {
            logWarn('Thumbnail container not found');
        }
    } catch (error) {
        logError('Error rendering thumbnails:', error);
    }
}

// Function to render variants
function renderVariants(variants) {
    try {
        const variantOptions = document.getElementById('variant-options');
        if (variantOptions) {
            variantOptions.innerHTML = '';
            logInfo(`Rendering ${variants.length} variants`);
            
            variants.forEach((variant, index) => {
                const button = document.createElement('button');
                button.className = `variant-btn px-4 py-2 border ${index === 0 ? 'border-2 border-pharmacy-blue bg-pharmacy-light-blue text-pharmacy-blue font-semibold' : 'border-gray-300 bg-white text-gray-700'} rounded-lg transition-all duration-200 hover:border-pharmacy-blue hover:shadow-md`;
                button.textContent = variant;
                button.addEventListener('click', () => {
                    document.querySelectorAll('.variant-btn').forEach(btn => {
                        btn.classList.remove('border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                        btn.classList.add('border-gray-300', 'bg-white', 'text-gray-700');
                    });
                    button.classList.add('border-2', 'border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                    button.classList.remove('border-gray-300', 'bg-white', 'text-gray-700');
                    logInfo(`Variant selected: ${variant}`);
                });
                variantOptions.appendChild(button);
            });
        } else {
            logWarn('Variant options container not found');
        }
    } catch (error) {
        logError('Error rendering variants:', error);
    }
}

// Function to render size options
function renderSizes(sizes) {
    try {
        const sizeOptions = document.getElementById('size-options');
        if (sizeOptions) {
            sizeOptions.innerHTML = '';
            logInfo(`Rendering ${sizes.length} sizes`);
            
            sizes.forEach((size, index) => {
                const button = document.createElement('button');
                button.className = `size-btn px-4 py-2 border ${index === 0 ? 'border-2 border-pharmacy-blue bg-pharmacy-light-blue text-pharmacy-blue font-semibold' : 'border-gray-300 bg-white text-gray-700'} rounded-lg transition-all duration-200 hover:border-pharmacy-blue hover:shadow-md`;
                button.textContent = size;
                button.addEventListener('click', () => {
                    document.querySelectorAll('.size-btn').forEach(btn => {
                        btn.classList.remove('border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                        btn.classList.add('border-gray-300', 'bg-white', 'text-gray-700');
                    });
                    button.classList.add('border-2', 'border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                    button.classList.remove('border-gray-300', 'bg-white', 'text-gray-700');
                    logInfo(`Size selected: ${size}`);
                });
                sizeOptions.appendChild(button);
            });
        } else {
            logWarn('Size options container not found');
        }
    } catch (error) {
        logError('Error rendering sizes:', error);
    }
}

// Function to fetch related products from backend
async function loadRelatedProducts(category, currentProductId) {
    const relatedProductsContainer = document.getElementById('related-products');
    if (relatedProductsContainer) {
        relatedProductsContainer.innerHTML = '<p class="text-center text-gray-500">Loading related products...</p>';
        
        try {
            logInfo(`Loading related products for category: ${category}`);
            
            // Fetch products by category from backend
            const encodedCategory = encodeURIComponent(category);
            const response = await fetch(`${API_BASE_URL}/get-by-category/${encodedCategory}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const relatedProducts = await response.json();
            logInfo(`Found ${relatedProducts.length} products in category`);
            
            // Filter out current product and limit to 4
            const filteredProducts = relatedProducts
                .filter(p => p.productId != currentProductId)
                .slice(0, 4);
            
            logInfo(`Filtered to ${filteredProducts.length} related products`);
            
            // If we don't have enough products, fetch some from other categories
            if (filteredProducts.length < 4) {
                try {
                    logInfo('Fetching additional products from other categories');
                    const allResponse = await fetch(`${API_BASE_URL}/get-all-products?page=0&size=10`);
                    if (allResponse.ok) {
                        const allProductsData = await allResponse.json();
                        const otherProducts = allProductsData.content
                            .filter(p => p.productCategory !== category && p.productId != currentProductId)
                            .slice(0, 4 - filteredProducts.length);
                        
                        filteredProducts.push(...otherProducts);
                        logInfo(`Added ${otherProducts.length} additional products`);
                    }
                } catch (error) {
                    logError('Error fetching additional products:', error);
                }
            }
            
            // Render the products
            relatedProductsContainer.innerHTML = '';
            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group';
                
                // Use the backend image URL
                const imageUrl = product.productMainImage 
                    ? `${API_BASE_URL}/${product.productId}/image`
                    : 'https://via.placeholder.com/300x300?text=No+Image';
                
                productCard.innerHTML = `
                    <div class="relative">
                        <img src="${imageUrl}" alt="${product.productName}" class="w-full h-48 object-contain p-4 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div class="p-4">
                        <h4 class="font-bold text-gray-900 mb-1 group-hover:text-pharmacy-blue transition-colors duration-200">${product.productName}</h4>
                        <p class="text-gray-600 text-sm mb-3">${product.brandName || 'Generic'}</p>
                        <div class="flex items-center gap-2">
                            <span class="text-pharmacy-blue font-bold">₹${product.productPrice}</span>
                            ${product.productOldPrice && product.productOldPrice > product.productPrice ? 
                                `<span class="text-gray-400 line-through text-sm">₹${product.productOldPrice}</span>` : ''}
                            ${product.productOldPrice && product.productOldPrice > product.productPrice ? 
                                `<span class="text-sm font-semibold text-green-600">${Math.round((1 - product.productPrice/product.productOldPrice) * 100)}% off</span>` : ''}
                        </div>
                        ${product.prescriptionRequired ? '<div class="text-red-500 text-xs mt-2 font-medium">Prescription Required</div>' : ''}
                        <a href="productdetails.html?id=${product.productId}" class="btn-add-to-cart mt-2 bg-gradient-to-r from-pharmacy-blue to-pharmacy-dark-blue hover:from-pharmacy-dark-blue hover:to-pharmacy-blue text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </a>
                    </div>
                `;
                productCard.addEventListener('click', (e) => {
                    if (!e.target.closest('.btn-add-to-cart')) {
                        logInfo(`Navigating to product details: ${product.productId}`);
                        window.location.href = `productdetails.html?id=${product.productId}`;
                    }
                });
                relatedProductsContainer.appendChild(productCard);
            });
            
            if (filteredProducts.length === 0) {
                relatedProductsContainer.innerHTML = '<p class="text-center text-gray-500">No related products available.</p>';
                logWarn('No related products found');
            }
            
            logInfo('Related products loaded successfully');
            
        } catch (error) {
            logError('Error loading related products:', error);
            relatedProductsContainer.innerHTML = '<p class="text-center text-red-500">Error loading related products.</p>';
        }
    }
}

// Function to initialize tabs
function initTabs() {
    try {
        const tabs = document.querySelectorAll('.tab');
        logInfo(`Initializing ${tabs.length} tabs`);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('border-pharmacy-blue', 'text-pharmacy-blue', 'bg-pharmacy-light-blue');
                    t.classList.add('border-transparent', 'text-gray-600', 'hover:text-pharmacy-blue', 'hover:bg-gray-50');
                });
                document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                tab.classList.add('border-pharmacy-blue', 'text-pharmacy-blue', 'bg-pharmacy-light-blue');
                tab.classList.remove('border-transparent', 'text-gray-600', 'hover:text-pharmacy-blue', 'hover:bg-gray-50');
                document.getElementById(tab.dataset.tab).classList.remove('hidden');
                logInfo(`Tab switched to: ${tab.dataset.tab}`);
            });
        });
    } catch (error) {
        logError('Error initializing tabs:', error);
    }
}

// Function to initialize selection buttons (variants, age, size)
function initSelectionButtons() {
    try {
        // Initialize variant buttons
        const variantButtons = document.querySelectorAll('.variant-btn');
        logInfo(`Initializing ${variantButtons.length} variant buttons`);
        
        variantButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.variant-btn').forEach(b => {
                    b.classList.remove('border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                    b.classList.add('border-gray-300', 'bg-white', 'text-gray-700');
                });
                btn.classList.add('border-2', 'border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                btn.classList.remove('border-gray-300', 'bg-white', 'text-gray-700');
                logInfo(`Variant selected: ${btn.textContent}`);
            });
        });
        
        // Initialize age buttons
        const ageButtons = document.querySelectorAll('.age-btn');
        logInfo(`Initializing ${ageButtons.length} age buttons`);
        
        ageButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.age-btn').forEach(b => {
                    b.classList.remove('border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                    b.classList.add('border-gray-300', 'bg-white', 'text-gray-700');
                });
                btn.classList.add('border-2', 'border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                btn.classList.remove('border-gray-300', 'bg-white', 'text-gray-700');
                logInfo(`Age group selected: ${btn.textContent}`);
            });
        });
        
        // Initialize size buttons
        const sizeButtons = document.querySelectorAll('.size-btn');
        logInfo(`Initializing ${sizeButtons.length} size buttons`);
        
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => {
                    b.classList.remove('border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                    b.classList.add('border-gray-300', 'bg-white', 'text-gray-700');
                });
                btn.classList.add('border-2', 'border-pharmacy-blue', 'bg-pharmacy-light-blue', 'text-pharmacy-blue', 'font-semibold');
                btn.classList.remove('border-gray-300', 'bg-white', 'text-gray-700');
                logInfo(`Size selected: ${btn.textContent}`);
            });
        });
    } catch (error) {
        logError('Error initializing selection buttons:', error);
    }
}

// Function to initialize cart functionality
function initCart() {
    try {
        logInfo('Initializing cart functionality');
        updateCartCount();
        
        const addToCartButton = document.querySelector('.btn-add-to-cart');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', () => {
                try {
                    const params = getUrlParams();
                    const productId = params.id;
                    logInfo(`Add to cart clicked for product: ${productId}`);
                    
                    // Get product data from the page
                    const productName = document.getElementById('product-name').textContent;
                    const productPrice = parseFloat(document.getElementById('selling-price').textContent.replace('₹', ''));
                    const productImage = document.getElementById('main-product-image').src;
                    const prescriptionRequired = document.getElementById('prescription-badge') && 
                                                !document.getElementById('prescription-badge').classList.contains('hidden');
                    
                    const selectedVariant = document.querySelector('.variant-btn.border-pharmacy-blue')?.textContent || 'Default';
                    const selectedAge = document.querySelector('.age-btn.border-pharmacy-blue')?.textContent || null;
                    const selectedSize = document.querySelector('.size-btn.border-pharmacy-blue')?.textContent || null;
                    
                    const cartItem = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        variant: selectedVariant,
                        age: selectedAge,
                        size: selectedSize,
                        prescriptionRequired: prescriptionRequired,
                        quantity: 1
                    };
                    
                    addToCart(cartItem);
                    alert(`${productName}${selectedSize ? ' (' + selectedSize + ')' : ''} added to cart!`);
                    logInfo('Product added to cart successfully', cartItem);
                    
                } catch (error) {
                    logError('Error in add to cart click handler:', error);
                    alert('Error adding product to cart. Please try again.');
                }
            });
        } else {
            logError('Add to Cart button not found');
        }
        
        const buyNowButton = document.querySelector('.btn-buy-now');
        if (buyNowButton) {
            buyNowButton.addEventListener('click', () => {
                try {
                    const params = getUrlParams();
                    const productId = params.id;
                    logInfo(`Buy now clicked for product: ${productId}`);
                    
                    // Get product data from the page
                    const productName = document.getElementById('product-name').textContent;
                    const productPrice = parseFloat(document.getElementById('selling-price').textContent.replace('₹', ''));
                    const productImage = document.getElementById('main-product-image').src;
                    const prescriptionRequired = document.getElementById('prescription-badge') && 
                                                !document.getElementById('prescription-badge').classList.contains('hidden');
                    
                    const selectedVariant = document.querySelector('.variant-btn.border-pharmacy-blue')?.textContent || 'Default';
                    const selectedAge = document.querySelector('.age-btn.border-pharmacy-blue')?.textContent || null;
                    const selectedSize = document.querySelector('.size-btn.border-pharmacy-blue')?.textContent || null;
                    
                    const cartItem = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        variant: selectedVariant,
                        age: selectedAge,
                        size: selectedSize,
                        prescriptionRequired: prescriptionRequired,
                        quantity: 1
                    };
                    
                    addToCart(cartItem); // Add to cart before redirecting
                    logInfo('Product added to cart for buy now', cartItem);
                    window.location.href = 'checkout.html';
                    
                } catch (error) {
                    logError('Error in buy now click handler:', error);
                    alert('Error processing buy now. Please try again.');
                }
            });
        } else {
            logWarn('Buy now button not found');
        }
    } catch (error) {
        logError('Error initializing cart functionality:', error);
    }
}

// Function to load product data from backend
async function loadProductData() {
    try {
        const params = getUrlParams();
        const productId = params.id;
        
        logInfo(`Loading product data for ID: ${productId}`);
        
        if (!productId) {
            logWarn('No product ID found in URL parameters');
            showProductNotFound();
            return;
        }
        
        // Show loading state
        document.getElementById('product-name').textContent = 'Loading...';
        document.getElementById('selling-price').textContent = '';
        
        // Fetch product data from backend
        logInfo(`Fetching product data from: ${API_BASE_URL}/get-product/${productId}`);
        const response = await fetch(`${API_BASE_URL}/get-product/${productId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                logWarn(`Product not found with ID: ${productId}`);
                showProductNotFound();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return;
        }
        
        const product = await response.json();
        logInfo('Product data fetched successfully', { 
            id: product.productId, 
            name: product.productName,
            category: product.productCategory 
        });
        
        // Update product details with proper field mapping
        document.getElementById('product-name').textContent = product.productName;
        document.getElementById('selling-price').textContent = `₹${product.productPrice}`;
        
        if (product.productOldPrice && product.productOldPrice > product.productPrice) {
            document.getElementById('original-price').textContent = `₹${product.productOldPrice}`;
            const discountPercent = Math.round((1 - product.productPrice/product.productOldPrice) * 100);
            document.getElementById('discount').textContent = `${discountPercent}% off`;
            document.getElementById('original-price').style.display = 'inline';
            document.getElementById('discount').style.display = 'inline';
            logInfo(`Price discount applied: ${discountPercent}%`);
        } else {
            document.getElementById('original-price').style.display = 'none';
            document.getElementById('discount').style.display = 'none';
            logInfo('No discount available for this product');
        }
        
        // Update product information sections
        document.getElementById('product-description').textContent = product.productDescription || 'No description available.';
        
        // Handle ingredients - convert array to string if needed
        let ingredientsText = 'Not specified.';
        if (product.ingredientsList && Array.isArray(product.ingredientsList)) {
            ingredientsText = product.ingredientsList.join(', ');
        } else if (product.ingredientsList) {
            ingredientsText = product.ingredientsList;
        }
        document.getElementById('product-ingredients').textContent = ingredientsText;
        
        // Handle benefits - convert array to string if needed
        let benefitsText = 'Not specified.';
        if (product.benefitsList && Array.isArray(product.benefitsList)) {
            benefitsText = product.benefitsList.join(', ');
        } else if (product.benefitsList) {
            benefitsText = product.benefitsList;
        }
        document.getElementById('product-benefits').textContent = benefitsText;
        
        // Set main product image
        const mainImage = document.getElementById('main-product-image');
        if (product.productMainImage) {
            mainImage.src = `${API_BASE_URL}/${productId}/image`;
            logInfo('Main product image set');
        } else {
            mainImage.src = 'https://via.placeholder.com/500x400?text=No+Image';
            logWarn('No main product image available, using placeholder');
        }
        mainImage.alt = product.productName;

        // Handle prescription badge
        const prescriptionBadge = document.getElementById('prescription-badge');
        if (prescriptionBadge) {
            if (product.prescriptionRequired) {
                prescriptionBadge.classList.remove('hidden');
                logInfo('Prescription required badge shown');
            } else {
                prescriptionBadge.classList.add('hidden');
                logInfo('Prescription not required, badge hidden');
            }
        }

        // Handle conditional sections
        const babyCareSection = document.getElementById('baby-care-section');
        const motherCareSection = document.getElementById('mother-care-section');
        if (babyCareSection && motherCareSection) {
            if (product.productCategory === 'Baby Care') {
                babyCareSection.classList.remove('hidden');
                motherCareSection.classList.add('hidden');
                logInfo('Baby care section shown');
            } else if (product.productCategory === 'Mother Care' || product.productCategory === 'Feminine Care') {
                motherCareSection.classList.remove('hidden');
                babyCareSection.classList.add('hidden');
                logInfo('Mother care section shown');
            } else {
                babyCareSection.classList.add('hidden');
                motherCareSection.classList.add('hidden');
                logInfo('No special care sections shown');
            }
        }

        // Prepare thumbnails - main image + sub images
        const thumbnails = [`${API_BASE_URL}/${productId}/image`];
        
        // Add sub-images if available
        if (product.productSubImages && product.productSubImages.length > 0) {
            for (let i = 0; i < product.productSubImages.length; i++) {
                thumbnails.push(`${API_BASE_URL}/${productId}/subimage/${i}`);
            }
            logInfo(`Added ${product.productSubImages.length} sub-images`);
        } else {
            logInfo('No sub-images available');
        }
        
        // Render thumbnails
        renderThumbnails(thumbnails, productId);

        // Render variants and sizes if available
        const variants = ['30 tablets', '60 tablets', '90 tablets']; // Default variants
        renderVariants(variants);
        
        // Use productSizes from backend entity
        const sizes = product.productSizes || [];
        if (sizes.length > 0) {
            renderSizes(sizes);
            logInfo(`Rendered ${sizes.length} size options`);
        } else {
            logInfo('No size options available');
        }
        
        // Load related products
        if (product.productCategory) {
            logInfo(`Loading related products for category: ${product.productCategory}`);
            loadRelatedProducts(product.productCategory, productId);
        } else {
            logWarn('No product category found for related products');
        }
        
        logInfo('Product data loaded successfully');
        
    } catch (error) {
        logError('Error loading product:', error);
        showProductNotFound();
    }
}

// Function to show product not found message
function showProductNotFound() {
    try {
        logWarn('Showing product not found message');
        document.getElementById('product-name').textContent = 'Product Not Found';
        document.getElementById('product-description').textContent = 'The requested product could not be found. Please check the product ID and try again.';
        document.getElementById('selling-price').textContent = '';
        document.getElementById('original-price').style.display = 'none';
        document.getElementById('discount').style.display = 'none';
        document.getElementById('main-product-image').src = 'https://via.placeholder.com/500x400?text=Not+Found';
        document.getElementById('thumbnail-container').innerHTML = '';
        document.getElementById('related-products').innerHTML = '<p class="text-center text-gray-500">No related products available.</p>';
    } catch (error) {
        logError('Error showing product not found message:', error);
    }
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        logInfo('DOM Content Loaded - Initializing product details page');
        loadProductData();
        initTabs();
        initSelectionButtons();
        initCart();
        logInfo('Product details page initialized successfully');
    } catch (error) {
        logError('Error during page initialization:', error);
    }
});

// Export for testing purposes (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateCartCount,
        addToCart,
        getUrlParams,
        loadProductData,
        showProductNotFound
    };
}