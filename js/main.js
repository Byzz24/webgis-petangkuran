/* =========================================================
   MAIN.JS — Landing Page Interactions
   WebGIS Desa Kaibonpetangkuran
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ===== EFEK GULIR NAVBAR =====
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ===== PENGATURAN MENU NAVIGASI MOBILE =====
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    // Tutup menu saat tautan diklik
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ===== GULIR HALUS UNTUK TAUTAN JANGKAR =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72; // account for fixed navbar
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== FADE-IN ANIMATIONS (INTERSECTION OBSERVER) =====
  const animatedElements = document.querySelectorAll('.animate-fade-up, .feature-card, .about-card, .team-card, .proker-cards');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(el => {
      if (!el.classList.contains('animate-fade-up')) {
        el.classList.add('animate-fade-up');
      }
      observer.observe(el);
    });
  } else {
    // Fallback: show all
    animatedElements.forEach(el => el.classList.add('visible'));
  }

  // ===== COUNTER ANIMATION FOR STATS =====
  const statNums = document.querySelectorAll('.stat-num[data-count]');
  
  if (statNums.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          animateCounter(el, 0, target, 1500);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      el.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // ===== HERO PARTICLES =====
  const particlesContainer = document.getElementById('heroParticles');
  if (particlesContainer) {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
      particle.style.width = (Math.random() * 3 + 1) + 'px';
      particle.style.height = particle.style.width;
      particlesContainer.appendChild(particle);
    }
  }

  // ===== TAUTAN NAVIGASI AKTIF SAAT DIGULIR =====
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    const navLinksAll = document.querySelectorAll('.nav-link[href^="#"]');
    
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 100;
      
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        
        if (scrollPos >= top && scrollPos < top + height) {
          navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { passive: true });
  }
});
