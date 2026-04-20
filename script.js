/* ================================================
   SEEDANCE — Main JavaScript
   Apple-style scroll-driven video hero + interactions
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // BACKGROUND VIDEO — infinite loop autoplay across entire site
    // ======================================================
    const bgVideo = document.getElementById('hero-video');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useFallback = prefersReducedMotion;

    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.loop = true;
        bgVideo.setAttribute('playsinline', '');

        if (useFallback) {
            // Honor reduced-motion — pause on first frame
            bgVideo.pause();
        } else {
            const tryPlay = () => bgVideo.play().catch(() => {});
            tryPlay();
            // Some browsers require user interaction first
            const nudge = () => {
                tryPlay();
                document.removeEventListener('touchstart', nudge);
                document.removeEventListener('click', nudge);
            };
            document.addEventListener('touchstart', nudge, { once: true, passive: true });
            document.addEventListener('click', nudge, { once: true });
        }
    }

    // ======================================================
    // PRELOADER
    // ======================================================
    const preloader = document.getElementById('preloader');
    const hidePreloader = () => {
        if (preloader) preloader.classList.add('hidden');
    };
    window.addEventListener('load', () => setTimeout(hidePreloader, 500));
    if (document.readyState === 'complete') {
        setTimeout(hidePreloader, 500);
    }

    // ======================================================
    // CUSTOM CURSOR (desktop only)
    // ======================================================
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');

    if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursor.style.left = cursorX - 4 + 'px';
            cursor.style.top = cursorY - 4 + 'px';
        });

        const animateFollower = () => {
            followerX += (cursorX - followerX) * 0.12;
            followerY += (cursorY - followerY) * 0.12;
            follower.style.left = followerX - 18 + 'px';
            follower.style.top = followerY - 18 + 'px';
            requestAnimationFrame(animateFollower);
        };
        animateFollower();

        document.querySelectorAll('a, button, .service-card, input, textarea, select').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('active');
                follower.classList.add('active');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('active');
                follower.classList.remove('active');
            });
        });
    } else if (cursor && follower) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
    }

    // ======================================================
    // NAVBAR + ACTIVE SECTION
    // ======================================================
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const trackedSections = [
        { id: 'hero', el: document.getElementById('hero') },
        ...Array.from(document.querySelectorAll('main .section')).map(el => ({ id: el.id, el }))
    ].filter(s => s.el);

    const handleNavScroll = () => {
        const scrollY = window.scrollY;

        if (scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        let currentId = trackedSections[0]?.id || '';
        trackedSections.forEach(({ id, el }) => {
            const top = el.offsetTop - 200;
            const bottom = top + el.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                currentId = id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === currentId);
        });
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // ======================================================
    // MOBILE MENU
    // ======================================================
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ======================================================
    // SMOOTH SCROLL (anchor links)
    // ======================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;
            e.preventDefault();
            const offset = 80;
            const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // ======================================================
    // SCROLL-REVEAL ANIMATIONS
    // ======================================================
    const animateElements = document.querySelectorAll('[data-animate]');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
                setTimeout(() => entry.target.classList.add('visible'), delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    animateElements.forEach(el => revealObserver.observe(el));

    // ======================================================
    // STAT COUNTERS
    // ======================================================
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length > 0) {
        let animated = false;
        const animateCounters = () => {
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-count'), 10);
                const duration = 2000;
                const start = performance.now();
                const step = (now) => {
                    const p = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    counter.textContent = Math.round(eased * target);
                    if (p < 1) requestAnimationFrame(step);
                    else counter.textContent = target;
                };
                requestAnimationFrame(step);
            });
        };

        const statsContainer = counters[0].closest('.hero-stats');
        if (statsContainer) {
            const statsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !animated) {
                        animated = true;
                        animateCounters();
                        statsObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            statsObserver.observe(statsContainer);
        }
    }

    // ======================================================
    // SERVICE CARD TILT EFFECT
    // ======================================================
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height / 2) / (rect.height / 2) * -5;
            const rotateY = (x - rect.width / 2) / (rect.width / 2) * 5;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.left = `${x - rect.width}px`;
                glow.style.top = `${y - rect.height}px`;
            }
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ======================================================
    // CONTACT FORM
    // ======================================================
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');

    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <span>Message envoyé !</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            `;
            submitBtn.style.background = 'var(--accent-green)';
            submitBtn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.background = '';
                submitBtn.style.boxShadow = '';
                submitBtn.disabled = false;
                contactForm.reset();
            }, 3000);
        });
    }

});
