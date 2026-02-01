// Shared Navigation Utilities

/**
 * Initialize navigation highlighting based on current page
 */
function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Navigate to a different page
 */
function navigateTo(url) {
    window.location.href = url;
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', initNavigation);
