/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Verify Order Page
 * ═══════════════════════════════════════════════════════════
 * Final order review. Add extras, cutlery, confirm & place.
 */

import { CONFIG } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { formatPrice, getCategoryEmoji, escapeHtml } from '../utils/format.js';
import { showToast } from '../components/toast.js';

export function renderVerify(container) {
  const cart = Store.getCart();
  if (cart.length === 0) {
    navigate('/cart');
    return;
  }

  const notes = sessionStorage.getItem('pp_order_notes') || '';
  const coupon = sessionStorage.getItem('pp_order_coupon') || '';
  const subtotal = Store.getCartTotal();

  // Track selected extras and cutlery
  const selectedExtras = new Set();
  let cutlery = false;

  function calcTotal() {
    let extrasTotal = 0;
    CONFIG.extras.forEach(ex => {
      if (selectedExtras.has(ex.id)) extrasTotal += ex.price;
    });
    return subtotal + extrasTotal;
  }

  function render() {
    const total = calcTotal();
    let extrasTotal = 0;
    CONFIG.extras.forEach(ex => {
      if (selectedExtras.has(ex.id)) extrasTotal += ex.price;
    });

    container.innerHTML = `
      <div class="verify-page">
        <div class="cart-page-header">
          <button class="back-btn" id="verify-back">←</button>
          <h1>Verify Order</h1>
        </div>

        <!-- Order Summary -->
        <div class="card-padded mb-16">
          <div class="section-title">📋 Order Summary</div>
          ${cart.map(item => `
            <div class="flex items-center justify-between gap-8 mb-8">
              <div class="flex items-center gap-8" style="flex:1;">
                <span>${getCategoryEmoji(item.category)}</span>
                <div>
                  <div class="font-semibold text-sm">${escapeHtml(item.name)}</div>
                  <div class="text-xs text-muted">${formatPrice(item.price)} each</div>
                </div>
              </div>
              <div class="qty-stepper">
                <button class="qty-minus" data-id="${item.itemId}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-plus" data-id="${item.itemId}">+</button>
              </div>
              <div class="text-price text-sm" style="min-width:50px;text-align:right;">
                ${formatPrice(item.price * item.qty)}
              </div>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
        </div>

        ${notes ? `
          <div class="card-padded mb-16">
            <div class="section-title">📝 Note</div>
            <p class="text-sm text-secondary">${escapeHtml(notes)}</p>
          </div>
        ` : ''}

        ${coupon ? `
          <div class="card-padded mb-16">
            <div class="flex items-center justify-between">
              <div class="section-title mb-0">🎟️ Coupon</div>
              <span class="badge badge-success">${escapeHtml(coupon)}</span>
            </div>
          </div>
        ` : ''}

        <!-- Extras -->
        <div class="section">
          <div class="section-title">🧀 Add Extras</div>
          <div class="extras-grid" id="extras-grid">
            ${CONFIG.extras.map(ex => `
              <div class="extra-item ${selectedExtras.has(ex.id) ? 'selected' : ''}" data-extra-id="${ex.id}">
                <span class="extra-icon">${ex.icon}</span>
                <span class="extra-name">${ex.name}</span>
                ${ex.price > 0 ? `<span class="extra-price">+${formatPrice(ex.price)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Total -->
        <div class="cart-total-card mb-16">
          <div class="cart-total-row">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
          ${extrasTotal > 0 ? `
            <div class="cart-total-row">
              <span>Extras</span>
              <span>+${formatPrice(extrasTotal)}</span>
            </div>
          ` : ''}
          <div class="cart-total-row total">
            <span>Total</span>
            <span class="text-price">${formatPrice(total)}</span>
          </div>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="confirm-warning" id="confirm-box">
          <span class="warn-icon">⚠️</span>
          <div>
            <label class="checkbox-wrap">
              <input type="checkbox" class="checkbox-input" id="confirm-check" />
              <div class="checkbox-box"></div>
              <span class="warn-text">I confirm this order is correct and final. Once placed, the order will be sent for preparation.</span>
            </label>
          </div>
        </div>

        <!-- Optional UPI Payment -->
        ${CONFIG.upi?.enabled ? `
          <div class="upi-pay-section" id="upi-pay-section">
            <a href="upi://pay?pa=${CONFIG.upi.id}&pn=${encodeURIComponent(CONFIG.upi.name)}&am=${total}&cu=INR&tn=PetPooja+Order" 
               class="btn btn-secondary btn-full" id="upi-pay-link" target="_blank" rel="noopener">
              💳 Pay ₹${total} via UPI (Optional)
            </a>
            <p class="text-xs text-muted" style="text-align:center;margin-top:6px;">Opens your UPI app. Payment is optional — you can pay at counter too.</p>
          </div>
        ` : ''}

        <!-- Place Order -->
        <button class="btn btn-primary btn-full btn-lg mt-16" id="place-order-btn" disabled>
          🍕 Place Order — ${formatPrice(total)}
        </button>

        <div style="height:30px;"></div>
      </div>
    `;

    // ── Events ──
    document.getElementById('verify-back').addEventListener('click', () => navigate('/cart'));

    // Qty changes
    container.querySelectorAll('.qty-minus, .qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const qty = Store.getCartItemQty(id);
        const newQty = btn.classList.contains('qty-plus') ? qty + 1 : qty - 1;
        Store.updateCartQty(id, newQty);
        if (newQty <= 0 && Store.getCart().length === 0) {
          navigate('/cart');
          return;
        }
        render();
      });
    });

    // Extras toggle
    document.getElementById('extras-grid').addEventListener('click', (e) => {
      const item = e.target.closest('.extra-item');
      if (!item) return;
      const id = item.dataset.extraId;
      if (selectedExtras.has(id)) {
        selectedExtras.delete(id);
      } else {
        selectedExtras.add(id);
      }
      // Check if it's cutlery
      const extraConfig = CONFIG.extras.find(ex => ex.id === id);
      if (extraConfig && extraConfig.isToggle) {
        cutlery = selectedExtras.has(id);
      }
      render();
    });

    // Confirm checkbox
    document.getElementById('confirm-check').addEventListener('change', (e) => {
      document.getElementById('place-order-btn').disabled = !e.target.checked;
    });

    // Place order
    document.getElementById('place-order-btn').addEventListener('click', async () => {
      const btn = document.getElementById('place-order-btn');
      btn.disabled = true;
      btn.textContent = 'Placing order...';

      try {
        const extrasArr = CONFIG.extras.filter(ex => selectedExtras.has(ex.id));
        const order = await Store.placeOrder({
          extras: extrasArr,
          notes,
          coupon,
          cutlery,
          discount: 0,
        });
        sessionStorage.removeItem('pp_order_notes');
        sessionStorage.removeItem('pp_order_coupon');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        navigate('/order-placed');
      } catch (err) {
        showToast('Failed to place order. Try again.', 'error');
        btn.disabled = false;
        btn.textContent = '🍕 Place Order';
      }
    });
  }

  render();
}
