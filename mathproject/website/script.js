/* ============================================
   مكتبة الرياضيات — الأكواد الرئيسية
   ============================================ */

(function () {
  'use strict';

  // ============ الإعدادات ============
  const GITHUB_USER = 'mo2xo';
  const GITHUB_REPO = 'math.2027';
  const GITHUB_BRANCH = 'main';
  const FILES_FOLDER = 'files';
  const MAX_PARTICLES_MOBILE = 14;
  const MAX_PARTICLES_DESKTOP = 35;

  // ============ الحالة العامة ============
  const state = {
    currentPath: [{ name: 'الرئيسية', path: FILES_FOLDER }],
    currentItems: [],
    subjects: {},
    audioCtx: null,
    soundEnabled: localStorage.getItem('soundEnabled') !== 'off',
    theme: localStorage.getItem('theme') || 'dark',
    studentName: localStorage.getItem('studentName') || '',
    lastLoadedPath: ''
  };

  // ============ العناصر ============
  const $ = (id) => document.getElementById(id);
  const els = {
    pageLoader: $('pageLoader'),
    nameOverlay: $('nameOverlay'),
    nameInput: $('nameInput'),
    nameSubmit: $('nameSubmit'),
    nameError: $('nameError'),
    maintenanceScreen: $('maintenanceScreen'),
    noticeBar: $('noticeBar'),
    noticeEmoji: $('noticeEmoji'),
    noticeText: $('noticeText'),
    tickerContent: $('tickerContent'),
    bgImage: $('bgImage'),
    particles: $('particles'),
    themeToggle: $('themeToggle'),
    soundToggle: $('soundToggle'),
    backToTop: $('backToTop'),
    homeBtn: $('homeBtn'),
    greeting: $('greeting'),
    greetingText: $('greetingText'),
    scheduleBtn: $('scheduleBtn'),
    errorBox: $('errorBox'),
    searchInput: $('searchInput'),
    refreshBtn: $('refreshBtn'),
    breadcrumb: $('breadcrumb'),
    content: $('content'),
    loading: $('loading'),
    empty: $('empty'),
    scheduleModal: $('scheduleModal'),
    scheduleTitle: $('scheduleTitle'),
    scheduleList: $('scheduleList')
  };

  // ============ الأصوات ============
  function initAudio() {
    if (!state.audioCtx) {
      try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { state.audioCtx = null; }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playTone(freq, duration, type, volume, endFreq) {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, state.audioCtx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume || 0.12, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start(state.audioCtx.currentTime);
      osc.stop(state.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function sndClick() {
    playTone(680, 0.08, 'sine', 0.1, 480);
  }
  function sndSuccess() {
    playTone(660, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.12), 90);
  }

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
    initAudio();
    sndClick();
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme();
  });

  // ============ الأصوات (تفعيل/إيقاف) ============
  function applySoundState() {
    els.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
  }

  els.soundToggle.addEventListener('click', () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('soundEnabled', state.soundEnabled ? 'on' : 'off');
    applySoundState();
    if (state.soundEnabled) sndClick();
  });

  // ============ أصوات النقر العام ============
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .card, a, .header-btn, .control-btn, .float-btn, .wa-btn, .modal-close');
    if (target) {
      initAudio();
      if (state.soundEnabled) sndClick();
    }
  }, { passive: true });

  // ============ الخلفية والجزيئات ============
  function createParticles() {
    if (!els.particles) return;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      const dur = 12 + Math.random() * 14;
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = (Math.random() * -dur) + 's';
      const size = 1 + Math.random() * 2.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
      frag.appendChild(p);
    }
    els.particles.appendChild(frag);
  }

  // ============ تحميل ملفات JSON ============
  async function loadJSON(path) {
    try {
      const res = await fetch(path + '?t=' + Date.now());
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ============ الإشعار العلوي ============
  async function initNotice() {
    const data = await loadJSON('notice.json');
    if (!data || data.active !== true) {
      els.noticeBar.hidden = true;
      return;
    }
    const color = data.color || 'green';
    els.noticeBar.className = 'notice-bar color-' + color;
    els.noticeEmoji.textContent = data.emoji || '🌟';
    els.noticeText.textContent = data.text || '';
    els.noticeBar.hidden = false;
  }

  // ============ شريط الإعلانات ============
  async function initTicker() {
    const data = await loadJSON('messages.json');
    if (!data || !Array.isArray(data.messages) || !data.messages.length) return;

    const defaultColor = data.defaultColor || 'green';
    const items = data.messages;
    // نكرر القائمة مرتين للحركة المستمرة
    const doubled = [...items, ...items];

    const frag = document.createDocumentFragment();
    doubled.forEach((msg) => {
      const span = document.createElement('span');
      let text = '', color = defaultColor;
      if (typeof msg === 'string') {
        text = msg;
      } else if (msg && typeof msg === 'object') {
        text = msg.text || '';
        color = msg.color || defaultColor;
      }
      // استخراج الإيموجي الأول (إن وجد)
      const match = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u);
      let emoji = '';
      let rest = text;
      if (match) { emoji = match[1]; rest = match[2]; }

      if (emoji) {
        const em = document.createElement('span');
        em.className = 'tk-emoji';
        em.textContent = emoji;
        span.appendChild(em);
      }
      const txt = document.createElement('span');
      txt.textContent = rest;
      if (color && color !== 'green') {
        txt.style.color = colorToCss(color);
      }
      span.appendChild(txt);
      frag.appendChild(span);
    });
    els.tickerContent.innerHTML = '';
    els.tickerContent.appendChild(frag);
  }

  function colorToCss(c) {
    const map = {
      green: '#22c55e', red: '#ef4444', blue: '#3b82f6',
      yellow: '#fbbf24', orange: '#f97316', purple: '#a855f7', gray: '#64748b'
    };
    return map[c] || 'inherit';
  }

  // ============ اسم الطالب والترحيب ============
  function initNameFlow() {
    if (state.studentName) {
      // الطالب أدخل اسمه سابقًا
      els.nameOverlay.hidden = true;
      showGreeting();
    } else {
      els.nameOverlay.hidden = false;
      setTimeout(() => els.nameInput && els.nameInput.focus(), 300);
    }
  }

  function submitName() {
    const val = (els.nameInput.value || '').trim();
    if (val.length < 2) {
      els.nameError.textContent = 'الاسم قصير جدًا';
      els.nameInput.focus();
      return;
    }
    state.studentName = val;
    localStorage.setItem('studentName', val);
    els.nameError.textContent = '';
    els.nameOverlay.hidden = true;
    initAudio();
    sndSuccess();
    showGreeting();
  }

  els.nameSubmit.addEventListener('click', submitName);
  els.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitName();
  });
  els.nameInput.addEventListener('input', () => { els.nameError.textContent = ''; });

  function showGreeting() {
    if (!state.studentName) return;
    const hour = new Date().getHours();
    let greeting = '';
    if (hour >= 5 && hour < 12) greeting = 'صباح الخير';
    else if (hour >= 12 && hour < 17) greeting = 'نهارك سعيد';
    else if (hour >= 17 && hour < 21) greeting = 'مساء الخير';
    else greeting = 'سهرة موفقة';
    els.greetingText.textContent = '🌟 ' + greeting + ' يا ' + state.studentName;
    els.greeting.hidden = false;
  }

  // ============ جلب مجلد من GitHub ============
  async function fetchFolder(path) {
    const url = 'https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO +
                '/contents/' + path + '?ref=' + GITHUB_BRANCH;
    const res = await fetch(url);
    if (res.status === 404) throw new Error('المجلد غير موجود');
    if (res.status === 403) throw new Error('تجاوزت الحد المسموح، انتظر قليلًا');
    if (!res.ok) throw new Error('فشل الاتصال بالخادم (' + res.status + ')');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // ============ مسار التنقل ============
  function renderBreadcrumb() {
    els.breadcrumb.innerHTML = '';
    state.currentPath.forEach((item, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '›';
        els.breadcrumb.appendChild(sep);
      }
      const span = document.createElement('span');
      span.textContent = item.name;
      span.onclick = () => {
        if (i === state.currentPath.length - 1) return;
        state.currentPath = state.currentPath.slice(0, i + 1);
        loadFolder(item.path);
      };
      els.breadcrumb.appendChild(span);
    });
  }

  // ============ أدوات الملفات ============
  function formatSize(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, size = parseInt(bytes, 10);
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(1) + ' ' + units[i];
  }

  function getIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return '🖼️';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return '🎵';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
    return '📎';
  }

  function getDownloadUrl(path) {
    return 'https://raw.githubusercontent.com/' + GITHUB_USER + '/' + GITHUB_REPO +
           '/' + GITHUB_BRANCH + '/' + encodeURI(path);
  }

  // ============ عرض العناصر ============
  function renderItems(items) {
    els.content.innerHTML = '';
    if (!items.length) {
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;

    const frag = document.createDocumentFragment();
    items.forEach((file, idx) => {
      const isFolder = file.type === 'dir';
      const card = document.createElement('div');
      card.className = 'card' + (isFolder ? ' folder-card' : '');
      card.style.animationDelay = Math.min(idx * 0.03, 0.6) + 's';

      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = isFolder ? '📁' : getIcon(file.name);

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = file.name;

      const meta = document.createElement('div');
      meta.className = 'meta';
      if (isFolder) {
        meta.textContent = '📂 مجلد';
      } else if (file.size) {
        meta.textContent = '💾 ' + formatSize(file.size);
      } else {
        meta.textContent = '📄 ملف';
      }

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (isFolder) {
        card.addEventListener('click', () => {
          state.currentPath.push({ name: file.name, path: file.path });
          loadFolder(file.path);
        });
      } else {
        const a = document.createElement('a');
        a.href = getDownloadUrl(file.path);
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('download', file.name);
        a.textContent = '⬇️ تنزيل';
        actions.appendChild(a);
      }

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(actions);
      frag.appendChild(card);
    });

    els.content.appendChild(frag);
  }

  // ============ البحث ============
  function filterItems() {
    const q = (els.searchInput.value || '').trim().toLowerCase();
    if (!q) { renderItems(state.currentItems); return; }
    const filtered = state.currentItems.filter(f =>
      f.name.toLowerCase().includes(q)
    );
    renderItems(filtered);
  }
  els.searchInput.addEventListener('input', filterItems);

  // ============ تحميل المجلد ============
  async function loadFolder(path) {
    els.errorBox.hidden = true;
    els.loading.hidden = false;
    els.content.innerHTML = '';
    els.empty.hidden = true;
    renderBreadcrumb();

    try {
      const items = await fetchFolder(path);
      items.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name, 'ar');
      });
      state.currentItems = items;
      state.lastLoadedPath = path;
      renderItems(items);
    } catch (e) {
      els.errorBox.textContent = '⚠️ ' + e.message;
      els.errorBox.hidden = false;
    } finally {
      els.loading.hidden = true;
    }
  }

  // ============ زر التحديث ============
  els.refreshBtn.addEventListener('click', () => {
    const current = state.currentPath[state.currentPath.length - 1];
    loadFolder(current.path);
  });

  // ============ زر الرئيسية ============
  els.homeBtn.addEventListener('click', () => {
    state.currentPath = [{ name: 'الرئيسية', path: FILES_FOLDER }];
    els.searchInput.value = '';
    loadFolder(FILES_FOLDER);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============ زر العودة للأعلى ============
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

  els.backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============ جدول المواعيد ============
  async function initSchedule() {
    const data = await loadJSON('schedule.json');
    if (!data || !Array.isArray(data.items)) return;

    if (data.title) els.scheduleTitle.textContent = (data.emoji ? data.emoji + ' ' : '') + data.title;

    els.scheduleList.innerHTML = '';
    data.items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'schedule-item color-' + (item.color || 'blue');
      el.style.animationDelay = (i * 0.05) + 's';

      const day = document.createElement('div');
      day.className = 'schedule-day';
      day.textContent = item.day || '';

      const time = document.createElement('div');
      time.className = 'schedule-time';
      time.textContent = '🕐 ' + (item.time || '');

      el.appendChild(day);
      el.appendChild(time);

      if (item.label) {
        const label = document.createElement('div');
        label.className = 'schedule-label';
        label.textContent = item.label;
        el.appendChild(label);
      }

      els.scheduleList.appendChild(el);
    });
  }

  // ============ فتح/إغلاق نافذة المواعيد ============
  els.scheduleBtn.addEventListener('click', () => {
    els.scheduleModal.hidden = false;
  });

  els.scheduleModal.addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined || e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
      els.scheduleModal.hidden = true;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.scheduleModal.hidden) {
      els.scheduleModal.hidden = true;
    }
  });

  // ============ صورة الخلفية (اختيارية) ============
  function tryLoadBackground() {
    const img = new Image();
    img.onload = () => els.bgImage.classList.add('loaded');
    img.onerror = () => {};
    img.src = '../assets/background.jpg';
    els.bgImage.style.backgroundImage = "url('../assets/background.jpg')";
  }

  // ============ إخفاء شاشة التحميل ============
  function hideLoader() {
    setTimeout(() => {
      if (els.pageLoader) els.pageLoader.classList.add('hidden');
    }, 500);
  }

  // ============ وضع الصيانة ============
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
    // تفعيل الثيم
    applyTheme();
    applySoundState();

    // إنشاء الجزيئات
    createParticles();

    // محاولة تحميل الخلفية (اختيارية)
    tryLoadBackground();

    // وضع الصيانة
    if (checkMaintenance()) return;

    // تدفق الاسم (قبل البقية لتظهر سريعًا)
    initNameFlow();

    // تحميل الإشعار + الشريط + الجدول (بالتوازي)
    Promise.all([initNotice(), initTicker(), initSchedule()]).catch(() => {});

    // تحميل الملفات
    await loadFolder(FILES_FOLDER);

    // إخفاء شاشة التحميل
    hideLoader();
  }

  // تشغيل
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();