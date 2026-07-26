// ==================== GSAP Animations ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Register ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Animate elements with .gsap-reveal class
    gsap.utils.toArray('.gsap-reveal').forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out',
      });
    });

    // Animate elements with .gsap-reveal-left class
    gsap.utils.toArray('.gsap-reveal-left').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    // Animate elements with .gsap-reveal-right class
    gsap.utils.toArray('.gsap-reveal-right').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    // Animate elements with .gsap-reveal-scale class
    gsap.utils.toArray('.gsap-reveal-scale').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    // Hero animation timeline
    const heroTl = gsap.timeline();
    heroTl
      .from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
      .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-stats', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Floating animation for phone mockup
    gsap.to('.phone-mockup', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }

  // ==================== Sidebar Toggle (Dashboard) ====================
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });

    // Close sidebar on click outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add('-translate-x-full');
      }
    });
  }

  // ==================== Smooth Scroll ====================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ==================== Form Validation Visual Feedback ====================
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('focus', () => {
      el.parentElement?.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
    });
    el.addEventListener('blur', () => {
      el.parentElement?.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
    });
  });

  // ==================== Toast Notifications ====================
  window.showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-primary-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ==================== Loading State ====================
  window.showLoading = () => {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    loader.innerHTML = `
      <div class="bg-white rounded-xl p-6 flex items-center gap-4 shadow-2xl">
        <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-slate-700 font-medium">Memproses...</span>
      </div>
    `;
    document.body.appendChild(loader);
  };

  window.hideLoading = () => {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
  };

  // ==================== API Helper ====================
  window.api = {
    async get(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      return res.json();
    },
    async post(url, data) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      return res.json();
    },
    async put(url, data) {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      return res.json();
    },
    async patch(url, data) {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      return res.json();
    },
    async delete(url) {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      return res.json();
    },
  };
});
