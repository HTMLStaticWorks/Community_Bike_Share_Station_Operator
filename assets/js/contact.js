document.addEventListener('DOMContentLoaded', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const card = document.getElementById('contactCard');
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name: document.getElementById('cName'),
    email: document.getElementById('cEmail'),
    topic: document.getElementById('cTopic'),
    message: document.getElementById('cMessage'),
    consent: document.getElementById('cConsent'),
  };

  /* ==========================================================================
     TOPIC PRESELECT (?topic=station from About / service area links)
     ========================================================================== */
  function selectTopic(value) {
    if (value && fields.topic.querySelector(`option[value="${value}"]`)) {
      fields.topic.value = value;
    }
  }

  selectTopic(new URLSearchParams(window.location.search).get('topic'));

  document.querySelectorAll('[data-topic]').forEach(link => {
    link.addEventListener('click', () => selectTopic(link.dataset.topic));
  });

  /* ==========================================================================
     VALIDATION
     ========================================================================== */
  function setField(input, ok, errorId) {
    if (input.type !== 'checkbox') {
      input.classList.toggle('error', !ok);
      input.classList.toggle('success', ok);
    }
    document.getElementById(errorId).style.display = ok ? 'none' : 'block';
    return ok;
  }

  function validate() {
    const checks = [
      setField(fields.name, fields.name.value.trim().length >= 2, 'cNameError'),
      setField(fields.email, EMAIL_RE.test(fields.email.value.trim()), 'cEmailError'),
      setField(fields.topic, fields.topic.value !== '', 'cTopicError'),
      setField(fields.message, fields.message.value.trim().length >= 20, 'cMessageError'),
      setField(fields.consent, fields.consent.checked, 'cConsentError'),
    ];
    return checks.every(Boolean);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = form.querySelector('.form-control.error');
      if (firstError) firstError.focus();
      return;
    }

    // Simulated send: show a loading state, then the confirmation panel
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-circle" class="spin"></i> Sending';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
      document.getElementById('sentName').textContent = fields.name.value.trim().split(' ')[0];
      document.getElementById('sentEmail').textContent = fields.email.value.trim();
      card.classList.add('is-sent');
      btn.disabled = false;
      btn.innerHTML = 'Send Message <i data-lucide="send"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 900);
  });

  document.getElementById('sendAnother').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error', 'success'));
    card.classList.remove('is-sent');
    fields.name.focus();
  });
});
