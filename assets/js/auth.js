document.addEventListener('DOMContentLoaded', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ==========================================================================
     SHOW / HIDE PASSWORD
     ========================================================================== */
  document.querySelectorAll('.pwd-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  /* ==========================================================================
     HELPERS
     ========================================================================== */
  function setField(input, ok, errorId) {
    input.classList.toggle('error', !ok);
    input.classList.toggle('success', ok);
    document.getElementById(errorId).style.display = ok ? 'none' : 'block';
    return ok;
  }

  // Simulated auth: flag the session and continue to the dashboard
  function submitSuccess(form, label) {
    localStorage.setItem('isAuthenticated', 'true');
    const btn = form.querySelector('.btn-auth');
    btn.classList.add('is-loading');
    btn.innerHTML = `<i data-lucide="loader-circle" class="spin"></i> ${label}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  }

  /* ==========================================================================
     LOGIN
     ========================================================================== */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const pwd = document.getElementById('password');
      const okEmail = setField(email, EMAIL_RE.test(email.value.trim()), 'emailError');
      const okPwd = setField(pwd, pwd.value.length >= 8, 'pwdError');
      if (okEmail && okPwd) submitSuccess(loginForm, 'Signing in');
    });
  }

  /* ==========================================================================
     REGISTER
     ========================================================================== */
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const pwd = document.getElementById('password');
      const confirm = document.getElementById('confirm_pwd');
      const terms = document.getElementById('terms');

      const results = [
        setField(name, name.value.trim().length > 1, 'nameError'),
        setField(email, EMAIL_RE.test(email.value.trim()), 'emailError'),
        setField(pwd, pwd.value.length >= 8, 'pwdError'),
        setField(confirm, confirm.value.length > 0 && confirm.value === pwd.value, 'confirmError')
      ];
      const termsOk = terms.checked;
      document.getElementById('termsError').style.display = termsOk ? 'none' : 'block';

      if (results.every(Boolean) && termsOk) submitSuccess(regForm, 'Creating account');
    });
  }
});
