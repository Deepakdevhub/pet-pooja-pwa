/**
 * PET POOJA — Menu Manager (Admin)
 * With image upload, description, and tags support.
 */

import { CONFIG } from '../../config.js';
import { navigate } from '../../router.js';
import * as Store from '../../store.js';
import { formatPrice, escapeHtml } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';
import { pickImageFile, uploadImage, dataUrlSizeKB } from '../../utils/image.js';

let editingId = null;
let pendingImageUrl = null;  // holds image during add/edit before save

export function renderMenuManager(container) {
  const menu = Store.getMenu();
  const grouped = {};
  CONFIG.categories.forEach(c => { grouped[c.id] = []; });
  menu.forEach(item => {
    if (grouped[item.category]) grouped[item.category].push(item);
  });

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <button class="back-btn" id="mm-back">←</button>
        <h1>Menu Manager</h1>
        <button class="btn btn-primary btn-sm" id="mm-add-btn">+ Add</button>
      </div>

      <!-- Add/Edit Form (hidden by default) -->
      <div id="mm-form" class="card-padded mb-16" style="display:none;">
        <h3 class="mb-16" id="mm-form-title">Add Item</h3>

        <!-- Image Upload -->
        <div class="mm-image-upload" id="mm-image-area">
          <div class="mm-image-preview" id="mm-image-preview">
            <span class="mm-image-placeholder" id="mm-image-placeholder">📷 Tap to upload image</span>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn btn-ghost btn-sm" id="mm-image-pick" type="button">📷 Upload</button>
            <button class="btn btn-ghost btn-sm" id="mm-image-remove" type="button" style="display:none;">🗑 Remove</button>
          </div>
          <div class="text-xs text-muted mt-4" id="mm-image-info"></div>
        </div>

        <div class="input-group">
          <label>Name</label>
          <input type="text" class="input" id="mm-name" placeholder="Item name" maxlength="60" />
        </div>
        <div class="input-group">
          <label>Price (₹)</label>
          <input type="number" class="input" id="mm-price" placeholder="Price" min="1" />
        </div>
        <div class="input-group">
          <label>Category</label>
          <select class="input" id="mm-category">
            ${CONFIG.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label>Description</label>
          <textarea class="input" id="mm-desc" placeholder="Short appetizing description" maxlength="120" rows="2" style="min-height:56px;"></textarea>
        </div>
        <div class="input-group">
          <label>Tags <span class="text-muted text-xs">(comma separated)</span></label>
          <input type="text" class="input" id="mm-tags" placeholder="e.g. Spicy, Cheesy, Bestseller" maxlength="80" />
        </div>
        <div class="flex gap-8">
          <button class="btn btn-primary btn-sm" id="mm-save">Save</button>
          <button class="btn btn-ghost btn-sm" id="mm-cancel">Cancel</button>
        </div>
      </div>

      <!-- Menu Items -->
      ${CONFIG.categories.map(cat => {
        const items = grouped[cat.id] || [];
        if (items.length === 0) return '';
        return `
          <div class="section">
            <div class="section-title">${cat.icon} ${cat.name} <span class="text-muted text-xs">(${items.length})</span></div>
            ${items.map(item => `
              <div class="admin-list-item">
                ${item.img
                  ? `<img src="${item.img}" class="mm-item-thumb" alt="" loading="lazy" />`
                  : `<span class="item-icon">${item.available ? '🟢' : '🔴'}</span>`
                }
                <div class="item-info">
                  <div class="item-primary">${escapeHtml(item.name)} ${item.badge || ''}</div>
                  <div class="item-secondary">${formatPrice(item.price)}</div>
                  ${item.desc ? `<div class="item-secondary" style="font-size:11px;color:var(--c-text-muted);margin-top:2px;">${escapeHtml(item.desc).slice(0, 50)}${item.desc.length > 50 ? '…' : ''}</div>` : ''}
                  ${item.tags && item.tags.length ? `<div style="display:flex;gap:3px;margin-top:3px;">${item.tags.map(t => `<span class="menu-tag">${t}</span>`).join('')}</div>` : ''}
                </div>
                <button class="item-action toggle-avail" data-id="${item.id}" title="Toggle">${item.available ? '✅' : '❌'}</button>
                <button class="item-action edit-item" data-id="${item.id}" title="Edit">✏️</button>
                <button class="item-action delete-item" data-id="${item.id}" title="Delete">🗑️</button>
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}

      <div class="text-center text-muted text-sm mt-24">
        ${menu.length} items total
      </div>
    </div>
  `;

  // ── Events ──
  document.getElementById('mm-back').addEventListener('click', () => navigate('/admin/dashboard'));

  const form = document.getElementById('mm-form');
  const previewEl = document.getElementById('mm-image-preview');
  const placeholderEl = document.getElementById('mm-image-placeholder');
  const removeBtn = document.getElementById('mm-image-remove');
  const imageInfo = document.getElementById('mm-image-info');

  // Show/hide image preview helper
  function setImagePreview(url) {
    pendingImageUrl = url;
    if (url) {
      previewEl.style.backgroundImage = `url(${url})`;
      previewEl.classList.add('has-image');
      placeholderEl.style.display = 'none';
      removeBtn.style.display = '';
      imageInfo.textContent = `${dataUrlSizeKB(url)} KB compressed`;
    } else {
      previewEl.style.backgroundImage = '';
      previewEl.classList.remove('has-image');
      placeholderEl.style.display = '';
      removeBtn.style.display = 'none';
      imageInfo.textContent = '';
    }
  }

  // Add button
  document.getElementById('mm-add-btn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('mm-form-title').textContent = 'Add Item';
    document.getElementById('mm-name').value = '';
    document.getElementById('mm-price').value = '';
    document.getElementById('mm-category').value = 'pizza';
    document.getElementById('mm-desc').value = '';
    document.getElementById('mm-tags').value = '';
    setImagePreview(null);
    form.style.display = 'block';
    document.getElementById('mm-name').focus();
  });

  // Image pick
  document.getElementById('mm-image-pick').addEventListener('click', async () => {
    const file = await pickImageFile();
    if (!file) return;
    showToast('Compressing image…', 'info');
    try {
      const url = await uploadImage(file, editingId || 'new_item');
      setImagePreview(url);
      showToast('Image ready ✓', 'success');
    } catch (err) {
      console.error('Image compress error:', err);
      showToast('Image processing failed', 'error');
    }
  });

  // Also allow clicking the preview area to upload
  previewEl.addEventListener('click', () => {
    document.getElementById('mm-image-pick').click();
  });

  // Remove image
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setImagePreview(null);
    showToast('Image removed', 'info');
  });

  // Cancel
  document.getElementById('mm-cancel').addEventListener('click', () => {
    form.style.display = 'none';
    editingId = null;
    pendingImageUrl = null;
  });

  // Save
  document.getElementById('mm-save').addEventListener('click', async () => {
    const name = document.getElementById('mm-name').value.trim();
    const price = parseInt(document.getElementById('mm-price').value);
    const category = document.getElementById('mm-category').value;
    const desc = document.getElementById('mm-desc').value.trim();
    const tagsRaw = document.getElementById('mm-tags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!name || !price || price < 1) {
      showToast('Fill name and price', 'error');
      return;
    }

    const itemData = { name, price, category, desc, tags };

    // Image: use pending or keep existing (don't overwrite with null if not changed)
    if (pendingImageUrl !== null) {
      itemData.img = pendingImageUrl || '';  // empty string = explicitly removed
    } else if (editingId) {
      // pendingImageUrl is null means no change — keep existing
    } else {
      itemData.img = '';  // new item with no image
    }

    if (editingId) {
      await Store.updateMenuItem(editingId, itemData);
      showToast('Item updated ✓', 'success');
    } else {
      await Store.addMenuItem(itemData);
      showToast('Item added ✓', 'success');
    }
    form.style.display = 'none';
    editingId = null;
    pendingImageUrl = null;
    renderMenuManager(container);
  });

  // Toggle/Edit/Delete via delegation
  container.addEventListener('click', async (e) => {
    const toggle = e.target.closest('.toggle-avail');
    if (toggle) {
      await Store.toggleMenuItemAvail(toggle.dataset.id);
      renderMenuManager(container);
      return;
    }
    const edit = e.target.closest('.edit-item');
    if (edit) {
      const item = Store.getMenuItemById(edit.dataset.id);
      if (!item) return;
      editingId = item.id;
      document.getElementById('mm-form-title').textContent = 'Edit Item';
      document.getElementById('mm-name').value = item.name;
      document.getElementById('mm-price').value = item.price;
      document.getElementById('mm-category').value = item.category;
      document.getElementById('mm-desc').value = item.desc || '';
      document.getElementById('mm-tags').value = item.tags ? item.tags.join(', ') : '';
      pendingImageUrl = null;  // null = no change yet
      setImagePreview(item.img || null);
      if (item.img) pendingImageUrl = null;  // keep existing, don't mark as "changed"
      form.style.display = 'block';
      document.getElementById('mm-name').focus();
      return;
    }
    const del = e.target.closest('.delete-item');
    if (del) {
      if (confirm('Delete this item?')) {
        await Store.deleteMenuItem(del.dataset.id);
        showToast('Item deleted', 'info');
        renderMenuManager(container);
      }
    }
  });
}
