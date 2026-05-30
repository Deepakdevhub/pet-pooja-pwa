/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Floating Action Button (FAB) Component
 * ═══════════════════════════════════════════════════════════
 * Expandable speed-dial FAB with quick-action buttons:
 * Download Menu, Call, Directions, WhatsApp, Admin.
 * Hides on the auth page.
 */

import { CONFIG, getCategory } from '../config.js';
import { formatPrice, getCategoryEmoji } from '../utils/format.js';
import { openWhatsApp, callOwner, openDirections, getOwnerWhatsAppLink } from '../utils/whatsapp.js';
import { navigate, getCurrentRoute } from '../router.js';
import * as Store from '../store.js';
import { showToast } from './toast.js';

/** @type {HTMLElement|null} */
let fabContainer = null;
/** @type {HTMLElement|null} */
let fabMain = null;
/** @type {HTMLElement|null} */
let fabActions = null;
/** @type {HTMLElement|null} */
let fabBackdrop = null;
let isOpen = false;

/**
 * Initialize the FAB — appends markup to document.body.
 * Call once during app bootstrap.
 */
export function initFab() {
  if (fabContainer && document.body.contains(fabContainer)) return;

  // ── Backdrop ──
  fabBackdrop = document.createElement('div');
  fabBackdrop.className = 'fab-backdrop';
  fabBackdrop.id = 'fab-backdrop';
  document.body.appendChild(fabBackdrop);

  // ── FAB Container ──
  fabContainer = document.createElement('div');
  fabContainer.className = 'fab-container';
  fabContainer.id = 'fab-container';
  fabContainer.innerHTML = `
    <button class="fab-main" id="fab-main-btn" aria-label="Quick actions" aria-expanded="false">
      ➕
    </button>
    <div class="fab-actions" id="fab-actions">
      <button class="fab-action" id="fab-action-menu" aria-label="Download Menu">
        <span class="fab-icon">📋</span>
        <span>Download Menu</span>
      </button>
      <button class="fab-action" id="fab-action-call" aria-label="Call Us">
        <span class="fab-icon">📞</span>
        <span>Call Us</span>
      </button>
      <button class="fab-action" id="fab-action-directions" aria-label="Directions">
        <span class="fab-icon">📍</span>
        <span>Directions</span>
      </button>
      <button class="fab-action" id="fab-action-whatsapp" aria-label="WhatsApp">
        <span class="fab-icon">💬</span>
        <span>WhatsApp</span>
      </button>
      <button class="fab-action" id="fab-action-share" aria-label="Share Menu">
        <span class="fab-icon">📤</span>
        <span>Share Menu</span>
      </button>
      <button class="fab-action" id="fab-action-admin" aria-label="Admin">
        <span class="fab-icon">👤</span>
        <span>Admin</span>
      </button>
    </div>
  `;

  document.body.appendChild(fabContainer);

  // Cache references
  fabMain = document.getElementById('fab-main-btn');
  fabActions = document.getElementById('fab-actions');

  // ── Event Listeners ──

  // Toggle open/close
  fabMain.addEventListener('click', toggleFab);

  // Close on backdrop click
  fabBackdrop.addEventListener('click', closeFab);

  // Action: Download Menu
  document.getElementById('fab-action-menu').addEventListener('click', () => {
    closeFab();
    downloadMenuAsImage();
  });

  // Action: Call Us
  document.getElementById('fab-action-call').addEventListener('click', () => {
    closeFab();
    callOwner(0);
  });

  // Action: Directions
  document.getElementById('fab-action-directions').addEventListener('click', () => {
    closeFab();
    openDirections();
  });

  // Action: WhatsApp
  document.getElementById('fab-action-whatsapp').addEventListener('click', () => {
    closeFab();
    const link = getOwnerWhatsAppLink();
    window.open(link, '_blank');
  });

  // Action: Share Menu
  document.getElementById('fab-action-share').addEventListener('click', () => {
    closeFab();
    if (navigator.share) {
      navigator.share({
        title: CONFIG.shop.fullName,
        text: `Check out ${CONFIG.shop.fullName} — ${CONFIG.shop.heroTitle}! Order online:`,
        url: window.location.origin
      }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin).then(() => {
        showToast('Link copied! Share it with friends 📋', 'success');
      }).catch(() => {
        showToast('Share not supported on this browser', 'warning');
      });
    }
  });

  // Action: Admin
  document.getElementById('fab-action-admin').addEventListener('click', () => {
    closeFab();
    navigate('/admin-login');
  });

  // ── Visibility: hide on auth page ──
  updateFabVisibility();
  window.addEventListener('hashchange', updateFabVisibility);
}

/**
 * Toggle FAB open/closed.
 */
function toggleFab() {
  if (isOpen) {
    closeFab();
  } else {
    openFab();
  }
}

/**
 * Open FAB actions.
 */
function openFab() {
  isOpen = true;
  fabMain.classList.add('open');
  fabMain.setAttribute('aria-expanded', 'true');
  fabActions.classList.add('open');
  fabBackdrop.classList.add('open');
}

