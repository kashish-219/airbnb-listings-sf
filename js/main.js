let allListings = [];
let filteredListings = [];
let favorites = JSON.parse(localStorage.getItem('airbnb_favs') || '[]');
let showFavsOnly = false;
let viewMode = 'grid';

// dom elements
const listingsDiv = document.getElementById('listings');
const spinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const searchBox = document.getElementById('searchInput');
const sortDropdown = document.getElementById('sortSelect');
const typeDropdown = document.getElementById('typeFilter');
const priceSlider = document.getElementById('priceRange');
const priceLabel = document.getElementById('priceValue');
const resultsText = document.getElementById('resultsCount');
const totalText = document.getElementById('totalListings');
const favBadge = document.getElementById('favCount');
const themeBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const gridBtn = document.getElementById('gridView');
const listBtn = document.getElementById('listView');
const favsLink = document.getElementById('showFavorites');
const allLink = document.getElementById('showAll');
const modalBody = document.getElementById('modalBody');

let listingModal;

// helper to get rating from name like "... · ★4.87 · ..."
function getRating(name) {
  const match = name.match(/★([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

// get price as number
function getPrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/\$([\d,]+)/);
  return match ? parseFloat(match[1].replace(',', '')) : 0;
}

// parse amenities json string
function getAmenities(str) {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
}

// shorten text
function shorten(text, max = 150) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.substring(0, max) + '...';
}

// create card html for one listing
function createCard(listing) {
  const rating = getRating(listing.name);
  const amenities = getAmenities(listing.amenities);
  const isFav = favorites.includes(listing.id);
  const superhost = listing.host_is_superhost === 't';
  
  // clean up title
  const title = listing.name.split('·')[0].trim();
  const topAmenities = amenities.slice(0, 3);

  return `
    <div class="col-lg-4 col-md-6 col-12">
      <div class="listing-card card" data-id="${listing.id}">
        <div class="card-img-container">
          <img 
            src="${listing.picture_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
            class="card-img-top" 
            alt="${title}"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'"
          />
          <button class="favorite-btn ${isFav ? 'active' : ''}" 
                  onclick="toggleFav(${listing.id}, event)"
                  title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
          <div class="price-badge">${listing.price || 'N/A'}<small>/night</small></div>
          ${superhost ? '<div class="superhost-badge"><i class="bi bi-award"></i> Superhost</div>' : ''}
        </div>
        <div class="card-body">
          <h5 class="card-title" title="${title}">${title}</h5>
          <div class="rating">
            ${rating ? `<i class="bi bi-star-fill"></i> ${rating.toFixed(2)}` : '<i class="bi bi-star"></i> New'}
            <span class="ms-2 text-muted">
              <i class="bi bi-door-open"></i> ${listing.bedrooms || 0} bed${listing.bedrooms !== 1 ? 's' : ''} · 
              <i class="bi bi-people"></i> ${listing.accommodates || 0} guests
            </span>
          </div>
          <p class="description">${shorten(listing.description, 100)}</p>
          <div class="amenities">
            ${topAmenities.map(a => `<span class="amenity-badge">${shorten(a, 20)}</span>`).join('')}
            ${amenities.length > 3 ? `<span class="amenity-badge">+${amenities.length - 3} more</span>` : ''}
          </div>
          <div class="host-section">
            <img 
              src="${listing.host_thumbnail_url || 'https://via.placeholder.com/40?text=?'}" 
              alt="${listing.host_name}" 
              class="host-photo"
              onerror="this.src='https://via.placeholder.com/40?text=?'"
            />
            <div class="host-info">
              <p class="host-name">${listing.host_name || 'Unknown'}</p>
              <p class="host-status">
                ${superhost ? '<i class="bi bi-patch-check-fill text-primary"></i> Superhost' : 'Host'}
              </p>
            </div>
          </div>
          <button class="btn btn-view w-100" onclick="openModal(${listing.id})">
            <i class="bi bi-eye me-1"></i> View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

// render all listings
function render(listings) {
  spinner.classList.add('d-none');
  
  if (listings.length === 0) {
    listingsDiv.innerHTML = '';
    noResults.classList.remove('d-none');
    resultsText.textContent = '(0 results)';
    return;
  }

  noResults.classList.add('d-none');
  listingsDiv.innerHTML = listings.map(createCard).join('');
  resultsText.textContent = `(showing ${listings.length})`;

  if (viewMode === 'list') {
    listingsDiv.classList.add('list-view');
  } else {
    listingsDiv.classList.remove('list-view');
  }
}

// filter and sort
function applyFilters() {
  let result = [...allListings];

  // favorites filter
  if (showFavsOnly) {
    result = result.filter(l => favorites.includes(l.id));
  }

  // search
  const search = searchBox.value.toLowerCase().trim();
  if (search) {
    result = result.filter(l => 
      (l.name && l.name.toLowerCase().includes(search)) ||
      (l.description && l.description.toLowerCase().includes(search)) ||
      (l.host_name && l.host_name.toLowerCase().includes(search)) ||
      (l.neighbourhood_cleansed && l.neighbourhood_cleansed.toLowerCase().includes(search))
    );
  }

  // type filter
  const type = typeDropdown.value;
  if (type !== 'all') {
    result = result.filter(l => l.room_type === type);
  }

  // price filter
  const maxPrice = parseInt(priceSlider.value);
  result = result.filter(l => getPrice(l.price) <= maxPrice);

  // sorting
  const sort = sortDropdown.value;
  if (sort === 'price-low') {
    result.sort((a, b) => getPrice(a.price) - getPrice(b.price));
  } else if (sort === 'price-high') {
    result.sort((a, b) => getPrice(b.price) - getPrice(a.price));
  } else if (sort === 'rating') {
    result.sort((a, b) => (getRating(b.name) || 0) - (getRating(a.name) || 0));
  } else if (sort === 'beds') {
    result.sort((a, b) => (b.beds || 0) - (a.beds || 0));
  }

  filteredListings = result;
  render(result);
}

// populate type dropdown
function setupTypeFilter(listings) {
  const types = [...new Set(listings.map(l => l.room_type).filter(Boolean))];
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeDropdown.appendChild(opt);
  });
}

// toggle favorite
function toggleFav(id, event) {
  event.stopPropagation();
  
  const idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(id);
  }

  localStorage.setItem('airbnb_favs', JSON.stringify(favorites));
  updateFavBadge();
  
  // update heart icon
  const btn = event.currentTarget;
  const icon = btn.querySelector('i');
  btn.classList.toggle('active');
  icon.classList.toggle('bi-heart');
  icon.classList.toggle('bi-heart-fill');

  if (showFavsOnly) {
    applyFilters();
  }
}

function updateFavBadge() {
  favBadge.textContent = favorites.length;
}

// show modal with details
function openModal(id) {
  const listing = allListings.find(l => l.id === id);
  if (!listing) return;

  const rating = getRating(listing.name);
  const amenities = getAmenities(listing.amenities);
  const superhost = listing.host_is_superhost === 't';
  const title = listing.name.split('·')[0].trim();
  const isFav = favorites.includes(listing.id);

  const html = `
    <img src="${listing.picture_url}" alt="${title}" class="main-image">
    
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h4>${title}</h4>
        <p class="text-muted mb-0">
          <i class="bi bi-geo-alt"></i> ${listing.neighbourhood_cleansed || 'San Francisco'}
        </p>
      </div>
      <div class="text-end">
        <span class="fs-4 fw-bold text-danger">${listing.price}</span>
        <small class="text-muted">/night</small>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-3">
        <div class="stat-box">
          <div class="stat-value">${rating ? rating.toFixed(1) : 'New'}</div>
          <div class="stat-label"><i class="bi bi-star-fill text-warning"></i> Rating</div>
        </div>
      </div>
      <div class="col-3">
        <div class="stat-box">
          <div class="stat-value">${listing.bedrooms || 0}</div>
          <div class="stat-label"><i class="bi bi-door-open"></i> Bedrooms</div>
        </div>
      </div>
      <div class="col-3">
        <div class="stat-box">
          <div class="stat-value">${listing.beds || 0}</div>
          <div class="stat-label"><i class="bi bi-lamp"></i> Beds</div>
        </div>
      </div>
      <div class="col-3">
        <div class="stat-box">
          <div class="stat-value">${listing.accommodates || 0}</div>
          <div class="stat-label"><i class="bi bi-people"></i> Guests</div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h5><i class="bi bi-person-circle me-2"></i>About the Host</h5>
      <div class="d-flex align-items-center p-3 rounded" style="background-color: var(--bg-secondary);">
        <img src="${listing.host_picture_url || listing.host_thumbnail_url}" 
             alt="${listing.host_name}" 
             class="rounded-circle me-3"
             style="width: 64px; height: 64px; object-fit: cover;"
             onerror="this.src='https://via.placeholder.com/64?text=?'">
        <div>
          <h6 class="mb-1">${listing.host_name} ${superhost ? '<span class="badge bg-warning text-dark"><i class="bi bi-award"></i> Superhost</span>' : ''}</h6>
          <small class="text-muted">Host since ${new Date(listing.host_since).getFullYear() || 'N/A'}</small>
          <p class="mb-0 small mt-1">${shorten(listing.host_about, 150) || 'No bio available'}</p>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h5><i class="bi bi-card-text me-2"></i>Description</h5>
      <p style="white-space: pre-line;">${listing.description ? listing.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '') : 'No description available'}</p>
    </div>

    <div class="mb-4">
      <h5><i class="bi bi-check2-circle me-2"></i>Amenities (${amenities.length})</h5>
      <div class="amenities-grid">
        ${amenities.map(a => `
          <div class="amenity-item">
            <i class="bi bi-check-lg"></i>
            ${a}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="d-flex gap-2">
      <a href="${listing.listing_url}" target="_blank" class="btn btn-danger flex-grow-1">
        <i class="bi bi-box-arrow-up-right me-1"></i> View on Airbnb
      </a>
      <button class="btn btn-outline-secondary" onclick="toggleFav(${listing.id}, event)">
        <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
      </button>
    </div>
  `;

  modalBody.innerHTML = html;
  document.getElementById('listingModalLabel').textContent = title;
  listingModal.show();
}

// theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeIcon.className = next === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeIcon.className = saved === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

// view toggle
function setView(mode) {
  viewMode = mode;
  if (mode === 'list') {
    listingsDiv.classList.add('list-view');
    gridBtn.classList.remove('active');
    listBtn.classList.add('active');
  } else {
    listingsDiv.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  }
}

// setup event listeners
function setupEvents() {
  // search with debounce
  let timeout;
  searchBox.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(applyFilters, 300);
  });

  sortDropdown.addEventListener('change', applyFilters);
  typeDropdown.addEventListener('change', applyFilters);
  
  priceSlider.addEventListener('input', () => {
    priceLabel.textContent = `$${priceSlider.value}`;
    applyFilters();
  });

  themeBtn.addEventListener('click', toggleTheme);
  
  gridBtn.addEventListener('click', () => setView('grid'));
  listBtn.addEventListener('click', () => setView('list'));

  favsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showFavsOnly = true;
    favsLink.classList.add('active');
    allLink.classList.remove('active');
    applyFilters();
  });

  allLink.addEventListener('click', (e) => {
    e.preventDefault();
    showFavsOnly = false;
    allLink.classList.add('active');
    favsLink.classList.remove('active');
    applyFilters();
  });
}

// load data with fetch
async function loadData() {
  try {
    spinner.classList.remove('d-none');
    
    const res = await fetch('./airbnb_sf_listings_500.json');
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    
    const data = await res.json();
    
    // get first 50 listings
    allListings = data.slice(0, 50);
    filteredListings = [...allListings];
    
    totalText.textContent = allListings.length;
    setupTypeFilter(allListings);
    render(filteredListings);
    updateFavBadge();
    
    console.log('Loaded ' + allListings.length + ' listings');
    
  } catch (err) {
    console.error('Error loading listings:', err);
    spinner.classList.add('d-none');
    listingsDiv.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
        <h3 class="mt-3">Failed to load listings</h3>
        <p class="text-muted">${err.message}</p>
        <button class="btn btn-danger" onclick="loadData()">
          <i class="bi bi-arrow-clockwise me-1"></i> Retry
        </button>
      </div>
    `;
  }
}

// init
document.addEventListener('DOMContentLoaded', () => {
  listingModal = new bootstrap.Modal(document.getElementById('listingModal'));
  loadTheme();
  setupEvents();
  loadData();
});