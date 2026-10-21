// Café El Portón: open-now status, reveal on scroll, the changing frame, the WhatsApp coupon.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opening hours by weekday (0 = domingo), in minutes after midnight, Colombia time.
  const HOURS = { 0: [480, 1080], 1: [420, 1140], 2: null, 3: [420, 1140], 4: [420, 1140], 5: [420, 1140], 6: [420, 1260] };
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  // Colombian public holidays: they take Sunday hours, except on Tuesday, when we are at the farm.
  // shortcut: list covers 2026–2027 only, extend it (or compute Ley Emiliani dates) before 2028.
  const FESTIVOS = new Set([
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08',
    '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
    '2026-12-08', '2026-12-25',
    '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01', '2027-05-10', '2027-05-31',
    '2027-06-07', '2027-07-05', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15',
    '2027-12-08', '2027-12-25',
  ]);

  // Hours for a calendar date ('YYYY-MM-DD'), or null when closed.
  const hoursOn = (ymd) => {
    const day = new Date(ymd + 'T12:00:00Z').getUTCDay();
    if (HOURS[day] === null) return null;
    return FESTIVOS.has(ymd) ? HOURS[0] : HOURS[day];
  };
  const addDays = (ymd, n) => new Date(Date.parse(ymd + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const weekday = (ymd) => new Date(ymd + 'T12:00:00Z').getUTCDay();

  const fmt = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
  };
  const span = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? `${h} h ${m} min` : `${m} min`;
  };

  function bogotaNow() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { ymd: `${get('year')}-${get('month')}-${get('day')}`, min: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  // Returns { open, text } for a Colombia date and minute; checked below.
  function status({ ymd, min }) {
    const today = hoursOn(ymd);
    if (today && min >= today[0] && min < today[1]) {
      return { open: true, text: `Abierto ahora · cerramos a las ${fmt(today[1])}, en ${span(today[1] - min)}` };
    }
    if (today && min < today[0]) {
      return { open: false, text: `Cerrado ahora · abrimos hoy a las ${fmt(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const next = addDays(ymd, i), h = hoursOn(next);
      if (h) {
        const when = i === 1 ? 'mañana' : `el ${DAYS[weekday(next)]}`;
        return { open: false, text: `Cerrado ahora · abrimos ${when} a las ${fmt(h[0])}` };
      }
    }
  }

  // Self-check of the schedule logic (runs once, logs only on failure). 2026-10-19 is a Monday.
  [[{ ymd: '2026-10-19', min: 600 }, true], [{ ymd: '2026-10-20', min: 600 }, false], [{ ymd: '2026-10-19', min: 1140 }, false],
   [{ ymd: '2026-10-25', min: 470 }, false], [{ ymd: '2026-10-24', min: 1250 }, true], [{ ymd: '2026-11-02', min: 435 }, false]]
    .forEach(([t, want]) => { if (status(t).open !== want) console.error('status check failed', t); });
  console.assert(status({ ymd: '2026-10-19', min: 1150 }).text.includes('abrimos el miércoles'), 'monday night should skip tuesday');

  function paintStatus() {
    const now = bogotaNow();
    const s = status(now);
    const day = weekday(now.ymd);
    document.querySelectorAll('.status').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      el.querySelector('.status-text').textContent = s.text;
    });
    document.querySelectorAll('.hours tr').forEach((tr) => {
      const isToday = FESTIVOS.has(now.ymd) && day !== 2 ? tr.dataset.day === '0' : Number(tr.dataset.day) === day;
      tr.classList.toggle('is-today', isToday);
    });
  }
  paintStatus();
  setInterval(paintStatus, 30000);

  // Reveal: each section's parts enter in order, once.
  const reveal = document.querySelectorAll('[data-reveal]');
  document.querySelectorAll('section, footer').forEach((sec) => {
    sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6)));
  });
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add('is-in'));
  }

  // The portón opens on load.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.shutter, .porton').forEach((el) => el.classList.add('is-in'));
  }));

  // The roasting loop plays only while on screen, and never under reduced motion.
  document.querySelectorAll('video[data-loop]').forEach((v) => {
    if (reduced || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  });

  // Phone navigation: close after choosing a section, on Escape, or on a tap outside.
  const navPhone = document.querySelector('.nav-phone');
  if (navPhone) {
    navPhone.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { navPhone.open = false; }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navPhone.open) { navPhone.open = false; navPhone.querySelector('summary').focus(); }
    });
    document.addEventListener('click', (e) => { if (navPhone.open && !navPhone.contains(e.target)) navPhone.open = false; });
  }

  // The frame: one arch, Salento changes inside it when the visitor taps it (no automatic rotation).
  const frame = document.querySelector('[data-frame]');
  if (frame) {
    const imgs = [...frame.querySelectorAll('img')];
    const cap = frame.querySelector('.frame-caption');
    let i = 0;
    const show = (n) => {
      imgs[i].classList.remove('is-on');
      imgs[i].setAttribute('aria-hidden', 'true');
      i = (n + imgs.length) % imgs.length;
      imgs[i].classList.add('is-on');
      imgs[i].removeAttribute('aria-hidden');
      cap.textContent = imgs[i].dataset.caption;
    };
    imgs.forEach((img, n) => { if (n) img.setAttribute('aria-hidden', 'true'); });
    frame.querySelector('.frame-stage').addEventListener('click', () => show(i + 1));
  }

  // The coupon: writes the WhatsApp message. No number on purpose; WhatsApp asks which chat to send it to.
  const form = document.getElementById('reserva');
  if (form) {
    const day = form.querySelector('#f-dia');
    const hour = form.querySelector('#f-hora');
    const err = form.querySelector('#f-error');
    const showError = (msg) => { err.hidden = !msg; err.textContent = msg || ''; day.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    day.min = bogotaNow().ymd;

    // Rebuild the hour list from that day's hours: on the hour, the last one an hour before closing.
    function fillHours() {
      const ymd = day.value;
      hour.length = 0;
      if (!ymd) { hour.add(new Option('Primero elige el día', '')); hour.disabled = true; showError(''); return; }
      const h = hoursOn(ymd);
      if (!h) {
        hour.add(new Option('Ese día está cerrado', ''));
        hour.disabled = true;
        showError('Los martes cerramos: estamos en la finca. Elige otro día.');
        return;
      }
      const now = bogotaNow();
      const from = ymd === now.ymd ? Math.max(h[0], Math.ceil((now.min + 30) / 60) * 60) : h[0];
      const slots = [];
      for (let m = from; m <= h[1] - 60; m += 60) slots.push(m);
      if (!slots.length) {
        hour.add(new Option('Hoy ya no hay horas', ''));
        hour.disabled = true;
        showError('Hoy ya no quedan horas para reservar. Elige otro día.');
        return;
      }
      showError('');
      hour.disabled = false;
      hour.add(new Option('Elige la hora', ''));
      hour.options[0].disabled = true;
      slots.forEach((m) => hour.add(new Option(fmt(m), fmt(m))));
      hour.selectedIndex = 0;
    }
    day.addEventListener('change', fillHours);
    fillHours();

    form.addEventListener('submit', (ev) => {
      if (day.value && !hoursOn(day.value)) { ev.preventDefault(); fillHours(); day.focus(); return; }
      const name = form.querySelector('#f-nombre').value.trim();
      const people = form.querySelector('#f-personas').value;
      const when = new Date(day.value + 'T12:00:00Z').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
      form.querySelector('#f-text').value =
        `Hola, Café El Portón. Soy ${name} y quiero apartar una mesa para ${people} el ${when} a las ${hour.value}, ¡gracias!`;
    });
  }
})();
