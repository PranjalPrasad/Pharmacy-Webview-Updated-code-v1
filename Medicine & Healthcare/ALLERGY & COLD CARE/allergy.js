document.addEventListener('DOMContentLoaded', () => {
  // ================
  // Data
  // ================
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let products = []; // Will be populated from API

  // ================
  // DOM Elements
  // ================
  const productGrid = document.getElementById('productGrid');
  const categoryList = document.getElementById('categoryList');
  const brandList = document.getElementById('brandList');
  const brandToggle = (brandList && brandList.previousElementSibling) ? brandList.previousElementSibling.querySelector('span') : null;
  const brandFilters = document.querySelectorAll('.brand-filter');
  const sortSelect = document.getElementById('sortSelect');
  const uploadModal = document.getElementById('uploadModal');
  const validPrescriptionModal = document.getElementById('validPrescriptionModal');
  const validPrescriptionBtn = document.getElementById('validPrescriptionBtn');
  const cartCountElement = document.getElementById('cart-count');

  // keep track of active filters
  let activeCategory = null;
  let activeSort = null;

  // ================
  // API Integration
  // ================
  const API_BASE_URL = 'http://localhost:8083/api/products';

  // Function to fetch products by subcategory
  async function fetchProductsBySubCategory(subCategory) {
    try {
      console.log('Fetching products for subcategory:', subCategory);
      
      const response = await fetch(`${API_BASE_URL}/get-by-sub-category/${encodeURIComponent(subCategory)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const products = await response.json();
      console.log(`Fetched ${products.length} products for subcategory: ${subCategory}`);
      
      // Debug: Log the first product to see image data
      if (products.length > 0) {
        console.log('Sample product data:', products[0]);
        console.log('Image URL of first product:', products[0].productMainImage);
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Function to fetch all products (fallback)
  async function fetchAllProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/get-all-products?page=0&size=100`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  }

  // Initialize products based on subcategory "allergy"
  async function initializeProducts() {
    console.log('Fetching products for subcategory: allergy');
    
    // Fetch products for "allergy" subcategory
    products = await fetchProductsBySubCategory('allergy');
    
    // If no products found with subcategory, fallback to all products
    if (products.length === 0) {
      console.log('No products found for subcategory "allergy", fetching all products');
      products = await fetchAllProducts();
    }
    
    // Transform API response to match frontend structure
    products = products.map(product => {
      const imageUrl = getProductImageUrl(product);
      console.log(`Product: ${product.productName}, Image URL: ${imageUrl}`);
      
      return {
        id: product.productId,
        name: product.productName,
        price: product.productPrice,
        originalPrice: product.originalPrice,
        discount: product.discountPercentage ? `${product.discountPercentage}% off` : '',
        category: product.productCategory,
        brand: product.brandName || 'Generic',
        image: imageUrl,
        prescriptionRequired: product.prescriptionRequired || false,
        // Include backend fields for compatibility
        productId: product.productId,
        productName: product.productName,
        productPrice: product.productPrice,
        productMainImage: product.productMainImage,
        productCategory: product.productCategory,
        brandName: product.brandName
      };
    });
    
    console.log('Final products array:', products);
    displayProducts(products);
    updateCartCount();
  }

  // Function to get proper product image URL
  function getProductImageUrl(product) {
    // Check if productMainImage exists and is valid
    if (product.productMainImage && 
        product.productMainImage !== 'undefined' && 
        product.productMainImage !== 'null' && 
        product.productMainImage !== '' &&
        product.productMainImage !== 'NULL') {
      
      let imageUrl = product.productMainImage.trim();
      
      // If it's already an absolute URL, return as is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // If it starts with /, make it absolute with localhost
      if (imageUrl.startsWith('/')) {
        return `http://localhost:8083${imageUrl}`;
      }
      
      // Otherwise, assume it's relative to the API base
      return `${API_BASE_URL}/${imageUrl}`;
    }
    
    // If no valid image, try to construct from product ID
    if (product.productId) {
      return `${API_BASE_URL}/${product.productId}/image`;
    }
    
    // Last resort - return empty string (no image)
    return '';
  }

  // Handle image loading errors
  function handleImageError(img) {
    console.log('Image failed to load, hiding image element');
    img.style.display = 'none';
    
    // Show a text placeholder instead of dummy image
    const parent = img.parentElement;
    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center';
    placeholder.innerHTML = '<span class="text-gray-500 text-sm">No Image</span>';
    
    img.insertAdjacentElement('afterend', placeholder);
  }

  // ================
  // Helpers
  // ================
  function updateCartCount() {
    if (!cartCountElement) return;
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCountElement.textContent = totalItems;
    localStorage.setItem('cartCount', totalItems);
  }

  // Initialize cart from localStorage
  (function loadCart() {
    const stored = JSON.parse(localStorage.getItem('cart') || 'null');
    if (Array.isArray(stored)) cart = stored;
    updateCartCount();
  })();

  // ================
  // Product Rendering
  // ================
  function createProductCard(product) {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-card bg-white p-4 shadow rounded-lg flex flex-col justify-between relative cursor-pointer hover:shadow-lg transition-shadow';

    const prescriptionBadge = product.prescriptionRequired
      ? '<div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">Rx Required</div>'
      : '';

    const imageHtml = product.image 
      ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-image w-full h-32 rounded-lg mb-3 object-cover" onerror="handleImageError(this)">`
      : '<div class="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center"><span class="text-gray-500 text-sm">No Image Available</span></div>';

    const actionButton = product.prescriptionRequired
      ? `<button 
            class="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2 upload-pres-btn" 
            data-product='${escapeHtml(JSON.stringify(product))}'>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Upload Prescription
          </button>`
      : `<button 
            class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2 add-to-cart-btn" 
            data-id="${product.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View Details
          </button>`;

    productDiv.innerHTML = `
      ${prescriptionBadge}
      ${imageHtml}
      <p class="text-sm text-gray-600 font-medium">${escapeHtml(product.name)}</p>
      <p class="text-xs text-gray-500">${escapeHtml(product.brand)}</p>
      ${product.prescriptionRequired ? '<p class="text-red-600 text-xs mt-1 font-semibold">⚠️ Prescription needed</p>' : ''}
      <p class="text-green-600 font-bold mt-2">₹${product.price.toFixed(2)} 
        ${product.originalPrice ? `<span class="text-gray-500 line-through text-sm">₹${product.originalPrice.toFixed(2)}</span> <span class="text-green-600 text-sm">${escapeHtml(product.discount)}</span>` : ''}</p>
      ${actionButton}
    `;

    // click handlers
    productDiv.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON' || event.target.closest('button')) return;
      if (product.prescriptionRequired) {
        openUploadModalForProduct(product);
      } else {
        openProductDetails(product);
      }
    });

    return productDiv;
  }

  function displayProducts(list) {
    if (!productGrid) return;
    
    if (list.length === 0) {
      productGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-500">No allergy products found.</p>
          <p class="text-sm text-gray-400 mt-2">Try refreshing the page or check back later.</p>
        </div>
      `;
      return;
    }
    
    productGrid.innerHTML = '';
    list.forEach(product => productGrid.appendChild(createProductCard(product)));
  }

  // ================
  // Product interactions
  // ================
  function openProductDetails(product) {
    const productDetailsUrl = `/productdetails.html?id=${product.id}`;
    window.location.href = productDetailsUrl;
  }
  window.openProductDetails = openProductDetails;

  function addToCartById(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }
  window.addToCart = addToCartById;

  // ================
  // Category & Brand Filters
  // ================
  categoryList?.addEventListener('click', (e) => {
    if (e.target.classList.contains('expand-toggle')) {
      const li = e.target.parentElement;
      const subcategory = li.querySelector('.subcategory');
      if (subcategory) {
        subcategory.classList.toggle('hidden');
      }
      e.target.textContent = e.target.textContent === '+' ? '-' : '+';
      return;
    }

    if (e.target.classList.contains('category-link') || e.target.classList.contains('subcategory-link')) {
      e.preventDefault();
      const text = e.target.textContent.trim();
      let filtered;
      if (e.target.classList.contains('subcategory-link')) {
        filtered = products.filter(p => p.name === text);
      } else {
        filtered = products.filter(p => p.category === text);
      }
      activeCategory = text;
      applyFilters(filtered);
    }
  });

  // brand toggle (expand/collapse)
  if (brandToggle) {
    brandToggle.addEventListener('click', () => {
      brandList.classList.toggle('hidden');
      brandToggle.textContent = brandToggle.textContent === '+' ? '-' : '+';
    });
  }

  brandFilters.forEach(filter => {
    filter.addEventListener('change', () => {
      applyFilters(products);
    });
  });

  // sorting
  sortSelect?.addEventListener('change', () => {
    activeSort = sortSelect.value;
    applyFilters(products);
  });

  // Apply filters
  function applyFilters(startList) {
    let list = Array.isArray(startList) ? [...startList] : [...products];

    // brand filters
    const selectedBrands = Array.from(brandFilters).filter(f => f.checked).map(f => f.value);
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brand));
    }

    // sorting
    if (activeSort === 'Price: Low to High') {
      list.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'Price: High to Low') {
      list.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'Discount') {
      list.sort((a, b) => {
        const da = parseFloat((a.discount || '').replace(/[^0-9.]/g, '')) || 0;
        const db = parseFloat((b.discount || '').replace(/[^0-9.]/g, '')) || 0;
        return db - da;
      });
    }
    displayProducts(list);
  }

  // ================
  // Upload Prescription Modal Integration
  // ================
  function openUploadModalForProduct(product) {
    if (!uploadModal) {
      window.location.href = `/prescribed.html?id=${product.id}`;
      return;
    }

    uploadModal.dataset.productId = product.id;
    const modalProductName = uploadModal.querySelector('#modalProductName') || uploadModal.querySelector('#modalProductName') || document.getElementById('modalProductName');
    if (modalProductName) modalProductName.textContent = `Upload Prescription for: ${product.name}`;

    const modalProductImage = uploadModal.querySelector('.modal-product-image');
    if (modalProductImage) {
      modalProductImage.src = product.image || '';
      modalProductImage.onerror = function() {
        this.style.display = 'none';
      };
    }

    let fileInput = uploadModal.querySelector('#prescriptionFile');
    if (!fileInput) {
      fileInput = uploadModal.querySelector('input[type="file"]');
    }
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,.pdf';
      fileInput.id = 'prescriptionFile';
      fileInput.className = 'hidden';
      uploadModal.querySelector('label')?.appendChild(fileInput) || uploadModal.appendChild(fileInput);
    }

    const fileNameDisplay = uploadModal.querySelector('#fileNameDisplay') || document.getElementById('fileNameDisplay');

    const newFileInput = fileInput.cloneNode();
    newFileInput.id = fileInput.id;
    newFileInput.accept = fileInput.accept;
    newFileInput.className = fileInput.className;
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    fileInput = newFileInput;

    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (!file) {
        if (fileNameDisplay) fileNameDisplay.textContent = '';
        return;
      }
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;

      if (file.type.startsWith('image/')) {
        const previewImg = uploadModal.querySelector('#prescriptionPreviewImg');
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (previewImg) {
            previewImg.src = evt.target.result;
            previewImg.classList.remove('hidden');
          }
          uploadModal.dataset.tempDataURL = evt.target.result;
          uploadModal.dataset.tempFileName = file.name;
        };
        reader.readAsDataURL(file);
      } else {
        uploadModal.dataset.tempDataURL = '';
        uploadModal.dataset.tempFileName = file.name;
      }
    });

    const label = uploadModal.querySelector('label');
    if (label) {
      label.addEventListener('click', (ev) => {
        ev.preventDefault();
        const fi = uploadModal.querySelector('#prescriptionFile');
        if (fi) fi.click();
      }, { once: true });
    }

    const submitBtn = uploadModal.querySelector('#submitPrescription') || document.getElementById('submitPrescription');
    if (submitBtn) {
      const newBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newBtn, submitBtn);
      newBtn.addEventListener('click', () => {
        const prodId = uploadModal.dataset.productId;
        const tmpName = uploadModal.dataset.tempFileName;
        const tmpData = uploadModal.dataset.tempDataURL || null;
        
        const fi = uploadModal.querySelector('#prescriptionFile');
        if (!tmpName && fi && fi.files[0]) {
          const file = fi.files[0];
          const reader = new FileReader();
          reader.onload = function (evt) {
            savePrescription(prodId, file.name, evt.target.result);
            uploadModal.classList.add('hidden');
            clearModalTempState();
          };
          reader.readAsDataURL(file);
          return;
        }

        if (!tmpName) {
          alert('Please choose a prescription file before submitting.');
          return;
        }

        savePrescription(prodId, tmpName, tmpData);
        uploadModal.classList.add('hidden');
        clearModalTempState();
        alert('Prescription uploaded successfully.');
      });
    }

    uploadModal.classList.remove('hidden');
  }

  function savePrescription(productId, fileName, dataURL) {
    if (!productId) return;
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '{}');
    prescriptions[productId] = {
      fileName,
      dataURL: dataURL || null,
      uploadedAt: new Date().toISOString()
    };
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  }

  function clearModalTempState() {
    if (!uploadModal) return;
    delete uploadModal.dataset.tempFileName;
    delete uploadModal.dataset.tempDataURL;
    const previewImg = uploadModal.querySelector('#prescriptionPreviewImg');
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.add('hidden');
    }
    const fileNameDisplay = uploadModal.querySelector('#fileNameDisplay');
    if (fileNameDisplay) fileNameDisplay.textContent = '';
    const fi = uploadModal.querySelector('#prescriptionFile');
    if (fi) fi.value = '';
  }

  // Event delegation for dynamic buttons
  document.body.addEventListener('click', (e) => {
    const up = e.target.closest('.upload-pres-btn');
    if (up) {
      e.stopPropagation();
      const productData = up.getAttribute('data-product');
      if (productData) {
        try {
          const product = JSON.parse(unescapeHtml(productData));
          openUploadModalForProduct(product);
        } catch (err) {
          window.location.href = `/prescribed.html`;
        }
      }
      return;
    }

    const atc = e.target.closest('.add-to-cart-btn');
    if (atc) {
      e.stopPropagation();
      const pid = atc.getAttribute('data-id');
      if (pid) openProductDetails({ id: pid });
      return;
    }
  });

  // Modal event listeners
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        uploadModal.classList.add('hidden');
        clearModalTempState();
      }
    });

    const closeUploadModalBtn = document.getElementById('closeUploadModal');
    if (closeUploadModalBtn) {
      closeUploadModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        clearModalTempState();
      });
    }
  }

  if (validPrescriptionBtn && validPrescriptionModal) {
    validPrescriptionBtn.addEventListener('click', () => validPrescriptionModal.classList.remove('hidden'));
    validPrescriptionModal.addEventListener('click', (e) => { if (e.target === validPrescriptionModal) validPrescriptionModal.classList.add('hidden'); });
    const validClose = validPrescriptionModal.querySelector('#closeValidPrescriptionModal') || validPrescriptionModal.querySelector('button');
    if (validClose) validClose.addEventListener('click', () => validPrescriptionModal.classList.add('hidden'));
  }

  // ================
  // Utility functions
  // ================
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  function unescapeHtml(encoded) {
    if (!encoded) return encoded;
    return encoded.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }

  // ================
  // Initialize
  // ================
  // Start the application
  initializeProducts();

  // Expose functions globally
  window.uploadPrescription = function (productObjOrId) {
    if (typeof productObjOrId === 'number' || typeof productObjOrId === 'string') {
      const p = products.find(x => x.id == productObjOrId);
      if (p) openUploadModalForProduct(p);
      else window.location.href = `/prescribed.html?id=${productObjOrId}`;
    } else if (typeof productObjOrId === 'object' && productObjOrId !== null) {
      openUploadModalForProduct(productObjOrId);
    } else {
      window.location.href = '/prescribed.html';
    }
  };

  window.addToCart = addToCartById;
  window.handleImageError = handleImageError; // Expose for inline use
});