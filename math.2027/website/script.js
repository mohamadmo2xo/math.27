/* ============================================
   مكتبة الرياضيات — الأكواد
   ============================================ */
(function () {
  'use strict';

  // ============ الإعدادات ============
  const GITHUB_USER = 'mo2xo';
  const GITHUB_REPO = 'math.2027';
  const GITHUB_BRANCH = 'main';
  const FILES_FOLDER = 'files';
  const CACHE_TIME = 30 * 60 * 1000;    // 30 دقيقة
  const FETCH_TIMEOUT = 12000;          // 12 ثانية

  // ============ حماية localStorage ============
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
  };

  // ============ الحالة ============
  const state = {
    currentPath: [{ name: 'الرئيسية', path: FILES_FOLDER }],
    currentItems: [],
    subjects: {},
    audioCtx: null,
    soundEnabled: store.get('soundEnabled') !== 'off',
    theme: store.get('theme') || 'dark',
    studentName: store.get('studentName') || '',
    loadToken: 0,
    cache: {}
  };

  // ============ العناصر ============
  const $ = (id) => document.getElementById(id);
  const els = {
    pageLoader: $('pageLoader'), nameOverlay: $('nameOverlay'),
    nameInput: $('nameInput'), nameSubmit: $('nameSubmit'), nameError: $('nameError'),
    maintenanceScreen: $('maintenanceScreen'),
    noticeBar: $('noticeBar'), tickerContent: $('tickerContent'),
    particles: $('particles'),
    themeToggle: $('themeToggle'), soundToggle: $('soundToggle'),
    backToTop: $('backToTop'), homeBtn: $('homeBtn'),
    greeting: $('greeting'), greetingText: $('greetingText'),
    scheduleBtn: $('scheduleBtn'), errorBox: $('errorBox'),
    searchInput: $('searchInput'), refreshBtn: $('refreshBtn'),
    breadcrumb: $('breadcrumb'), content: $('content'),
    loading: $('loading'), empty: $('empty'),
    scheduleModal: $('scheduleModal'), scheduleTitle: $('scheduleTitle'),
    scheduleList: $('scheduleList'), year: $('year')
  };

  // ============ الأصوات ============
  function initAudio() {
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { state.audioCtx = null; }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') state.audioCtx.resume();
  }
  function playTone(freq, dur, type, vol, endFreq) {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, state.audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol || .12, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, state.audioCtx.currentTime + dur);
      osc.connect(gain); gain.connect(state.audioCtx.destination);
      osc.start(state.audioCtx.currentTime);
      osc.stop(state.audioCtx.currentTime + dur);
    } catch (e) {}
  }
  const sndClick = () => playTone(680, .08, 'sine', .1, 480);
  const sndSuccess = () => { playTone(660, .1, 'sine', .12); setTimeout(() => playTone(880, .15, 'sine', .12), 90); };

  // ============ الثيم ============
  function applyTheme() {
    if (state.theme === 'light') {
      document.body.classList.add('light-mode');
      els.themeToggle.textContent = '☀️';
    } else {
      document.body.classList.remove('light-mode');
      els.themeToggle.textContent = '🌙';
    }
  }
  els.themeToggle.addEventListener('click', () => {
    initAudio(); sndClick();
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    store.set('theme', state.theme);
    applyTheme();
  });

  // ============ الأصوات تفعيل ============
  function applySoundState() {
    els.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
  }
  els.soundToggle.addEventListener('click', () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    store.set('soundEnabled', state.soundEnabled ? 'on' : 'off');
    applySoundState();
    if (state.soundEnabled) sndClick();
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, .card, a, .header-btn, .control-btn, .float-btn, .wa-btn, .modal-close');
    if (t) { initAudio(); if (state.soundEnabled) sndClick(); }
  }, { passive: true });

  // ============ الجزيئات ============
  function createParticles() {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 14 : 35;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      const dur = 12 + Math.random() * 14;
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = (Math.random() * -dur) + 's';
      const s = 1 + Math.random() * 2.5;
      p.style.width = s + 'px';
      p.style.height = s + 'px';
      p.style.opacity = (.35 + Math.random() * .55).toFixed(2);
      frag.appendChild(p);
    }
    els.particles.appendChild(frag);
  }

  // ============ جلب مع Timeout ============
  async function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  // ============ تحميل JSON ============
  async function loadJSON(path) {
    const cacheKey = 'json:' + path;
    const cached = state.cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_TIME) return cached.data;
    try {
      const res = await fetchWithTimeout(path + '?t=' + Date.now(), FETCH_TIMEOUT);
      if (!res.ok) return null;
      const data = await res.json();
      state.cache[cacheKey] = { data, time: Date.now() };
      return data;
    } catch (e) { return null; }
  }

  // ============ الإشعار ============
  async function initNotice() {
    const data = await loadJSON('notice.json');
    if (!data || data.active !== true) { els.noticeBar.hidden = true; return; }
    const color = data.color || 'green';
    els.noticeBar.className = 'notice-bar color-' + color;
    els.noticeBar.innerHTML = '<span class="notice-emoji">' + (data.emoji || '🌟') + '</span><span>' + escapeHTML(data.text || '') + '</span>';
    els.noticeBar.hidden = false;
  }

  // ============ شريط الإعلانات ============
  async function initTicker() {
    const data = await loadJSON('messages.json');
    if (!data || !Array.isArray(data.messages) || !data.messages.length) return;
    const defaultColor = data.defaultColor || 'green';
    const items = data.messages;
    const doubled = [...items, ...items];
    const frag = document.createDocumentFragment();
    doubled.forEach((msg) => {
      const span = document.createElement('span');
      let text = '', color = defaultColor;
      if (typeof msg === 'string') text = msg;
      else if (msg && typeof msg === 'object') { text = msg.text || ''; color = msg.color || defaultColor; }
      const match = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u);
      let emoji = '', rest = text;
      if (match) { emoji = match[1]; rest = match[2]; }
      if (emoji) {
        const em = document.createElement('span');
        em.className = 'tk-emoji';
        em.textContent = emoji;
        span.appendChild(em);
      }
      const txt = document.createElement('span');
      txt.textContent = rest;
      if (color && color !== 'green') txt.style.color = colorToCss(color);
      span.appendChild(txt);
      frag.appendChild(span);
    });
    els.tickerContent.innerHTML = '';
    els.tickerContent.appendChild(frag);
    // ضبط السرعة حسب عدد الرسائل
    const seconds = Math.max(30, doubled.length * 4);
    els.tickerContent.style.animationDuration = seconds + 's';
  }
  function colorToCss(c) {
    const map = { green: '#22c55e', red: '#ef4444', blue: '#3b82f6', yellow: '#fbbf24', orange: '#f97316', purple: '#a855f7', gray: '#64748b' };
    return map[c] || 'inherit';
  }

  // ============ حماية HTML ============
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ============ الاسم ============
  function initNameFlow() {
    if (state.studentName) { els.nameOverlay.hidden = true; showGreeting(); }
    else { els.nameOverlay.hidden = false; setTimeout(() => els.nameInput && els.nameInput.focus(), 300); }
  }
  function submitName() {
    const val = (els.nameInput.value || '').trim();
    if (val.length < 2) { els.nameError.textContent = 'الاسم قصير جدًا'; els.nameInput.focus(); return; }
    state.studentName = val;
    store.set('studentName', val);
    els.nameError.textContent = '';
    els.nameOverlay.hidden = true;
    initAudio(); sndSuccess();
    showGreeting();
  }
  els.nameSubmit.addEventListener('click', submitName);
  els.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitName(); });
  els.nameInput.addEventListener('input', () => { els.nameError.textContent = ''; });
  function showGreeting() {
    if (!state.studentName) return;
    const h = new Date().getHours();
    let g = '';
    if (h >= 5 && h < 12) g = 'صباح الخير';
    else if (h >= 12 && h < 17) g = 'نهارك سعيد';
    else if (h >= 17 && h < 21) g = 'مساء الخير';
    else g = 'سهرة موفقة';
    els.greetingText.textContent = '🌟 ' + g + ' يا ' + state.studentName;
    els.greeting.hidden = false;
  }

  // ============ GitHub ============
  async function fetchFolder(path) {
    const cacheKey = 'folder:' + path;
    const cached = state.cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_TIME) return cached.data;

    // ترميز كل جزء من المسار على حدة
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const url = 'https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO +
                '/contents/' + encodedPath + '?ref=' + GITHUB_BRANCH;
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT);
      if (res.status === 404) throw new Error('المجلد غير موجود');
      if (res.status === 403) {
        // استخدم النسخة المحفوظة إن وُجدت
        const saved = store.get('folder:' + path);
        if (saved) {
          try { return JSON.parse(saved); } catch (e) {}
        }
        throw new Error('تجاوزت الحد المسموح، انتظر قليلًا');
      }
      if (!res.ok) throw new Error('فشل الاتصال (' + res.status + ')');
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      state.cache[cacheKey] = { data: items, time: Date.now() };
      try { store.set('folder:' + path, JSON.stringify(items)); } catch (e) {}
      return items;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('انتهت مدة الاتصال');
      throw e;
    }
  }

  // ============ مسار التنقل ============
  function renderBreadcrumb() {
    els.breadcrumb.innerHTML = '';
    state.currentPath.forEach((item, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep'; sep.textContent = '›';
        els.breadcrumb.appendChild(sep);
      }
      const s = document.createElement('span');
      s.textContent = item.name;
      s.tabIndex = 0;
      const go = () => {
        if (i === state.currentPath.length - 1) return;
        state.currentPath = state.currentPath.slice(0, i + 1);
        els.searchInput.value = '';
        loadFolder(item.path);
      };
      s.onclick = go;
      s.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      els.breadcrumb.appendChild(s);
    });
  }

  // ============ أدوات ============
  function formatSize(bytes) {
    if (!bytes) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, s = parseInt(bytes, 10);
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
    return s.toFixed(1) + ' ' + u[i];
  }
  function getIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '🖼️';
    if (['mp4','avi','mov','mkv','webm'].includes(ext)) return '🎬';
    if (['mp3','wav','ogg','m4a'].includes(ext)) return '🎵';
    if (['doc','docx','txt','rtf'].includes(ext)) return '📝';
    if (['xls','xlsx','csv'].includes(ext)) return '📊';
    if (['ppt','pptx'].includes(ext)) return '📽️';
    if (['zip','rar','7z','tar','gz'].includes(ext)) return '🗜️';
    return '📎';
  }
  function getDownloadUrl(path) {
    // نستخدم GitHub Pages (نفس النطاق) ليعمل download بشكل صحيح
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return 'https://' + GITHUB_USER + '.github.io/' + GITHUB_REPO + '/' + encodedPath;
  }

  // ============ توحيد البحث العربي ============
  function normalizeArabic(str) {
    return String(str).toLowerCase()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F\u0670]/g, '');
  }

  // ============ عرض العناصر ============
  async function renderItems(items) {
    els.content.innerHTML = '';
    if (!items.length) { els.empty.hidden = false; return; }
    els.empty.hidden = true;

    const frag = document.createDocumentFragment();
    // هل نحن في مجلد رئيسي (الجذر)؟
    const atRoot = state.currentPath.length === 1;

    for (let idx = 0; idx < items.length; idx++) {
      const file = items[idx];
      const isFolder = file.type === 'dir';
      const card = document.createElement('div');
      card.className = 'card' + (isFolder ? ' folder-card' : '');
      card.style.animationDelay = Math.min(idx * .03, .6) + 's';

      // صورة المادة إن وُجدت
      const subjectImg = isFolder && atRoot && state.subjects[file.name];
      if (subjectImg) {
        const img = document.createElement('img');
        img.className = 'subject-thumb';
        img.src = subjectImg;
        img.alt = file.name;
        img.loading = 'lazy';
        img.onerror = () => { img.replaceWith(makeIcon('📁')); };
        card.appendChild(img);
      } else {
        card.appendChild(makeIcon(isFolder ? '📁' : getIcon(file.name)));
      }

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = file.name;

      const meta = document.createElement('div');
      meta.className = 'meta';
      if (isFolder) meta.textContent = '📂 مجلد';
      else if (file.size) meta.textContent = '💾 ' + formatSize(file.size);
      else meta.textContent = '📄 ملف';

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (isFolder) {
        const go = () => {
          state.currentPath.push({ name: file.name, path: file.path });
          els.searchInput.value = '';
          loadFolder(file.path);
        };
        card.onclick = go;
        card.tabIndex = 0;
        card.onkeydown = (e) => { if (e.key === 'Enter') go(); };
      } else {
        const a = document.createElement('a');
        a.href = getDownloadUrl(file.path);
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('download', file.name);
        a.textContent = '⬇️ تنزيل';
        actions.appendChild(a);
      }

      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(actions);
      frag.appendChild(card);
    }
    els.content.appendChild(frag);
  }

  function makeIcon(char) {
    const el = document.createElement('div');
    el.className = 'icon';
    el.textContent = char;
    return el;
  }

  // ============ البحث ============
  function filterItems() {
    const q = normalizeArabic((els.searchInput.value || '').trim());
    if (!q) { renderItems(state.currentItems); return; }
    renderItems(state.currentItems.filter(f => normalizeArabic(f.name).includes(q)));
  }
  els.searchInput.addEventListener('input', filterItems);

  // ============ تحميل المجلد ============
  async function loadFolder(path) {
    const token = ++state.loadToken;
    els.errorBox.hidden = true;
    els.loading.hidden = false;
    els.content.innerHTML = '';
    els.empty.hidden = true;
    renderBreadcrumb();
    try {
      const items = await fetchFolder(path);
      if (token !== state.loadToken) return;   // تجاهل النتائج القديمة
      items.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name, 'ar');
      });
      state.currentItems = items;
      await renderItems(items);
    } catch (e) {
      if (token !== state.loadToken) return;
      els.errorBox.textContent = '⚠️ ' + e.message;
      els.errorBox.hidden = false;
    } finally {
      if (token === state.loadToken) els.loading.hidden = true;
    }
  }

  els.refreshBtn.addEventListener('click', () => {
    // مسح الـ cache
    state.cache = {};
    try { localStorage.removeItem('folder:' + state.currentPath[state.currentPath.length - 1].path); } catch (e) {}
    const c = state.currentPath[state.currentPath.length - 1];
    loadFolder(c.path);
  });

  els.homeBtn.addEventListener('click', () => {
    state.currentPath = [{ name: 'الرئيسية', path: FILES_FOLDER }];
    els.searchInput.value = '';
    loadFolder(FILES_FOLDER);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============ زر الأعلى ============
  let scrollRaf = false;
  window.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 300) els.backToTop.classList.add('visible');
      else els.backToTop.classList.remove('visible');
      scrollRaf = false;
    });
  }, { passive: true });
  els.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ============ الجدول ============
  async function initSchedule() {
    const data = await loadJSON('schedule.json');
    if (!data || !Array.isArray(data.items)) return;
    if (data.title) els.scheduleTitle.textContent = (data.emoji ? data.emoji + ' ' : '') + data.title;
    els.scheduleList.innerHTML = '';
    data.items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'schedule-item color-' + (item.color || 'blue');
      el.style.animationDelay = (i * .05) + 's';
      const day = document.createElement('div');
      day.className = 'schedule-day';
      day.textContent = item.day || '';
      const time = document.createElement('div');
      time.className = 'schedule-time';
      time.textContent = '🕐 ' + (item.time || '');
      el.appendChild(day);
      el.appendChild(time);
      if (item.label) {
        const l = document.createElement('div');
        l.className = 'schedule-label';
        l.textContent = item.label;
        el.appendChild(l);
      }
      els.scheduleList.appendChild(el);
    });
  }
  els.scheduleBtn.addEventListener('click', () => { els.scheduleModal.hidden = false; });
  els.scheduleModal.addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined ||
        e.target.classList.contains('modal-backdrop') ||
        e.target.classList.contains('modal-close')) {
      els.scheduleModal.hidden = true;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.scheduleModal.hidden) els.scheduleModal.hidden = true;
  });

  // ============ الصور ============
  async function initSubjects() {
    const data = await loadJSON('subjects.json');
    if (data && typeof data === 'object') state.subjects = data;
  }

  // ============ سنة الفوتر ============
  if (els.year) els.year.textContent = new Date().getFullYear();

  // ============ إخفاء شاشة التحميل ============
  function hideLoader() {
    setTimeout(() => { if (els.pageLoader) els.pageLoader.classList.add('hidden'); }, 500);
  }

  // ============ الصيانة ============
  function checkMaintenance() {
    if (window.MAINTENANCE_MODE === true) {
      document.body.classList.add('maintenance-active');
      els.maintenanceScreen.hidden = false;
      els.pageLoader.classList.add('hidden');
      return true;
    }
    return false;
  }

  // ============ الإقلاع ============
  async function init() {
    applyTheme();
    applySoundState();
    createParticles();
    if (checkMaintenance()) return;
    initNameFlow();
    initNotice();
    initTicker();
    initSubjects().then(() => loadFolder(FILES_FOLDER));
    initSchedule();
    hideLoader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();