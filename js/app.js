/* ============================================
   App — Core Logic, Home Page, Theme, Modals
   ============================================ */

let currentPage = 'home';
let currentTaskId = null;
let currentMrType = null;
let currentDailyType = null;
let uploadedImage = '';
let countdownTimer = null;

/* ---- Init ---- */
function init() {
  loadStore();
  initTheme();
  initAccent();
  applyI18n();
  renderHome();
  window.addEventListener('resize', updateTabIndicator);
}

/* ---- Theme ---- */
function initTheme() {
  const saved = localStorage.getItem('study-tracker-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('study-tracker-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M17.5 10.83A7.5 7.5 0 019.17 2.5a7.5 7.5 0 108.33 8.33z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
  } else {
    icon.innerHTML = '<circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
  }
}

/* ---- Accent Color Scheme ---- */
function initAccent() {
  const saved = localStorage.getItem('study-tracker-accent') || 'gold';
  document.documentElement.setAttribute('data-accent', saved);
}

function toggleAccent() {
  const current = document.documentElement.getAttribute('data-accent') || 'gold';
  const next = current === 'gold' ? 'neon' : 'gold';
  document.documentElement.setAttribute('data-accent', next);
  localStorage.setItem('study-tracker-accent', next);
}

/* ---- Navigation ---- */
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'home') {
    renderHome();
  } else if (page === 'detail') {
    applyI18n();
    renderDetail();
  }
}

/* ---- Home Page Render ---- */
function renderHome() {
  renderStats();
  renderTaskGrid();
  renderComeOn();
}

function renderStats() {
  const tasks = store.tasks;
  const active = tasks.filter(t => getTaskStatus(t) === 'inProgress').length;

  const stats = [
    { value: tasks.length, label: t('statTotal') },
    { value: active, label: t('statActive') }
  ];

  document.getElementById('statsRow').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');
}

function calculateInterruptedDays(task) {
  if (!task.startDate) return 0;
  const start = new Date(task.startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (start > today) return 0;

  const checked = new Set((task.daily && task.daily.checkinDates) ? task.daily.checkinDates : []);
  const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1; // inclusive
  let interrupted = 0;
  for (let i = 0; i < daysDiff; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!checked.has(dateStr)) interrupted++;
  }
  return interrupted;
}

