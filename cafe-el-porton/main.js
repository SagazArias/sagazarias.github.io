// Café El Portón: open-now status, reveal on scroll, the changing frame, the WhatsApp coupon.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A silent loop is decoration: under reduced motion it rests on its poster.
  if (reduced) document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });

  // Opening hours by weekday (0 = domingo), in minutes after midnight, Colombia time.
  const HOURS = { 0: [480, 1080], 1: [420, 1140], 2: null, 3: [420, 1140], 4: [420, 1140], 5: [420, 1140], 6: [420, 1260] };
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

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
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  // Returns { open, text } for a given day/minute; exported for the self-check below.
  function status({ day, min }) {
    const today = HOURS[day];
    if (today && min >= today[0] && min < today[1]) {
      return { open: true, text: `Abierto ahora · cerramos a las ${fmt(today[1])}, en ${span(today[1] - min)}` };
    }
    if (today && min < today[0]) {
      return { open: false, text: `Cerrado ahora · abrimos hoy a las ${fmt(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) {
        const when = i === 1 ? 'mañana' : `el ${DAYS[d]}`;
        return { open: false, text: `Cerrado ahora · abrimos ${when} a las ${fmt(HOURS[d][0])}` };
      }
    }
  }

  // Self-check of the schedule logic (runs once, logs only on failure).
  [[{ day: 1, min: 600 }, true], [{ day: 2, min: 600 }, false], [{ day: 1, min: 1140 }, false], [{ day: 0, min: 470 }, false], [{ day: 6, min: 1250 }, true]]
    .forEach(([t, want]) => { if (status(t).open !== want) console.error('status check failed', t); });
  console.assert(status({ day: 1, min: 1150 }).text.includes('abrimos el miércoles'), 'monday night should skip tuesday');

  function paintStatus() {
    const now = bogotaNow();
    const s = status(now);
    document.querySelectorAll('.status').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      el.querySelector('.status-text').textContent = s.text;
    });
    document.querySelectorAll('.hours tr').forEach((tr) => {
      tr.classList.toggle('is-today', Number(tr.dataset.day) === now.day);
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

  // The frame: one arch, Salento changes inside it. Tap to advance.
  const frame = document.querySelector('[data-frame]');
  if (frame) {
    const imgs = [...frame.querySelectorAll('img')];
    const cap = frame.querySelector('.frame-caption');
    let i = 0, timer = null;
    const show = (n) => {
      imgs[i].classList.remove('is-on');
      i = (n + imgs.length) % imgs.length;
      imgs[i].classList.add('is-on');
      cap.textContent = imgs[i].dataset.caption;
    };
    const start = () => { if (!reduced && !timer) timer = setInterval(() => show(i + 1), 3200); };
    const stop = () => { clearInterval(timer); timer = null; };
    frame.querySelector('.frame-stage').addEventListener('click', () => { stop(); show(i + 1); start(); });
    // Only run while visible and the tab is shown.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(frame);
    } else start();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : null));
  }

  // The coupon: writes the WhatsApp message. No number on purpose; WhatsApp asks whom to send it to.
  const form = document.getElementById('reserva');
  if (form) {
    const day = form.querySelector('#f-dia');
    const today = new Date();
    day.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const err = form.querySelector('#f-error');
    form.addEventListener('submit', (ev) => {
      const name = form.querySelector('#f-nombre').value.trim();
      const people = form.querySelector('#f-personas').value;
      const hour = form.querySelector('#f-hora').value;
      const date = day.value ? new Date(day.value + 'T12:00:00') : null;
      if (date && HOURS[date.getDay()] === null) {
        ev.preventDefault();
        err.hidden = false;
        err.textContent = 'Los martes cerramos: estamos en la finca. Elige otro día.';
        day.focus();
        return;
      }
      err.hidden = true;
      const when = date ? date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
      form.querySelector('#f-text').value =
        `Hola, Café El Portón. Soy ${name} y quiero apartar una mesa para ${people} el ${when} a las ${hour}, ¡gracias!`;
    });
  }
})();
