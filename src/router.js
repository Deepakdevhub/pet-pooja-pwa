/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Hash-Based SPA Router
 * ═══════════════════════════════════════════════════════════
 * Lightweight client-side router using hash fragments.
 * Supports auth guards, page transitions, and lazy loading.
 */

import { isLoggedIn, isAdminAuthed } from './store.js';

const routes = {};
let currentPage = null;
let appContainer = null;

/**
 * Register a route
 * @param {string} path - hash path like '/home', '/admin/dashboard'
 * @param {Function} handler - async function that returns HTML string or renders into container
 * @param {object} opts - { requiresAuth, requiresAdmin, title }
 */
export function route(path, handler, opts = {}) {
  routes[path] = { handler, ...opts };
}

/**
 * Initialize router
 */
export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', () => handleRoute());
  // Handle initial route
  handleRoute();
}

/**
 * Navigate to a route
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Get current route path
 */
export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/auth';
}

/**
 * Handle route change
 */
async function handleRoute() {
  const path = getCurrentRoute();
  const routeConfig = routes[path];

  // Auth guard
  if (path !== '/auth' && !isLoggedIn()) {
    navigate('/auth');
    return;
  }

  // Admin guard (exclude /admin-login itself to avoid redirect loop)
  if (path.startsWith('/admin/') && !isAdminAuthed()) {
    navigate('/admin-login');
    return;
  }

  // Already on auth and logged in → go home
  if (path === '/auth' && isLoggedIn()) {
    navigate('/home');
    return;
  }

  if (!routeConfig) {
    // Default fallback
    if (isLoggedIn()) {
      navigate('/home');
    } else {
      navigate('/auth');
    }
    return;
  }

  // Page transition
  if (currentPage) {
    appContainer.classList.add('page-exit');
    await new Promise(r => setTimeout(r, 200));
    appContainer.classList.remove('page-exit');
  }

  try {
    // Call handler
    const html = await routeConfig.handler(appContainer);
    if (typeof html === 'string') {
      appContainer.innerHTML = html;
    }
    currentPage = path;

    // Update title
    if (routeConfig.title) {
      document.title = `${routeConfig.title} — Pet Pooja`;
    }

    // Add route-specific body class for CSS scopes (like cart-strip)
    if (path === '/home') {
      document.body.classList.add('page-home');
    } else {
      document.body.classList.remove('page-home');
    }

    // Animate in
    appContainer.classList.add('page-enter');
    setTimeout(() => appContainer.classList.remove('page-enter'), 350);

    // Scroll to top
    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Route error:', err);
    appContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Something went wrong</div>
        <div class="empty-desc">${err.message}</div>
        <button class="btn btn-primary" onclick="location.hash='#/home'">Go Home</button>
      </div>
    `;
  }
}

/**
 * Go back in history
 */
export function goBack() {
  window.history.back();
}
