/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Order Placed Page
 * ═══════════════════════════════════════════════════════════
 * Success screen with receipt + WhatsApp send + download.
 */

import { CONFIG } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { formatPrice, formatDateTime, getCategoryEmoji, escapeHtml } from '../utils/format.js';
import { sendOrderToWhatsApp } from '../utils/whatsapp.js';
import { showToast } from '../components/toast.js';

export async function renderOrderPlaced(container) {
  const orders = Store.getOrders();
  const order = orders[0];

  if (!order) {
    navigate('/home');
    return;
  }

  container.innerHTML = `
    <div class="order-success-page">
      <div class="success-animation">🎉</div>
      <h1 class="success-title">Order Placed!</h1>
      <p class="success-subtitle">Your order has been received. Send it on WhatsApp for fast preparation!</p>

      <!-- Receipt Card -->
      <div class="receipt-card" id="receipt-card">
        <div class="receipt-header">
          <div style="font-size:2rem;margin-bottom:4px;">🍕</div>
          <h3>${CONFIG.shop.fullName}</h3>
          <div class="order-num">Order #${order.orderNum}</div>
          <div class="text-xs text-muted">${formatDateTime(order.createdAt)}</div>
        </div>

        <div style="margin-bottom:8px;">
          <div class="text-sm"><strong>Customer:</strong> ${escapeHtml(order.customer.name)}</div>
          <div class="text-sm"><strong>Mobile:</strong> ${order.customer.mobile}</div>
          <div class="text-sm"><strong>Mode:</strong> ${order.mode}</div>
        </div>

        <div class="divider"></div>

        ${order.items.map(item => `
          <div class="receipt-item-row">
            <span>${getCategoryEmoji(item.category)} ${escapeHtml(item.name)} × ${item.qty}</span>
            <span>${formatPrice(item.price * item.qty)}</span>
          </div>
        `).join('')}

        ${order.extras && order.extras.length > 0 ? `
          <div class="divider"></div>
          <div class="text-xs text-muted" style="margin-bottom:4px;">Extras:</div>
          ${order.extras.map(ex => `
            <div class="receipt-item-row">
              <span>${ex.icon} ${ex.name}</span>
              <span>${ex.price > 0 ? formatPrice(ex.price) : 'Free'}</span>
            </div>
          `).join('')}
        ` : ''}

        ${order.notes ? `
          <div class="divider"></div>
          <div class="text-xs text-muted">Note: ${escapeHtml(order.notes)}</div>
        ` : ''}

        ${order.cutlery ? '<div class="text-xs text-muted">🍴 Cutlery included</div>' : ''}

        <div class="receipt-total-row">
          <span>TOTAL</span>
          <span>${formatPrice(order.total)}</span>
        </div>

        <div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px dashed var(--c-divider);">
          <div class="text-xs text-muted">Thank you for ordering! 🙏</div>
          <div class="text-xs text-muted">${CONFIG.shop.description}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="order-actions">
        <button class="btn btn-whatsapp btn-full btn-lg" id="send-receipt-img-btn">
          📸 Send Receipt Image on WhatsApp
        </button>
        <button class="btn btn-whatsapp btn-full" id="send-order-text-btn">
          📝 Send Order Details on WhatsApp
        </button>
        <button class="btn btn-secondary btn-full" id="download-receipt-btn">
          ⬇️ Download Receipt
        </button>
        <button class="btn btn-primary btn-full btn-lg mt-8" id="done-btn">
          Done ✓
        </button>
      </div>
    </div>
  `;

  // ── Send Receipt Image ──
  document.getElementById('send-receipt-img-btn').addEventListener('click', async () => {
    const btn = document.getElementById('send-receipt-img-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const canvas = await captureReceipt();
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], `receipt_${order.orderNum}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Order Receipt #${order.orderNum}`,
          text: `Order from ${CONFIG.shop.fullName}`,
          files: [file],
        });
        showToast('Receipt shared!', 'success');
      } else {
        // Fallback: download and inform user
        downloadCanvas(canvas, `receipt_${order.orderNum}.png`);
        showToast('Receipt downloaded! Share it on WhatsApp manually.', 'info');
      }
    } catch (err) {
      console.error('Receipt capture error:', err);
      showToast('Could not generate receipt image', 'error');
    }

    btn.disabled = false;
    btn.textContent = '📸 Send Receipt Image on WhatsApp';
  });

  // ── Send Order Text ──
  document.getElementById('send-order-text-btn').addEventListener('click', () => {
    sendOrderToWhatsApp(order);
  });

  // ── Download Receipt ──
  document.getElementById('download-receipt-btn').addEventListener('click', async () => {
    const btn = document.getElementById('download-receipt-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const canvas = await captureReceipt();
      downloadCanvas(canvas, `receipt_${order.orderNum}.png`);
      showToast('Receipt downloaded ✓', 'success');
    } catch (err) {
      showToast('Download failed', 'error');
    }

    btn.disabled = false;
    btn.textContent = '⬇️ Download Receipt';
  });

  // ── Done ──
  document.getElementById('done-btn').addEventListener('click', () => navigate('/home'));
}

async function captureReceipt() {
  const html2canvas = (await import('html2canvas')).default;
  const receiptEl = document.getElementById('receipt-card');
  return html2canvas(receiptEl, {
    scale: 2,
    backgroundColor: '#FFFFFF',
    useCORS: true,
    logging: false,
  });
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
