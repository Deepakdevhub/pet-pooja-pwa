/**
 * PET POOJA — Admin Login Page
 * 6-digit code: 223311
 */

import { CONFIG } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { showToast } from '../components/toast.js';

export function renderAdminLogin(container) {
  container.innerHTML = `
    <div class="admin-auth-overlay">
      <div class="admin-auth-card">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔐</div>
        <h2 style="font-family:var(--ff-heading);margin-bottom:4px;">Admin Access</h2>
        <p class="text-sm text-muted mb-24">Enter 6-digit admin code</p>

        <div class="auth-code-inputs" id="admin-code-group" style="margin-bottom:16px;">
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="0" autocomplete="off" />
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="1" autocomplete="off" />
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="2" autocomplete="off" />
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="3" autocomplete="off" />
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="4" autocomplete="off" />
          <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="5" autocomplete="off" />
        </div>

        <div id="admin-code-error" class="input-hint error" style="text-align:center;display:none;">Wrong code. Access denied.</div>

        <button class="btn btn-primary btn-full btn-lg mt-16" id="admin-verify-btn" disabled>
          🔓 Unlock Admin
        </button>
        <button class="btn btn-ghost btn-full mt-8" id="admin-back-btn">← Back to Menu</button>
      </div>
    </div>
  `;

  const codeGroup = document.getElementById('admin-code-group');
  const digits = codeGroup.querySelectorAll('.code-digit');
  const verifyBtn = document.getElementById('admin-verify-btn');
  const errorEl = document.getElementById('admin-code-error');

  digits.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      if (val && idx < 5) digits[idx + 1].focus();
      validateCode();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        digits[idx - 1].focus();
        digits[idx - 1].value = '';
        validateCode();
      }
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      for (let i = 0; i < 6 && i < text.length; i++) digits[i].value = text[i];
      if (text.length >= 6) digits[5].focus();
      validateCode();
    });
  });

  digits[0].focus();

  function validateCode() {
    const code = Array.from(digits).map(d => d.value).join('');
    verifyBtn.disabled = code.length !== 6;
    errorEl.style.display = 'none';
  }

  verifyBtn.addEventListener('click', async () => {
    const code = Array.from(digits).map(d => d.value).join('');
    const ok = await Store.adminLogin(code);
    if (ok) {
      showToast('Admin access granted ✓', 'success');
      navigate('/admin/dashboard');
    } else {
      errorEl.style.display = 'block';
      codeGroup.style.animation = 'shake 0.4s';
      setTimeout(() => codeGroup.style.animation = '', 400);
      showToast('Wrong code', 'error');
      if (navigator.vibrate) navigator.vibrate(200);
    }
  });

  document.getElementById('admin-back-btn').addEventListener('click', () => navigate('/home'));
}
