/**
 * Scroll-Triggered Reveal Motion & Initial Load Cascade
 * Delivers silky, subtle scroll entrance motion across all sections.
 */
(function () {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    document.documentElement.classList.add('has-scroll-motion');

    function initScrollMotion() {
        const motionMap = [
            // 1. Hero Section (Above the fold initial entrance)
            { sel: '.hero-title', delay: 0.04 },
            { sel: '.subscribe-section .claim-search-form', delay: 0.14 },
            { sel: '.subscribe-form-caption', delay: 0.22 },
            { sel: '.featured-subtitle', delay: 0.28 },
            { sel: '.featured-wrap', delay: 0.36 },

            // 2. Announcements & Activities Full-Width Carousel Section
            { sel: '.center-carousel-subtitle', delay: 0 },
            { sel: '.center-carousel-viewport', delay: 0.08 },
            { sel: '.center-carousel-footer-wrap', delay: 0.16 },

            // 3. Post Loop Feed Section
            { sel: '.loop-subtitle', delay: 0 },

            // 4. Bento Feature Section
            { sel: '.bento-separator', delay: 0 },

            // 5. Footer Section
            { sel: '.footer-subscribe', delay: 0 },
            { sel: '.footer-container', delay: 0.12 }
        ];

        const registeredElements = new Set();

        function registerElement(el, delay) {
            if (!el || registeredElements.has(el)) return;
            registeredElements.add(el);
            el.classList.add('motion-scroll-item');
            if (delay) el.style.transitionDelay = `${delay}s`;

            el.addEventListener('transitionend', function onEnd(e) {
                if (e.target === el && e.propertyName === 'transform') {
                    el.classList.add('is-done');
                    el.removeEventListener('transitionend', onEnd);
                }
            });

            observer.observe(el);
        }

        // High-performance IntersectionObserver with comfortable entry margin
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-inview');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.06
        });

        // Register defined motion blocks
        motionMap.forEach(({ sel, delay }) => {
            document.querySelectorAll(sel).forEach((el) => {
                registerElement(el, delay);
            });
        });

        // Register Bento Cards with column stagger (0s for 1st card, 0.12s for 2nd card)
        document.querySelectorAll('.bento-row').forEach((row) => {
            const cards = row.querySelectorAll('.bento-card');
            cards.forEach((card, idx) => {
                registerElement(card, idx * 0.12);
            });
        });

        // Register Post Loop Items with 3-column stagger (0s, 0.08s, 0.16s)
        function registerLoopItems(container) {
            const items = container.querySelectorAll('.item');
            items.forEach((item, idx) => {
                registerElement(item, (idx % 3) * 0.08);
            });
        }

        const loopWrap = document.querySelector('.loop-wrap');
        if (loopWrap) {
            registerLoopItems(loopWrap);

            const loopMutation = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.matches('.item')) {
                                registerElement(node, 0.08);
                            } else if (node.querySelectorAll) {
                                node.querySelectorAll('.item').forEach((item) => {
                                    registerElement(item, 0.08);
                                });
                            }
                        }
                    });
                });
            });
            loopMutation.observe(loopWrap, { childList: true });
        }

        // Immediately check elements that are in or near the viewport on first page open
        requestAnimationFrame(() => {
            const vh = window.innerHeight || document.documentElement.clientHeight;
            registeredElements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < vh * 0.95 && rect.bottom > 0) {
                    el.classList.add('is-inview');
                    observer.unobserve(el);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollMotion);
    } else {
        initScrollMotion();
    }
})();

