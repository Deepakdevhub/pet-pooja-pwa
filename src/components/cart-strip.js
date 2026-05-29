/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Cart Strip Component (Floating Bottom Bar)
 * ═══════════════════════════════════════════════════════════
 * Shows cart summary at the bottom of the screen.
 * Auto-updates when cart changes via event bus.
 */

import { formatPrice } from '../utils/format.js';
import * as Store from '../store.js';
import { navigate } from '../router.js';

/** @type {HTMLElement|null} */
let stripEl = null;
/** @type {HTMLElement|null} */
let countEl = null;
/** @type {HTMLElement|null} */
let totalEl = null;

/**
 * Initialize the cart strip — appends markup to document.body.
 * Call once during app bootstrap.
 */
export function initCartStrip() {
  if (stripEl && document.body.contains(stripEl)) return;

  stripEl = document.createElement('div');
  stripEl.className = 'cart-strip';
  stripEl.id = 'cart-strip';
  stripEl.innerHTML = `
    <div class="cart-strip-inner" id="cart-strip-inner" role="button" tabindex="0" aria-label="View cart">
      <div class="cart-strip-left">
        <div class="cart-strip-count" id="cart-strip-count">0 items</div>
        <div class="cart-strip-total" id="cart-strip-total">${formatPrice(0)}</div>
      </div>
      <div class="cart-strip-right">
        <span>View Order</span>
        <span class="arrow">→</span>
      </div>
    </div>
  `;

  document.body.appendChild(stripEl);

  countEl = document.getElementById('cart-strip-count');
  totalEl = document.getElementById('cart-strip-total');

  // Navigate to cart on click
  document.getElementById('cart-strip-inner').addEventListener('click', () => {
    navigate('/cart');
  });

  // Listen for cart changes
  Store.on('cart:changed', () => {
    updateCartStrip();
  });

  // Initial render
  updateCartStrip();
}

/**
 * Update the cart strip's visible state, item count, and total.
 * Called automatically on cart:changed and can be called manually.
 */
export function updateCartStrip() {
  if (!stripEl) return;

  const count = Store.getCartCount();
  const total = Store.getCartTotal();

  if (count > 0) {
    stripEl.classList.add('visible');
  } else {
    stripEl.classList.remove('visible');
  }

  if (countEl) {
    countEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
  if (totalEl) {
    totalEl.textContent = formatPrice(total);
  }
}
