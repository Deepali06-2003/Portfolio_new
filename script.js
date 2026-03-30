/* ═══════════════════════════════════════════
   AKS/SYS PORTFOLIO OS — script.js (macOS Edition)
═══════════════════════════════════════════ */

/* ══════════════════════════════════════
   MATRIX RAIN
══════════════════════════════════════ */
(function () {
  const cv = document.getElementById('matrix');
  const cx = cv.getContext('2d');
  let W, H, cols, drops;

  function init() {
    W = cv.width  = innerWidth;
    H = cv.height = innerHeight;
    cols  = Math.floor(W / 14);
    drops = Array(cols).fill(0);
  }

  function draw() {
    cx.fillStyle = 'rgba(13,17,23,0.05)';
    cx.fillRect(0, 0, W, H);
    cx.font = '12px IBM Plex Mono, monospace';
    const ch = '01アイウカキクサシスタチツナニヌハヒフヘホラリルレロ';
    drops.forEach((y, i) => {
      cx.globalAlpha = Math.random() * 0.35 + 0.05;
      cx.fillStyle   = Math.random() > 0.96 ? '#ff7b72' : '#7ee787';
      cx.fillText(ch[Math.floor(Math.random() * ch.length)], i * 14, y * 14);
      cx.globalAlpha = 1;
      if (y * 14 > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  init();
  window.addEventListener('resize', init);
  setInterval(draw, 50);
})();

/* ══════════════════════════════════════
   CLOCK (topbar + lock screen)
══════════════════════════════════════ */
function tick() {
  const n = new Date(), pad = v => String(v).padStart(2, '0');
  const ts = pad(n.getHours()) + ':' + pad(n.getMinutes());
  const el = document.getElementById('clock');
  if (el) el.textContent = ts;
}
tick();
setInterval(tick, 10000);

function updateLockClock() {
  const n = new Date(), pad = v => String(v).padStart(2, '0');
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const elC = document.getElementById('lock-clock');
  const elD = document.getElementById('lock-date');
  if (elC) elC.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes());
  if (elD) elD.textContent = days[n.getDay()] + ', ' + months[n.getMonth()] + ' ' + n.getDate();
}
updateLockClock();
setInterval(updateLockClock, 10000);

/* ══════════════════════════════════════
   SCREEN MANAGER
══════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s.id === id) s.classList.remove('gone');
    else s.classList.add('gone');
  });
}

/* ══════════════════════════════════════
   LOCK SCREEN INTERACTION
══════════════════════════════════════ */
(function () {
  const ls = document.getElementById('lockscreen');
  let startY = null, dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    ls.classList.add('sliding-up');
    setTimeout(() => {
      showScreen('granted');
      setTimeout(() => {
        showScreen('os');
        initOS();
      }, 1800);
    }, 700);
  }

  ls.addEventListener('click', dismiss);
  ls.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  ls.addEventListener('touchend', e => {
    if (startY === null) return;
    if (startY - e.changedTouches[0].clientY > 40) dismiss();
    startY = null;
  }, { passive: true });
  ls.addEventListener('mousedown', e => { startY = e.clientY; });
  window.addEventListener('mouseup', e => {
    if (startY === null) return;
    if (startY - e.clientY > 40) dismiss();
    startY = null;
  });
})();

/* ══════════════════════════════════════
   WINDOW MANAGER
══════════════════════════════════════ */

// Track all open windows
const openWindows = new Set();
const minimizedWindows = new Map(); // id -> original style backup
const maximizedWindows = new Set();

let zCounter = 100;

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // If minimized, restore it
  if (minimizedWindows.has(id)) {
    const saved = minimizedWindows.get(id);
    win.style.cssText = saved;
    win.style.display = 'flex';
    minimizedWindows.delete(id);
    win.classList.remove('minimized');
  } else {
    win.style.display = 'flex';
  }

  // Bring to front
  win.style.zIndex = ++zCounter;
  focusWindow(id);

  openWindows.add(id);
  updateDockDot(id, true);
  updateGreeting();

  // Bounce animation on re-open
  win.style.animation = 'none';
  requestAnimationFrame(() => {
    win.style.animation = '';
  });
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Quick fade out
  win.style.opacity = '0';
  win.style.transform = 'scale(0.9)';
  win.style.transition = 'opacity 0.18s ease, transform 0.18s ease';

  setTimeout(() => {
    win.style.display = 'none';
    win.style.opacity = '';
    win.style.transform = '';
    win.style.transition = '';
    openWindows.delete(id);
    minimizedWindows.delete(id);
    maximizedWindows.delete(id);
    updateDockDot(id, false);
    updateGreeting();
  }, 180);
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Save current style
  minimizedWindows.set(id, win.style.cssText);

  win.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  win.style.opacity = '0';
  win.style.transform = 'scale(0.65) translateY(80px)';

  setTimeout(() => {
    win.style.display = 'none';
    win.style.opacity = '';
    win.style.transform = '';
    win.style.transition = '';
  }, 250);

  // Still "running" — dot stays
  updateDockDot(id, openWindows.has(id));
  updateGreeting();
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (maximizedWindows.has(id)) {
    // Restore
    maximizedWindows.delete(id);
    win.classList.remove('maximized');
  } else {
    maximizedWindows.add(id);
    win.classList.add('maximized');
  }
}

function focusWindow(id) {
  document.querySelectorAll('.mac-window').forEach(w => w.classList.remove('focused'));
  const win = document.getElementById(id);
  if (win) win.classList.add('focused');
}

function updateDockDot(id, running) {
  const dot = document.getElementById('dot-' + id);
  if (dot) dot.classList.toggle('running', running);
}

function updateGreeting() {
  const greeting = document.getElementById('desktop-greeting');
  if (!greeting) return;
  // Count visible windows
  const anyVisible = [...openWindows].some(id => {
    const w = document.getElementById(id);
    return w && w.style.display !== 'none' && !minimizedWindows.has(id);
  });
  greeting.classList.toggle('hidden', anyVisible);
}

/* ══════════════════════════════════════
   WINDOW DRAGGING
══════════════════════════════════════ */
function makeDraggable(titlebar) {
  const win = titlebar.closest('.mac-window');
  const winId = win.id;
  let dragging = false, startX, startY, origLeft, origTop;

  titlebar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wc')) return; // don't drag on traffic lights
    if (maximizedWindows.has(winId)) return;       // don't drag maximized windows
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = win.getBoundingClientRect();
    origLeft = rect.left;
    origTop  = rect.top;
    win.style.zIndex = ++zCounter;
    focusWindow(winId);
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const desktop = document.getElementById('desktop');
    const dRect = desktop.getBoundingClientRect();
    const topbar = document.getElementById('topbar');
    const minTop = topbar ? topbar.offsetHeight : 28;
    const newLeft = Math.max(0, Math.min(origLeft + dx, dRect.width - win.offsetWidth));
    const newTop  = Math.max(minTop, Math.min(origTop + dy, dRect.height - 40));
    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });
}

