// Global Visa Solutions - Main Script

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initNavbar();
    initAnimations();
    initStatsCounter();
    initTimelineAnimation();
    initMobileMenu();
});

// Preloader
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('preloader-hidden');
            }, 600); // Minimum view time set to 0.6 seconds
        });
    }
}

// Sticky Navbar & Active Link
function initNavbar() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active Link Highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            // If it's a dropdown item, also highlight the parent dropdown toggle
            if (link.classList.contains('dropdown-link')) {
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const toggle = parentDropdown.querySelector('.nav-link');
                    if (toggle) toggle.classList.add('active');
                }
            }
        }
    });
}

// Mobile Menu Toggle
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }
}

// Scroll Animations (Intersection Observer)
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // Consistent with our new CSS
                entry.target.classList.add('visible'); // Backward compatibility
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all possible reveal types
    const revealElements = document.querySelectorAll('.reveal, .service-card, .country-card, .timeline-item, .stat-number');
    revealElements.forEach(el => observer.observe(el));
}

// Stats Counter Animation
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsSection = document.querySelector('.stats-section');

    if (!statsSection || statNumbers.length === 0) return;

    // Prepare numbers: parse and set to initial state
    statNumbers.forEach(stat => {
        const originalText = stat.innerText;
        // Match number and suffix (any non-digit characters at the end)
        const match = originalText.match(/^(\d+)(.*)$/);

        if (match) {
            stat.setAttribute('data-target', match[1]);
            stat.setAttribute('data-suffix', match[2]);
            // Set initial text to 0 + suffix
            stat.innerText = '0' + match[2];
        }
    });

    const observerOptions = {
        threshold: 0.2, // Trigger when 20% of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    const suffix = stat.getAttribute('data-suffix');

                    if (!isNaN(target)) {
                        animateCounter(stat, 0, target, 3000, suffix);
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(statsSection);
}

function animateCounter(element, start, end, duration, suffix) {
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        const current = Math.floor(progress * (end - start) + start);
        element.innerText = current + suffix;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = end + suffix;
        }
    };

    window.requestAnimationFrame(step);
}

// Timeline Animation for Home Page
function initTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length === 0) return;

    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: once visible, stop observing
                // timelineObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
}
