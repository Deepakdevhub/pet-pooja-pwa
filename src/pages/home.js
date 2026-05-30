/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Home Page
 * ═══════════════════════════════════════════════════════════
 * Header → Store Status → Order Mode → Hero → Last Order →
 * Search → Categories → Menu Grid (popular first)
 */

import { CONFIG, getCategory } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { formatPrice, getCategoryEmoji } from '../utils/format.js';
import { openSearch } from '../components/search.js';
import { updateCartStrip } from '../components/cart-strip.js';
import { showToast } from '../components/toast.js';
import { triggerInstall } from '../main.js';

let activeCategory = 'pizza';
let cleanupFns = [];

/** Haptic helper — safe no-op on unsupported devices */
function haptic(ms = 20) { if (navigator.vibrate) navigator.vibrate(ms); }

export function renderHome(container) {
  // Cleanup previous listeners
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];

  const user = Store.getUser();
  const settings = Store.getSettings();
  const storeOpen = Store.isStoreOpen();
  const lastOrder = Store.getLastOrder();
  const popularIds = Store.getPopularItemIds();

  container.innerHTML = `
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="header-brand">
          <span class="brand-icon">🍕</span>
          <div>
            <div class="brand-name">${CONFIG.shop.name}</div>
            <div class="brand-tag">${CONFIG.shop.tagline}</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="install-btn hidden" id="pwa-install-btn" title="Install App">
            📲 Install
          </button>
          <button class="header-btn" id="home-notif-btn" title="Notifications">🔔</button>
        </div>
      </div>
    </header>

    <!-- Store Status Banner -->
    <div class="store-status-banner ${storeOpen ? 'open' : 'closed'}" id="store-status">
      <span class="status-dot"></span>
      <span>${storeOpen
        ? `We're Open — Ordering available until ${Store.getStoreHoursText().split('–')[1].trim()}`
        : `We're Closed — Opens at ${Store.getStoreHoursText().split('–')[0].trim()}`
      }</span>
    </div>

    <!-- Order Modes -->
    <div class="order-modes" id="order-modes">
      ${CONFIG.orderModes.map(mode => `
        <button class="order-mode-btn ${mode.id === settings.orderMode ? 'active' : ''} ${!mode.active ? 'disabled' : ''}"
                data-mode="${mode.id}" ${!mode.active ? 'aria-disabled="true"' : ''}>
          <span>${mode.icon}</span>
          <span>${mode.label}</span>
          ${mode.comingSoon ? '<span class="coming-soon-tag">Soon</span>' : ''}
        </button>
      `).join('')}
    </div>

    <!-- Hero Section -->
    <div class="hero">
      <div class="hero-bg">
        <div class="hero-content">
          <h2>${CONFIG.shop.heroTitle}</h2>
          <p>${CONFIG.shop.heroSubtitle}</p>
        </div>
      </div>
      <div class="hero-emoji">🍕</div>
    </div>

    ${lastOrder ? `
    <!-- Last Order Reorder Banner -->
    <div class="last-order-banner" id="last-order-banner">
      <div class="last-order-info">
        <span class="last-order-icon">🔄</span>
        <div>
          <div class="last-order-title">Reorder your last</div>
          <div class="last-order-items">${lastOrder.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="reorder-btn">Reorder ${formatPrice(lastOrder.total)}</button>
    </div>
    ` : ''}

    <!-- Smart Install Banner -->
    <div class="install-banner hidden" id="smart-install-banner">
      <div class="install-banner-text">
        <span>📲</span>
        <div>
          <div class="install-banner-title">Install ${CONFIG.shop.name}</div>
          <div class="install-banner-desc">Faster ordering, works offline</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="smart-install-btn">Install</button>
      <button class="install-banner-close" id="smart-install-close">✕</button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar-trigger">
      <div class="search-trigger-input" id="search-trigger" role="button" tabindex="0" aria-label="Search menu">
        <span class="search-icon">🔍</span>
        <span>Search pizza, burger, grill...</span>
      </div>
    </div>

    <!-- Categories -->
    <div class="categories-scroll" id="categories-scroll">
      ${CONFIG.categories.map(cat => `
        <button class="category-chip ${cat.id === activeCategory ? 'active' : ''}" data-cat="${cat.id}">
          <span class="chip-icon">${cat.icon}</span>
          <span>${cat.name}</span>
          <span class="chip-count">${Store.getMenuByCategory(cat.id).length}</span>
        </button>
      `).join('')}
    </div>

    <!-- Menu Grid -->
    <div class="menu-section" id="menu-section">
      ${renderMenuGrid(activeCategory, popularIds)}
    </div>

    <!-- Bottom spacer for cart strip -->
    <div style="height:90px;"></div>
  `;

  // ── Event Listeners ──

  // Install button
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', () => { triggerInstall(); haptic(); });
  }

  // Search trigger
  document.getElementById('search-trigger').addEventListener('click', () => { openSearch(); haptic(); });

  // Order modes
  document.getElementById('order-modes').addEventListener('click', (e) => {
    const btn = e.target.closest('.order-mode-btn');
    if (!btn || btn.classList.contains('disabled')) return;
    // Block ordering if store is closed
    if (!storeOpen) {
      showToast(`We're closed! Orders open ${Store.getStoreHoursText()}`, 'warning');
      haptic(100);
      return;
    }
    const mode = btn.dataset.mode;
    document.querySelectorAll('.order-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Store.updateSettings({ orderMode: mode });
    showToast(`Switched to ${mode} ordering`, 'info');
    haptic();
  });

  // Category switching
  document.getElementById('categories-scroll').addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('menu-section').innerHTML = renderMenuGrid(activeCategory, popularIds);
    haptic();
  });

  // Notification button
  document.getElementById('home-notif-btn').addEventListener('click', async () => {
    haptic();
    if (!('Notification' in window)) {
      showToast('Notifications not supported on this browser', 'warning');
      return;
    }
    if (Notification.permission === 'granted') {
      showToast('Notifications already enabled ✓', 'success');
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      showToast('Notifications enabled! 🔔', 'success');
    } else {
      showToast('Notifications blocked. Check browser settings.', 'warning');
    }
  });

  // Menu card listeners — attach ONCE via event delegation (survives innerHTML swaps)
  const menuSection = document.getElementById('menu-section');
  menuSection.addEventListener('click', handleMenuClick);

  // Reorder button
  const reorderBtn = document.getElementById('reorder-btn');
  if (reorderBtn && lastOrder) {
    reorderBtn.addEventListener('click', () => {
      haptic(50);
      for (const item of lastOrder.items) {
        const menuItem = Store.getMenuItemById(item.itemId);
        if (menuItem && menuItem.available) {
          Store.addToCart(menuItem, item.qty);
        }
      }
      showToast('Last order added to cart! 🔄', 'success');
    });
  }

  // Smart install banner
  handleSmartInstall();

  // ── Swipe gesture to change category ──
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  const onTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
  };

  const onTouchEnd = (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // Only trigger if horizontal distance > 50px and more horizontal than vertical
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    const catIds = CONFIG.categories.map(c => c.id);
    const currentIdx = catIds.indexOf(activeCategory);
    let nextIdx;

    if (dx < 0) {
      // Swipe left → next category
      nextIdx = currentIdx + 1;
    } else {
      // Swipe right → previous category
      nextIdx = currentIdx - 1;
    }

    if (nextIdx < 0 || nextIdx >= catIds.length) return;

    activeCategory = catIds[nextIdx];

    // Update chips
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    const activeChip = document.querySelector(`.category-chip[data-cat="${activeCategory}"]`);
    if (activeChip) {
      activeChip.classList.add('active');
      // Auto-scroll chip into view
      activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // Re-render with slide animation
    menuSection.style.opacity = '0.3';
    menuSection.style.transform = dx < 0 ? 'translateX(-8px)' : 'translateX(8px)';
    requestAnimationFrame(() => {
      menuSection.innerHTML = renderMenuGrid(activeCategory, popularIds);
      requestAnimationFrame(() => {
        menuSection.style.transition = 'opacity 0.2s, transform 0.2s';
        menuSection.style.opacity = '1';
        menuSection.style.transform = 'translateX(0)';
        setTimeout(() => { menuSection.style.transition = ''; }, 200);
      });
    });

    haptic(15);
  };

  menuSection.addEventListener('touchstart', onTouchStart, { passive: true });
  menuSection.addEventListener('touchend', onTouchEnd, { passive: true });
  cleanupFns.push(() => {
    menuSection.removeEventListener('touchstart', onTouchStart);
    menuSection.removeEventListener('touchend', onTouchEnd);
  });

  // React to cart changes
  const onCartChange = () => {
    updateMenuQtyDisplays();
    updateCartStrip();
  };
  Store.on('cart:changed', onCartChange);
  cleanupFns.push(() => Store.off('cart:changed', onCartChange));

  // Update cart strip on load
  updateCartStrip();
}

