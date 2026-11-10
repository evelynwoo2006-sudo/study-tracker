/* ============================================
   Detail — Task Detail Page Logic
   Tabs: Exam / Daily Check-in / Mistakes & Reflection / Review
   ============================================ */

let activeTab = 'exam';

/* ---- Render Detail Page ---- */
function renderDetail() {
  const task = getTask(currentTaskId);
  if (!task) {
    navigate('home');
    return;
  }

  // Header
  document.getElementById('detailTaskName').textContent = task.name;
  const status = getTaskStatus(task);
  const statusLabel = t(status);
  document.getElementById('detailMeta').innerHTML = `
    <span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.7 3.4 3.8.6-2.7 2.7.6 3.8L7 9.7 3.6 11.5l.6-3.8L1.5 5l3.8-.6L7 1z" stroke="currentColor" stroke-width="1"/></svg>
      ${task.checkInDays} ${t('days')}
    </span>
    <span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1"/><path d="M5 7l2 2 3-3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${task.progress}%
    </span>
    <span>· ${statusLabel}</span>
  `;

  // Render all tabs
  renderExamTab(task);
  renderDailyTab(task);
  renderMistakesTab(task);
  renderReviewTab(task);

  // Set active tab
  switchTab(activeTab);
}

/* ---- Tab Switching ---- */
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === 'tab-' + tab);
  });
  updateTabIndicator();

  // Start/stop countdown
  if (tab === 'exam') {
    startCountdown();
  } else {
    stopCountdown();
  }
}

function updateTabIndicator() {
  const activeBtn = document.querySelector('.tab-btn.active');
  const indicator = document.getElementById('tabIndicator');
  if (activeBtn && indicator) {
    indicator.style.width = activeBtn.offsetWidth + 'px';
    indicator.style.left = activeBtn.offsetLeft + 'px';
  }
}

/* ---- Exam Tab ---- */
function renderExamTab(task) {
  const exam = task.exam;

  // Hero (countdown)
  if (exam.date) {
    document.getElementById('examHero').innerHTML = `
      <div class="exam-hero-label">${t('examCountdown')}</div>
      <div class="exam-countdown" id="countdownDisplay">--</div>
      <div class="exam-date-text">${formatDateTime(exam.date)}</div>
    `;
  } else {
    document.getElementById('examHero').innerHTML = `
      <div class="exam-hero-label">${t('examCountdown')}</div>
      <div class="exam-countdown" style="font-size:28px;">${t('noExamDate')}</div>
      <div class="exam-date-text">${t('examDate')}: ${t('notSet')}</div>
    `;
  }

  // Info cards
  const infoCards = [
    {
      icon: '<rect x="2" y="3" width="11" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M2 6h11M5 1.5v3M10 1.5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
      label: t('examDate'),
      value: exam.date ? formatDateTime(exam.date) : t('notSet')
    },
    {
      icon: '<path d="M7 1C4.8 1 3 2.8 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.2-1.8-4-4-4z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="5" r="1.5" stroke="currentColor" stroke-width="1.2"/>',
      label: t('examLocation'),
      value: exam.location || t('notSet')
    },
    {
      icon: '<rect x="2" y="2" width="11" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="6.5" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M5 11l-1 2.5h7L10 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
      label: t('examCert'),
      value: exam.certificate || t('notSet')
    },
    {
      icon: '<circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M7.5 4v3.5l2 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
      label: t('expectedDate'),
      value: formatDate(task.expectedDate)
    }
  ];

  document.getElementById('examInfoGrid').innerHTML = infoCards.map(c => `
    <div class="exam-info-card">
      <div class="exam-info-icon">
        <svg width="22" height="22" viewBox="0 0 15 15" fill="none">${c.icon}</svg>
      </div>
      <div class="exam-info-content">
        <div class="exam-info-label">${c.label}</div>
        <div class="exam-info-value">${escapeHtml(c.value)}</div>
      </div>
    </div>
  `).join('');
}

