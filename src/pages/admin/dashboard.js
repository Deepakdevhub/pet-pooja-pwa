/**
 * PET POOJA — Admin Dashboard
 */

import { CONFIG } from '../../config.js';
import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatPrice, timeAgo, escapeHtml } from '../../utils/format.js';
import { sendReceiptToCustomer } from '../../utils/whatsapp.js';
import { showToast } from '../../components/toast.js';

export function renderAdminDashboard(container) {
  const todayOrders = Store.getTodayOrders();
  const revenue = Store.getTodayRevenue();
  const activeOrders = Store.getActiveOrders();
  const customers = Store.getCustomers();
  const settings = Store.getSettings();

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="admin-back">←</button>
        <h1>Admin Panel</h1>
        <button class="btn btn-ghost btn-sm" id="admin-logout">Logout</button>
      </div>

      <!-- Stats -->
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-value">${todayOrders.length}</div>
          <div class="stat-label">Today's Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${formatPrice(revenue)}</div>
          <div class="stat-label">Today's Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${activeOrders.length}</div>
          <div class="stat-label">Active Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${customers.length}</div>
          <div class="stat-label">Customers</div>
        </div>
      </div>

      <!-- Order Toggle -->
      <div class="order-toggle-card">
        <div>
          <div class="toggle-label">Accept Orders</div>
          <div class="toggle-status">${settings.acceptOrders ? '🟢 Active' : '🔴 Paused'}</div>
        </div>
        <label class="toggle-wrap">
          <input type="checkbox" class="toggle-input" id="order-toggle" ${settings.acceptOrders ? 'checked' : ''} />
          <div class="toggle-track"></div>
        </label>
      </div>

      <!-- Nav Grid -->
      <div class="admin-nav-grid">
        <button class="admin-nav-btn" data-page="/admin/menu"><span class="nav-icon">📋</span>Menu</button>
        <button class="admin-nav-btn" data-page="/admin/orders"><span class="nav-icon">📦</span>Orders</button>
        <button class="admin-nav-btn" data-page="/admin/customers"><span class="nav-icon">👥</span>Customers</button>
        <button class="admin-nav-btn" data-page="/admin/cash"><span class="nav-icon">💰</span>Cash</button>
        <button class="admin-nav-btn" data-page="#notifs"><span class="nav-icon">🔔</span>Notify</button>
        <button class="admin-nav-btn" data-page="/admin/logs"><span class="nav-icon">📊</span>Logs</button>
      </div>

      <!-- Active Orders -->
      ${activeOrders.length > 0 ? `
        <div class="section-title">🔥 Active Orders</div>
        ${activeOrders.map(order => `
          <div class="active-order-card" data-order-id="${order.id}">
            <div class="active-order-header">
              <span class="active-order-num">#${order.orderNum}</span>
              <span class="active-order-time">${timeAgo(order.createdAt)}</span>
            </div>
            <div class="active-order-customer">👤 ${escapeHtml(order.customer.name)} — ${order.customer.mobile}</div>
            <div class="active-order-items">
              ${order.items.map(i => `${i.name} ×${i.qty}`).join(', ')}
              ${order.extras?.length ? ` + ${order.extras.map(e => e.name).join(', ')}` : ''}
            </div>
            <div class="flex justify-between items-center mb-8">
              <span class="text-price font-bold">${formatPrice(order.total)}</span>
              <span class="badge">${order.mode}</span>
            </div>
            ${order.notes ? `<div class="text-xs text-muted mb-8">📝 ${escapeHtml(order.notes)}</div>` : ''}
            <div class="active-order-actions">
              <button class="btn btn-success btn-sm fulfill-btn" data-id="${order.id}">✓ Fulfill</button>
              <button class="btn btn-danger btn-sm cancel-btn" data-id="${order.id}">✕ Cancel</button>
            </div>
          </div>
        `).join('')}
      ` : `
        <div class="empty-state">
          <div class="empty-icon">☕</div>
          <div class="empty-title">No active orders</div>
          <div class="empty-desc">Orders will appear here when customers place them.</div>
        </div>
      `}
    </div>
  `;

  // Events
  document.getElementById('admin-back').addEventListener('click', () => navigate('/home'));

  document.getElementById('admin-logout').addEventListener('click', async () => {
    await Store.adminLogout();
    showToast('Logged out', 'info');
    navigate('/home');
  });

  document.getElementById('order-toggle').addEventListener('change', (e) => {
    Store.updateSettings({ acceptOrders: e.target.checked });
    showToast(e.target.checked ? 'Orders ON ✓' : 'Orders paused ⏸', 'info');
    renderAdminDashboard(container);
  });

  // Nav grid
  container.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === '#notifs') {
        showToast('Push notifications coming soon!', 'info');
        return;
      }
      navigate(page);
    });
  });

  // Fulfill / Cancel
  container.querySelectorAll('.fulfill-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const order = await Store.fulfillOrder(btn.dataset.id);
      if (order) {
        showToast(`Order #${order.orderNum} fulfilled ✓`, 'success');
        const sendReceipt = confirm('Send receipt to customer on WhatsApp?');
        if (sendReceipt) sendReceiptToCustomer(order);
        renderAdminDashboard(container);
      }
    });
  });

  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = prompt('Reason for cancellation (optional):');
      const order = await Store.cancelOrder(btn.dataset.id, reason || '');
      if (order) {
        showToast(`Order #${order.orderNum} cancelled`, 'warning');
        renderAdminDashboard(container);
      }
    });
  });
}