/**
 * Single delegated click handler for menu items.
 * Attached ONCE to #menu-section — survives innerHTML replacements.
 */
function handleMenuClick(e) {
  // Add button
  const addBtn = e.target.closest('.menu-card-add');
  if (addBtn) {
    // Block if store is closed
    if (!Store.isStoreOpen()) {
      showToast(`We're closed! Orders open ${Store.getStoreHoursText()}`, 'warning');
      haptic(100);
      return;
    }
    const item = Store.getMenuItemById(addBtn.dataset.id);
    if (item) {
      Store.addToCart(item);
      showToast(`${item.name} added!`, 'success');
      haptic(30);
    }
    return;
  }

  // Qty plus
  const plusBtn = e.target.closest('.qty-plus');
  if (plusBtn) {
    const qty = Store.getCartItemQty(plusBtn.dataset.id);
    Store.updateCartQty(plusBtn.dataset.id, qty + 1);
    haptic(15);
    return;
  }

  // Qty minus
  const minusBtn = e.target.closest('.qty-minus');
  if (minusBtn) {
    const qty = Store.getCartItemQty(minusBtn.dataset.id);
    Store.updateCartQty(minusBtn.dataset.id, qty - 1);
    haptic(15);
    return;
  }
}

function renderMenuGrid(categoryId, popularIds = []) {
  let items = Store.getMenuByCategory(categoryId);
  const cat = getCategory(categoryId);

  if (items.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <div class="empty-title">No items yet</div>
        <div class="empty-desc">Items will appear here when added by the admin.</div>
      </div>
    `;
  }

  // Sort: popular items first
  if (popularIds.length > 0) {
    items = [...items].sort((a, b) => {
      const aPopular = popularIds.includes(a.id) ? 0 : 1;
      const bPopular = popularIds.includes(b.id) ? 0 : 1;
      return aPopular - bPopular;
    });
  }

  return `
    <div class="menu-section-title">
      <span>${cat.icon}</span>
      <span>${cat.name}</span>
    </div>
    <div class="menu-grid">
      ${items.map(item => {
        const qty = Store.getCartItemQty(item.id);
        const emoji = getCategoryEmoji(item.category);
        const isPopular = popularIds.includes(item.id);
        return `
          <div class="menu-card ${!item.available ? 'unavailable' : ''}" data-item-id="${item.id}">
            <div class="menu-card-img" style="${!item.img ? `background:linear-gradient(135deg, ${cat.color}15, ${cat.color}08);` : ''}">
              ${isPopular ? '<span class="card-badge popular-badge">🔥 Popular</span>' : (item.badge ? `<span class="card-badge">${item.badge}</span>` : '')}
              ${item.tags && item.tags.length ? `<span class="card-tag">${item.tags[0]}</span>` : ''}
              ${item.img
                ? `<img src="${item.img}" class="menu-card-photo" alt="${item.name}" loading="lazy" />`
                : `<span style="font-size:2.8rem;">${emoji}</span>`
              }
            </div>
            <div class="menu-card-body">
              <div class="menu-card-name">${item.name}</div>
              ${item.desc ? `<div class="menu-card-desc">${item.desc}</div>` : ''}
              <div class="menu-card-footer">
                <span class="menu-card-price">${formatPrice(item.price)}</span>
                ${qty > 0 ? `
                  <div class="qty-stepper" id="qty-${item.id}">
                    <button class="qty-minus" data-id="${item.id}">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-plus" data-id="${item.id}">+</button>
                  </div>
                ` : `
                  <button class="menu-card-add" data-id="${item.id}" title="Add to cart">+</button>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function updateMenuQtyDisplays() {
  const section = document.getElementById('menu-section');
  if (!section) return;
  section.innerHTML = renderMenuGrid(activeCategory, Store.getPopularItemIds());
}

/** Smart install banner — show after 2nd visit, hide if dismissed or installed */
function handleSmartInstall() {
  const banner = document.getElementById('smart-install-banner');
  const installBtn = document.getElementById('smart-install-btn');
  const closeBtn = document.getElementById('smart-install-close');
  if (!banner) return;

  // Track visits
  const visits = parseInt(localStorage.getItem('pp_visits') || '0', 10) + 1;
  localStorage.setItem('pp_visits', String(visits));

  const dismissed = localStorage.getItem('pp_install_dismissed');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Show on 2nd+ visit, not dismissed, not already installed
  if (visits >= 2 && !dismissed && !isStandalone) {
    banner.classList.remove('hidden');
  }

  installBtn?.addEventListener('click', () => {
    haptic(30);
    triggerInstall();
    banner.classList.add('hidden');
  });

  closeBtn?.addEventListener('click', () => {
    banner.classList.add('hidden');
    localStorage.setItem('pp_install_dismissed', '1');
  });
}
