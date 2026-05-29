/**
 * PET POOJA — Admin Cash Management
 */

import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatPrice, formatDate, formatTime, escapeHtml } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

let showAddForm = false;

export function renderAdminCash(container) {
  const entries = Store.getCashEntries();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter(e => e.createdAt.startsWith(todayStr));
  const totalIn = todayEntries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const totalOut = todayEntries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="cash-back">←</button>
        <h1>Cash Management</h1>
      </div>

      <!-- Today's Summary -->
      <div class="admin-stats" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value" style="color:var(--c-success);">${formatPrice(totalIn)}</div>
          <div class="stat-label">In</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📉</div>
          <div class="stat-value" style="color:var(--c-danger);">${formatPrice(totalOut)}</div>
          <div class="stat-label">Out</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${formatPrice(totalIn - totalOut)}</div>
          <div class="stat-label">Net</div>
        </div>
      </div>

      <div class="flex gap-8 mb-16">
        <button class="btn btn-primary btn-sm" id="cash-add-btn">+ Add Entry</button>
        <button class="btn btn-secondary btn-sm" id="cash-export-btn">📥 Export</button>
      </div>

      <!-- Add Form -->
      ${showAddForm ? `
        <div class="card-padded mb-16" id="cash-form">
          <div class="flex gap-8 mb-16">
            <button class="btn btn-sm ${showAddForm === 'in' ? 'btn-success' : 'btn-ghost'}" id="cash-type-in">💰 Money In</button>
            <button class="btn btn-sm ${showAddForm === 'out' ? 'btn-danger' : 'btn-ghost'}" id="cash-type-out">💸 Money Out</button>
          </div>
          <div class="input-group">
            <label>Amount (₹)</label>
            <input type="number" class="input" id="cash-amount" placeholder="Enter amount" min="1" />
          </div>
          <div class="input-group">
            <label>Note</label>
            <input type="text" class="input" id="cash-note" placeholder="Description" maxlength="100" />
          </div>
          <div class="flex gap-8">
            <button class="btn btn-primary btn-sm" id="cash-save">Save</button>
            <button class="btn btn-ghost btn-sm" id="cash-cancel-form">Cancel</button>
          </div>
        </div>
      ` : ''}

      <!-- Entries List -->
      <div class="section-title">📋 Recent Entries</div>
      ${entries.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">💵</div>
          <div class="empty-title">No cash entries</div>
          <div class="empty-desc">Entries are auto-created when orders are placed or cancelled.</div>
        </div>
      ` : [...entries].reverse().slice(0, 50).map(entry => `
        <div class="admin-list-item">
          <span class="item-icon">${entry.type === 'in' ? '📈' : '📉'}</span>
          <div class="item-info">
            <div class="item-primary" style="color:${entry.type === 'in' ? 'var(--c-success)' : 'var(--c-danger)'};">
              ${entry.type === 'in' ? '+' : '-'}${formatPrice(entry.amount)}
            </div>
            <div class="item-secondary">${escapeHtml(entry.note || 'No note')}</div>
          </div>
          <span class="text-xs text-muted">${formatTime(entry.createdAt)}<br/>${formatDate(entry.createdAt)}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('cash-back').addEventListener('click', () => navigate('/admin/dashboard'));

  document.getElementById('cash-add-btn').addEventListener('click', () => {
    showAddForm = 'in';
    renderAdminCash(container);
  });

  document.getElementById('cash-export-btn').addEventListener('click', () => {
    const data = Store.exportData('cash');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported ✓', 'success');
  });

  if (showAddForm) {
    document.getElementById('cash-type-in')?.addEventListener('click', () => { showAddForm = 'in'; renderAdminCash(container); });
    document.getElementById('cash-type-out')?.addEventListener('click', () => { showAddForm = 'out'; renderAdminCash(container); });
    document.getElementById('cash-cancel-form')?.addEventListener('click', () => { showAddForm = false; renderAdminCash(container); });
    document.getElementById('cash-save')?.addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('cash-amount').value);
      const note = document.getElementById('cash-note').value.trim();
      if (!amount || amount < 1) { showToast('Enter valid amount', 'error'); return; }
      await Store.addCashEntry(showAddForm, amount, note || `Manual ${showAddForm}`);
      showToast('Entry added ✓', 'success');
      showAddForm = false;
      renderAdminCash(container);
    });
  }
}
