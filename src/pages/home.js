/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Home Page
 * ═══════════════════════════════════════════════════════════
 * Header → Order Mode → Hero → Search → Categories → Menu Grid
 * The main ordering interface.
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

export function renderHome(container) {
  // Cleanup previous listeners
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];

  const user = Store.getUser();
  const settings = Store.getSettings();

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
      ${renderMenuGrid(activeCategory)}
    </div>

    <!-- Bottom spacer for cart strip -->
    <div style="height:90px;"></div>
  `;

  // ── Event Listeners ──

  // Install button
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', () => triggerInstall());
  }

  // Search trigger
  document.getElementById('search-trigger').addEventListener('click', () => openSearch());

  // Order modes
  document.getElementById('order-modes').addEventListener('click', (e) => {
    const btn = e.target.closest('.order-mode-btn');
    if (!btn || btn.classList.contains('disabled')) return;
    const mode = btn.dataset.mode;
    document.querySelectorAll('.order-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Store.updateSettings({ orderMode: mode });
    showToast(`Switched to ${mode} ordering`, 'info');
  });

  // Category switching
  document.getElementById('categories-scroll').addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('menu-section').innerHTML = renderMenuGrid(activeCategory);
    // No need to re-attach — delegated listener on #menu-section survives innerHTML changes
  });

  // Notification button
  document.getElementById('home-notif-btn').addEventListener('click', async () => {
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
    const item = Store.getMenuItemById(addBtn.dataset.id);
    if (item) {
      Store.addToCart(item);
      showToast(`${item.name} added!`, 'success');
      if (navigator.vibrate) navigator.vibrate(30);
    }
    return;
  }

  // Qty plus
  const plusBtn = e.target.closest('.qty-plus');
  if (plusBtn) {
    const qty = Store.getCartItemQty(plusBtn.dataset.id);
    Store.updateCartQty(plusBtn.dataset.id, qty + 1);
    return;
  }

  // Qty minus
  const minusBtn = e.target.closest('.qty-minus');
  if (minusBtn) {
    const qty = Store.getCartItemQty(minusBtn.dataset.id);
    Store.updateCartQty(minusBtn.dataset.id, qty - 1);
    return;
  }
}

function renderMenuGrid(categoryId) {
  const items = Store.getMenuByCategory(categoryId);
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

  return `
    <div class="menu-section-title">
      <span>${cat.icon}</span>
      <span>${cat.name}</span>
    </div>
    <div class="menu-grid">
      ${items.map(item => {
        const qty = Store.getCartItemQty(item.id);
        const emoji = getCategoryEmoji(item.category);
        return `
          <div class="menu-card ${!item.available ? 'unavailable' : ''}" data-item-id="${item.id}">
            <div class="menu-card-img" style="${!item.img ? `background:linear-gradient(135deg, ${cat.color}15, ${cat.color}08);` : ''}">
              ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
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
  // Only re-render HTML — the delegated click handler on #menu-section survives innerHTML swaps
  section.innerHTML = renderMenuGrid(activeCategory);
}
