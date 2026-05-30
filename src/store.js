/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — State Store (IndexedDB + Memory)
 * ═══════════════════════════════════════════════════════════
 * Persistent storage using IndexedDB via idb-keyval.
 * In-memory reactive state with event bus for UI updates.
 * Everything remembered forever — cart, orders, user, menu.
 */

import { get, set, del, keys, entries } from 'idb-keyval';
import { CONFIG } from './config.js';

// ── Simple Event Bus ──
const listeners = {};
export function on(event, fn) {
  (listeners[event] = listeners[event] || []).push(fn);
}
export function off(event, fn) {
  listeners[event] = (listeners[event] || []).filter(f => f !== fn);
}
export function emit(event, data) {
  (listeners[event] || []).forEach(fn => fn(data));
}

// ── In-Memory State ──
const state = {
  user: null,         // { name, mobile, createdAt }
  cart: [],           // [{ itemId, name, price, qty, category, customImage }]
  orders: [],         // [{ id, orderNum, items, extras, total, ... }]
  menu: [],           // menu items (from config or admin edits)
  settings: {
    acceptOrders: true,
    orderMode: 'online',
    adminAuth: false,
  },
  customers: [],      // admin: list of customers
  cashEntries: [],    // admin: cash log
  appLogs: [],        // admin: app logs
  pushSub: null,      // push subscription object
};

/**
 * Initialize store — load all data from IndexedDB
 */
export async function initStore() {
  try {
    const user = await get('pp_user');
    const cart = await get('pp_cart');
    const orders = await get('pp_orders');
    const menu = await get('pp_menu');
    const settings = await get('pp_settings');
    const customers = await get('pp_customers');
    const cashEntries = await get('pp_cash');
    const appLogs = await get('pp_logs');

    if (user) state.user = user;
    if (cart) state.cart = cart;
    if (orders) state.orders = orders;
    if (settings) Object.assign(state.settings, settings);
    if (customers) state.customers = customers;
    if (cashEntries) state.cashEntries = cashEntries;
    if (appLogs) state.appLogs = appLogs;

    // Load menu from stored data or use defaults
    if (menu && menu.length > 0) {
      state.menu = menu;
    } else {
      state.menu = [...CONFIG.defaultMenu];
      await set('pp_menu', state.menu);
    }

    logApp('info', 'Store initialized', { itemsLoaded: state.menu.length });
  } catch (err) {
    console.error('Store init error:', err);
    logApp('error', 'Store init failed', { error: err.message });
    // Fallback to defaults
    state.menu = [...CONFIG.defaultMenu];
  }
}

// ─── User ───────────────────────────────────────────────
export function getUser() { return state.user; }

export async function setUser(user) {
  state.user = user;
  await set('pp_user', user);
  addCustomer(user);
  emit('user:changed', user);
  logApp('info', 'User logged in', { name: user.name, mobile: user.mobile });
}

export function isLoggedIn() { return !!state.user; }

// ─── Cart ───────────────────────────────────────────────
export function getCart() { return state.cart; }

export function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

export function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

export async function addToCart(menuItem, qty = 1) {
  const existing = state.cart.find(c => c.itemId === menuItem.id);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      itemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty,
      category: menuItem.category,
      customImage: null,
    });
  }
  await persistCart();
  emit('cart:changed', state.cart);
}

