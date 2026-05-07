(function () {
  const mountCookieNotice = () => {
    const key = 'cd_cookie_notice_v1';

    try {
      if (localStorage.getItem(key) === '1') return;
    } catch (_) {}

    const el = document.createElement('section');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie notice');

    const privacyHref = document.documentElement.classList.contains('home')
      ? './privacy/'
      : '../privacy/';

    el.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-copy">
          <div class="cookie-title">Cookies</div>
          <div class="cookie-text">
            We use essential cookies/local storage. <a class="cookie-link" href="${privacyHref}">Privacy policy</a>.
          </div>
        </div>
        <div class="cookie-actions">
          <button class="btn ghost cookie-btn" type="button" data-cookie-ok>OK</button>
        </div>
      </div>
    `;

    el.querySelector('[data-cookie-ok]')?.addEventListener('click', () => {
      try { localStorage.setItem(key, '1'); } catch (_) {}
      el.remove();
    });

    document.body.appendChild(el);
  };

  const headerEl = document.querySelector('.site-header');
  const homeNavEl = document.querySelector('.home-nav');

  const setStickyVars = () => {
    if (headerEl) {
      document.documentElement.style.setProperty('--header-h', `${headerEl.offsetHeight}px`);
    }
    if (homeNavEl) {
      document.documentElement.style.setProperty('--home-nav-h', `${homeNavEl.offsetHeight}px`);
    }
  };

  setStickyVars();
  window.addEventListener('resize', setStickyVars, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountCookieNotice, { once: true });
  } else {
    mountCookieNotice();
  }

  const menuBtn = document.querySelector('[data-menu-btn]');
  const mainNav = document.querySelector('[data-main-nav]');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // -----------------------------
  // CONTACT FORM (FIXED FOR FORMSPREE)
  // -----------------------------
  const form = document.querySelector('[data-contact-form]');
  const statusEl = document.querySelector('[data-form-status]');

  const setStatus = (msg) => {
    if (statusEl) statusEl.textContent = msg;
  };

  const mark = (el, bad) => {
    if (el) el.classList.toggle('error', !!bad);
  };

  const validEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

  if (form) {
    const fields = {
      name: form.querySelector('input[name="name"]'),
      position: form.querySelector('input[name="position"]'),
      company: form.querySelector('input[name="company"]'),
      email: form.querySelector('input[name="email"]'),
      phone: form.querySelector('input[name="phone"]'),
      enquiry: form.querySelector('textarea[name="enquiry"]'),
    };

    const validate = () => {
      const v = {
        name: fields.name?.value?.trim(),
        position: fields.position?.value?.trim(),
        company: fields.company?.value?.trim(),
        email: fields.email?.value?.trim(),
        phone: fields.phone?.value?.trim(),
        enquiry: fields.enquiry?.value?.trim(),
      };

      Object.values(fields).forEach((el) => mark(el, false));

      const errors = [];

      if (!v.name) errors.push(['name', 'Please enter your name.']);
      if (!v.position) errors.push(['position', 'Please enter your position.']);
      if (!v.company) errors.push(['company', 'Please enter your company.']);
      if (!v.email || !validEmail(v.email))
        errors.push(['email', 'Please enter a valid email.']);
      if (!v.phone) errors.push(['phone', 'Please enter your phone number.']);
      if (!v.enquiry) errors.push(['enquiry', 'Please describe your enquiry.']);

      if (errors.length) {
        errors.forEach(([k]) => mark(fields[k], true));
        setStatus(errors[0][1]);
        return { ok: false };
      }

      setStatus('');
      return { ok: true };
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const { ok } = validate();
      if (!ok) return;

      const formData = new FormData(form);

      setStatus('Sending...');

      try {
        const res = await fetch('https://formspree.io/f/mjgleoyy', {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json'
          }
        });

        if (res.ok) {
          form.reset();
          setStatus('Message sent successfully.');
        } else {
          setStatus('Failed to send. Please try again.');
        }
      } catch (err) {
        setStatus('Network error. Please try again.');
      }
    });
  }
})();
