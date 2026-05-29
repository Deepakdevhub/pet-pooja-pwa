/**
 * PET POOJA — Formatting Utilities
 */
import { CONFIG } from '../config.js';

/**
 * Format price with currency symbol
 */
export function formatPrice(amount) {
  return `${CONFIG.shop.currency}${amount}`;
}

/**
 * Format date to readable string
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time
 */
export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date + time
 */
export function formatDateTime(isoString) {
  return `${formatDate(isoString)}, ${formatTime(isoString)}`;
}

/**
 * Relative time (e.g., "2 min ago")
 */
export function timeAgo(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return formatDate(isoString);
}

/**
 * Truncate text
 */
export function truncate(str, len = 30) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * Generate unique ID
 */
export function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Debounce function
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Get category emoji for food item
 */
export function getCategoryEmoji(categoryId) {
  return CONFIG.categoryEmojis[categoryId] || '🍽️';
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format mobile number for display
 */
export function formatMobile(mobile) {
  if (mobile.length === 10) {
    return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
  }
  return mobile;
}