/**
 * Close FAB actions.
 */
function closeFab() {
  isOpen = false;
  fabMain.classList.remove('open');
  fabMain.setAttribute('aria-expanded', 'false');
  fabActions.classList.remove('open');
  fabBackdrop.classList.remove('open');
}

/**
 * Show/hide the FAB based on the current route.
 * Hidden on the auth page.
 */
function updateFabVisibility() {
  if (!fabContainer) return;
  const route = getCurrentRoute();
  if (route === '/auth') {
    fabContainer.classList.add('hidden');
    fabBackdrop.classList.add('hidden');
  } else {
    fabContainer.classList.remove('hidden');
    fabBackdrop.classList.remove('hidden');
  }
}

/**
 * Generate a text-based menu image using Canvas and trigger download.
 */
function downloadMenuAsImage() {
  try {
    const menu = Store.getMenu();
    const categories = CONFIG.categories;

    // Group menu items by category
    const grouped = {};
    for (const cat of categories) {
      const items = menu.filter(i => i.category === cat.id && i.available);
      if (items.length > 0) {
        grouped[cat.id] = { category: cat, items };
      }
    }

    const catIds = Object.keys(grouped);
    if (catIds.length === 0) {
      showToast('Menu is empty', 'warning');
      return;
    }

    // ── Canvas dimensions ──
    const canvasWidth = 600;
    const padding = 32;
    const lineHeight = 28;
    const catHeaderHeight = 44;
    const titleBlockHeight = 110;
    const footerHeight = 60;

    // Calculate total height
    let totalItems = 0;
    for (const id of catIds) {
      totalItems += grouped[id].items.length;
    }
    const canvasHeight = titleBlockHeight
      + (catIds.length * (catHeaderHeight + 12))
      + (totalItems * lineHeight)
      + footerHeight
      + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // ── Background ──
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ── Title ──
    let y = padding;
    ctx.fillStyle = '#FF6B35';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🍕 ${CONFIG.shop.fullName}`, canvasWidth / 2, y + 28);
    y += 42;

    ctx.fillStyle = '#6B6B6B';
    ctx.font = '16px sans-serif';
    ctx.fillText(CONFIG.shop.description, canvasWidth / 2, y + 16);
    y += 30;

    ctx.fillStyle = '#9E9E9E';
    ctx.font = '13px sans-serif';
    ctx.fillText(CONFIG.shop.heroTitle, canvasWidth / 2, y + 14);
    y += 30;

    // Divider
    ctx.strokeStyle = '#F0E6DC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvasWidth - padding, y);
    ctx.stroke();
    y += 12;

    // ── Categories & Items ──
    ctx.textAlign = 'left';

    for (const catId of catIds) {
      const { category, items } = grouped[catId];

      // Category header
      ctx.fillStyle = category.color || '#FF6B35';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${category.icon} ${category.name}`, padding, y + 22);

      // Item count
      ctx.fillStyle = '#9E9E9E';
      ctx.font = '12px sans-serif';
      const countText = `(${items.length})`;
      ctx.fillText(countText, canvasWidth - padding - ctx.measureText(countText).width, y + 22);

      y += catHeaderHeight;

      // Items
      for (const item of items) {
        ctx.fillStyle = '#2D2D2D';
        ctx.font = '15px sans-serif';
        ctx.fillText(item.name, padding + 12, y + 16);

        ctx.fillStyle = '#C13515';
        ctx.font = 'bold 15px sans-serif';
        const priceText = formatPrice(item.price);
        ctx.fillText(priceText, canvasWidth - padding - ctx.measureText(priceText).width, y + 16);

        // Dotted line between name and price
        ctx.strokeStyle = '#E0D6CC';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 3]);
        const nameWidth = (() => {
          ctx.font = '15px sans-serif';
          return ctx.measureText(item.name).width;
        })();
        const priceWidth = (() => {
          ctx.font = 'bold 15px sans-serif';
          return ctx.measureText(priceText).width;
        })();
        const dotStart = padding + 12 + nameWidth + 8;
        const dotEnd = canvasWidth - padding - priceWidth - 8;
        if (dotEnd > dotStart) {
          ctx.beginPath();
          ctx.moveTo(dotStart, y + 12);
          ctx.lineTo(dotEnd, y + 12);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        y += lineHeight;
      }

      y += 12;
    }

    // ── Footer ──
    ctx.strokeStyle = '#F0E6DC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvasWidth - padding, y);
    ctx.stroke();
    y += 16;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9E9E9E';
    ctx.font = '12px sans-serif';
    const owner = CONFIG.contacts.owners[0];
    ctx.fillText(`📞 ${owner ? owner.phone : ''} | ${CONFIG.contacts.address}`, canvasWidth / 2, y + 12);

    // ── Download ──
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('Failed to generate menu image', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${CONFIG.shop.fullName.replace(/\s+/g, '_')}_Menu.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Menu downloaded!', 'success');
    }, 'image/png');

  } catch (err) {
    console.error('Menu download error:', err);
    showToast('Failed to download menu', 'error');
  }
}
