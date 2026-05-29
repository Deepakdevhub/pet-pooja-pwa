/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Cart Page (Order Preview)
 * ═══════════════════════════════════════════════════════════
 * Shows cart items, suggested adds, coupon, notes, total.
 */

import { CONFIG, getMenuItem } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { formatPrice, getCategoryEmoji, escapeHtml } from '../utils/format.js';
import { showToast } from '../components/toast.js';

// Temporary storage for notes and coupon
let orderNotes = '';
let couponCode = '';

export function renderCart(container) {
  const cart = Store.getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-page">
        <div class="cart-page-header">
          <button class="back-btn" id="cart-back">←</button>
          <h1>Your Order</h1>
        </div>
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">Your cart is empty</div>
          <div class="empty-desc">Add some delicious items from our menu!</div>
          <button class="btn btn-primary" id="cart-browse">Browse Menu</button>
        </div>
      </div>
    `;
    document.getElementById('cart-back').addEventListener('click', () => navigate('/home'));
    document.getElementById('cart-browse').addEventListener('click', () => navigate('/home'));
    return;
  }

  const subtotal = Store.getCartTotal();
  const cartCount = Store.getCartCount();

  // Get suggestions: items not in cart
  const cartIds = new Set(cart.map(c => c.itemId));
  const suggestions = CONFIG.suggestedIds
    .filter(id => !cartIds.has(id))
    .map(id => Store.getMenuItemById(id) || getMenuItem(id))
    .filter(Boolean)
    .slice(0, 5);

  container.innerHTML = `
    <div class="cart-page">
      <div class="cart-page-header">
        <button class="back-btn" id="cart-back">←</button>
        <h1>Your Order <span class="text-muted text-sm">(${cartCount} items)</span></h1>
      </div>

      <!-- Cart Items -->
      <div id="cart-items-list">
        ${cart.map((item, idx) => `
          <div class="cart-item" style="animation-delay:${idx * 50}ms" data-item-id="${item.itemId}">
            <div class="cart-item-emoji">${getCategoryEmoji(item.category)}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${escapeHtml(item.name)}</div>
              <div class="cart-item-price">${formatPrice(item.price)} × ${item.qty} = ${formatPrice(item.price * item.qty)}</div>
            </div>
            <div class="qty-stepper">
              <button class="qty-minus" data-id="${item.itemId}">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-plus" data-id="${item.itemId}">+</button>
            </div>
            <button class="cart-item-remove" data-id="${item.itemId}" title="Remove">🗑️</button>
          </div>
        `).join('')}
      </div>

      ${suggestions.length > 0 ? `
        <!-- Suggested Items -->
        <div class="cart-suggestions">
          <div class="section-title">🌟 You might also like</div>
          <div class="suggestions-scroll">
            ${suggestions.map(item => `
              <div class="suggestion-card" data-suggest-id="${item.id}">
                <div class="suggestion-card-img" style="background:linear-gradient(135deg, #FFF0E5, #FFE8D6);">
                  <span>${getCategoryEmoji(item.category)}</span>
                </div>
                <div class="suggestion-card-body">
                  <div class="suggestion-card-name">${item.name}</div>
                  <div class="suggestion-card-price">${formatPrice(item.price)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Order Notes -->
      <div class="section">
        <div class="section-title">📝 Order Notes</div>
        <textarea class="input" id="cart-notes" placeholder="Any special instructions? (e.g., less spicy, extra sauce...)" rows="2">${escapeHtml(orderNotes)}</textarea>
      </div>

      <!-- Coupon -->
      <div class="section">
        <div class="section-title">🎟️ Coupon Code</div>
        <div class="cart-coupon">
          <input type="text" class="input" id="cart-coupon" placeholder="Enter code" value="${escapeHtml(couponCode)}" />
          <button class="btn btn-secondary btn-sm" id="cart-apply-coupon">Apply</button>
        </div>
        ${couponCode ? `<div class="input-hint" style="color:var(--c-success);">Coupon "${escapeHtml(couponCode)}" applied ✓</div>` : ''}
      </div>

      <!-- Total -->
      <div class="cart-total-card">
        <div class="cart-total-row">
          <span>Subtotal (${cartCount} items)</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        ${couponCode ? `
          <div class="cart-total-row" style="color:var(--c-success);">
            <span>Coupon Discount</span>
            <span>Applied at checkout</span>
          </div>
        ` : ''}
        <div class="cart-total-row total">
          <span>Total</span>
          <span class="text-price">${formatPrice(subtotal)}</span>
        </div>
      </div>

      <!-- Proceed Button -->
      <button class="btn btn-primary btn-full btn-lg mt-24" id="cart-proceed">
        Proceed to Verify →
      </button>

      <div style="height:30px;"></div>
    </div>
  `;

  // ── Events ──
  document.getElementById('cart-back').addEventListener('click', () => navigate('/home'));

  // Qty changes
  document.getElementById('cart-items-list').addEventListener('click', (e) => {
    const plus = e.target.closest('.qty-plus');
    const minus = e.target.closest('.qty-minus');
    const remove = e.target.closest('.cart-item-remove');

    if (plus) {
      const qty = Store.getCartItemQty(plus.dataset.id);
      Store.updateCartQty(plus.dataset.id, qty + 1);
      renderCart(container); // Re-render
    }
    if (minus) {
      const qty = Store.getCartItemQty(minus.dataset.id);
      Store.updateCartQty(minus.dataset.id, qty - 1);
      renderCart(container);
    }
    if (remove) {
      Store.removeFromCart(remove.dataset.id);
      showToast('Item removed', 'info');
      renderCart(container);
    }
  });

  // Suggestions
  container.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = Store.getMenuItemById(card.dataset.suggestId) || getMenuItem(card.dataset.suggestId);
      if (item) {
        Store.addToCart(item);
        showToast(`${item.name} added!`, 'success');
        renderCart(container);
      }
    });
  });

  // Notes
  document.getElementById('cart-notes').addEventListener('input', (e) => {
    orderNotes = e.target.value;
  });

  // Coupon
  document.getElementById('cart-apply-coupon').addEventListener('click', () => {
    const input = document.getElementById('cart-coupon');
    couponCode = input.value.trim().toUpperCase();
    if (couponCode) {
      showToast(`Coupon "${couponCode}" applied ✓`, 'success');
      renderCart(container);
    }
  });

  // Proceed
  document.getElementById('cart-proceed').addEventListener('click', () => {
    // Store notes and coupon in sessionStorage for verify page
    sessionStorage.setItem('pp_order_notes', orderNotes);
    sessionStorage.setItem('pp_order_coupon', couponCode);
    navigate('/verify');
  });
}

// Export for verify page to read
export function getOrderMeta() {
  return {
    notes: orderNotes || sessionStorage.getItem('pp_order_notes') || '',
    coupon: couponCode || sessionStorage.getItem('pp_order_coupon') || '',
  };
}
