// API Configuration
const API_BASE_URL = 'https://krishisarthi-xar0.onrender.com/api';

// ----------------------
// UTILITY FUNCTIONS
// ----------------------

// Function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Function to make authenticated API calls
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON response received from:', url);
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    
    // Handle unauthorized errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('fullname');
      window.location.href = 'Login.html';
      throw new Error('Session expired. Please login again.');
    }
    
    return { response, data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ----------------------
// NAVBAR FUNCTIONALITY
// ----------------------

// Navbar active link highlight
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPage || 
        (currentPage === '' && linkHref === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ----------------------
// HERO SECTION
// ----------------------

// Hero section dynamic greeting
const heroHeading = document.querySelector('.hero-section h1');
if (heroHeading) {
  const hours = new Date().getHours();
  let greeting;

  if (hours < 12) {
    greeting = "Good Morning, Farmer!";
  } else if (hours < 17) {
    greeting = "Good Afternoon, Farmer!";
  } else {
    greeting = "Good Evening, Farmer!";
  }

  // Check if greeting already exists to avoid duplicates
  const existingGreeting = heroHeading.nextElementSibling;
  if (!existingGreeting || !existingGreeting.classList.contains('dynamic-greeting')) {
    heroHeading.insertAdjacentHTML(
      'afterend',
      `<p class="mt-2 fs-5 text-light dynamic-greeting">${greeting}</p>`
    );
  }
}

// ----------------------
// LOGIN/LOGOUT HANDLING
// ----------------------

document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const loginLink = document.getElementById('loginLink');
  const signupLink = document.getElementById('signupLink');
  const profileLink = document.getElementById('profileLink');
  const logoutLink = document.getElementById('logoutLink');

  if (token) {
    // User is logged in
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";
    if (profileLink) profileLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "block";
  } else {
    // User is not logged in
    if (loginLink) loginLink.style.display = "block";
    if (signupLink) signupLink.style.display = "block";
    if (profileLink) profileLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "none";
  }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.getElementById('logoutLink');
  const logoutBtn = document.getElementById('logoutBtn');

  const handleLogout = (e) => {
    e.preventDefault();
    
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('fullname');
    
    // Show logout message
    alert('You have been logged out successfully!');
    
    // Redirect to login page
    window.location.href = 'Login.html';
  };

  if (logoutLink) {
    logoutLink.addEventListener('click', handleLogout);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// ----------------------
// API FUNCTIONS
// ----------------------

// Check API health
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('API Health Status:', data);
    return data;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return null;
  }
}

// Login function
async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('username', data.user.username);
        if (data.user.fullname) {
          localStorage.setItem('fullname', data.user.fullname);
        }
      }
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// Register function
async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('username', data.user.username);
        if (data.user.fullname) {
          localStorage.setItem('fullname', data.user.fullname);
        }
      }
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// Get user profile - FIXED: Changed from /user/profile to /auth/profile
async function getUserProfile() {
  try {
    // CRITICAL FIX: Use /auth/profile instead of /user/profile
    const { response, data } = await fetchWithAuth(`${API_BASE_URL}/auth/profile`);
    
    if (data.success) {
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, message: 'Failed to fetch profile' };
  }
}

// Update user profile
async function updateUserProfile(profileData) {
  try {
    const { response, data } = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (data.success) {
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('username', data.user.username);
        if (data.user.fullname) {
          localStorage.setItem('fullname', data.user.fullname);
        }
      }
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}

// Get crop listings
async function getCropListings(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/crop-listings${queryParams ? '?' + queryParams : ''}`;
    
    const { response, data } = await fetchWithAuth(url);
    
    if (data.success) {
      return { success: true, listings: data.listings || data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Get crop listings error:', error);
    return { success: false, message: 'Failed to fetch crop listings' };
  }
}

// Create crop listing
async function createCropListing(listingData) {
  try {
    const { response, data } = await fetchWithAuth(`${API_BASE_URL}/crop-listings`, {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
    
    if (data.success) {
      return { success: true, listing: data.listing || data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Create crop listing error:', error);
    return { success: false, message: 'Failed to create listing' };
  }
}

// Get quotations
async function getQuotations(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/quotations${queryParams ? '?' + queryParams : ''}`;
    
    const { response, data } = await fetchWithAuth(url);
    
    if (data.success) {
      return { success: true, quotations: data.quotations || data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Get quotations error:', error);
    return { success: false, message: 'Failed to fetch quotations' };
  }
}

// Create quotation
async function createQuotation(quotationData) {
  try {
    const { response, data } = await fetchWithAuth(`${API_BASE_URL}/quotations`, {
      method: 'POST',
      body: JSON.stringify(quotationData)
    });
    
    if (data.success) {
      return { success: true, quotation: data.quotation || data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Create quotation error:', error);
    return { success: false, message: 'Failed to create quotation' };
  }
}

// ----------------------
// WEATHER API (Placeholder)
// ----------------------

async function fetchWeatherData(location = 'Nagpur') {
  try {
    // Placeholder for weather API integration
    console.log(`Weather API integration coming soon for ${location}...`);
    
    // You can integrate OpenWeatherMap or any other weather API here
    // Example:
    // const apiKey = 'YOUR_API_KEY';
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`);
    // const data = await response.json();
    // return data;
    
    return null;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

// ----------------------
// INITIALIZATION
// ----------------------

// Check API health on page load (but don't fail if it errors)
document.addEventListener('DOMContentLoaded', () => {
  checkAPIHealth().catch(err => console.log('API health check skipped'));
  fetchWeatherData().catch(err => console.log('Weather fetch skipped'));
});

// ----------------------
// EXPORT FUNCTIONS (if using modules)
// ----------------------

// If you're using ES6 modules, uncomment below:
// export { 
//   loginUser, 
//   registerUser, 
//   getUserProfile, 
//   updateUserProfile,
//   getCropListings,
//   createCropListing,
//   getQuotations,
//   createQuotation,
//   fetchWeatherData 
// };