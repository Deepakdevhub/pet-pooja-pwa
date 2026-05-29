/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Search Overlay Component
 * ═══════════════════════════════════════════════════════════
 * Full-screen search with debounced results, highlighted
 * matches, and add-to-cart on tap.
 */

import { CONFIG, getCategory } from '../config.js';
import { formatPrice } from '../utils/format.js';
import { debounce, getCategoryEmoji, escapeHtml } from '../utils/format.js';
import * as Store from '../store.js';
import { showToast } from './toast.js';

/** @type {HTMLElement|null} */
let overlayEl = null;
/** @type {HTMLInputElement|null} */
let inputEl = null;
/** @type {HTMLElement|null} */
let resultsEl = null;

/**
 * Initialize the search overlay — appends markup to document.body.
 * Call once during app bootstrap.
 */
export function initSearch() {
  if (overlayEl && document.body.contains(overlayEl)) return;

  overlayEl = document.createElement('div');
  overlayEl.className = 'search-overlay';
  overlayEl.id = 'search-overlay';
  overlayEl.innerHTML = `
    <div class="search-header">
      <button class="search-back-btn" id="search-back-btn" aria-label="Close search">←</button>
      <input type="text"
             id="search-input"
             placeholder="Search pizza, burger, shake…"
             autocomplete="off"
             autocapitalize="off"
             spellcheck="false" />
    </div>
    <div class="search-results" id="search-results">
      <div class="search-empty">
        <div class="emoji">🔍</div>
        <div>Type to search the menu</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  inputEl = document.getElementById('search-input');
  resultsEl = document.getElementById('search-results');

  // Debounced search handler
  const handleSearch = debounce((query) => {
    renderResults(query.trim());
  }, 200);

  inputEl.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  // Back button
  document.getElementById('search-back-btn').addEventListener('click', closeSearch);

  // Escape key closes overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl.classList.contains('open')) {
      closeSearch();
    }
  });
}

/**
 * Open the search overlay and focus the input.
 */
export function openSearch() {
  if (!overlayEl) return;
  overlayEl.classList.add('open');
  // Small delay so the CSS transition runs before focus (avoids iOS quirks)
  setTimeout(() => {
    inputEl.value = '';
    inputEl.focus();
    renderResults('');
  }, 100);
}

/**
 * Close the search overlay and reset.
 */
function closeSearch() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  inputEl.blur();
}

/**
 * Render search results into the results container.
 * @param {string} query
 */
function renderResults(query) {
  if (!resultsEl) return;

  // Empty query → show initial state
  if (!query) {
    resultsEl.innerHTML = `
      <div class="search-empty">
        <div class="emoji">🔍</div>
        <div>Type to search the menu</div>
      </div>
    `;
    return;
  }

  const lowerQuery = query.toLowerCase();
  const menu = Store.getMenu();
  const matches = menu.filter(item =>
    item.available && (
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.desc && item.desc.toLowerCase().includes(lowerQuery)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(lowerQuery)))
    )
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `
      <div class="search-empty">
        <div class="emoji">😕</div>
        <div>No items found</div>
      </div>
    `;
    return;
  }

  resultsEl.innerHTML = matches.map(item => {
    const cat = getCategory(item.category);
    const emoji = getCategoryEmoji(item.category);
    const catName = cat ? cat.name : item.category;
    const highlightedName = highlightMatch(escapeHtml(item.name), query);
    const descText = item.desc ? escapeHtml(item.desc).slice(0, 60) + (item.desc.length > 60 ? '…' : '') : '';
    const tagsHtml = item.tags && item.tags.length
      ? `<div class="result-tags">${item.tags.map(t => `<span class="menu-tag">${t}</span>`).join('')}</div>`
      : '';

    return `
      <div class="search-result-item" data-item-id="${item.id}" role="button" tabindex="0">
        ${item.img
          ? `<img src="${item.img}" class="result-thumb" alt="" loading="lazy" />`
          : `<div class="result-emoji">${emoji}</div>`
        }
        <div class="result-info">
          <div class="result-name">${highlightedName}</div>
          <div class="result-cat">${escapeHtml(catName)}</div>
          ${descText ? `<div class="result-desc">${descText}</div>` : ''}
          ${tagsHtml}
        </div>
        <div class="result-price">${formatPrice(item.price)}</div>
      </div>
    `;
  }).join('');

  // Attach click handlers to each result
  resultsEl.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => handleResultTap(el.dataset.itemId));
  });
}

/**
 * Handle tapping a search result — add to cart + toast.
 * @param {string} itemId
 */
async function handleResultTap(itemId) {
  const item = Store.getMenuItemById(itemId);
  if (!item) return;

  await Store.addToCart(item, 1);

  const emoji = getCategoryEmoji(item.category);
  showToast(`${emoji} ${item.name} added to cart`, 'success');
}

/**
 * Highlight matching portion of text with <mark> tags.
 * Works on already-escaped HTML text.
 *
 * @param {string} text   — the escaped item name
 * @param {string} query  — raw search query
 * @returns {string} HTML with <mark> around matches
 */
function highlightMatch(text, query) {
  if (!query) return text;

  // Escape regex special chars in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
