/**
 * PET POOJA — Admin Logs Page
 */

import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatDateTime, escapeHtml } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';

let levelFilter = 'all';

export function renderAdminLogs(container) {
  const allLogs = Store.getAppLogs();
  const logs = levelFilter === 'all'
    ? allLogs
    : allLogs.filter(l => l.level === levelFilter);
  const reversed = [...logs].reverse().slice(0, 100);

  const counts = {
    all: allLogs.length,
    info: allLogs.filter(l => l.level === 'info').length,
    warn: allLogs.filter(l => l.level === 'warn').length,
    error: allLogs.filter(l => l.level === 'error').length,
  };

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="logs-back">←</button>
        <h1>App Logs</h1>
      </div>

      <!-- Filters -->
      <div class="categories-scroll" style="padding:0 0 16px;">
        ${['all', 'info', 'warn', 'error'].map(lvl => `
          <button class="category-chip ${lvl === levelFilter ? 'active' : ''}" data-lvl="${lvl}">
            ${lvl === 'all' ? '📋' : lvl === 'info' ? 'ℹ️' : lvl === 'warn' ? '⚠️' : '❌'} ${lvl}
            <span class="chip-count">${counts[lvl]}</span>
          </button>
        `).join('')}
      </div>

      <div class="flex gap-8 mb-16">
        <button class="btn btn-ghost btn-sm" id="logs-clear">🗑 Clear</button>
        <button class="btn btn-ghost btn-sm" id="logs-export">📥 Export</button>
      </div>

      ${reversed.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">No logs</div>
          <div class="empty-desc">App activity will be recorded here.</div>
        </div>
      ` : reversed.map(log => `
        <div class="admin-list-item" style="border-left:3px solid ${getLogColor(log.level)};">
          <div class="item-info">
            <div class="item-primary" style="font-size:13px;">
              <span style="color:${getLogColor(log.level)};font-weight:700;">[${log.level.toUpperCase()}]</span>
              ${escapeHtml(log.message)}
            </div>
            <div class="item-secondary">
              ${formatDateTime(log.createdAt)}
              ${log.details ? ` • ${escapeHtml(JSON.stringify(log.details).slice(0, 80))}` : ''}
            </div>
          </div>
        </div>
      `).join('')}

      <div class="text-center text-muted text-sm mt-16">
        Showing ${reversed.length} of ${logs.length} logs
      </div>
    </div>
  `;

  document.getElementById('logs-back').addEventListener('click', () => navigate('/admin/dashboard'));

  container.querySelectorAll('[data-lvl]').forEach(btn => {
    btn.addEventListener('click', () => {
      levelFilter = btn.dataset.lvl;
      renderAdminLogs(container);
    });
  });

  document.getElementById('logs-clear').addEventListener('click', async () => {
    if (confirm('Clear all logs?')) {
      await Store.clearLogs();
      showToast('Logs cleared', 'info');
      renderAdminLogs(container);
    }
  });

  document.getElementById('logs-export').addEventListener('click', () => {
    const data = Store.exportData('logs');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Logs exported ✓', 'success');
  });
}

function getLogColor(level) {
  return level === 'info' ? '#2196F3' : level === 'warn' ? '#FF9800' : '#E53935';
}
