/* ================================================
   SEEDANCE — Main JavaScript
   Apple-style scroll-driven video hero + interactions
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // SCROLL-DRIVEN VIDEO HERO (Apple AirPods Pro style)
    // ======================================================
    const heroSection = document.querySelector('.hero-scroll-section');
    const heroVideo = document.getElementById('hero-video');
    const heroProgressBar = document.getElementById('hero-progress-bar');
    const heroTextIntro = document.getElementById('hero-text-intro');
    const heroTextServices = document.getElementById('hero-text-services');
    const heroTextCTA = document.getElementById('hero-text-cta');

    // Capability detection
    const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
    const isTouchMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useFallback = isSmallScreen || isTouchMobile || prefersReducedMotion;

    if (heroSection && heroVideo) {
        if (useFallback) {
            // --- Fallback: classic autoplay loop ---
            heroSection.classList.add('hero-fallback');
            heroVideo.setAttribute('autoplay', '');
            heroVideo.setAttribute('loop', '');
            heroVideo.setAttribute('muted', '');
            heroVideo.muted = true;
            heroVideo.loop = true;
            // Attempt autoplay — iOS/Android require muted + playsinline (already set)
            const tryPlay = () => heroVideo.play().catch(() => {});
            tryPlay();
            // Some browsers need a user interaction nudge
            document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
            document.addEventListener('click', tryPlay, { once: true });
        } else {
            // --- Scroll-driven playback ---
            heroVideo.removeAttribute('autoplay');
            heroVideo.removeAttribute('loop');
            heroVideo.pause();
            heroVideo.muted = true;

            let targetTime = 0;
            let displayedTime = 0;
            let rafId = null;
            let videoReady = false;

            const computeProgress = () => {
                const rect = heroSection.getBoundingClientRect();
                const scrollable = heroSection.offsetHeight - window.innerHeight;
                if (scrollable <= 0) return 0;
                const scrolled = -rect.top;
                return Math.max(0, Math.min(1, scrolled / scrollable));
            };

            const updateTextPhases = (progress) => {
                // 3 phases: intro (0-0.33), services (0.33-0.66), CTA (0.66-1)
                const introActive = progress < 0.34;
                const servicesActive = progress >= 0.3 && progress < 0.72;
                const ctaActive = progress >= 0.68;

                heroTextIntro.classList.toggle('active', introActive);
                heroTextServices.classList.toggle('active', servicesActive);
                heroTextCTA.classList.toggle('active', ctaActive);
            };

            const updateProgressBar = (progress) => {
                heroProgressBar.style.height = `${progress * 100}%`;
            };

            const tick = () => {
                rafId = null;
                // Smooth interpolation toward target (eases scroll jitter)
                const diff = targetTime - displayedTime;
                if (Math.abs(diff) > 0.005) {
                    displayedTime += diff * 0.22;
                    if (videoReady && !isNaN(displayedTime)) {
                        try { heroVideo.currentTime = displayedTime; } catch (e) {}
                    }
                    rafId = requestAnimationFrame(tick);
                } else {
                    displayedTime = targetTime;
                    if (videoReady && !isNaN(displayedTime)) {
                        try { heroVideo.currentTime = displayedTime; } catch (e) {}
                    }
                }
            };

            const onScroll = () => {
                const progress = computeProgress();

                // Update overlays immediately (not tied to interpolation)
                updateProgressBar(progress);
                updateTextPhases(progress);

                const duration = (heroVideo.duration && isFinite(heroVideo.duration)) ? heroVideo.duration : 14;
                targetTime = progress * duration;

                if (!rafId) {
                    rafId = requestAnimationFrame(tick);
                }
            };

            const initVideo = () => {
                videoReady = true;
                onScroll();
            };

            if (heroVideo.readyState >= 2) {
                initVideo();
            } else {
                heroVideo.addEventListener('loadedmetadata', initVideo, { once: true });
                heroVideo.addEventListener('loadeddata', initVideo, { once: true });
            }

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });

            // Force a first paint after short delay in case scroll hasn't fired
            setTimeout(() => onScroll(), 100);
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

        // Trigger counters when user reaches the CTA phase in the hero
        // (fallback: on intersection with hero-stats which is always in DOM)
        const statsContainer = counters[0].closest('.hero-stats');
        if (statsContainer) {
            // Trigger once hero scroll progress indicates CTA phase, or immediately in fallback
            if (useFallback) {
                setTimeout(() => {
                    if (!animated) { animated = true; animateCounters(); }
                }, 800);
            } else {
                const checkAndRun = () => {
                    const rect = heroSection.getBoundingClientRect();
                    const scrollable = heroSection.offsetHeight - window.innerHeight;
                    const progress = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;
                    if (progress >= 0.65 && !animated) {
                        animated = true;
                        animateCounters();
                        window.removeEventListener('scroll', checkAndRun);
                    }
                };
                window.addEventListener('scroll', checkAndRun, { passive: true });
            }
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
