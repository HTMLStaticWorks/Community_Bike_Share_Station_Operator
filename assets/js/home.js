document.addEventListener('DOMContentLoaded', () => {
  const money = (n) => '$' + (n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2).replace(/\.00$/, ''));
  const bump = (el) => {
    el.classList.remove('bump');
    void el.offsetWidth; // restart animation
    el.classList.add('bump');
  };

  /* ==========================================================================
     RIDE COST & IMPACT CALCULATOR (index.html)
     Plan rules mirror pricing.html
     ========================================================================== */
  const ridesRange = document.getElementById('ridesRange');
  const minsRange = document.getElementById('minsRange');

  if (ridesRange && minsRange) {
    const PLANS = {
      payg:    { name: 'Pay-As-You-Go',    cost: (r, m) => r * (1 + 0.20 * m) },
      monthly: { name: 'Monthly Commuter', cost: (r, m) => 18 + r * Math.max(0, m - 45) * 0.15 },
      annual:  { name: 'Annual Pass',      cost: (r, m) => 150 / 12 + r * Math.max(0, m - 60) * 0.10 }
    };
    const MPH = 7.5;
    const CO2_PER_MILE = 0.89;
    const KCAL_PER_MIN = 7;

    const ridesOut = document.getElementById('ridesOut');
    const minsOut = document.getElementById('minsOut');
    const bestName = document.getElementById('bestName');
    const bestPrice = document.getElementById('bestPrice');
    const savingsEl = document.getElementById('savings');
    const compareLabel = document.getElementById('compareLabel');
    const co2Out = document.getElementById('co2Out');
    const milesOut = document.getElementById('milesOut');
    const calOut = document.getElementById('calOut');
    const calcCta = document.getElementById('calcCta');
    const presetBtns = document.querySelectorAll('[data-preset]');
    const compareBtns = document.querySelectorAll('[data-compare]');
    let compareMode = 'car';
    let lastBest = null;

    const setFill = (input) => {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty('--fill', pct + '%');
    };

    function compute() {
      const perWeek = +ridesRange.value;
      const mins = +minsRange.value;
      const rides = perWeek * 52 / 12;
      const milesPerRide = (mins / 60) * MPH;
      const miles = rides * milesPerRide;

      ridesOut.textContent = perWeek;
      minsOut.textContent = mins;
      setFill(ridesRange);
      setFill(minsRange);

      const costs = Object.fromEntries(Object.entries(PLANS).map(([k, p]) => [k, p.cost(rides, mins)]));
      const bestKey = Object.keys(costs).reduce((a, b) => (costs[b] < costs[a] ? b : a));
      const maxCost = Math.max(...Object.values(costs));

      document.querySelectorAll('#planBars .plan-bar').forEach(bar => {
        const key = bar.dataset.plan;
        bar.classList.toggle('is-best', key === bestKey);
        bar.querySelector('[data-cost]').textContent = money(costs[key]) + '/mo';
        bar.querySelector('.plan-bar-fill').style.width = Math.max(4, (costs[key] / maxCost) * 100) + '%';
      });

      const best = costs[bestKey];
      bestPrice.textContent = money(best);
      if (bestKey !== lastBest) {
        bestName.textContent = PLANS[bestKey].name;
        if (lastBest) bump(bestName);
        lastBest = bestKey;
      }

      const alt = compareMode === 'car'
        ? miles * 0.67 + rides * 4
        : rides * (3 + 1.9 * milesPerRide + 0.35 * mins);
      const saved = Math.max(0, alt - best);
      savingsEl.textContent = money(saved);
      compareLabel.textContent = compareMode === 'car' ? 'driving' : 'rideshare';

      co2Out.textContent = Math.round(miles * CO2_PER_MILE).toLocaleString('en-US');
      milesOut.textContent = Math.round(miles).toLocaleString('en-US');
      calOut.textContent = Math.round(rides * mins * KCAL_PER_MIN).toLocaleString('en-US');

      const ctaLabel = calcCta.querySelector('.cta-text');
      if (ctaLabel) ctaLabel.textContent = 'Get ' + PLANS[bestKey].name;
    }

    // Wrap CTA text so we can update it without destroying the icon
    const firstText = [...calcCta.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (firstText) {
      const span = document.createElement('span');
      span.className = 'cta-text';
      calcCta.replaceChild(span, firstText);
    }

    [ridesRange, minsRange].forEach(input => input.addEventListener('input', () => {
      presetBtns.forEach(b => b.classList.remove('is-active'));
      compute();
    }));

    presetBtns.forEach(btn => btn.addEventListener('click', () => {
      const [r, m] = btn.dataset.preset.split(',');
      ridesRange.value = r;
      minsRange.value = m;
      presetBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      compute();
      bump(bestPrice);
    }));

    compareBtns.forEach(btn => btn.addEventListener('click', () => {
      compareMode = btn.dataset.compare;
      compareBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      compute();
      bump(savingsEl);
    }));

    compute();
  }

  /* ==========================================================================
     TESTIMONIAL CAROUSEL (home2.html)
     Native scroll-snap for swipe/scroll; buttons, dots and autoplay on top.
     ========================================================================== */
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.tc-track');
    const slides = [...track.children];
    const dotsWrap = carousel.querySelector('.tc-dots');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    let timer = null;
    let inView = false;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'tc-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const setActive = (i) => {
      index = i;
      dots.forEach((d, n) => {
        d.classList.toggle('is-active', n === i);
        d.setAttribute('aria-selected', n === i);
      });
    };

    const goTo = (i) => {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[n].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      setActive(n);
    };

    // Keep dots in sync when the user swipes or scrolls the track
    let raf = null;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index && slides[i]) setActive(i);
      });
    }, { passive: true });

    carousel.querySelectorAll('.tc-btn').forEach(btn => btn.addEventListener('click', () => {
      const dir = +btn.dataset.dir * (document.documentElement.dir === 'rtl' ? -1 : 1);
      goTo(index + dir);
      restart();
    }));

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); restart(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); restart(); }
    });

    // Autoplay only while visible and not being interacted with
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      if (reduce || timer || !inView) return;
      timer = setInterval(() => goTo(index + 1), 6000);
    };
    function restart() { stop(); start(); }

    ['mouseenter', 'focusin', 'touchstart'].forEach(ev => carousel.addEventListener(ev, stop, { passive: true }));
    ['mouseleave', 'focusout'].forEach(ev => carousel.addEventListener(ev, start));

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      inView ? start() : stop();
    }, { threshold: 0.4 }).observe(carousel);

    setActive(0);
  });

  /* ==========================================================================
     LIVE NETWORK EXPLORER (home2.html)
     ========================================================================== */
  const pinsLayer = document.getElementById('mapPins');

  if (pinsLayer) {
    const geo = window.CycleFlowGeo;
    const stations = (window.CycleFlowStations || []).map(s => ({ ...s }));

    // Deterministic "today" history per station (12 hourly samples, 6 AM → now)
    stations.forEach((s, i) => {
      let seed = (i + 1) * 9301;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      s.history = Array.from({ length: 11 }, (_, h) => {
        const commute = Math.exp(-Math.pow(h - 2, 2) / 3) * 0.5 + Math.exp(-Math.pow(h - 9, 2) / 4) * 0.35;
        return Math.min(1, Math.max(0.05, 0.35 + commute * (rand() > 0.5 ? 1 : -0.8) + (rand() - 0.5) * 0.2));
      });
    });

    const els = {
      name: document.getElementById('pName'),
      addr: document.getElementById('pAddr'),
      hood: document.getElementById('pHood'),
      status: document.getElementById('pStatus'),
      classic: document.getElementById('pClassic'),
      ebike: document.getElementById('pEbike'),
      docks: document.getElementById('pDocks'),
      capClassic: document.getElementById('capClassic'),
      capEbike: document.getElementById('capEbike'),
      capText: document.getElementById('capText'),
      capPct: document.getElementById('capPct'),
      spark: document.getElementById('spark'),
      sparkPeak: document.getElementById('sparkPeak'),
      walk: document.getElementById('pWalk'),
      dist: document.getElementById('pDist'),
      reserveBtn: document.getElementById('reserveBtn'),
      reserveLabel: document.getElementById('reserveLabel'),
      liveClock: document.getElementById('liveClock'),
      panel: document.getElementById('stationPanel')
    };

    const filterBtns = document.querySelectorAll('[data-filter]');
    let selectedId = 'usq';
    let activeFilter = 'all';
    let reservation = null; // { id, endsAt }
    let lastUpdate = Date.now();

    const total = (s) => s.classic + s.ebike;
    const docks = (s) => s.cap - total(s);
    const status = (s) => (total(s) === 0 ? 'empty' : total(s) <= 3 ? 'low' : 'ok');
    const statusText = { ok: 'Plenty of bikes', low: 'Running low', empty: 'No bikes' };
    const byId = (id) => stations.find(s => s.id === id);

    const matchesFilter = (s) => ({
      all: true,
      bikes: total(s) > 0,
      ebikes: s.ebike > 0,
      docks: docks(s) >= 5
    })[activeFilter];

    // Build pins
    stations.forEach(s => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'st-pin';
      pin.style.left = s.x + '%';
      pin.style.top = s.y + '%';
      pin.dataset.id = s.id;
      pin.addEventListener('click', () => select(s.id));
      s.pin = pin;
      pinsLayer.appendChild(pin);
    });

    function renderPin(s) {
      const st = status(s);
      s.pin.textContent = total(s);
      s.pin.classList.toggle('is-low', st === 'low');
      s.pin.classList.toggle('is-empty', st === 'empty');
      s.pin.classList.toggle('is-selected', s.id === selectedId);
      s.pin.classList.toggle('is-dim', !matchesFilter(s));
      s.pin.setAttribute('aria-label', `${s.name}: ${total(s)} bikes, ${docks(s)} open docks`);
      s.pin.setAttribute('aria-pressed', s.id === selectedId);
    }

    function renderPanel(animate) {
      const s = byId(selectedId);
      const st = status(s);
      const filled = total(s);

      els.name.textContent = s.name;
      els.addr.textContent = s.addr;
      els.hood.textContent = s.hood;
      els.status.textContent = statusText[st];
      els.status.className = 'status-badge' + (st === 'ok' ? '' : ' is-' + st);
      els.classic.textContent = s.classic;
      els.ebike.textContent = s.ebike;
      els.docks.textContent = docks(s);
      els.capClassic.style.width = (s.classic / s.cap) * 100 + '%';
      els.capEbike.style.width = (s.ebike / s.cap) * 100 + '%';
      els.capText.textContent = `${filled} of ${s.cap} docks filled`;
      els.capPct.textContent = Math.round((filled / s.cap) * 100) + '%';

      // Sparkline: history + live "now" bar
      const series = [...s.history, filled / s.cap];
      els.spark.innerHTML = series
        .map((v, i) => `<span class="${i === series.length - 1 ? 'is-now' : ''}" style="height:${Math.max(6, v * 100)}%"></span>`)
        .join('');
      const peakIdx = s.history.indexOf(Math.max(...s.history));
      const hour = 6 + peakIdx;
      els.sparkPeak.textContent = `Peak at ${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;

      const miles = geo.distanceTo(s);
      els.dist.textContent = miles.toFixed(1) + ' mi away';
      els.walk.textContent = Math.max(1, Math.round(miles * 20)) + ' min';

      renderReserve();

      if (animate) {
        els.panel.classList.remove('panel-fade');
        void els.panel.offsetWidth;
        els.panel.classList.add('panel-fade');
      }
    }

    function renderReserve() {
      const s = byId(selectedId);
      const btn = els.reserveBtn;
      btn.classList.remove('is-reserved');
      btn.disabled = false;

      if (reservation) {
        const left = Math.max(0, Math.ceil((reservation.endsAt - Date.now()) / 1000));
        const mm = Math.floor(left / 60);
        const ss = String(left % 60).padStart(2, '0');
        if (reservation.id === s.id) {
          btn.classList.add('is-reserved');
          els.reserveLabel.textContent = `Held · ${mm}:${ss} · Cancel`;
        } else {
          btn.disabled = true;
          els.reserveLabel.textContent = `Bike held at ${byId(reservation.id).name}`;
        }
        return;
      }

      if (total(s) === 0) {
        btn.disabled = true;
        els.reserveLabel.textContent = 'No bikes to reserve';
      } else {
        els.reserveLabel.textContent = 'Reserve for 10 min';
      }
    }

    function renderAll(animatePanel) {
      stations.forEach(renderPin);
      renderPanel(animatePanel);
    }

    function select(id) {
      if (id === selectedId) return;
      selectedId = id;
      renderAll(true);
    }

    function releaseReservation() {
      const s = byId(reservation.id);
      s.classic = Math.min(s.cap - s.ebike, s.classic + 1);
      reservation = null;
    }

    els.reserveBtn.addEventListener('click', () => {
      const s = byId(selectedId);
      if (reservation && reservation.id === s.id) {
        releaseReservation();
      } else if (!reservation && total(s) > 0) {
        if (s.classic > 0) s.classic--; else s.ebike--;
        reservation = { id: s.id, endsAt: Date.now() + 10 * 60 * 1000 };
      }
      renderAll(false);
      s.pin.classList.remove('flash');
      void s.pin.offsetWidth;
      s.pin.classList.add('flash');
    });

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      stations.forEach(renderPin);
    }));

    // Simulated live feed: a random station gains or loses a bike every few seconds
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setInterval(() => {
      const s = stations[Math.floor(Math.random() * stations.length)];
      const useEbike = Math.random() < 0.35;
      const delta = Math.random() < 0.5 ? -1 : 1;

      if (delta > 0 && docks(s) > 0) {
        useEbike ? s.ebike++ : s.classic++;
      } else if (delta < 0) {
        if (useEbike && s.ebike > 0) s.ebike--;
        else if (s.classic > 0) s.classic--;
        else return;
      } else {
        return;
      }

      lastUpdate = Date.now();
      renderPin(s);
      if (s.id === selectedId) renderPanel(false);
      if (!reduceMotion) {
        s.pin.classList.remove('flash');
        void s.pin.offsetWidth;
        s.pin.classList.add('flash');
      }
    }, 2800);

    // Clock: "updated Xs ago" + reservation countdown
    setInterval(() => {
      const ago = Math.round((Date.now() - lastUpdate) / 1000);
      els.liveClock.textContent = ago < 2 ? 'Live · updated just now' : `Live · updated ${ago}s ago`;

      if (reservation) {
        if (Date.now() >= reservation.endsAt) {
          releaseReservation();
          renderAll(false);
        } else {
          renderReserve();
        }
      }
    }, 1000);

    renderAll(false);
  }
});
