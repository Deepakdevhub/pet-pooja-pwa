/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Auth Page (Account Creation)
 * ═══════════════════════════════════════════════════════════
 * Irremovable first screen. Name → Mobile → Code (7777).
 * Cannot be bypassed. Beautiful glassmorphism card.
 */

import { CONFIG } from '../config.js';
import { navigate } from '../router.js';
import * as Store from '../store.js';
import { showToast } from '../components/toast.js';
import { getOwnerWhatsAppLink } from '../utils/whatsapp.js';

export function renderAuth(container) {
  container.innerHTML = `
    <div class="auth-page" id="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="emoji">🍕</div>
          <h1>${CONFIG.shop.name}</h1>
          <p>${CONFIG.shop.tagline} — ${CONFIG.shop.description}</p>
        </div>

        <!-- Step 1: Name + Mobile -->
        <div class="auth-step active" id="auth-step-1">
          <div class="input-group">
            <label for="auth-name">Your Name</label>
            <input type="text" id="auth-name" class="input" placeholder="Enter your name" autocomplete="name" maxlength="50" />
          </div>
          <div class="input-group">
            <label for="auth-mobile">Mobile Number</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-weight:600;color:var(--c-text-secondary);font-size:var(--fs-md);padding:12px 0;">+91</span>
              <input type="tel" id="auth-mobile" class="input" placeholder="10-digit mobile" maxlength="10" inputmode="numeric" pattern="[0-9]*" autocomplete="tel" />
            </div>
          </div>
          <button class="btn btn-primary btn-full btn-lg" id="auth-next-btn" disabled>
            Continue →
          </button>
        </div>

        <!-- Step 2: Verification Code -->
        <div class="auth-step" id="auth-step-2">
          <p style="text-align:center;color:var(--c-text-secondary);margin-bottom:8px;">Enter the 4-digit code to create your account</p>
          <div class="auth-code-inputs" id="auth-code-group">
            <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="0" autocomplete="off" />
            <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="1" autocomplete="off" />
            <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="2" autocomplete="off" />
            <input type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="code-digit" data-idx="3" autocomplete="off" />
          </div>
          <div id="auth-code-error" class="input-hint error" style="text-align:center;display:none;">Wrong code. Please try again.</div>
          <button class="btn btn-primary btn-full btn-lg" id="auth-verify-btn" disabled>
            Create Account ✓
          </button>
          <button class="btn btn-ghost btn-full mt-16" id="auth-back-btn">← Back</button>
        </div>

        <!-- WhatsApp Contact -->
        <a href="${getOwnerWhatsAppLink('Hi! I need the code to create my account on Pet Pooja app.')}" target="_blank" rel="noopener" class="auth-whatsapp-link" id="auth-wa-link">
          <span>💬</span>
          <span>Don't have the code? Contact us on WhatsApp</span>
        </a>
      </div>
    </div>
  `;

  // ── State ──
  let name = '';
  let mobile = '';

  // ── Elements ──
  const nameInput = document.getElementById('auth-name');
  const mobileInput = document.getElementById('auth-mobile');
  const nextBtn = document.getElementById('auth-next-btn');
  const step1 = document.getElementById('auth-step-1');
  const step2 = document.getElementById('auth-step-2');
  const verifyBtn = document.getElementById('auth-verify-btn');
  const backBtn = document.getElementById('auth-back-btn');
  const codeGroup = document.getElementById('auth-code-group');
  const codeDigits = codeGroup.querySelectorAll('.code-digit');
  const codeError = document.getElementById('auth-code-error');

  // ── Validate Step 1 ──
  function validateStep1() {
    name = nameInput.value.trim();
    mobile = mobileInput.value.trim().replace(/\D/g, '');
    nextBtn.disabled = !(name.length >= 2 && mobile.length === 10);
  }

  nameInput.addEventListener('input', validateStep1);
  mobileInput.addEventListener('input', () => {
    mobileInput.value = mobileInput.value.replace(/\D/g, '');
    validateStep1();
  });

  // ── Go to Step 2 ──
  nextBtn.addEventListener('click', () => {
    step1.classList.remove('active');
    step2.classList.add('active');
    codeDigits[0].focus();
    vibrate();
  });

  // ── Code digit inputs ──
  codeDigits.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      if (val && idx < 3) {
        codeDigits[idx + 1].focus();
      }
      validateCode();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        codeDigits[idx - 1].focus();
        codeDigits[idx - 1].value = '';
        validateCode();
      }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      for (let i = 0; i < 4 && i < text.length; i++) {
        codeDigits[i].value = text[i];
      }
      if (text.length >= 4) codeDigits[3].focus();
      validateCode();
    });
  });

  function validateCode() {
    const code = Array.from(codeDigits).map(d => d.value).join('');
    verifyBtn.disabled = code.length !== 4;
    codeError.style.display = 'none';
  }

  // ── Back to Step 1 ──
  backBtn.addEventListener('click', () => {
    step2.classList.remove('active');
    step1.classList.add('active');
    codeDigits.forEach(d => d.value = '');
    codeError.style.display = 'none';
    vibrate();
  });

  // ── Verify ──
  verifyBtn.addEventListener('click', async () => {
    const code = Array.from(codeDigits).map(d => d.value).join('');

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      await Store.customerLogin(name, mobile, code);
      vibrate(50);
      showToast(`Welcome, ${name}! 🎉`, 'success');
      navigate('/home');
    } catch (err) {
      if (err.message.includes('Invalid code') || err.message.includes('401')) {
        codeError.style.display = 'block';
        codeGroup.style.animation = 'shake 0.4s';
        setTimeout(() => codeGroup.style.animation = '', 400);
        vibrate(200);
      } else {
        showToast('Connection error. Check your internet.', 'error');
      }
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Create Account ✓';
    }
  });

  // Enter key handling
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') mobileInput.focus();
  });
  mobileInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !nextBtn.disabled) nextBtn.click();
  });

  function vibrate(ms = 30) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }
}