export async function updateCartQty(itemId, qty) {
  if (qty <= 0) {
    state.cart = state.cart.filter(c => c.itemId !== itemId);
  } else {
    const item = state.cart.find(c => c.itemId === itemId);
    if (item) item.qty = qty;
  }
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

async function persistCart() {
  await set('pp_cart', state.cart);
}

export function getCartItemQty(itemId) {
  const item = state.cart.find(c => c.itemId === itemId);
  return item ? item.qty : 0;
}

// ─── Orders ─────────────────────────────────────────────
export function getOrders() { return state.orders; }

export function getActiveOrders() {
  return state.orders.filter(o => o.status === 'active');
}

export function getOrderById(id) {
  return state.orders.find(o => o.id === id);
}

export async function placeOrder(orderData) {
  const orderNum = generateOrderNum();
  const order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderNum,
    customer: { name: state.user.name, mobile: state.user.mobile },
    items: [...state.cart],
    extras: orderData.extras || [],
    notes: orderData.notes || '',
    coupon: orderData.coupon || null,
    subtotal: getCartTotal(),
    extrasTotal: (orderData.extras || []).reduce((s, e) => s + e.price, 0),
    discount: orderData.discount || 0,
    total: 0,
    status: 'active',
    mode: state.settings.orderMode,
    cutlery: orderData.cutlery || false,
    createdAt: new Date().toISOString(),
    fulfilledAt: null,
    cancelledAt: null,
  };
  order.total = order.subtotal + order.extrasTotal - order.discount;

  state.orders.unshift(order);
  await set('pp_orders', state.orders);
  await clearCart();

  // Add cash entry
  await addCashEntry('in', order.total, `Order #${orderNum}`);

  emit('order:placed', order);
  logApp('info', 'Order placed', { orderNum, total: order.total });
  return order;
}

export async function fulfillOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'fulfilled';
    order.fulfilledAt = new Date().toISOString();
    await set('pp_orders', state.orders);
    emit('order:fulfilled', order);
    logApp('info', 'Order fulfilled', { orderNum: order.orderNum });
  }
  return order;
}

export async function cancelOrder(orderId, reason = '') {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelReason = reason;
    // Reverse cash entry
    await addCashEntry('out', order.total, `Cancelled #${order.orderNum}`);
    await set('pp_orders', state.orders);
    emit('order:cancelled', order);
    logApp('info', 'Order cancelled', { orderNum: order.orderNum, reason });
  }
  return order;
}

export async function updateOrderItems(orderId, newItems) {
  const order = state.orders.find(o => o.id === orderId);
  if (order && order.status === 'active') {
    const oldTotal = order.total;
    order.items = newItems;
    order.subtotal = newItems.reduce((s, i) => s + (i.price * i.qty), 0);
    order.total = order.subtotal + order.extrasTotal - order.discount;
    // Adjust cash
    const diff = order.total - oldTotal;
    if (diff !== 0) {
      await addCashEntry(diff > 0 ? 'in' : 'out', Math.abs(diff), `Edited #${order.orderNum}`);
    }
    await set('pp_orders', state.orders);
    emit('order:updated', order);
    logApp('info', 'Order updated', { orderNum: order.orderNum });
  }
  return order;
}

function generateOrderNum() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todayOrders = state.orders.filter(o => o.createdAt.startsWith(today.toISOString().slice(0, 10)));
  const seq = String(todayOrders.length + 1).padStart(3, '0');
  return `PP${dateStr}-${seq}`;
}

// ─── Menu Management ────────────────────────────────────
export function getMenu() { return state.menu; }

export function getMenuByCategory(categoryId) {
  return state.menu.filter(item => item.category === categoryId);
}

export function getMenuItemById(id) {
  return state.menu.find(item => item.id === id);
}

export async function addMenuItem(item) {
  const newItem = {
    id: `custom_${Date.now()}`,
    ...item,
    available: true,
  };
  state.menu.push(newItem);
  await set('pp_menu', state.menu);
  emit('menu:changed', state.menu);
  logApp('info', 'Menu item added', { name: item.name });
  return newItem;
}

export async function updateMenuItem(id, updates) {
  const idx = state.menu.findIndex(item => item.id === id);
  if (idx >= 0) {
    Object.assign(state.menu[idx], updates);
    await set('pp_menu', state.menu);
    emit('menu:changed', state.menu);
  }
}

export async function deleteMenuItem(id) {
  state.menu = state.menu.filter(item => item.id !== id);
  await set('pp_menu', state.menu);
  emit('menu:changed', state.menu);
  logApp('info', 'Menu item deleted', { id });
}

export async function toggleMenuItemAvail(id) {
  const item = state.menu.find(i => i.id === id);
  if (item) {
    item.available = !item.available;
    await set('pp_menu', state.menu);
    emit('menu:changed', state.menu);
  }
}

