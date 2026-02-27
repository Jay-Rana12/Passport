// BorderBridge - Main Script

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initNavbar();
    initAnimations();
    initStatsCounter();
    initTimelineAnimation();
    initMobileMenu();
    initAuth();
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
        console.error('Failed to parse user from localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
    const token = localStorage.getItem('token');

    if (token && user) {
        // Find existing Get Started button
        const getStartedBtn = document.querySelector('.btn-nav');
        if (getStartedBtn) {
            // Create Profile Item
            const profileItem = document.createElement('li');
            profileItem.className = 'nav-item dropdown profile-dropdown';
            const userName = user.fullName || 'User';
            const userFirstName = userName.split(' ')[0];
            const profilePic = user.profilePhoto || `https://ui-avatars.comhttps://passport-ia5r.onrender.com/api/?name=${encodeURIComponent(userName)}&background=ff8c00&color=fff&rounded=true`;

            profileItem.innerHTML = `
                <a href="profile.html" style="display: flex; align-items: center; gap: 10px; padding: 6px 16px; background: rgba(255, 255, 255, 0.1); border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); transition: all 0.3s; text-decoration: none;">
                    <div class="nav-avatar-wrapper" style="position: relative; display: flex; align-items: center;">
                        <img src="${profilePic}" alt="${userName}" class="nav-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #ff8c00; background: white; flex-shrink: 0;">
                        <span class="status-online-dot" style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 1.5px solid #0a192f; border-radius: 50%;"></span>
                    </div>
                    <span class="user-name-nav" style="font-weight: 600; font-family: 'Outfit', sans-serif; color: white; font-size: 0.95rem; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${userFirstName}</span>
                </a>
            `;

            // Replace button with profile link
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                // If the ul has a specific structure preventing proper layout, let's append adjacent to container if possible
                // OR we just append to the end of the menu but ensure flex layout is ok
                navMenu.appendChild(profileItem);
                getStartedBtn.remove();
            }
        }

        // Handle Logout for all possible buttons (e.g. Navigation & Profile sidebar)
        setTimeout(() => {
            document.querySelectorAll('#logoutBtn, .logout-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                });
            });
        }, 300);
    }
}