function renderTaskGrid() {
  const grid = document.getElementById('taskGrid');
  const empty = document.getElementById('emptyState');

  if (store.tasks.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = store.tasks.map(task => {
    const status = getTaskStatus(task);
    const statusLabel = t(status);
    return `
      <div class="task-card" onclick="navigateToDetail('${task.id}')">
        <div class="task-card-top">
          <div class="task-card-name">${escapeHtml(task.name)}</div>
          <div class="task-card-actions" onclick="event.stopPropagation()">
            <button onclick="openTaskModal('${task.id}')" title="${t('editTask')}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10.5V12h1.5L10 5.5 8.5 4 2 10.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
            </button>
            <button class="del" onclick="confirmDeleteTask('${task.id}')" title="Delete">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div class="progress-wrap">
          <div class="progress-header">
            <span class="progress-label">${t('progress')}</span>
            <span class="progress-value">${task.progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${task.progress}%"></div>
          </div>
        </div>

        <div class="task-meta">
          <div class="task-meta-row checkin-row">
            <svg class="star-icon" width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 5.7l4-.6L7.5 1.5z"/></svg>
            <span class="streak-badge">${task.checkInDays} ${t('days')}</span>
            <span class="interrupt-separator">|</span>
            <span class="interrupt-dot" aria-hidden="true">🔴</span>
            <span class="interrupt-badge">${calculateInterruptedDays(task)} ${t('interruptedDays')}</span>
          </div>
          <div class="task-meta-row">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="3" width="11" height="10" rx="1" stroke="currentColor" stroke-width="1"/><path d="M2 6h11M5 1.5v3M10 1.5v3" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
            <span>${t('startDate')}:</span>
            <span class="meta-val">${formatDate(task.startDate)}</span>
          </div>
          <div class="task-meta-row">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1"/><path d="M7.5 4v3.5l2 1.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
            <span>${t('expectedDate')}:</span>
            <span class="meta-val">${formatDate(task.expectedDate)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function navigateToDetail(taskId) {
  currentTaskId = taskId;
  navigate('detail');
}

/* ---- Task Modal ---- */
function openTaskModal(taskId) {
  const modal = document.getElementById('taskModal');
  const title = document.getElementById('taskModalTitle');

  if (taskId) {
    const task = getTask(taskId);
    if (!task) return;
    title.textContent = t('editTask');
    document.getElementById('f_name').value = task.name;
    document.getElementById('f_startDate').value = task.startDate;
    document.getElementById('f_expectedDate').value = task.expectedDate;
    document.getElementById('f_examDate').value = task.exam.date;
    document.getElementById('f_examLocation').value = task.exam.location;
    document.getElementById('f_examCert').value = task.exam.certificate;
    currentTaskId = taskId;
  } else {
    title.textContent = t('addTask');
    document.getElementById('f_name').value = '';
    document.getElementById('f_startDate').value = todayStr();
    document.getElementById('f_expectedDate').value = '';
    document.getElementById('f_examDate').value = '';
    document.getElementById('f_examLocation').value = '';
    document.getElementById('f_examCert').value = '';
    currentTaskId = null;
  }

  // Update i18n for modal title if adding
  if (!taskId) title.setAttribute('data-i18n', 'addTask');
  else title.removeAttribute('data-i18n');

  modal.classList.add('active');
}

function saveTask() {
  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    showToast(t('toastFillRequired'), 'error');
    return;
  }

  const data = {
    name: name,
    startDate: document.getElementById('f_startDate').value,
    expectedDate: document.getElementById('f_expectedDate').value,
    examDate: document.getElementById('f_examDate').value,
    examLocation: document.getElementById('f_examLocation').value,
    examCert: document.getElementById('f_examCert').value,
  };

  if (currentTaskId) {
    updateTask(currentTaskId, data);
  } else {
    addTask(data);
  }

  closeModal('taskModal');
  showToast(t('toastSaveSuccess'), 'success');

  if (currentPage === 'home') renderHome();
  else if (currentPage === 'detail') renderDetail();
}

function confirmDeleteTask(taskId) {
  showConfirm(t('deleteConfirm'), () => {
    deleteTask(taskId);
    showToast(t('toastDeleteSuccess'), 'success');
    renderHome();
  });
}

/* ---- Modal Helpers ---- */
function closeModal(modalId, event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById(modalId).classList.remove('active');
}

function showConfirm(text, onConfirm) {
  document.getElementById('confirmText').textContent = text;
  const btn = document.getElementById('confirmOkBtn');
  // Clone to remove old listeners
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    closeModal('confirmModal');
    onConfirm();
  });
  document.getElementById('confirmModal').classList.add('active');
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + (type || '');
  setTimeout(() => {
    toast.className = 'toast ' + (type || '');
  }, 2500);
}

/* ---- Image Upload Preview ---- */
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedImage = e.target.result;
    const preview = document.getElementById('uploadPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

/* ---- Image Viewer ---- */
function viewImage(src) {
  let viewer = document.getElementById('imageViewer');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'imageViewer';
    viewer.className = 'image-viewer';
    viewer.onclick = () => viewer.classList.remove('active');
    viewer.innerHTML = '<img>';
    document.body.appendChild(viewer);
  }
  viewer.querySelector('img').src = src;
  viewer.classList.add('active');
}

/* ---- Come On Notepad ---- */
function renderComeOn() {
  const body = document.getElementById('comeOnBody');
  if (!body) return;
  const data = (store && store.comeOn) || { images: [], messages: [] };
  const images = data.images || [];
  const messages = data.messages || [];

  if (images.length === 0 && messages.length === 0) {
    body.innerHTML = `<div class="come-on-empty">${t('comeOnEmpty')}</div>`;
    return;
  }

  let html = '';

  if (images.length > 0) {
    html += `<div class="come-on-section-label">${t('comeOnUploadImage')} · ${images.length}</div>`;
    html += '<div class="come-on-image-grid">';
    images.forEach(img => {
      html += `
        <div class="come-on-image" onclick="viewImage(this.querySelector('img').src)">
          <img src="${img.dataUrl}" alt="${escapeHtml(img.name || '')}" loading="lazy">
          <button class="come-on-image-del" onclick="event.stopPropagation();confirmDeleteComeOnImage('${img.id}')" title="${t('comeOnDeleteImage')}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      `;
    });
    html += '</div>';
  }

  if (messages.length > 0) {
    html += `<div class="come-on-section-label">${t('comeOnTitle')} · ${messages.length}</div>`;
    messages.forEach(msg => {
      html += `
        <div class="come-on-message">
          ${escapeHtml(msg.text)}
          <button class="come-on-message-del" onclick="confirmDeleteComeOnMessage('${msg.id}')" title="${t('comeOnDeleteMessage')}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4h6M4.5 4V2.5h3V4M4 4l.4 6h3.2L7 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      `;
    });
  }

  body.innerHTML = html;
}

function submitComeOnMessage() {
  const input = document.getElementById('comeOnInput');
  const text = (input.value || '').trim();
  if (!text) return;
  addComeOnMessage(text);
  input.value = '';
  renderComeOn();
  showToast(t('toastSaveSuccess'), 'success');
}

function handleComeOnImages(input) {
  const files = Array.from(input.files || []);
  if (files.length === 0) return;

  let remaining = files.length;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      addComeOnImage(e.target.result, file.name);
      remaining--;
      if (remaining === 0) {
        input.value = '';
        renderComeOn();
        showToast(t('toastSaveSuccess'), 'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

function confirmDeleteComeOnImage(id) {
  showConfirm(t('comeOnDeleteImage') + '?', () => {
    deleteComeOnImage(id);
    renderComeOn();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function confirmDeleteComeOnMessage(id) {
  showConfirm(t('comeOnDeleteMessage') + '?', () => {
    deleteComeOnMessage(id);
    renderComeOn();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function confirmClearComeOn() {
  showConfirm(t('comeOnClearConfirm'), () => {
    clearComeOn();
    renderComeOn();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

/* ---- Escape HTML ---- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---- Start ---- */
init();