// ─── Settings ───────────────────────────────────────────
export function getSettings() { return state.settings; }

export async function updateSettings(updates) {
  Object.assign(state.settings, updates);
  await set('pp_settings', state.settings);
  emit('settings:changed', state.settings);
}

export function isAdminAuthed() { return state.settings.adminAuth; }

export async function adminLogin(code) {
  if (code === CONFIG.auth.adminCodeHash) {
    state.settings.adminAuth = true;
    await set('pp_settings', state.settings);
    emit('admin:authed', true);
    logApp('info', 'Admin login successful');
    return true;
  }
  logApp('warn', 'Admin login failed — wrong code');
  return false;
}

export async function adminLogout() {
  state.settings.adminAuth = false;
  await set('pp_settings', state.settings);
  emit('admin:authed', false);
}

// ─── Customers ──────────────────────────────────────────
export function getCustomers() { return state.customers; }

async function addCustomer(user) {
  const existing = state.customers.find(c => c.mobile === user.mobile);
  if (!existing) {
    state.customers.push({
      mobile: user.mobile,
      name: user.name,
      orderCount: 0,
      totalSpent: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  } else {
    existing.name = user.name;
    existing.lastSeen = new Date().toISOString();
  }
  await set('pp_customers', state.customers);
}

export function getCustomerByMobile(mobile) {
  return state.customers.find(c => c.mobile === mobile);
}

// ─── Cash Management ────────────────────────────────────
export function getCashEntries() { return state.cashEntries; }

export function getTodayRevenue() {
  const today = new Date().toISOString().slice(0, 10);
  return state.cashEntries
    .filter(e => e.createdAt.startsWith(today))
    .reduce((sum, e) => sum + (e.type === 'in' ? e.amount : -e.amount), 0);
}

export async function addCashEntry(type, amount, note) {
  state.cashEntries.push({
    id: `cash_${Date.now()}`,
    type,
    amount,
    note,
    createdAt: new Date().toISOString(),
  });
  await set('pp_cash', state.cashEntries);
  emit('cash:changed', state.cashEntries);
}

// ─── App Logs ───────────────────────────────────────────
export function getAppLogs() { return state.appLogs; }

export function logApp(level, message, details = null) {
  const entry = {
    id: `log_${Date.now()}`,
    level,
    message,
    details,
    createdAt: new Date().toISOString(),
  };
  state.appLogs.push(entry);
  // Keep max 500 logs
  if (state.appLogs.length > 500) {
    state.appLogs = state.appLogs.slice(-500);
  }
  // Async persist (don't await — fire and forget)
  set('pp_logs', state.appLogs).catch(() => {});
  if (level === 'error') console.error(`[PP] ${message}`, details);
}

export async function clearLogs() {
  state.appLogs = [];
  await set('pp_logs', []);
}

// ─── Push Subscription ─────────────────────────────────
export function getPushSub() { return state.pushSub; }

export async function setPushSub(sub) {
  state.pushSub = sub;
  await set('pp_push_sub', sub);
}

// ─── Data Export ────────────────────────────────────────
export function exportData(type) {
  switch (type) {
    case 'orders': return JSON.stringify(state.orders, null, 2);
    case 'customers': return JSON.stringify(state.customers, null, 2);
    case 'cash': return JSON.stringify(state.cashEntries, null, 2);
    case 'menu': return JSON.stringify(state.menu, null, 2);
    case 'logs': return JSON.stringify(state.appLogs, null, 2);
    case 'all': return JSON.stringify({
      orders: state.orders,
      customers: state.customers,
      cashEntries: state.cashEntries,
      menu: state.menu,
      logs: state.appLogs,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    default: return '{}';
  }
}

// ─── Get today's orders ─────────────────────────────────
export function getTodayOrders() {
  const today = new Date().toISOString().slice(0, 10);
  return state.orders.filter(o => o.createdAt.startsWith(today));
}

// ─── Store Hours ────────────────────────────────────────
export function isStoreOpen() {
  const now = new Date();
  const hour = now.getHours();
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
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);
}
