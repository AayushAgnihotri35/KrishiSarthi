
// Navbar active link highlight
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const currentPage = window.location.pathname.split('/').pop();

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

//  Hero section dynamic greeting

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

  // Append greeting under main heading
  heroHeading.insertAdjacentHTML(
    'afterend',
    `<p class="mt-2 fs-5">${greeting}</p>`
  );
}

//  Placeholder for future APIs (Weather, Market etc.)

// Example function to fetch weather data
// (You can integrate a real API later)
async function fetchWeatherData() {
  try {
    // Example API call placeholder
    console.log("Weather API integration coming soon...");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// ----------------------
// LOGIN/LOGOUT HANDLING
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const loginLink = document.getElementById('loginLink');
  const signupLink = document.getElementById('signupLink');
  const profileLink = document.getElementById('profileLink');
  const logoutLink = document.getElementById('logoutLink');

    if (token) {
    // Logged in
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";
    if (profileLink) profileLink.style.display = "block";
  } else {
    // Not logged in
    if (loginLink) loginLink.style.display = "block";
    if (signupLink) signupLink.style.display = "block";
    if (profileLink) profileLink.style.display = "none";
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.getElementById('logoutLink');

  // Logout click handler
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }
});


// Call the placeholder function
fetchWeatherData();
