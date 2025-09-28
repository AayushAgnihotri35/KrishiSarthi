
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

// Call the placeholder function
fetchWeatherData();
