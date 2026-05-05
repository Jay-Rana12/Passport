// BorderBridge - Main Script

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initNavbar();
    initAnimations();
    initStatsCounter();
    initTimelineAnimation();
    initMobileMenu();
    initAuth();
    initAppointmentForm();
});

// Preloader
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // Detect navigation type
    const perfEntries = window.performance.getEntriesByType('navigation');
    const isReload = perfEntries.length > 0 && perfEntries[0].type === 'reload';
    const isInternal = document.referrer && document.referrer.includes(window.location.hostname);

    // Only show preloader on reload or when entering the site from an external source
    // If it's internal navigation (link click) and NOT a reload, hide it immediately
    if (!isReload && isInternal) {
        preloader.style.display = 'none';
        return;
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('preloader-hidden');
        }, 600); // Minimum view time set to 0.6 seconds
    });
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
    const dropdowns = document.querySelectorAll('.nav-item.dropdown');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Handle Dropdowns on Mobile
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.nav-link');
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 991) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');

                    // Optional: Close other open dropdowns
                    dropdowns.forEach(other => {
                        if (other !== dropdown) other.classList.remove('active');
                    });
                }
            });
        });

        // Close menu when clicking a direct link (excluding dropdown toggles)
        document.querySelectorAll('.nav-link:not([href="#"]), .dropdown-link').forEach(n => n.addEventListener('click', () => {
            if (!n.closest('.dropdown') || n.classList.contains('dropdown-link')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                dropdowns.forEach(d => d.classList.remove('active'));
            }
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
// Auth State Management
// Auth State Management
function initAuth() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
    const token = localStorage.getItem('token');
    const navMenu = document.querySelector('.nav-menu');
    const getStartedBtn = document.querySelector('.btn-nav');

    if (token && user) {
        // --- LOGGED IN STATE ---
        const userName = user.fullName || user.name || 'User';
        const userFirstName = userName.split(' ')[0];
        const profilePic = user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=ffc107&color=0a192f&rounded=true`;

        // Check if we are on the profile page
        const isProfilePage = window.location.pathname.includes('profile.html');

        // Robustly remove ANY login/get started buttons across all views
        const allLoginBtns = document.querySelectorAll('.btn-nav, .mobile-login-link, .btn-primary, .nav-link');
        allLoginBtns.forEach(btn => {
            const txt = btn.innerText.toLowerCase();
            if (txt === 'login' || txt === 'get started' || txt.includes('login / register')) {
                btn.remove();
            }
        });

        // Add Profile Item to navMenu ONLY if not on profile page
        if (navMenu && !document.querySelector('.profile-nav-item') && !isProfilePage) {
            const profileItem = document.createElement('li');
            profileItem.className = 'nav-item profile-nav-item';
            profileItem.innerHTML = `
                <a href="profile.html" class="nav-link profile-toggle-link" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 18px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); margin-left: 10px;">
                    <img src="${profilePic}" style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--color-accent); object-fit: cover;">
                    <span style="font-weight: 600;">${userFirstName}</span>
                </a>
            `;
            navMenu.appendChild(profileItem);
        }

        // Add Logout (Enforce mobile-only class)
        if (!document.querySelector('.mobile-logout-link')) {
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item mobile-only-item mobile-logout-li'; // Added mobile-only-item class
            logoutLi.innerHTML = `<a href="#" class="nav-link mobile-logout-link" style="color: #ef4444;"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
            navMenu.appendChild(logoutLi);
        }
    } else {
        // --- LOGGED OUT STATE ---
        // Ensure Login button is visible in mobile menu
        if (navMenu && !document.querySelector('.mobile-login-link')) {
            const loginLi = document.createElement('li');
            loginLi.className = 'nav-item mobile-only-item';
            loginLi.innerHTML = `<a href="login.html" class="nav-link mobile-login-link"><i class="fas fa-sign-in-alt"></i> Login / Register</a>`;
            navMenu.appendChild(loginLi);
        }
    }

    // Global Logout Handler
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-logout-link') || e.target.closest('.mobile-logout-link')) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

function initAppointmentForm() {
    const form = document.getElementById('homeAppointmentForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Your consultation request has been sent! Our experts will contact you shortly.');
            form.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    });
}


