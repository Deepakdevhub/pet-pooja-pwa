/**
 * PET POOJA — Admin Orders Page
 */

import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatPrice, timeAgo, formatDateTime, escapeHtml, getCategoryEmoji } from '../../utils/format.js';
import { sendReceiptToCustomer } from '../../utils/whatsapp.js';
import { showToast } from '../../components/toast.js';

let activeFilter = 'all';
let expandedOrderId = null;

export function renderAdminOrders(container) {
  const allOrders = Store.getOrders();
  const filtered = activeFilter === 'all' ? allOrders : allOrders.filter(o => o.status === activeFilter);

  const counts = {
    all: allOrders.length,
    active: allOrders.filter(o => o.status === 'active').length,
    fulfilled: allOrders.filter(o => o.status === 'fulfilled').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  };

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="ao-back">←</button>
        <h1>Orders</h1>
      </div>

      <!-- Filter Tabs -->
      <div class="categories-scroll" style="padding:0 16px 16px;">
        ${['all', 'active', 'fulfilled', 'cancelled'].map(f => `
          <button class="category-chip ${f === activeFilter ? 'active' : ''}" data-filter="${f}">
            ${f.charAt(0).toUpperCase() + f.slice(1)}
            <span class="chip-count">${counts[f]}</span>
          </button>
        `).join('')}
      </div>

      <!-- Orders List -->
      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-title">No ${activeFilter} orders</div>
        </div>
      ` : filtered.map(order => `
        <div class="active-order-card" data-oid="${order.id}" style="border-left-color:${getStatusColor(order.status)};">
          <div class="active-order-header" style="cursor:pointer;" data-expand="${order.id}">
            <span class="active-order-num">#${order.orderNum}</span>
            <span class="badge ${order.status === 'fulfilled' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">
              ${order.status}
            </span>
          </div>
          <div class="active-order-customer">👤 ${escapeHtml(order.customer.name)} — ${order.customer.mobile}</div>
          <div class="flex justify-between items-center">
            <span class="text-price font-semibold">${formatPrice(order.total)}</span>
            <span class="text-xs text-muted">${timeAgo(order.createdAt)}</span>
          </div>

          <!-- Expanded Details -->
          ${expandedOrderId === order.id ? `
            <div class="mt-16" style="border-top:1px solid var(--c-divider);padding-top:12px;">
              <div class="text-xs text-muted mb-8">${formatDateTime(order.createdAt)}</div>
              ${order.items.map(i => `
                <div class="flex justify-between text-sm mb-4">
                  <span>${getCategoryEmoji(i.category)} ${escapeHtml(i.name)} × ${i.qty}</span>
                  <span>${formatPrice(i.price * i.qty)}</span>
                </div>
              `).join('')}
              ${order.extras?.length ? order.extras.map(e => `
                <div class="flex justify-between text-sm mb-4 text-muted">
                  <span>+ ${e.name}</span>
                  <span>${formatPrice(e.price)}</span>
                </div>
              `).join('') : ''}
              ${order.notes ? `<div class="text-xs text-muted mt-8">📝 ${escapeHtml(order.notes)}</div>` : ''}
              ${order.cancelReason ? `<div class="text-xs text-muted mt-8" style="color:var(--c-danger);">Reason: ${escapeHtml(order.cancelReason)}</div>` : ''}

              <div class="active-order-actions mt-12">
                ${order.status === 'active' ? `
                  <button class="btn btn-success btn-sm fulfill-btn" data-id="${order.id}">✓ Fulfill</button>
                  <button class="btn btn-danger btn-sm cancel-btn" data-id="${order.id}">✕ Cancel</button>
                ` : ''}
                ${order.status === 'fulfilled' ? `
                  <button class="btn btn-whatsapp btn-sm send-receipt" data-id="${order.id}">📱 Send Receipt</button>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('ao-back').addEventListener('click', () => navigate('/admin/dashboard'));

  // Filter tabs
  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      renderAdminOrders(container);
    });
  });

  // Expand/collapse
  container.querySelectorAll('[data-expand]').forEach(el => {
    el.addEventListener('click', () => {
      expandedOrderId = expandedOrderId === el.dataset.expand ? null : el.dataset.expand;
      renderAdminOrders(container);
    });
  });

  // Fulfill
  container.querySelectorAll('.fulfill-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const order = await Store.fulfillOrder(btn.dataset.id);
      if (order) {
        showToast(`#${order.orderNum} fulfilled ✓`, 'success');
        if (confirm('Send receipt to customer?')) sendReceiptToCustomer(order);
        renderAdminOrders(container);
      }
    });
  });

  // Cancel
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = prompt('Cancel reason:');
      if (reason === null) return; // User clicked cancel
      await Store.cancelOrder(btn.dataset.id, reason || '');
      showToast('Order cancelled', 'warning');
      renderAdminOrders(container);
    });
  });

  // Send receipt (synchronous button)
  container.querySelectorAll('.send-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = Store.getOrderById(btn.dataset.id);
      if (order) {
        if (order.customer.mobile === 'Admin') {
          showToast('Cannot send WhatsApp to Admin test orders', 'info');
          return;
        }
        sendReceiptToCustomer(order);
      }
    });
  });
}

function getStatusColor(status) {
  return status === 'active' ? '#FF6B35' : status === 'fulfilled' ? '#4CAF50' : '#E53935';
}