/* ---- Countdown Timer ---- */
function startCountdown() {
  stopCountdown();
  const task = getTask(currentTaskId);
  if (!task || !task.exam.date) return;

  function update() {
    const examDate = new Date(task.exam.date);
    const now = new Date();
    const diff = examDate - now;

    const display = document.getElementById('countdownDisplay');
    if (!display) {
      stopCountdown();
      return;
    }

    if (diff <= 0) {
      display.innerHTML = `<span style="font-size:28px;">${t('examPassed')}</span>`;
      stopCountdown();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    display.innerHTML = `
      ${days}<span class="exam-countdown-unit">${t('daysLeft')}</span>
      ${String(hours).padStart(2, '0')}<span class="exam-countdown-unit">${t('hoursLeft')}</span>
      ${String(mins).padStart(2, '0')}<span class="exam-countdown-unit">${t('minsLeft')}</span>
      ${String(secs).padStart(2, '0')}<span class="exam-countdown-unit">${t('secsLeft')}</span>
    `;
  }

  update();
  countdownTimer = setInterval(update, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

/* ---- Daily Check-in Tab ---- */
function renderDailyTab(task) {
  ensureSpellingData(task);
  const sections = [
    {
      type: 'textbooks',
      title: t('textbook'),
      icon: '<path d="M2.5 2.5h4.5a2 2 0 012 2v8a1.5 1.5 0 00-1.5-1.5H2.5v-8.5z" stroke="currentColor" stroke-width="1.2"/><path d="M12.5 2.5H8a2 2 0 00-2 2v8a1.5 1.5 0 011.5-1.5h5v-8.5z" stroke="currentColor" stroke-width="1.2"/>',
      items: task.daily.textbooks,
      isTextbook: true
    },
    {
      type: 'spelling',
      title: t('spellingTitle'),
      subtitle: t('spellingSubtitle'),
      isSpelling: true
    },
    {
      type: 'words',
      title: t('wordCheckin'),
      icon: '<path d="M3 3h9v9H3z" stroke="currentColor" stroke-width="1.2"/><path d="M3 6h9M6 3v9" stroke="currentColor" stroke-width="1.2"/>',
      items: task.daily.words,
      showCount: true
    },
    {
      type: 'questions',
      title: t('questionCheckin'),
      icon: '<path d="M7.5 1.5a4 4 0 00-4 4c0 1.5.5 2.5 1.5 3v2h5v-2c1-.5 1.5-1.5 1.5-3a4 4 0 00-4-4z" stroke="currentColor" stroke-width="1.2"/><path d="M5 12.5h5M6 14.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
      items: task.daily.questions,
      showCount: true
    }
  ];

  document.getElementById('dailySections').innerHTML = sections.map(s => {
    if (s.isTextbook) {
      return renderTextbookSection(s, task);
    }
    if (s.isSpelling) {
      return renderSpellingEntry(task);
    }
    const totalCount = s.items.length;
    return `
      <div class="daily-card ${s.type}-card">
        <div class="daily-card-header">
          <div class="daily-card-title">
            <div class="daily-card-title-icon">
              <svg width="18" height="18" viewBox="0 0 15 15" fill="none">${s.icon}</svg>
            </div>
            ${s.title}
          </div>
          <div class="daily-card-stat">
            ${t('totalCheckins')} <strong>${totalCount}</strong> ${t('times')}
          </div>
        </div>
        <div class="daily-card-body">
          <button class="checkin-btn" onclick="openDailyModal('${s.type}')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            ${t('checkIn')}
          </button>
          <div class="checkin-list">
            ${s.items.length === 0
              ? `<div class="mr-empty">${t('noCheckins')}</div>`
              : s.items.map(item => `
                <div class="checkin-item">
                  <span class="checkin-item-date">${formatRelativeDate(item.date)}</span>
                  <span class="checkin-item-content">${escapeHtml(item.text || '—')}</span>
                  ${s.showCount ? `<span class="checkin-item-count">${item.count || 1}</span>` : ''}
                  <button class="checkin-item-del" onclick="confirmDeleteCheckin('${s.type}', '${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTextbookSection(s, task) {
  return `
    <div class="daily-card textbook-card">
      <div class="daily-card-header">
        <div class="daily-card-title">
          <div class="daily-card-title-icon">
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">${s.icon}</svg>
          </div>
          ${s.title}
        </div>
        <button class="btn-small" onclick="openTextbookModal()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          ${t('upload')}
        </button>
      </div>
      <div class="daily-card-body">
        ${s.items.length === 0
          ? `<div class="mr-empty">${t('noTextbook')}</div>`
          : `<div class="textbook-list">${s.items.map(book => `
              <div class="textbook-item">
                <div class="textbook-icon">
                  <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M2.5 2.5h4.5a2 2 0 012 2v8a1.5 1.5 0 00-1.5-1.5H2.5v-8.5z" stroke="currentColor" stroke-width="1.2"/><path d="M12.5 2.5H8a2 2 0 00-2 2v8a1.5 1.5 0 011.5-1.5h5v-8.5z" stroke="currentColor" stroke-width="1.2"/></svg>
                </div>
                <div class="textbook-info">
                  <div class="textbook-name">${escapeHtml(book.name)}</div>
                  <div class="textbook-meta">${escapeHtml(book.fileName || '')} · ${formatFileSize(book.size)}</div>
                </div>
                ${book.dataUrl
                  ? `<a href="${book.dataUrl}" download="${escapeHtml(book.fileName)}" class="btn-small">${t('open')}</a>`
                  : ''
                }
                <button class="checkin-item-del" onclick="confirmDeleteTextbook('${book.id}')">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            `).join('')}</div>`
        }
      </div>
    </div>
  `;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderSpellingEntry(task) {
  const chapters = (task.spelling && task.spelling.chapters) || [];
  const wrongWords = (task.spelling && task.spelling.wrongWords) || [];
  const totalWords = chapters.reduce((sum, c) => sum + (c.words ? c.words.length : 0), 0);
  return `
    <div class="daily-card spelling-card">
      <div class="daily-card-header">
        <div class="daily-card-title">
          <div class="daily-card-title-icon spelling-icon">
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5h10M2.5 4.5h10M2.5 10.5h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div>${t('spellingTitle')}</div>
            <div class="daily-card-subtitle">${t('spellingSubtitle')}</div>
          </div>
        </div>
        <div class="daily-card-stat">
          ${t('spellingChapter')} <strong>${chapters.length}</strong> · ${t('wordCount')} <strong>${totalWords}</strong> · ${t('wordbookTitle')} <strong>${wrongWords.length}</strong>
        </div>
      </div>
      <div class="daily-card-body">
        <div class="spelling-entry-actions">
          <button class="checkin-btn" onclick="openSpellingModal()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            ${t('spellingStart')}
          </button>
          <button class="btn-ghost" onclick="openSpellingManageModal()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5v11M2.5 8h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            ${t('spellingManage')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ---- Daily Check-in Modal ---- */
function openDailyModal(type) {
  currentDailyType = type;
  const titleEl = document.getElementById('dailyModalTitle');
  const labelEl = document.getElementById('dailyModalLabel');
  const titleMap = {
    'words': t('wordCheckin'),
    'questions': t('questionCheckin')
  };
  titleEl.textContent = titleMap[type] || t('checkIn');
  labelEl.textContent = t('textContent');

  document.getElementById('f_dailyText').value = '';
  document.getElementById('f_dailyCount').value = '1';
  document.getElementById('dailyModal').classList.add('active');
}

function saveDailyCheckin() {
  const text = document.getElementById('f_dailyText').value.trim();
  const count = parseInt(document.getElementById('f_dailyCount').value) || 1;

  addCheckin(currentTaskId, currentDailyType, text, count);
  closeModal('dailyModal');
  showToast(t('toastCheckinSuccess'), 'success');
  renderDetail();
}

function confirmDeleteCheckin(type, checkinId) {
  showConfirm(t('deleteCheckinConfirm'), () => {
    deleteCheckin(currentTaskId, type, checkinId);
    showToast(t('toastDeleteSuccess'), 'success');
    renderDetail();
  });
}

/* ---- Textbook Modal ---- */
function openTextbookModal() {
  document.getElementById('f_textbookName').value = '';
  document.getElementById('f_textbookFile').value = '';
  document.getElementById('textbookModal').classList.add('active');
}

function saveTextbook() {
  const name = document.getElementById('f_textbookName').value.trim();
  const fileInput = document.getElementById('f_textbookFile');
  const file = fileInput.files[0];

  if (!name || !file) {
    showToast(t('toastFillTextbook'), 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    addTextbook(currentTaskId, name, {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: e.target.result
    });
    closeModal('textbookModal');
    showToast(t('toastUploadSuccess'), 'success');
    renderDetail();
  };
  reader.readAsDataURL(file);
}

function confirmDeleteTextbook(textbookId) {
  showConfirm(t('deleteTextbookConfirm'), () => {
    deleteTextbook(currentTaskId, textbookId);
    showToast(t('toastDeleteSuccess'), 'success');
    renderDetail();
  });
}

/* ---- Mistakes & Reflection Tab ---- */
function renderMistakesTab(task) {
  ensureSpellingData(task);

  // Mistakes
  const mistakeList = document.getElementById('mistakeList');
  mistakeList.innerHTML = task.mistakes.length === 0
    ? `<div class="mr-empty">${t('noRecords')}</div>`
    : task.mistakes.map(m => renderMrCard(m, 'mistake')).join('');

  // Wordbook (replaces reflections)
  renderWordbook(task);
}

function renderWordbook(task) {
  const list = document.getElementById('wordbookList');
  if (!list) return;
  const wrongWords = (task.spelling && task.spelling.wrongWords) || [];

  if (wrongWords.length === 0) {
    list.innerHTML = `<div class="mr-empty">${t('wordbookEmpty')}</div>`;
    return;
  }

  list.innerHTML = wrongWords.map(w => `
    <div class="wordbook-item">
      <div class="wordbook-info">
        <div class="wordbook-en">${escapeHtml(w.en)}</div>
        <div class="wordbook-cn">${escapeHtml(w.cn)}</div>
        <div class="wordbook-meta">
          ${t('wordbookCorrectCount').replace('{{count}}', w.correctCount || 0)} ·
          ${t('wordbookTotalAttempts').replace('{{count}}', w.totalAttempts || 0)}
        </div>
      </div>
      <div class="wordbook-actions">
        <button class="btn-small" onclick="spellWordbookWord('${w.id}')">${t('wordbookSpell')}</button>
        <button class="btn-small btn-danger" onclick="confirmRemoveWordbookWord('${w.id}')">${t('wordbookRemove')}</button>
      </div>
    </div>
  `).join('');
}

function renderMrCard(item, type) {
  return `
    <div class="mr-card">
      ${item.image ? `<img class="mr-card-image" src="${item.image}" onclick="viewImage(this.src)" alt="screenshot">` : ''}
      ${item.text ? `<div class="mr-card-text">${escapeHtml(item.text)}</div>` : ''}
      <div class="mr-card-footer">
        <span class="mr-card-date">${formatRelativeDate(item.date)}</span>
        <button class="mr-card-del" onclick="confirmDeleteMr('${type}', '${item.id}')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `;
}

/* ---- Mistake/Reflection Modal ---- */
function openMistakeModal(type) {
  currentMrType = type;
  uploadedImage = '';

  const titleEl = document.getElementById('mistakeModalTitle');
  titleEl.textContent = type === 'mistake' ? t('mistakesTitle') + ' — ' + t('add') : t('reflectionTitle') + ' — ' + t('add');

  document.getElementById('f_mrText').value = '';
  document.getElementById('f_mrImage').value = '';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';

  document.getElementById('mistakeModal').classList.add('active');
}

function saveMistakeOrReflection() {
  const text = document.getElementById('f_mrText').value.trim();

  addMistakeOrReflection(currentTaskId, currentMrType, text, uploadedImage);
  closeModal('mistakeModal');
  showToast(t('toastSaveSuccess'), 'success');
  renderDetail();
}

function confirmDeleteMr(type, entryId) {
  showConfirm(t('deleteMrConfirm'), () => {
    deleteMistakeOrReflection(currentTaskId, type, entryId);
    showToast(t('toastDeleteSuccess'), 'success');
    renderDetail();
  });
}

/* ============================================
   Review Tab — OCR + Word Review + New Words
   ============================================ */

let currentReviewWords = [];
let currentReviewIndex = 0;
let currentReviewKnown = 0;
let currentReviewUnknown = [];
let currentReviewImage = '';
let tesseractWorker = null;

function renderReviewTab(task) {
  ensureReviewData(task);
  renderNewWordsList(task);
  // Reset upload preview if no active session
  if (!document.getElementById('reviewSessionStep').classList.contains('active') &&
      !document.getElementById('reviewSummaryStep').classList.contains('active')) {
    showReviewStep('upload');
  }
}

function showReviewStep(step) {
  document.getElementById('reviewUploadStep').style.display = step === 'upload' ? 'block' : 'none';
  document.getElementById('reviewSessionStep').style.display = step === 'session' ? 'block' : 'none';
  document.getElementById('reviewSummaryStep').style.display = step === 'summary' ? 'block' : 'none';
}

function previewReviewImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    currentReviewImage = e.target.result;
    document.getElementById('reviewUploadPreview').src = currentReviewImage;
    document.getElementById('reviewUploadPreview').style.display = 'block';
    document.getElementById('reviewUploadPlaceholder').style.display = 'none';
    document.getElementById('startOcrBtn').disabled = false;
    document.getElementById('recognizedWordTags').innerHTML = '';
    document.getElementById('reviewRecognizedWords').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function runOcr() {
  if (!currentReviewImage) {
    showToast(t('emptyWordList'), 'error');
    return;
  }
  const btn = document.getElementById('startOcrBtn');
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span>${t('ocrProcessing')}</span>`;

  try {
    if (!tesseractWorker) {
      tesseractWorker = await Tesseract.createWorker('eng');
    }
    const result = await tesseractWorker.recognize(currentReviewImage);
    const text = result.data.text || '';
    const words = extractWords(text);

    if (words.length === 0) {
      showToast(t('noWordsFound'), 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
      return;
    }

    currentReviewWords = shuffleArray(words);
    renderRecognizedWords(currentReviewWords);
    document.getElementById('reviewRecognizedWords').style.display = 'block';
    showToast(`${words.length} ${t('recognizedWords')}`, 'success');
  } catch (err) {
    console.error('OCR failed:', err);
    showToast(t('ocrError'), 'error');
    btn.disabled = false;
  }
  btn.innerHTML = originalText;
}

function extractWords(text) {
  // Match sequences of letters (including apostrophes for contractions)
  const matches = text.match(/[a-zA-Z]+(?:['’][a-zA-Z]+)?/g) || [];
  const words = matches
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length >= 2 && w.length <= 30);
  // Deduplicate while preserving order
  const seen = new Set();
  return words.filter(w => {
    if (seen.has(w)) return false;
    seen.add(w);
    return true;
  });
}

function renderRecognizedWords(words) {
  const container = document.getElementById('recognizedWordTags');
  container.innerHTML = words.map(w => `<span class="word-tag">${escapeHtml(w)}</span>`).join('');
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startWordReview() {
  if (currentReviewWords.length === 0) {
    showToast(t('emptyWordList'), 'error');
    return;
  }
  // Save the word list to task history
  addWordList(currentTaskId, currentReviewWords.slice());

  currentReviewIndex = 0;
  currentReviewKnown = 0;
  currentReviewUnknown = [];
  showReviewStep('session');
  renderCurrentWord();
}

function renderCurrentWord() {
  const total = currentReviewWords.length;
  const word = currentReviewWords[currentReviewIndex];
  document.getElementById('reviewWord').textContent = word || '';
  document.getElementById('reviewProgressText').textContent = `${currentReviewIndex + 1} / ${total}`;
  document.getElementById('reviewProgressFill').style.width = `${((currentReviewIndex + 1) / total) * 100}%`;

  // Animate card
  const card = document.getElementById('reviewCard');
  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');
}

function reviewAnswer(known) {
  const word = currentReviewWords[currentReviewIndex];
  if (known) {
    currentReviewKnown++;
  } else {
    currentReviewUnknown.push(word);
  }

  currentReviewIndex++;
  if (currentReviewIndex >= currentReviewWords.length) {
    finishReview();
  } else {
    renderCurrentWord();
  }
}

function finishReview() {
  if (currentReviewUnknown.length > 0) {
    addNewWords(currentTaskId, currentReviewUnknown);
  }
  renderNewWordsList(getTask(currentTaskId));

  const summaryHtml = t('reviewSummary')
    .replace('{{total}}', currentReviewWords.length)
    .replace('{{known}}', currentReviewKnown)
    .replace('{{unknown}}', currentReviewUnknown.length);
  document.getElementById('reviewSummaryStats').innerHTML = summaryHtml;
  showReviewStep('summary');
}

function backToReviewUpload() {
  currentReviewWords = [];
  currentReviewImage = '';
  document.getElementById('f_reviewImage').value = '';
  document.getElementById('reviewUploadPreview').style.display = 'none';
  document.getElementById('reviewUploadPlaceholder').style.display = 'flex';
  document.getElementById('startOcrBtn').disabled = true;
  document.getElementById('recognizedWordTags').innerHTML = '';
  document.getElementById('reviewRecognizedWords').style.display = 'none';
  showReviewStep('upload');
}

function renderNewWordsList(task) {
  ensureReviewData(task);
  const list = document.getElementById('newWordsList');
  if (task.review.newWords.length === 0) {
    list.innerHTML = `<div class="mr-empty" data-i18n="emptyNewWords">${t('emptyNewWords')}</div>`;
    return;
  }
  list.innerHTML = task.review.newWords.map(w => `
    <div class="new-word-item">
      <span class="new-word-text">${escapeHtml(w.text)}</span>
      <button class="new-word-del" onclick="removeNewWordFromList('${w.id}')">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `).join('');
}

function removeNewWordFromList(wordId) {
  removeNewWord(currentTaskId, wordId);
  renderNewWordsList(getTask(currentTaskId));
  showToast(t('toastDeleteSuccess'), 'success');
}

function clearNewWordsForTask() {
  if (getTask(currentTaskId).review.newWords.length === 0) return;
  showConfirm(t('deleteNewWordsConfirm') || '确定要清空生词表吗？', () => {
    clearNewWords(currentTaskId);
    renderNewWordsList(getTask(currentTaskId));
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function switchReviewPanel(panel) {
  // Simple scroll-into-view helper for the side panel on mobile
  const sidePanel = document.querySelector('.review-side');
  if (sidePanel) sidePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Keyboard shortcuts for review ---- */
document.addEventListener('keydown', function(e) {
  if (document.getElementById('reviewSessionStep').style.display === 'none') return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    reviewAnswer(true);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    reviewAnswer(false);
  }
});

/* ============================================
   Spelling Check & Wordbook
   ============================================ */

let currentSpellingState = null;
let currentSpellingImportChapterId = null;

function openSpellingModal() {
  renderSpellingChapterList();
  document.getElementById('spellingModal').classList.add('active');
}

function renderSpellingChapterList() {
  const task = getTask(currentTaskId);
  if (!task) return;
  ensureSpellingData(task);
  const container = document.getElementById('spellingChapterList');
  const chapters = task.spelling.chapters;

  if (chapters.length === 0) {
    container.innerHTML = `<div class="spelling-empty">${t('spellingEmptyChapters')}</div>`;
    return;
  }

  container.innerHTML = `<div class="spelling-chapter-list">${chapters.map(c => `
    <div class="spelling-chapter-item">
      <div class="spelling-chapter-info">
        <div class="spelling-chapter-name">${escapeHtml(c.name)}</div>
        <div class="spelling-chapter-meta">${t('wordCount')} ${c.words.length}</div>
      </div>
      <div class="spelling-chapter-actions">
        <button class="btn-small" onclick="startSpellingSession('${c.id}')" ${c.words.length === 0 ? 'disabled' : ''}>${t('spellingStart')}</button>
      </div>
    </div>
  `).join('')}</div>`;
}

function startSpellingSession(chapterId) {
  const task = getTask(currentTaskId);
  if (!task) return;
  ensureSpellingData(task);
  const chapter = task.spelling.chapters.find(c => c.id === chapterId);
  if (!chapter || chapter.words.length === 0) return;

  currentSpellingState = {
    chapterId: chapter.id,
    chapterName: chapter.name,
    words: shuffleArray(chapter.words.slice()),
    index: 0,
    correct: 0,
    wrong: 0,
    wrongWords: [],
    answered: false
  };

  closeModal('spellingModal');
  document.getElementById('spellingSessionModal').classList.add('active');
  renderSpellingQuestion();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderSpellingQuestion() {
  if (!currentSpellingState) return;
  const state = currentSpellingState;
  const total = state.words.length;
  const current = state.words[state.index];

  document.getElementById('spellingProgressText').textContent = `${state.index + 1} / ${total}`;
  document.getElementById('spellingProgressFill').style.width = `${((state.index) / total) * 100}%`;

  document.getElementById('spellingSessionBody').innerHTML = `
    <div class="spelling-chinese">${escapeHtml(current.cn)}</div>
    <input type="text" class="spelling-input-lg" id="spellingAnswerInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      placeholder="${t('spellingInputPh')}" onkeydown="handleSpellingInputKey(event)">
    <div class="spelling-feedback" id="spellingFeedback"></div>
    <div class="spelling-correct-answer" id="spellingCorrectAnswer" style="display:none"></div>
  `;

  document.getElementById('spellingSessionFooter').innerHTML = `
    <button class="btn-ghost" onclick="closeSpellingSession()">${t('cancel')}</button>
  `;

  setTimeout(() => document.getElementById('spellingAnswerInput').focus(), 50);
}

function handleSpellingInputKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (currentSpellingState && currentSpellingState.answered) {
      nextSpellingQuestion();
    } else {
      submitSpellingAnswer();
    }
  }
}

function submitSpellingAnswer() {
  if (!currentSpellingState || currentSpellingState.answered) return;
  const input = document.getElementById('spellingAnswerInput');
  const answer = (input.value || '').trim().toLowerCase();
  const current = currentSpellingState.words[currentSpellingState.index];
  const correct = answer === current.en.toLowerCase();

  currentSpellingState.answered = true;
  input.disabled = true;

  const feedback = document.getElementById('spellingFeedback');
  const correctAnswer = document.getElementById('spellingCorrectAnswer');

  if (correct) {
    currentSpellingState.correct += 1;
    input.classList.add('correct');
    feedback.textContent = t('spellingCorrect');
    feedback.className = 'spelling-feedback correct';
  } else {
    currentSpellingState.wrong += 1;
    currentSpellingState.wrongWords.push(current);
    addWrongWord(currentTaskId, current.en, current.cn);
    input.classList.add('wrong');
    feedback.textContent = t('spellingWrong');
    feedback.className = 'spelling-feedback wrong';
    correctAnswer.textContent = `${t('spellingCorrectAnswer')}: ${current.en}`;
    correctAnswer.style.display = 'block';
  }

  document.getElementById('spellingProgressFill').style.width = `${((currentSpellingState.index + 1) / currentSpellingState.words.length) * 100}%`;

  document.getElementById('spellingSessionFooter').innerHTML = `
    <button class="btn-ghost" onclick="closeSpellingSession()">${t('cancel')}</button>
    <button class="btn-primary" onclick="nextSpellingQuestion()">
      ${currentSpellingState.index + 1 >= currentSpellingState.words.length ? t('spellingFinish') : t('spellingNext')}
    </button>
  `;
}

function nextSpellingQuestion() {
  if (!currentSpellingState) return;
  currentSpellingState.index += 1;
  currentSpellingState.answered = false;
  if (currentSpellingState.index >= currentSpellingState.words.length) {
    finishSpellingSession();
  } else {
    renderSpellingQuestion();
  }
}

function finishSpellingSession() {
  if (!currentSpellingState) return;
  const state = currentSpellingState;
  document.getElementById('spellingProgressText').textContent = `${state.words.length} / ${state.words.length}`;
  document.getElementById('spellingProgressFill').style.width = '100%';

  document.getElementById('spellingSessionBody').innerHTML = `
    <div class="spelling-result">
      <h3>${t('spellingResultTitle')}</h3>
      <p>${t('spellingResultSummary')
        .replace('{{total}}', state.words.length)
        .replace('{{correct}}', state.correct)
        .replace('{{wrong}}', state.wrong)}</p>
      ${state.wrongWords.length > 0 ? `
        <div class="spelling-result-wrong">
          <h4>${t('spellingResultWrongHint')}</h4>
          ${state.wrongWords.map(w => `
            <div class="spelling-result-wrong-item">
              <span>${escapeHtml(w.en)}</span>
              <span>${escapeHtml(w.cn)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('spellingSessionFooter').innerHTML = `
    <button class="btn-ghost" onclick="closeSpellingSession()">${t('cancel')}</button>
    <button class="btn-primary" onclick="startSpellingSession('${state.chapterId}')">${t('spellingAgain')}</button>
  `;

  renderDetail();
}

function closeSpellingSession() {
  document.getElementById('spellingSessionModal').classList.remove('active');
  currentSpellingState = null;
}

/* ---- Manage chapters ---- */
function openSpellingManageModal() {
  renderSpellingManageList();
  document.getElementById('spellingManageModal').classList.add('active');
}

function renderSpellingManageList() {
  const task = getTask(currentTaskId);
  if (!task) return;
  ensureSpellingData(task);
  const container = document.getElementById('spellingManageList');
  const chapters = task.spelling.chapters;

  if (chapters.length === 0) {
    container.innerHTML = `<div class="spelling-empty">${t('spellingEmptyChapters')}</div>`;
    return;
  }

  container.innerHTML = chapters.map((c, idx) => `
    <div class="spelling-manage-item">
      <div class="spelling-manage-header" onclick="toggleSpellingManageChapter('${c.id}')">
        <div class="spelling-manage-name">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform .2s" id="chevron-${c.id}">
            <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${escapeHtml(c.name)} · ${t('wordCount')} ${c.words.length}
        </div>
        <div class="spelling-manage-actions" onclick="event.stopPropagation()">
          <button class="btn-small" onclick="openSpellingImportModal('${c.id}')">${t('importWords')}</button>
          <button class="btn-small btn-danger" onclick="deleteSpellingChapterFromModal('${c.id}')">${t('deleteChapter')}</button>
        </div>
      </div>
      <div class="spelling-manage-body" id="manage-body-${c.id}">
        ${renderSpellingWordTable(c)}
      </div>
    </div>
  `).join('');
}

function renderSpellingWordTable(chapter) {
  if (chapter.words.length === 0) {
    return `<div class="mr-empty">${t('noWordsInChapter')}</div>`;
  }
  return `
    <table class="spelling-word-table">
      <thead><tr><th>${t('wordEn')}</th><th>${t('wordCn')}</th><th></th></tr></thead>
      <tbody>
        ${chapter.words.map(w => `
          <tr>
            <td>${escapeHtml(w.en)}</td>
            <td>${escapeHtml(w.cn)}</td>
            <td>
              <button class="spelling-word-del" onclick="deleteSpellingWordFromModal('${chapter.id}', '${w.id}')">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleSpellingManageChapter(chapterId) {
  const body = document.getElementById(`manage-body-${chapterId}`);
  const chevron = document.getElementById(`chevron-${chapterId}`);
  const isOpen = body.classList.toggle('open');
  chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

function addSpellingChapterFromModal() {
  const input = document.getElementById('f_newChapterName');
  const name = input.value.trim();
  if (!name) return;
  addSpellingChapter(currentTaskId, name);
  input.value = '';
  renderSpellingManageList();
  renderSpellingChapterList();
  renderDetail();
  showToast(t('toastSaveSuccess'), 'success');
}

function deleteSpellingChapterFromModal(chapterId) {
  showConfirm(t('deleteChapterConfirm'), () => {
    deleteSpellingChapter(currentTaskId, chapterId);
    renderSpellingManageList();
    renderSpellingChapterList();
    renderDetail();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function deleteSpellingWordFromModal(chapterId, wordId) {
  showConfirm(t('deleteMrConfirm'), () => {
    deleteSpellingWord(currentTaskId, chapterId, wordId);
    renderSpellingManageList();
    renderSpellingChapterList();
    renderDetail();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

/* ---- Import words ---- */
function openSpellingImportModal(chapterId) {
  currentSpellingImportChapterId = chapterId;
  document.getElementById('f_importWords').value = '';
  document.getElementById('spellingImportModal').classList.add('active');
}

function submitImportWords() {
  const text = document.getElementById('f_importWords').value.trim();
  if (!text || !currentSpellingImportChapterId) return;

  const words = [];
  text.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    // Match: English[space/tab/punctuation]Chinese
    // Allow formats: "abandon 放弃", "abandon	放弃", "abandon, 放弃", "abandon  放弃"
    const match = line.match(/^([a-zA-Z0-9\-\s'.]+?)[\s,，]+(.+)$/);
    if (match) {
      const en = match[1].trim();
      const cn = match[2].trim();
      if (en && cn) words.push({ en, cn });
    }
  });

  if (words.length === 0) {
    showToast(t('noWordsFound'), 'error');
    return;
  }

  addSpellingWords(currentTaskId, currentSpellingImportChapterId, words);
  closeModal('spellingImportModal');
  renderSpellingManageList();
  renderSpellingChapterList();
  renderDetail();
  showToast(`${t('toastSaveSuccess')} (${words.length})`, 'success');
}

/* ---- Wordbook actions ---- */
function confirmClearWordbook() {
  const task = getTask(currentTaskId);
  if (!task || !task.spelling.wrongWords.length) return;
  showConfirm(t('wordbookClearConfirm'), () => {
    clearWrongWords(currentTaskId);
    renderDetail();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function confirmRemoveWordbookWord(wordId) {
  showConfirm(t('wordbookRemoveConfirm'), () => {
    removeWrongWord(currentTaskId, wordId);
    renderDetail();
    showToast(t('toastDeleteSuccess'), 'success');
  });
}

function spellWordbookWord(wordId) {
  const task = getTask(currentTaskId);
  if (!task) return;
  const word = task.spelling.wrongWords.find(w => w.id === wordId);
  if (!word) return;

  currentSpellingState = {
    chapterId: 'wordbook',
    chapterName: t('wordbookTitle'),
    words: [word],
    index: 0,
    correct: 0,
    wrong: 0,
    wrongWords: [],
    answered: false,
    isWordbookMode: true,
    wordId: wordId
  };

  document.getElementById('spellingSessionModal').classList.add('active');
  renderSpellingQuestion();
}

/* Override finish for wordbook single-word mode */
const originalFinishSpellingSession = finishSpellingSession;
finishSpellingSession = function() {
  if (!currentSpellingState || !currentSpellingState.isWordbookMode) {
    return originalFinishSpellingSession();
  }
  const state = currentSpellingState;
  const input = document.getElementById('spellingAnswerInput');
  const answer = input ? (input.value || '').trim().toLowerCase() : '';
  const word = state.words[0];
  const correct = answer === word.en.toLowerCase();

  const item = recordWrongWordAttempt(currentTaskId, word.en, correct);
  let removed = false;
  if (item && item.correctCount >= 2) {
    removeWrongWord(currentTaskId, item.id);
    removed = true;
  }

  document.getElementById('spellingProgressText').textContent = '1 / 1';
  document.getElementById('spellingProgressFill').style.width = '100%';

  document.getElementById('spellingSessionBody').innerHTML = `
    <div class="spelling-result">
      <h3>${correct ? t('spellingCorrect') : t('spellingWrong')}</h3>
      <p>${escapeHtml(word.en)} — ${escapeHtml(word.cn)}</p>
      ${item && !removed ? `<p>${t('wordbookCorrectCount').replace('{{count}}', item.correctCount)} · ${t('wordbookTotalAttempts').replace('{{count}}', item.totalAttempts)}</p>` : ''}
      ${removed ? `<p style="color:var(--success)">${t('wordbookRemovedAfterTwoCorrect')}</p>` : ''}
    </div>
  `;

  document.getElementById('spellingSessionFooter').innerHTML = `
    <button class="btn-ghost" onclick="closeSpellingSession()">${t('cancel')}</button>
    ${removed ? '' : `<button class="btn-primary" onclick="spellWordbookWord('${state.wordId}')">${t('spellingAgain')}</button>`}
  `;

  renderDetail();
};
