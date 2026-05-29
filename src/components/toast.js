/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Toast Notification Component
 * ═══════════════════════════════════════════════════════════
 * Stackable toast notifications with type variants.
 * Auto-removes after 3 seconds with CSS animation.
 */

/** @type {HTMLElement|null} */
let container = null;

const ICONS = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const AUTO_DISMISS_MS = 3000;

/**
 * Ensure the #toast-container exists in the DOM.
 * Idempotent — safe to call multiple times.
 */
function ensureContainer() {
  if (container && document.body.contains(container)) return;
  container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
}

/**
 * Show a toast notification.
 *
 * @param {string} message  — text to display
 * @param {'success'|'error'|'warning'|'info'} [type='info'] — visual style
 */
export function showToast(message, type = 'info') {
  ensureContainer();

  // Prevent toast flooding — max 3 visible at once
  const existing = container.querySelectorAll('.toast');
  if (existing.length >= 3) {
    existing[0].remove(); // Remove oldest
  }

  // Dedupe: skip if same message already showing
  for (const t of existing) {
    if (t.querySelector('.toast-msg')?.textContent === message) return;
  }

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const icon = ICONS[type] || ICONS.info;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = id;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after the animation duration
  const timer = setTimeout(() => {
    removeToast(toast);
  }, AUTO_DISMISS_MS);

  // Allow manual dismiss on tap
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    removeToast(toast);
  }, { once: true });
}

/**
 * Remove a toast element from the DOM.
 * @param {HTMLElement} toast
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.remove();
}