/* ══════════════════════════════════════
   WINDOW RESIZING (bottom-right handle)
══════════════════════════════════════ */
function makeResizable(win) {
  const handle = document.createElement('div');
  handle.style.cssText = `
    position: absolute; bottom: 0; right: 0;
    width: 14px; height: 14px;
    cursor: se-resize; z-index: 10;
  `;
  win.appendChild(handle);

  let resizing = false, startX, startY, startW, startH;

  handle.addEventListener('mousedown', e => {
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const newW = Math.max(380, startW + (e.clientX - startX));
    const newH = Math.max(200, startH + (e.clientY - startY));
    win.style.width  = newW + 'px';
    win.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', () => { resizing = false; });
}

/* ══════════════════════════════════════
   TRAINING TABS (inside window)
══════════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById(btn.dataset.tab);
    if (pane) pane.classList.add('active');
  });
});

/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */
function doLogout() {
  // Close all windows with animation
  openWindows.forEach(id => {
    const win = document.getElementById(id);
    if (win) { win.style.opacity = '0'; win.style.transform = 'scale(0.8)'; win.style.transition = 'all 0.3s'; }
  });

  setTimeout(() => {
    location.reload();
  }, 500);
}
window.doLogout = doLogout;

/* ══════════════════════════════════════
   INIT OS
══════════════════════════════════════ */
function initOS() {
  // Make all windows draggable and resizable
  document.querySelectorAll('.mac-window').forEach(win => {
    const titlebar = win.querySelector('.win-titlebar');
    if (titlebar) makeDraggable(titlebar);
    makeResizable(win);

    // Focus on click anywhere in window
    win.addEventListener('mousedown', () => {
      win.style.zIndex = ++zCounter;
      focusWindow(win.id);
    });
  });

  // Auto-open Home window
  setTimeout(() => {
    openWindow('win-home');
  }, 100);

  // Expose openWindow globally (used in HTML onclick)
  window.openWindow = openWindow;
  window.closeWindow = closeWindow;
  window.minimizeWindow = minimizeWindow;
  window.maximizeWindow = maximizeWindow;
}
