document.addEventListener('DOMContentLoaded', () => {
  const geo = window.CycleFlowGeo;
  const stations = (window.CycleFlowStations || []).map(s => ({ ...s }));
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const map = $('smMap');
  const canvas = $('smCanvas');
  const pinsLayer = $('smPins');
  const list = $('stationList');
  if (!map || !list) return;

  const state = {
    query: '',
    filter: 'all',
    sort: 'near',
    selectedId: null,
    view: { s: 1, tx: 0, ty: 0 }
  };

  /* ==========================================================================
     HELPERS
     ========================================================================== */
  const total = (s) => s.classic + s.ebike;
  const docks = (s) => s.cap - total(s);
  const status = (s) => (total(s) === 0 ? 'empty' : total(s) <= 3 ? 'low' : 'ok');
  const statusText = { ok: 'Plenty of bikes', low: 'Running low', empty: 'No bikes' };
  const byId = (id) => stations.find(s => s.id === id);
  const walkMins = (s) => Math.max(1, Math.round(geo.distanceTo(s) * 20));

  const matches = (s) => {
    const q = state.query.trim().toLowerCase();
    const textOk = !q || [s.name, s.addr, s.hood].some(t => t.toLowerCase().includes(q));
    const filterOk = {
      all: true,
      bikes: total(s) > 0,
      ebikes: s.ebike > 0,
      docks: docks(s) >= 5
    }[state.filter];
    return textOk && filterOk;
  };

  const flash = (el) => {
    if (reduceMotion) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  /* ==========================================================================
     BUILD PINS + LIST ITEMS (once)
     ========================================================================== */
  stations.forEach(s => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'st-pin';
    pin.style.left = s.x + '%';
    pin.style.top = s.y + '%';
    pin.addEventListener('click', () => select(s.id, { focus: state.view.s > 1 }));
    pinsLayer.appendChild(pin);
    s.pin = pin;

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'sm-item';
    item.innerHTML = `
      <span class="sm-item-top">
        <span class="sm-item-info">
          <span class="sm-item-name"><span class="sm-dot"></span><span>${s.name}</span></span>
          <span class="sm-item-addr">${s.addr} · ${s.hood}</span>
        </span>
        <span class="sm-item-dist">${geo.distanceTo(s).toFixed(1)} mi<small>${walkMins(s)} min walk</small></span>
      </span>
      <span class="cap-bar" aria-hidden="true"><span class="cap-classic"></span><span class="cap-ebike"></span></span>
      <span class="sm-item-meta">
        <span class="sm-meta is-bikes"><i data-lucide="bike"></i><b data-f="classic"></b> classic</span>
        <span class="sm-meta is-ebikes"><i data-lucide="zap"></i><b data-f="ebike"></b> e-bikes</span>
        <span class="sm-meta"><i data-lucide="circle-parking"></i><b data-f="docks"></b> docks</span>
      </span>`;
    item.addEventListener('click', () => {
      select(s.id, { focus: true });
      if (window.matchMedia('(max-width: 1024px)').matches) {
        map.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
    list.appendChild(item);
    s.item = item;
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();

  /* ==========================================================================
     RENDERING
     ========================================================================== */
  function renderStation(s) {
    const st = status(s);
    const selected = s.id === state.selectedId;
    const visible = matches(s);

    // Pin
    s.pin.textContent = total(s);
    s.pin.classList.toggle('is-low', st === 'low');
    s.pin.classList.toggle('is-empty', st === 'empty');
    s.pin.classList.toggle('is-selected', selected);
    s.pin.classList.toggle('is-dim', !visible);
    s.pin.setAttribute('aria-label', `${s.name}: ${total(s)} bikes, ${docks(s)} open docks`);
    s.pin.setAttribute('aria-pressed', selected);

    // List item
    const item = s.item;
    item.hidden = !visible;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', selected);
    item.querySelector('.sm-dot').className = 'sm-dot' + (st === 'ok' ? '' : ' is-' + st);
    item.querySelector('[data-f="classic"]').textContent = s.classic;
    item.querySelector('[data-f="ebike"]').textContent = s.ebike;
    item.querySelector('[data-f="docks"]').textContent = docks(s);
    item.querySelector('.cap-classic').style.width = (s.classic / s.cap) * 100 + '%';
    item.querySelector('.cap-ebike').style.width = (s.ebike / s.cap) * 100 + '%';
  }

  function renderListMeta() {
    const shown = stations.filter(matches).length;
    $('listCount').textContent = `Showing ${shown} of ${stations.length}`;
    $('emptyState').classList.toggle('is-visible', shown === 0);
    list.hidden = shown === 0;
  }

  function renderStats() {
    const sum = (fn) => stations.reduce((n, s) => n + fn(s), 0);
    const classic = sum(s => s.classic);
    const ebike = sum(s => s.ebike);
    $('statStations').textContent = stations.length;
    $('statClassic').textContent = classic;
    $('statEbike').textContent = ebike;
    $('statDocks').textContent = sum(docks);
    $('heroBikes').textContent = classic + ebike;
  }

  function renderPopup() {
    const popup = $('smPopup');
    const s = byId(state.selectedId);
    popup.classList.toggle('is-hidden', !s);
    if (!s) return;

    const st = status(s);
    $('popHood').textContent = s.hood;
    $('popStatus').textContent = statusText[st];
    $('popStatus').className = 'status-badge' + (st === 'ok' ? '' : ' is-' + st);
    $('popName').textContent = s.name;
    $('popAddr').textContent = s.addr;
    $('popClassic').textContent = s.classic;
    $('popEbike').textContent = s.ebike;
    $('popDocks').textContent = docks(s);
    $('popCapClassic').style.width = (s.classic / s.cap) * 100 + '%';
    $('popCapEbike').style.width = (s.ebike / s.cap) * 100 + '%';
    $('popWalk').textContent = walkMins(s) + ' min';
    $('popDist').textContent = geo.distanceTo(s).toFixed(1) + ' mi away';

    const unlock = $('popUnlock');
    unlock.href = isAuthenticated ? 'dashboard.html' : 'login.html';
    unlock.classList.toggle('is-disabled', total(s) === 0);
    unlock.setAttribute('aria-disabled', total(s) === 0);

    $('popDirections').href = 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(`${s.addr}, New York, NY`);
  }

  function renderAll() {
    stations.forEach(renderStation);
    renderListMeta();
    renderPopup();
  }

  function sortList() {
    const sorters = {
      near: (a, b) => geo.distanceTo(a) - geo.distanceTo(b),
      bikes: (a, b) => total(b) - total(a),
      docks: (a, b) => docks(b) - docks(a),
      name: (a, b) => a.name.localeCompare(b.name)
    };
    [...stations].sort(sorters[state.sort]).forEach(s => list.appendChild(s.item));
  }

  function scrollItemIntoList(s) {
    const item = s.item;
    if (item.hidden) return;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ==========================================================================
     SELECTION
     ========================================================================== */
  function select(id, { focus = false } = {}) {
    state.selectedId = id;
    renderAll();
    const s = byId(id);
    if (!s) return;
    scrollItemIntoList(s);
    if (focus) focusOn(s, Math.max(state.view.s, 1.8));
  }

  $('popupClose').addEventListener('click', () => {
    state.selectedId = null;
    renderAll();
  });

  /* ==========================================================================
     PAN & ZOOM
     ========================================================================== */
  const MIN_Z = 1;
  const MAX_Z = 3;

  function clampView() {
    const W = map.clientWidth;
    const H = map.clientHeight;
    const v = state.view;
    v.tx = Math.min(0, Math.max(W - v.s * W, v.tx));
    v.ty = Math.min(0, Math.max(H - v.s * H, v.ty));
  }

  function applyView() {
    clampView();
    const v = state.view;
    canvas.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
    canvas.style.setProperty('--inv', (1 / v.s).toFixed(4));
    map.classList.toggle('is-zoomed', v.s > 1.01);
    $('zoomIn').disabled = v.s >= MAX_Z - 0.01;
    $('zoomOut').disabled = v.s <= MIN_Z + 0.01;
    $('zoomLevel').textContent = v.s > 1.01
      ? `${Math.round(v.s * 100)}% · drag to pan`
      : 'Double-click or press + to zoom';
  }

  function zoomAt(newScale, cx, cy) {
    const v = state.view;
    const s = Math.min(MAX_Z, Math.max(MIN_Z, newScale));
    const wx = (cx - v.tx) / v.s;
    const wy = (cy - v.ty) / v.s;
    v.s = s;
    v.tx = cx - wx * s;
    v.ty = cy - wy * s;
    applyView();
  }

  function focusOn(station, scale) {
    const W = map.clientWidth;
    const H = map.clientHeight;
    const v = state.view;
    v.s = Math.min(MAX_Z, scale);
    v.tx = W / 2 - v.s * (station.x / 100) * W;
    v.ty = H / 2 - v.s * (station.y / 100) * H;
    applyView();
  }

  const center = () => [map.clientWidth / 2, map.clientHeight / 2];

  $('zoomIn').addEventListener('click', () => zoomAt(state.view.s * 1.5, ...center()));
  $('zoomOut').addEventListener('click', () => zoomAt(state.view.s / 1.5, ...center()));

  $('resetView').addEventListener('click', () => {
    state.view = { s: 1, tx: 0, ty: 0 };
    applyView();
  });

  $('locateMe').addEventListener('click', () => {
    const nearest = stations
      .filter(s => total(s) > 0)
      .sort((a, b) => geo.distanceTo(a) - geo.distanceTo(b))[0];
    if (nearest) select(nearest.id, { focus: true });
  });

  const isOverlay = (target) => target.closest('.st-pin, .sm-controls, .sm-popup, .sm-toolbar');

  map.addEventListener('dblclick', (e) => {
    if (isOverlay(e.target)) return;
    const rect = map.getBoundingClientRect();
    zoomAt(state.view.s * 1.6, e.clientX - rect.left, e.clientY - rect.top);
  });

  // Drag to pan (only while zoomed in, so page scrolling still works at 100%)
  let drag = null;

  map.addEventListener('pointerdown', (e) => {
    if (state.view.s <= 1.01 || isOverlay(e.target) || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: state.view.tx, ty: state.view.ty, moved: false };
    map.setPointerCapture(e.pointerId);
  });

  map.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    map.classList.add('is-dragging');
    state.view.tx = drag.tx + dx;
    state.view.ty = drag.ty + dy;
    applyView();
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    map.classList.remove('is-dragging');
    drag = null;
  };
  map.addEventListener('pointerup', endDrag);
  map.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', applyView);

  /* ==========================================================================
     SEARCH, FILTERS, SORT
     ========================================================================== */
  const heroQuery = $('heroQuery');
  const sideQuery = $('sideQuery');
  const sideWrap = $('sideSearchWrap');
  const filterBtns = document.querySelectorAll('[data-filter]');

  function setQuery(value, source) {
    state.query = value;
    if (source !== heroQuery) heroQuery.value = value;
    if (source !== sideQuery) sideQuery.value = value;
    sideWrap.classList.toggle('has-value', value.length > 0);
    renderAll();
  }

  function selectFirstMatch() {
    const first = [...list.children].map(el => stations.find(s => s.item === el)).find(s => s && matches(s));
    if (first) select(first.id, { focus: true });
  }

  const goToMap = () => $('map').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

  heroQuery.addEventListener('input', () => setQuery(heroQuery.value, heroQuery));
  sideQuery.addEventListener('input', () => setQuery(sideQuery.value, sideQuery));

  $('heroSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    setQuery(heroQuery.value, heroQuery);
    selectFirstMatch();
    goToMap();
  });

  document.querySelectorAll('[data-hood]').forEach(btn => btn.addEventListener('click', () => {
    setQuery(btn.dataset.hood);
    selectFirstMatch();
    goToMap();
  }));

  $('clearSearch').addEventListener('click', () => {
    setQuery('');
    sideQuery.focus();
  });

  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    renderAll();
  }));

  $('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    sortList();
    list.scrollTop = 0;
  });

  $('resetFilters').addEventListener('click', () => {
    state.filter = 'all';
    filterBtns.forEach(b => b.classList.toggle('is-active', b.dataset.filter === 'all'));
    setQuery('');
  });

  /* ==========================================================================
     SIMULATED LIVE FEED
     ========================================================================== */
  let lastUpdate = Date.now();

  setInterval(() => {
    const s = stations[Math.floor(Math.random() * stations.length)];
    const useEbike = Math.random() < 0.35;

    if (Math.random() < 0.5) {
      if (docks(s) === 0) return;
      useEbike ? s.ebike++ : s.classic++;
    } else if (useEbike && s.ebike > 0) {
      s.ebike--;
    } else if (s.classic > 0) {
      s.classic--;
    } else {
      return;
    }

    lastUpdate = Date.now();
    renderStation(s);
    renderListMeta();
    renderStats();
    if (s.id === state.selectedId) renderPopup();
    flash(s.pin);
  }, 3000);

  setInterval(() => {
    const ago = Math.round((Date.now() - lastUpdate) / 1000);
    $('liveClock').textContent = ago < 2 ? 'Live · updated just now' : `Live · updated ${ago}s ago`;
  }, 1000);

  /* ==========================================================================
     INIT
     ========================================================================== */
  sortList();
  renderStats();

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    setQuery(initialQuery);
    selectFirstMatch();
    setTimeout(goToMap, 300);
  } else {
    const nearest = [...stations].sort((a, b) => geo.distanceTo(a) - geo.distanceTo(b))[0];
    state.selectedId = nearest.id;
    renderAll();
  }

  applyView();
});
