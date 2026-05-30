/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Store (API-first + IndexedDB cache)
 * ═══════════════════════════════════════════════════════════
 * All data lives in Cloudflare D1 via /api endpoints.
 * IndexedDB is used ONLY for cart (per-device) and JWT token.
 * Same 38+ function signatures — zero page code changes.
 */

import { get, set, del } from 'idb-keyval';
import { CONFIG } from './config.js';

// ─── Event Bus ──────────────────────────────────────────
const listeners = {};
export function on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); }
export function off(event, fn) { listeners[event] = (listeners[event] || []).filter(f => f !== fn); }
export function emit(event, data) { (listeners[event] || []).forEach(fn => fn(data)); }

// ─── State ──────────────────────────────────────────────
const state = {
  user: null,
  token: null,
  cart: [],
  orders: [],
  menu: [],
  settings: { acceptOrders: true, orderMode: 'online', adminAuth: false },
  customers: [],
  cashEntries: [],
  appLogs: [],
  pushSub: null,
};

// ─── API Helper ─────────────────────────────────────────
async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${CONFIG.apiBase}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API ${res.status}`);
  }
  return res.json();
}

// ─── Init ───────────────────────────────────────────────
export async function initStore() {
  // Load local-only data
  state.cart = (await get('pp_cart')) || [];
  state.token = (await get('pp_token')) || null;
  state.user = (await get('pp_user')) || null;
  state.pushSub = (await get('pp_push_sub')) || null;
  state.settings.adminAuth = (await get('pp_admin_auth')) || false;
  // Load admin token if admin session persisted
  const adminToken = await get('pp_admin_token');
  if (adminToken && state.settings.adminAuth) {
    state.token = adminToken; // prefer admin token if admin was authed
  }

  // Sync from server if we have a token
  if (state.token) {
    try { await syncFromServer(); }
    catch { /* offline or token expired — use cached data */ }
  } else {
    // Load menu even without auth (public endpoint)
    try {
      state.menu = await api('GET', '/menu');
      await set('pp_menu', state.menu);
    } catch {
      state.menu = (await get('pp_menu')) || CONFIG.defaultMenu;
    }
  }

  // Fallback to cached menu if empty
  if (!state.menu.length) {
    state.menu = (await get('pp_menu')) || CONFIG.defaultMenu;
  }
}

async function syncFromServer() {
  // Parallel fetch for speed
  const [menu, orders, settings] = await Promise.all([
    api('GET', '/menu'),
    api('GET', '/orders').catch(() => []),
    api('GET', '/settings').catch(() => ({})),
  ]);
  state.menu = menu;
  state.orders = orders;
  Object.assign(state.settings, settings);
  // Cache
  await set('pp_menu', menu);
}

// ─── User / Auth ────────────────────────────────────────
export function getUser() { return state.user; }
export function isLoggedIn() { return !!state.user && !!state.token; }

export async function setUser(userData) {
  // This is called from auth.js after server verification
  state.user = { name: userData.name, mobile: userData.mobile, createdAt: userData.createdAt || new Date().toISOString() };
  await set('pp_user', state.user);
  emit('user:changed', state.user);
}

export async function customerLogin(name, mobile, code) {
  const data = await api('POST', '/auth/customer', { name, mobile, code });
  state.token = data.token;
  state.user = data.user;
  state.user.createdAt = new Date().toISOString();
  await set('pp_token', data.token);
  await set('pp_user', state.user);
  emit('user:changed', state.user);
  // Now sync data
  await syncFromServer();
  return data;
}

// ─── Cart (local only — per-device) ─────────────────────
export function getCart() { return state.cart; }
export function getCartCount() { return state.cart.reduce((n, c) => n + c.qty, 0); }
export function getCartTotal() { return state.cart.reduce((s, c) => s + (c.price * c.qty), 0); }

export async function addToCart(menuItem, qty = 1) {
  const existing = state.cart.find(c => c.itemId === menuItem.id);
  if (existing) { existing.qty += qty; }
  else {
    state.cart.push({
      itemId: menuItem.id, name: menuItem.name, price: menuItem.price,
      qty, category: menuItem.category, customImage: null,
    });
  }
  await persistCart();
  emit('cart:changed', state.cart);
}

export async function updateCartQty(itemId, qty) {
  if (qty <= 0) { state.cart = state.cart.filter(c => c.itemId !== itemId); }
  else { const item = state.cart.find(c => c.itemId === itemId); if (item) item.qty = qty; }
  await persistCart();
  emit('cart:changed', state.cart);
}

export async function removeFromCart(itemId) {
  state.cart = state.cart.filter(c => c.itemId !== itemId);
  await persistCart();
  emit('cart:changed', state.cart);
}

export async function clearCart() {
  state.cart = [];
  await persistCart();
  emit('cart:changed', state.cart);
}

async function persistCart() { await set('pp_cart', state.cart); }

export function getCartItemQty(itemId) {
  const item = state.cart.find(c => c.itemId === itemId);
  return item ? item.qty : 0;
}

// ─── Orders ─────────────────────────────────────────────
export function getOrders() { return state.orders; }
export function getActiveOrders() { return state.orders.filter(o => o.status === 'active'); }
export function getOrderById(id) { return state.orders.find(o => o.id === id); }

export async function placeOrder(orderData) {
  const order = await api('POST', '/orders', {
    items: [...state.cart],
    extras: orderData.extras || [],
    notes: orderData.notes || '',
    coupon: orderData.coupon || null,
    cutlery: orderData.cutlery || false,
    discount: orderData.discount || 0,
    mode: state.settings.orderMode,
  });
  state.orders.unshift(order);
  await clearCart();
  emit('order:placed', order);
  return order;
}

export async function fulfillOrder(orderId) {
  await api('PUT', `/orders/${orderId}`, { status: 'fulfilled' });
  const order = state.orders.find(o => o.id === orderId);
  if (order) { order.status = 'fulfilled'; order.fulfilledAt = new Date().toISOString(); }
  emit('order:fulfilled', order);
  return order;
}

export async function cancelOrder(orderId, reason = '') {
  await api('PUT', `/orders/${orderId}`, { status: 'cancelled', cancelReason: reason });
  const order = state.orders.find(o => o.id === orderId);
  if (order) { order.status = 'cancelled'; order.cancelledAt = new Date().toISOString(); order.cancelReason = reason; }
  emit('order:cancelled', order);
  return order;
}

export async function updateOrderItems(orderId, newItems) {
  await api('PUT', `/orders/${orderId}`, { items: newItems });
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.items = newItems;
    order.subtotal = newItems.reduce((s, i) => s + (i.price * i.qty), 0);
    order.total = order.subtotal + (order.extrasTotal || 0) - (order.discount || 0);
  }
  emit('order:updated', order);
  return order;
}

export function getTodayOrders() {
  const today = new Date().toISOString().slice(0, 10);
  return state.orders.filter(o => o.createdAt?.startsWith(today));
}

function generateOrderNum() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todayOrders = state.orders.filter(o => o.createdAt?.startsWith(today.toISOString().slice(0, 10)));
  const seq = String(todayOrders.length + 1).padStart(3, '0');
  return `PP${dateStr}-${seq}`;
}

// ─── Menu Management ────────────────────────────────────
export function getMenu() { return state.menu; }
export function getMenuByCategory(categoryId) { return state.menu.filter(item => item.category === categoryId); }
export function getMenuItemById(id) { return state.menu.find(item => item.id === id); }

export async function addMenuItem(item) {
  const newItem = await api('POST', '/menu', item);
  state.menu.push(newItem);
  emit('menu:changed', state.menu);
  return newItem;
}

export async function updateMenuItem(id, updates) {
  await api('PUT', `/menu/${id}`, updates);
  const idx = state.menu.findIndex(item => item.id === id);
  if (idx >= 0) Object.assign(state.menu[idx], updates);
  emit('menu:changed', state.menu);
}

export async function deleteMenuItem(id) {
  await api('DELETE', `/menu/${id}`);
  state.menu = state.menu.filter(item => item.id !== id);
  emit('menu:changed', state.menu);
}

export async function toggleMenuItemAvail(id) {
  const item = state.menu.find(i => i.id === id);
  if (item) {
    const newAvail = !item.available;
    await api('PUT', `/menu/${id}`, { available: newAvail });
    item.available = newAvail;
    emit('menu:changed', state.menu);
  }
}

// ─── Settings ───────────────────────────────────────────
export function getSettings() { return state.settings; }

export async function updateSettings(updates) {
  try { await api('PUT', '/settings', updates); } catch { /* offline */ }
  Object.assign(state.settings, updates);
  emit('settings:changed', state.settings);
}

export function isAdminAuthed() { return state.settings.adminAuth; }

export async function adminLogin(code) {
  try {
    const data = await api('POST', '/auth/admin', { code });
    state.settings.adminAuth = true;
    state.token = data.token;
    await set('pp_token', data.token);
    await set('pp_admin_token', data.token);
    await set('pp_admin_auth', true);
    emit('admin:authed', true);
    // Sync admin data
    try {
      const [orders, customers, cash, logs] = await Promise.all([
        api('GET', '/orders'), api('GET', '/customers'),
        api('GET', '/cash'), api('GET', '/logs'),
      ]);
      state.orders = orders;
      state.customers = customers;
      state.cashEntries = cash;
      state.appLogs = logs;
    } catch { /* partial sync ok */ }
    return true;
  } catch {
    return false;
  }
}

export async function adminLogout() {
  state.settings.adminAuth = false;
  await set('pp_admin_auth', false);
  await del('pp_admin_token');
  // Restore customer token if available
  const customerToken = await get('pp_token');
  if (state.user && customerToken) {
    state.token = customerToken;
  }
  emit('admin:authed', false);
}

// ─── Customers ──────────────────────────────────────────
export function getCustomers() { return state.customers; }
export function getCustomerByMobile(mobile) { return state.customers.find(c => c.mobile === mobile); }

// ─── Cash Management ────────────────────────────────────
export function getCashEntries() { return state.cashEntries; }

export function getTodayRevenue() {
  const today = new Date().toISOString().slice(0, 10);
  return state.cashEntries
    .filter(e => (e.createdAt || '').startsWith(today))
    .reduce((sum, e) => sum + (e.type === 'in' ? e.amount : -e.amount), 0);
}

export async function addCashEntry(type, amount, note) {
  const entry = await api('POST', '/cash', { type, amount, note });
  state.cashEntries.unshift(entry);
  emit('cash:changed', state.cashEntries);
}

// ─── App Logs ───────────────────────────────────────────
export function getAppLogs() { return state.appLogs; }

export function logApp(level, message, details = null) {
  // Logs are written server-side by the API automatically
  // This is now a local-only console log
  const entry = { id: `log_${Date.now()}`, level, message, details, createdAt: new Date().toISOString() };
  state.appLogs.push(entry);
  if (state.appLogs.length > 500) state.appLogs = state.appLogs.slice(-500);
  if (level === 'error') console.error(`[PP] ${message}`, details);
}

export async function clearLogs() {
  try { await api('DELETE', '/logs'); } catch { /* offline */ }
  state.appLogs = [];
}

// ─── Push Subscription ─────────────────────────────────
export function getPushSub() { return state.pushSub; }
export async function setPushSub(sub) { state.pushSub = sub; await set('pp_push_sub', sub); }

// ─── Data Export ────────────────────────────────────────
export function exportData(type) {
  switch (type) {
    case 'orders': return JSON.stringify(state.orders, null, 2);
    case 'customers': return JSON.stringify(state.customers, null, 2);
    case 'cash': return JSON.stringify(state.cashEntries, null, 2);
    case 'menu': return JSON.stringify(state.menu, null, 2);
    case 'logs': return JSON.stringify(state.appLogs, null, 2);
    case 'all': return JSON.stringify({
      orders: state.orders, customers: state.customers,
      cashEntries: state.cashEntries, menu: state.menu, logs: state.appLogs,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    default: return '{}';
  }
}

// ─── Store Hours ────────────────────────────────────────
export function isStoreOpen() {
  const hour = new Date().getHours();
  return hour >= CONFIG.storeHours.open && hour < CONFIG.storeHours.close;
}

export function getStoreHoursText() {
  const o = CONFIG.storeHours.open;
  const c = CONFIG.storeHours.close;
  const fmt = (h) => `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
  return `${fmt(o)} – ${fmt(c)}`;
}

// ─── Last Order ─────────────────────────────────────────
export function getLastOrder() {
  const userOrders = state.orders.filter(o => o.customer?.mobile === state.user?.mobile && o.status !== 'cancelled');
  return userOrders.length > 0 ? userOrders[0] : null;
}

// ─── Item Popularity ────────────────────────────────────
export function getPopularItemIds() {
  const counts = {};
  for (const order of state.orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) {
      counts[item.itemId] = (counts[item.itemId] || 0) + item.qty;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
}
