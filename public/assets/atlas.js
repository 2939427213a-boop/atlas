/* atlas.js: reading statistics for atlas.haoli-agi.com.
   No cookies, no stored IP, no session recording. What is recorded: /privacy */
(function () {
  'use strict';
  if (window.atlas) return;
  var script = document.currentScript;
  var PAGE = (script && script.getAttribute('data-page')) || location.pathname;
  var PVER = (script && script.getAttribute('data-v')) || '';
  var ENDPOINT = '/api/e', SECTIONS = 'section[id]', BLOCKS = 'article[id]';
  var READ_LINE = 0.4, IDLE_MS = 120000, TICK_MS = 1000, HEARTBEAT_MS = 60000, FIRST_MS = 5000, MAX_QUEUE = 120, HIDDEN_GAP_MS = 15000;

  var t0 = performance.now();
  function now() { return Math.round(performance.now() - t0); }
  function rid() {
    var a = new Uint8Array(12); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function clip(s, n) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n); }
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var optOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (optOut) ls.del('atlas.vid');

  var pv = rid(), seq = 0, queue = [], vid = optOut ? null : ls.get('atlas.vid');
  var secMs = {}, blockMs = {}, activeMs = 0, maxDepth = 0, cur = null, last = now(), lastInput = now(), idle = false;

  function push(e) { e.t = now(); queue.push(e); if (queue.length >= MAX_QUEUE) flush(false); }

  /* reading time: the section and the visual crossing 40% of the viewport, while the tab is visible and not idle */
  function crossing(selector) {
    var y = innerHeight * READ_LINE, list = document.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) return list[i].id;
    }
    return null;
  }
  setInterval(function () {
    var t = now(), dt = Math.min(t - last, 2 * TICK_MS); last = t;
    if (document.visibilityState !== 'visible') return;
    if (!idle && t - lastInput > IDLE_MS) { idle = true; push({ k: 'idle' }); }
    if (idle) return;
    var id = crossing(SECTIONS);
    if (id !== cur) { cur = id; if (id) push({ k: 'in', id: id }); }
    if (id) secMs[id] = (secMs[id] || 0) + dt;
    var b = crossing(BLOCKS);
    if (b) blockMs[b] = (blockMs[b] || 0) + dt;
    activeMs += dt;
  }, TICK_MS);

  function touch() { lastInput = now(); if (idle) { idle = false; push({ k: 'act' }); } }
  ['mousemove', 'pointerdown', 'wheel', 'touchstart'].forEach(function (n) { addEventListener(n, touch, { passive: true }); });

  function depth() {
    var h = document.documentElement.scrollHeight - innerHeight;
    return h <= 0 ? 100 : Math.max(0, Math.min(100, Math.round(scrollY / h * 100)));
  }
  var lastDepth = -10;
  addEventListener('scroll', function () {
    touch();
    var d = depth();
    if (d > maxDepth) maxDepth = d;
    if (Math.abs(d - lastDepth) >= 5) { lastDepth = d; push({ k: 'sd', d: d }); }
  }, { passive: true });

  function sectionOf(node) {
    var el = node && node.nodeType === 1 ? node : node && node.parentElement;
    return el ? el.closest(SECTIONS) : null;
  }
  function describe(el) {
    var a = el.closest('a,button,summary,label,input,select,textarea,[role=button],[data-atlas]') || el;
    var d = a.tagName.toLowerCase();
    if (a.id) d += '#' + a.id;
    else {
      var p = a.parentElement && a.parentElement.closest('[id]');
      if (p) d = p.tagName.toLowerCase() + '#' + p.id + ' ' + d;
      var cls = typeof a.className === 'string' ? a.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      if (cls.length) d += '.' + cls.join('.');
    }
    if (a.getAttribute('data-atlas')) d += '[' + a.getAttribute('data-atlas') + ']';
    return { node: a, el: d.slice(0, 120) };
  }
  document.addEventListener('click', function (e) {
    touch();
    if (!(e.target instanceof Element)) return;
    var d = describe(e.target), s = sectionOf(e.target), box = s && s.getBoundingClientRect(), blk = e.target.closest(BLOCKS);
    var href = d.node.getAttribute('href');
    push({ k: 'c', el: d.el, txt: clip(d.node.textContent, 60), href: href ? href.slice(0, 200) : undefined,
      sec: s ? s.id : undefined, blk: blk ? blk.id : undefined,
      x: box ? Math.round((e.clientX - box.left) / box.width * 1000) / 10 : undefined,
      y: box ? Math.round((e.clientY - box.top) / box.height * 1000) / 10 : undefined,
      px: Math.round(e.pageX), py: Math.round(e.pageY), vw: innerWidth });
  }, true);

  document.addEventListener('copy', function () {
    var sel = getSelection(), text = String(sel || '');
    if (!text) return;
    var s = sectionOf(sel.anchorNode);
    push({ k: 'cp', sec: s ? s.id : undefined, txt: clip(text, 120), n: text.length });
  });

  var sv = document.getElementById('sv');
  var NAV_KEY = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|Escape| )$/;
  document.addEventListener('keydown', function (e) {
    touch();
    if (e.repeat || !NAV_KEY.test(e.key)) return;
    push({ k: 'key', key: e.key === ' ' ? 'Space' : e.key, ctx: sv && !sv.hidden ? 'sv' : 'page' });
  }, true);

  /* in-page slide viewer (#sv in constellate pages): open / go / close */
  if (sv && window.MutationObserver) {
    var svOpen = !sv.hidden, svLast = '';
    var svId = function () { var n = sv.querySelector('.sv-id'); return n ? clip(n.textContent, 20) : ''; };
    new MutationObserver(function () {
      var open = !sv.hidden, id = svId();
      if (open !== svOpen) { svOpen = open; svLast = open ? id : ''; push(open ? { k: 'sv', a: 'open', id: id } : { k: 'sv', a: 'close' }); }
      else if (open && id && id !== svLast) { svLast = id; push({ k: 'sv', a: 'go', id: id }); }
    }).observe(sv, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('toggle', function (e) {
    var t = e.target;
    if (t && t.tagName === 'DETAILS') push({ k: 'tg', id: t.id || describe(t).el, open: t.open });
  }, true);
  addEventListener('hashchange', function () { push({ k: 'hc', h: location.hash.slice(0, 80) }); });
  var rz;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { push({ k: 'rz', w: innerWidth, h: innerHeight }); }, 500); });
  addEventListener('error', function (e) { push({ k: 'err', m: clip(e.message, 200), src: String(e.filename || '').slice(-120), ln: e.lineno }); });
  addEventListener('beforeprint', function () { push({ k: 'print' }); });
  addEventListener('pageshow', function (e) { if (e.persisted) push({ k: 'bfcache' }); });

  var lcp = 0, cls = 0, inp = 0, vitalsSent = false;
  try {
    new PerformanceObserver(function (l) { var es = l.getEntries(); if (es.length) lcp = Math.round(es[es.length - 1].startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (!e.hadRecentInput) cls += e.value; }); }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (e.interactionId && e.duration > inp) inp = Math.round(e.duration); }); }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
  } catch (e) {}
  addEventListener('load', function () {
    setTimeout(function () {
      var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (n) push({ k: 'perf', n: 'nav', ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), type: n.type, size: n.transferSize });
    }, 0);
  });
  function vitals() {
    if (vitalsSent) return;
    vitalsSent = true;
    push({ k: 'perf', n: 'vitals', lcp: lcp, cls: Math.round(cls * 1000) / 1000, inp: inp });
  }

  function mq(q) { return !!(window.matchMedia && matchMedia(q).matches); }
  function refNoQuery() {
    try { var u = new URL(document.referrer); return (u.origin + u.pathname).slice(0, 300); } catch (e) { return ''; }
  }
  function meta() {
    var q = new URLSearchParams(location.search), tags = {}, c = navigator.connection || {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'via', 'src'].forEach(function (k) { var v = q.get(k); if (v) tags[k] = clip(v, 100); });
    return {
      ref: refNoQuery(), url: (location.pathname + location.hash).slice(0, 300), tags: tags,
      title: clip(document.title, 120), vw: innerWidth, vh: innerHeight, sw: screen.width, sh: screen.height, dpr: devicePixelRatio,
      langs: (navigator.languages || [navigator.language]).slice(0, 5), tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tzo: new Date().getTimezoneOffset(), dark: mq('(prefers-color-scheme: dark)'), rm: mq('(prefers-reduced-motion: reduce)'),
      ptr: mq('(pointer: coarse)') ? 'coarse' : 'fine', mem: navigator.deviceMemory, cpu: navigator.hardwareConcurrency,
      net: c.effectiveType, save: c.saveData
    };
  }

  function hasKeys(o) { for (var k in o) return true; return false; }
  var lastSent = -1e9;
  function flush(fin) {
    if (seq > 0 && !queue.length && !activeMs && !hasKeys(secMs) && !hasKeys(blockMs)) return;
    lastSent = now();
    var ev = queue, k; queue = [];
    for (k in secMs) ev.push({ k: 'sec', id: k, ms: secMs[k] });
    for (k in blockMs) ev.push({ k: 'blk', id: k, ms: blockMs[k] });
    secMs = {}; blockMs = {};
    var b = { v: 1, pv: pv, seq: seq, fin: !!fin, path: location.pathname, lang: document.documentElement.lang, page: PAGE, pver: PVER,
      ms: activeMs, depth: maxDepth, tp: navigator.maxTouchPoints || 0, wd: navigator.webdriver === true, ev: ev };
    activeMs = 0;
    if (vid) b.vid = vid;
    if (seq === 0) b.meta = meta();
    seq++;
    var body = JSON.stringify(b);
    if (b.seq === 0) { /* first flush: read whether this browser may keep a random id */
      fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.p === 1 && !optOut) { if (!vid) { vid = rid(); ls.set('atlas.vid', vid); } }
          else { vid = null; ls.del('atlas.vid'); }
        }).catch(function () {});
      return;
    }
    var sent = false;
    try { sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' })); } catch (e) {}
    if (!sent) fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
  }

  setTimeout(function () { flush(false); }, FIRST_MS);
  setInterval(function () { if (document.visibilityState === 'visible') flush(false); }, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', function () {
    var hidden = document.visibilityState === 'hidden';
    push({ k: 'vis', s: hidden ? 'h' : 'v' });
    /* some embedded browsers flip visibility every few seconds: send on hide at most once per 15 s; pagehide always sends */
    if (hidden) { vitals(); if (now() - lastSent >= HIDDEN_GAP_MS) flush(true); }
  });
  addEventListener('pagehide', function () { flush(true); });

  window.atlas = { v: 1 };
})();
