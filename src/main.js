/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA FASTFOOD — Main Application Entry
 * ═══════════════════════════════════════════════════════════
 * Bootstraps the PWA: store init, router setup, PWA install,
 * notification permissions, and global component mounting.
 */

import './styles/app.css';
import { CONFIG } from './config.js';
import { initStore, isLoggedIn, on } from './store.js';
import { route, initRouter, navigate } from './router.js';

// ── Page imports (lazy where possible) ──
import { renderAuth } from './pages/auth.js';
import { renderHome } from './pages/home.js';
import { renderCart } from './pages/cart.js';
import { renderVerify } from './pages/verify-order.js';
import { renderOrderPlaced } from './pages/order-placed.js';
import { renderAdminLogin } from './pages/admin-login.js';
import { renderAdminDashboard } from './pages/admin/dashboard.js';
import { renderMenuManager } from './pages/admin/menu-mgr.js';
import { renderAdminOrders } from './pages/admin/orders.js';
import { renderAdminCustomers } from './pages/admin/customers.js';
import { renderAdminCash } from './pages/admin/cash.js';
import { renderAdminLogs } from './pages/admin/logs.js';

// ── Component imports ──
import { initSearch } from './components/search.js';
import { initCartStrip } from './components/cart-strip.js';
import { initFab } from './components/fab.js';

// ════════════════════════════════════════════════════════════
// PWA Install Prompt
// ════════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hideInstallButton();
  console.log('[PWA] App installed successfully');
});

function showInstallButton() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.classList.remove('hidden');
}

function hideInstallButton() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.classList.add('hidden');
}

export async function triggerInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  console.log(`[PWA] Install outcome: ${outcome}`);
  deferredInstallPrompt = null;
}

// ════════════════════════════════════════════════════════════
// Push Notification Permission
// ════════════════════════════════════════════════════════════
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.warn('[Push] Permission request failed:', err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// App Bootstrap
// ════════════════════════════════════════════════════════════
async function boot() {
  try {
    // 1. Initialize persistent store
    await initStore();

    // 2. Register routes
    route('/auth', renderAuth, { title: 'Welcome' });
    route('/home', renderHome, { title: 'Menu', requiresAuth: true });
    route('/cart', renderCart, { title: 'Your Order', requiresAuth: true });
    route('/verify', renderVerify, { title: 'Verify Order', requiresAuth: true });
    route('/order-placed', renderOrderPlaced, { title: 'Order Placed!', requiresAuth: true });
    route('/admin-login', renderAdminLogin, { title: 'Admin Login' });
    route('/admin/dashboard', renderAdminDashboard, { title: 'Admin', requiresAdmin: true });
    route('/admin/menu', renderMenuManager, { title: 'Menu Manager', requiresAdmin: true });
    route('/admin/orders', renderAdminOrders, { title: 'Orders', requiresAdmin: true });
    route('/admin/customers', renderAdminCustomers, { title: 'Customers', requiresAdmin: true });
    route('/admin/cash', renderAdminCash, { title: 'Cash', requiresAdmin: true });
    route('/admin/logs', renderAdminLogs, { title: 'Logs', requiresAdmin: true });

    // 3. Initialize global components
    initSearch();
    initCartStrip();
    initFab();

    // 4. Start router
    const appContainer = document.getElementById('app');
    initRouter(appContainer);

    // 5. Hide splash loader
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 500);
    }

    console.log(`[${CONFIG.shop.fullName}] App booted successfully ✓`);
  } catch (err) {
    console.error('[BOOT] Fatal error:', err);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="empty-state" style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Failed to load</div>
          <div class="empty-desc">${err.message}</div>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    // Still hide loader
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hide');
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
