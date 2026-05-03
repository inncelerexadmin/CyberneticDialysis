(function () {
  // Cookie/GDPR notice (lightweight; we only remember dismissal in localStorage)
  const mountCookieNotice = () => {
    const key = 'cd_cookie_notice_v1';
    try {
      if (localStorage.getItem(key) === '1') return;
    } catch (_) {
      // ignore (private mode etc.)
    }

    const el = document.createElement('section');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie notice');
    const privacyHref = document.documentElement.classList.contains('home') ? './privacy/' : '../privacy/';
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

    const ok = el.querySelector('[data-cookie-ok]');
    const dismiss = () => {
      try { localStorage.setItem(key, '1'); } catch (_) { /* ignore */ }
      el.remove();
    };
    ok?.addEventListener('click', dismiss);

    document.body.appendChild(el);
  };

  // Header height -> CSS var (prevents sticky sub-nav from clipping under header on mobile)
  const headerEl = document.querySelector('.site-header');
  const homeNavEl = document.querySelector('.home-nav');
  const setStickyVars = () => {
    if (headerEl) document.documentElement.style.setProperty('--header-h', `${headerEl.offsetHeight}px`);
    if (homeNavEl) document.documentElement.style.setProperty('--home-nav-h', `${homeNavEl.offsetHeight}px`);
  };
  setStickyVars();
  window.addEventListener('resize', setStickyVars, { passive: true });

  // Mount cookie notice after the DOM is ready enough
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountCookieNotice, { once: true });
  } else {
    mountCookieNotice();
  }

  // Type-in (every load): home hero title (header should be static)
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (!prefersReduced) {
    if (document.documentElement.classList.contains('home')) {
      // Restart CSS animation reliably on every page load
      document.querySelectorAll('[data-hero-type]').forEach((el) => {
        el.classList.remove('type-in');
        // force reflow so the animation restarts
        void el.offsetWidth; // eslint-disable-line no-void
        el.classList.add('type-in');
      });
    }
  }

  // Scroll progress
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    let ticking = false;
    const heroWrap = document.querySelector('.hero-wrap');
    const heroContactCta = document.querySelector('[data-hero-contact-cta]');
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const pct = Math.min(100, Math.max(0, (scrollTop / max) * 100));
      progressBar.style.width = `${pct}%`;

      // Scroll-reactive hero FX (subtle parallax on the hero background overlays)
      if (heroWrap && !prefersReduced) {
        const t = Math.min(1, Math.max(0, scrollTop / Math.max(1, window.innerHeight * 0.9)));
        heroWrap.style.setProperty('--hero-parallax', t.toFixed(4));
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    // Home hero: hover/focus the Contact CTA to “wake up” the hero background
    if (heroWrap && heroContactCta && document.documentElement.classList.contains('home')) {
      const enable = () => heroWrap.classList.add('contact-hover');
      const disable = () => heroWrap.classList.remove('contact-hover');
      heroContactCta.addEventListener('mouseenter', enable);
      heroContactCta.addEventListener('mouseleave', disable);
      heroContactCta.addEventListener('focus', enable);
      heroContactCta.addEventListener('blur', disable);
    }
  }

  // Mobile menu
  const menuBtn = document.querySelector('[data-menu-btn]');
  const mainNav = document.querySelector('[data-main-nav]');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Back-to-top button
  const topBtn = document.querySelector('[data-back-to-top]');
  if (topBtn) {
    const toggle = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      topBtn.classList.toggle('show', y > 700);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Scroll reveal
  if (!prefersReduced) {
    const els = Array.from(document.querySelectorAll('[data-reveal], h1:not([data-no-reveal]), h2.h2, .cards-stack .slide, .cards-grid .slide'));
    els.forEach((el) => {
      el.classList.add('reveal');
      if (el.matches('h1, h2.h2')) el.classList.add('reveal-title');
    });
    if (els.length) {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              // Defer to next frame so initial "reveal" styles can paint
              requestAnimationFrame(() => e.target.classList.add('in'));
              obs.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
      );
      els.forEach((el) => obs.observe(el));
    }
  } else {
    document.querySelectorAll('[data-reveal], h1:not([data-no-reveal]), h2.h2').forEach((el) => {
      el.classList.add('reveal', 'in');
      if (el.matches('h1, h2.h2')) el.classList.add('reveal-title');
    });
  }

  // Home scrollspy
  const tabs = Array.from(document.querySelectorAll('[data-home-tab]'));
  const currentEl = document.querySelector('[data-home-current]');
  const navRoot = document.querySelector('[data-home-nav]');
  const currentBtn = document.querySelector('[data-home-current-btn]');
  const sections = tabs
    .map((t) => {
      const id = t.getAttribute('href')?.split('#')[1];
      const el = id ? document.getElementById(id) : null;
      return el ? { id, el, tab: t } : null;
    })
    .filter(Boolean);

  if (sections.length) {
    const labelFor = (tabEl) =>
      tabEl.querySelector('.home-label')?.textContent?.trim() || tabEl.textContent?.trim() || '';

    const setActive = (id) => {
      for (const s of sections) {
        const isActive = s.id === id;
        s.tab.classList.toggle('active', isActive);
        if (isActive) {
          const label = labelFor(s.tab);
          if (currentEl) currentEl.textContent = label;
        }
      }
    };
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { threshold: [0.18, 0.35, 0.55], rootMargin: '-25% 0px -60% 0px' }
    );
    sections.forEach((s) => obs.observe(s.el));
    if (location.hash) setActive(location.hash.replace('#', ''));
    else setActive(sections[0].id);
  }

  // Home tab clicks: scroll with correct offset (sticky header + sticky home-nav)
  // This keeps tab clicks consistent even when scroll snapping uses scroll-padding-top on mobile.
  if (document.documentElement.classList.contains('home') && tabs.length) {
    const scrollToSection = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerH = headerEl?.offsetHeight ?? 70;
      const homeNavEl = document.querySelector('.home-nav');
      const homeNavH = homeNavEl?.offsetHeight ?? 64;
      const y = el.getBoundingClientRect().top + (window.scrollY || 0) - (headerH + homeNavH + 4);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      try {
        history.replaceState(null, '', `#${id}`);
      } catch (_) {
        // ignore
      }
    };

    tabs.forEach((t) => {
      t.addEventListener('click', (e) => {
        const href = t.getAttribute('href') || '';
        const id = href.includes('#') ? href.split('#')[1] : '';
        if (!id) return;
        e.preventDefault();
        scrollToSection(id);
      });
    });
  }

  // Mobile home-nav dropdown (current section button toggles full list)
  if (navRoot && currentBtn) {
    const close = () => {
      navRoot.classList.remove('open');
      currentBtn.setAttribute('aria-expanded', 'false');
    };
    const toggle = () => {
      const open = navRoot.classList.toggle('open');
      currentBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    currentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    tabs.forEach((t) => t.addEventListener('click', () => close()));

    document.addEventListener('click', (e) => {
      if (!navRoot.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // Carousels
  document.querySelectorAll('[data-carousel]').forEach((rootEl) => {
    const track = rootEl.querySelector('[data-carousel-track]');
    const prev = rootEl.querySelector('[data-carousel-prev]');
    const next = rootEl.querySelector('[data-carousel-next]');
    if (!track) return;

    const viewport = rootEl.querySelector('[data-carousel-viewport]');
    const slides = Array.from(track.children);
    if (!viewport || slides.length === 0) return;

    let idx = 0;
    const isPager = rootEl.classList.contains('pager');
    const dotsEl = rootEl.querySelector('[data-carousel-dots]');
    const countEl = rootEl.querySelector('[data-carousel-count]');

    const stepPx = () => {
      if (isPager) return viewport.clientWidth;
      const first = slides[0];
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    };

    const maxIdx = () => {
      if (isPager) return Math.max(0, slides.length - 1);
      const step = stepPx();
      const maxTranslate = Math.max(0, track.scrollWidth - viewport.clientWidth);
      return step > 0 ? Math.floor(maxTranslate / step) : 0;
    };

    const ensureDots = () => {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pager-dot';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', () => { idx = clamp(i); render(); });
        dotsEl.appendChild(b);
      });
    };

    const render = () => {
      const x = idx * stepPx();
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= maxIdx();
      if (countEl) countEl.textContent = `${idx + 1} / ${slides.length}`;
      if (dotsEl) {
        const dots = Array.from(dotsEl.querySelectorAll('.pager-dot'));
        dots.forEach((d, i) => {
          if (i === idx) d.setAttribute('aria-current', 'true');
          else d.removeAttribute('aria-current');
        });
      }
    };

    const clamp = (v) => Math.max(0, Math.min(maxIdx(), v));

    if (prev) prev.addEventListener('click', () => { idx = clamp(idx - 1); render(); });
    if (next) next.addEventListener('click', () => { idx = clamp(idx + 1); render(); });

    // Prevent horizontal wheel scroll inside carousel
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    }, { passive: false });

    // Swipe support for pager on touch devices (mobile)
    if (isPager) {
      let startX = 0;
      let startY = 0;
      let dragging = false;

      const onStart = (e) => {
        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX;
        startY = t.clientY;
        dragging = true;
      };

      const onEnd = (e) => {
        if (!dragging) return;
        dragging = false;
        const t = e.changedTouches ? e.changedTouches[0] : e;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < 40) return;
        if (Math.abs(dx) < Math.abs(dy)) return;
        idx = clamp(idx + (dx < 0 ? 1 : -1));
        render();
      };

      viewport.addEventListener('touchstart', onStart, { passive: true });
      viewport.addEventListener('touchend', onEnd, { passive: true });
    }

    // Keyboard support (when focus is inside this carousel)
    rootEl.addEventListener('keydown', (e) => {
      if (!rootEl.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); idx = clamp(idx - 1); render(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); idx = clamp(idx + 1); render(); }
    });

    window.addEventListener('resize', () => { idx = clamp(idx); render(); }, { passive: true });
    ensureDots();
    render();
  });

  // Tabs
  document.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
    const tablist = tabsRoot.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = Array.from(tabsRoot.querySelectorAll('[role="tabpanel"]'));
    const activate = (id) => {
      tabs.forEach((t) => {
        const on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => (p.hidden = p.id !== id));
    };
    tabs.forEach((t) => t.addEventListener('click', () => activate(t.getAttribute('aria-controls'))));
    tablist.addEventListener('keydown', (e) => {
      const idx = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (idx + dir + tabs.length) % tabs.length;
        activate(tabs[next].getAttribute('aria-controls'));
        tabs[next].focus();
      }
    });
    // default
    const selected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    if (selected) activate(selected.getAttribute('aria-controls'));
  });

  // Contact form: submit to Formspree (with mailto fallback until configured)
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const statusEl = document.querySelector('[data-form-status]');
    const recipientEl = document.querySelector('[data-contact-recipient]');
    const recipient = (recipientEl?.textContent || '').trim() || 'contact@cyberneticdialysis.com';

    const fields = {
      name: form.querySelector('input[name="name"]'),
      position: form.querySelector('input[name="position"]'),
      company: form.querySelector('input[name="company"]'),
      email: form.querySelector('input[name="email"]'),
      phone: form.querySelector('input[name="phone"]'),
      enquiry: form.querySelector('textarea[name="enquiry"]'),
    };

    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };

    const mark = (el, bad) => el && el.classList.toggle('error', Boolean(bad));
    const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

    const validate = () => {
      const v = {
        name: fields.name?.value?.trim(),
        position: fields.position?.value?.trim(),
        company: fields.company?.value?.trim(),
        email: fields.email?.value?.trim(),
        phone: fields.phone?.value?.trim(),
        enquiry: fields.enquiry?.value?.trim(),
      website: form.querySelector('input[name="website"]')?.value?.trim(),
      };
      const problems = [];
      if (!v.name) problems.push(['name', 'Please enter your name.']);
      if (!v.position) problems.push(['position', 'Please enter your position.']);
      if (!v.company) problems.push(['company', 'Please enter your company.']);
      if (!v.email || !validEmail(v.email)) problems.push(['email', 'Please enter a valid email address.']);
      if (!v.phone) problems.push(['phone', 'Please enter your phone number.']);
      if (!v.enquiry) problems.push(['enquiry', 'Please describe your enquiry.']);

      Object.keys(fields).forEach((k) => mark(fields[k], false));
      if (problems.length) {
        problems.forEach(([k]) => mark(fields[k], true));
        setStatus(problems[0][1]);
        return { ok: false, v };
      }
      setStatus('');
      return { ok: true, v };
    };

    const buildMessage = (v) => {
      const subject = `CYBERNETIC DIALYSIS enquiry from ${v.name}`;
      const bodyLines = [
        'CYBERNETIC DIALYSIS — Website enquiry',
        '',
        `Name: ${v.name}`,
        `Position: ${v.position}`,
        `Company: ${v.company}`,
        `Email: ${v.email}`,
        `Phone: ${v.phone}`,
        '',
        'Enquiry:',
        v.enquiry,
        '',
      ];
      return { subject, body: bodyLines.join('\n') };
    };

    const toMailto = ({ subject, body }) =>
      `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const copyText = async (txt) => {
      if (!navigator.clipboard) return false;
      await navigator.clipboard.writeText(txt);
      return true;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { ok, v } = validate();
      if (!ok) return;
      const msg = buildMessage(v);
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setStatus('Sending…');

      try {
        const endpoint = form.getAttribute('action') || '';
        if (!endpoint || endpoint.includes('REPLACE_ME')) throw new Error('Form not configured');

        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: (() => {
            const fd = new FormData();
            Object.entries(v).forEach(([k, val]) => fd.append(k, String(val ?? '')));
            return fd;
          })(),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data?.ok !== true) throw new Error(data?.error || 'Send failed');

        form.reset();
        Object.keys(fields).forEach((k) => mark(fields[k], false));
        setStatus('Sent. We’ll get back to you soon.');
      } catch (_) {
        // fallback: open an email draft + copy the message to clipboard
        setStatus('Could not send automatically. Opening an email draft instead…');
        try { window.location.href = toMailto(msg); } catch (_) { /* ignore */ }
        try {
          const copied = await copyText(msg.body);
          setStatus(copied ? 'Draft opened (message copied to clipboard).' : 'Draft opened.');
        } catch (_) {
          setStatus('Draft opened.');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();


