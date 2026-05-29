/**
 * PET POOJA — Admin Customers Page
 */

import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatDate, formatMobile, escapeHtml, debounce, formatPrice } from '../../utils/format.js';

let searchQuery = '';
let expandedMobile = null;

export function renderAdminCustomers(container) {
  const allCustomers = Store.getCustomers();
  const filtered = searchQuery
    ? allCustomers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile.includes(searchQuery)
      )
    : allCustomers;

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="ac-back">←</button>
        <h1>Customers <span class="text-muted text-sm">(${allCustomers.length})</span></h1>
      </div>

      <div class="input-group">
        <input type="text" class="input" id="ac-search" placeholder="🔍 Search by name or mobile" value="${escapeHtml(searchQuery)}" />
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-title">${searchQuery ? 'No customers found' : 'No customers yet'}</div>
        </div>
      ` : filtered.map(cust => {
        const orders = Store.getOrders().filter(o => o.customer.mobile === cust.mobile);
        const totalSpent = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total : 0), 0);
        return `
          <div class="admin-list-item" style="flex-wrap:wrap;cursor:pointer;" data-mobile="${cust.mobile}">
            <span class="item-icon">👤</span>
            <div class="item-info">
              <div class="item-primary">${escapeHtml(cust.name)}</div>
              <div class="item-secondary">📱 ${formatMobile(cust.mobile)} • ${orders.length} orders • ${formatPrice(totalSpent)}</div>
            </div>
            <span class="text-xs text-muted">${formatDate(cust.lastSeen)}</span>
            ${expandedMobile === cust.mobile ? `
              <div style="width:100%;padding-top:12px;border-top:1px solid var(--c-divider);margin-top:8px;">
                <div class="text-xs text-muted mb-8">First seen: ${formatDate(cust.firstSeen)}</div>
                ${orders.length > 0 ? `
                  <div class="text-xs font-semibold mb-4">Recent Orders:</div>
                  ${orders.slice(0, 5).map(o => `
                    <div class="flex justify-between text-xs mb-4">
                      <span>#${o.orderNum} — ${o.items.map(i => i.name).join(', ').slice(0, 40)}</span>
                      <span class="badge ${o.status === 'fulfilled' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : ''}" style="font-size:10px;">${formatPrice(o.total)}</span>
                    </div>
                  `).join('')}
                ` : '<div class="text-xs text-muted">No orders yet</div>'}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('ac-back').addEventListener('click', () => navigate('/admin/dashboard'));

  const searchInput = document.getElementById('ac-search');
  searchInput.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.trim();
    renderAdminCustomers(container);
  }, 200));

  container.querySelectorAll('[data-mobile]').forEach(el => {
    el.addEventListener('click', () => {
      expandedMobile = expandedMobile === el.dataset.mobile ? null : el.dataset.mobile;
      renderAdminCustomers(container);
    });
  });
}
