/* ============================================
   Store — Data Management with localStorage
   ============================================ */

const STORAGE_KEY = 'study-tracker-data';

let store = {
  tasks: [],
  comeOn: {
    images: [],
    messages: []
  }
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      store = JSON.parse(raw);
      if (!store.tasks) store.tasks = [];
      if (!store.comeOn) store.comeOn = { images: [], messages: [] };
      if (!store.comeOn.images) store.comeOn.images = [];
      if (!store.comeOn.messages) store.comeOn.messages = [];
      // Migrate old tasks to include review and spelling data
      store.tasks.forEach(task => {
        ensureReviewData(task);
        ensureSpellingData(task);
      });
    } else {
      // Seed with demo data on first visit
      seedDemoData();
    }
  } catch (e) {
    console.error('Failed to load store:', e);
    store = { tasks: [], comeOn: { images: [], messages: [] } };
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save store:', e);
    showToast(t('toastSaveSuccess'), 'error');
  }
}

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getTask(id) {
  return store.tasks.find(t => t.id === id);
}

function addTask(data) {
  const task = {
    id: uuid(),
    name: data.name,
    startDate: data.startDate || todayStr(),
    expectedDate: data.expectedDate || '',
    progress: 0,
    checkInDays: 0,
    exam: {
      date: data.examDate || '',
      location: data.examLocation || '',
      certificate: data.examCert || ''
    },
    daily: {
      words: [],
      questions: [],
      textbooks: [],
      checkinDates: []
    },
    mistakes: [],
    reflections: [],
    review: {
      wordLists: [],
      newWords: []
    },
    spelling: {
      chapters: [],
      wrongWords: []
    },
    createdAt: new Date().toISOString()
  };
  store.tasks.push(task);
  saveStore();
  return task;
}

function updateTask(id, data) {
  const task = getTask(id);
  if (!task) return;
  task.name = data.name;
  if (data.startDate) task.startDate = data.startDate;
  if (data.expectedDate) task.expectedDate = data.expectedDate;
  if (data.examDate !== undefined) task.exam.date = data.examDate;
  if (data.examLocation !== undefined) task.exam.location = data.examLocation;
  if (data.examCert !== undefined) task.exam.certificate = data.examCert;
  saveStore();
}

function deleteTask(id) {
  store.tasks = store.tasks.filter(t => t.id !== id);
  saveStore();
}

function addCheckin(taskId, type, text, count) {
  const task = getTask(taskId);
  if (!task) return;
  const entry = {
    id: uuid(),
    text: text || '',
    count: count || 1,
    date: new Date().toISOString()
  };
  task.daily[type].unshift(entry);
  // Update check-in days (unique dates)
  const dateStr = todayStr();
  if (!task.daily.checkinDates.includes(dateStr)) {
    task.daily.checkinDates.push(dateStr);
    task.checkInDays = task.daily.checkinDates.length;
  }
  // Auto-update progress based on check-ins (simple heuristic)
  const totalCheckins = task.daily.words.length + task.daily.questions.length;
  if (task.expectedDate) {
    const total = new Date(task.expectedDate) - new Date(task.startDate);
    const elapsed = new Date() - new Date(task.startDate);
    const timeProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
    const checkinProgress = Math.min(100, Math.round(totalCheckins / 30 * 100));
    task.progress = Math.round((timeProgress + checkinProgress) / 2);
  } else {
    task.progress = Math.min(100, Math.round(totalCheckins / 30 * 100));
  }
  saveStore();
}

function deleteCheckin(taskId, type, checkinId) {
  const task = getTask(taskId);
  if (!task) return;
  task.daily[type] = task.daily[type].filter(c => c.id !== checkinId);
  saveStore();
}

function addTextbook(taskId, name, fileData) {
  const task = getTask(taskId);
  if (!task) return;
  task.daily.textbooks.unshift({
    id: uuid(),
    name: name,
    fileName: fileData.name,
    fileType: fileData.type,
    size: fileData.size,
    dataUrl: fileData.dataUrl,
    date: new Date().toISOString()
  });
  saveStore();
}

function deleteTextbook(taskId, textbookId) {
  const task = getTask(taskId);
  if (!task) return;
  task.daily.textbooks = task.daily.textbooks.filter(b => b.id !== textbookId);
  saveStore();
}

function addMistakeOrReflection(taskId, type, text, image) {
  const task = getTask(taskId);
  if (!task) return;
  const entry = {
    id: uuid(),
    text: text || '',
    image: image || '',
    date: new Date().toISOString()
  };
  if (type === 'mistake') {
    task.mistakes.unshift(entry);
  } else {
    task.reflections.unshift(entry);
  }
  saveStore();
}

function deleteMistakeOrReflection(taskId, type, entryId) {
  const task = getTask(taskId);
  if (!task) return;
  if (type === 'mistake') {
    task.mistakes = task.mistakes.filter(m => m.id !== entryId);
  } else {
    task.reflections = task.reflections.filter(r => r.id !== entryId);
  }
  saveStore();
}

/* ---- Review Functions ---- */
function ensureReviewData(task) {
  if (!task.review) {
    task.review = { wordLists: [], newWords: [] };
  }
  if (!task.review.wordLists) task.review.wordLists = [];
  if (!task.review.newWords) task.review.newWords = [];
}

function ensureSpellingData(task) {
  if (!task.spelling) {
    task.spelling = { chapters: [], wrongWords: [] };
  }
  if (!task.spelling.chapters) task.spelling.chapters = [];
  if (!task.spelling.wrongWords) task.spelling.wrongWords = [];
}

function addWordList(taskId, words) {
  const task = getTask(taskId);
  if (!task) return;
  ensureReviewData(task);
  const list = {
    id: uuid(),
    words: words || [],
    date: new Date().toISOString()
  };
  task.review.wordLists.unshift(list);
  saveStore();
  return list;
}

function deleteWordList(taskId, listId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureReviewData(task);
  task.review.wordLists = task.review.wordLists.filter(l => l.id !== listId);
  saveStore();
}

function addNewWords(taskId, words) {
  const task = getTask(taskId);
  if (!task) return;
  ensureReviewData(task);
  const existing = new Set(task.review.newWords.map(w => w.text.toLowerCase()));
  let added = 0;
  (words || []).forEach(word => {
    const normalized = word.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!existing.has(key)) {
      task.review.newWords.unshift({
        id: uuid(),
        text: normalized,
        date: new Date().toISOString()
      });
      existing.add(key);
      added++;
    }
  });
  if (added > 0) saveStore();
  return added;
}

function removeNewWord(taskId, wordId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureReviewData(task);
  task.review.newWords = task.review.newWords.filter(w => w.id !== wordId);
  saveStore();
}

function clearNewWords(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureReviewData(task);
  task.review.newWords = [];
  saveStore();
}

/* ---- Helpers ---- */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return t('notSet');
  const d = new Date(dateStr);
  if (isNaN(d)) return t('notSet');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (currentLang === 'zh-CN') return `${y}年${m}月${day}日`;
  return `${y}-${m}-${day}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return t('notSet');
  const d = new Date(dateStr);
  if (isNaN(d)) return t('notSet');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  if (currentLang === 'zh-CN') return `${y}年${m}月${day}日 ${h}:${min}`;
  return `${y}-${m}-${day} ${h}:${min}`;
}

function formatRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');
  if (currentLang === 'zh-CN') return `${diffDays}天前`;
  return `${diffDays} days ago`;
}

function getTaskStatus(task) {
  if (task.progress >= 100) return 'completed';
  if (task.expectedDate && new Date(task.expectedDate) < new Date()) return 'expired';
  return 'inProgress';
}

/* ---- Demo Data ---- */
function seedDemoData() {
  const demoTask = {
    id: uuid(),
    name: 'IELTS Preparation',
    startDate: '2026-07-15',
    expectedDate: '2026-09-20',
    progress: 35,
    checkInDays: 15,
    exam: {
      date: '2026-09-25T09:00',
      location: 'Beijing Exam Center, Room 302',
      certificate: 'Passport'
    },
    daily: {
      words: [
        { id: uuid(), text: 'IELTS Vocabulary List 3', count: 80, date: new Date(Date.now() - 86400000).toISOString() },
        { id: uuid(), text: 'Academic Word List Unit 5', count: 50, date: new Date(Date.now() - 172800000).toISOString() }
      ],
      questions: [
        { id: uuid(), text: 'Cambridge IELTS 18 Reading Test 1', count: 40, date: new Date(Date.now() - 86400000).toISOString() }
      ],
      textbooks: [],
      checkinDates: []
    },
    mistakes: [
      { id: uuid(), text: 'Confused "affect" vs "effect" in writing task 2. Need to memorize: affect = verb, effect = noun.', image: '', date: new Date(Date.now() - 86400000).toISOString() }
    ],
    reflections: [
      { id: uuid(), text: 'Reading speed improved but accuracy dropped when rushing. Focus on accuracy first, then speed.', image: '', date: new Date(Date.now() - 172800000).toISOString() }
    ],
    review: {
      wordLists: [],
      newWords: []
    },
    spelling: {
      chapters: [
        {
          id: uuid(),
          name: 'Chapter 1 自然地理',
          words: [
            { id: uuid(), en: 'geography', cn: '地理' },
            { id: uuid(), en: 'atlas', cn: '地图集' },
            { id: uuid(), en: 'hemisphere', cn: '半球' },
            { id: uuid(), en: 'latitude', cn: '纬度' },
            { id: uuid(), en: 'longitude', cn: '经度' }
          ]
        },
        {
          id: uuid(),
          name: 'Chapter 2 植物研究',
          words: [
            { id: uuid(), en: 'botany', cn: '植物学' },
            { id: uuid(), en: 'photosynthesis', cn: '光合作用' },
            { id: uuid(), en: 'species', cn: '物种' },
            { id: uuid(), en: 'habitat', cn: '栖息地' }
          ]
        }
      ],
      wrongWords: []
    },
    createdAt: new Date('2026-07-15').toISOString()
  };
  // Generate checkin dates
  for (let i = 0; i < 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    demoTask.daily.checkinDates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }
  store.tasks = [demoTask];
  saveStore();
}

/* ---- Come On (global notepad) ---- */
function addComeOnImage(dataUrl, name) {
  if (!store.comeOn) store.comeOn = { images: [], messages: [] };
  store.comeOn.images.unshift({
    id: uuid(),
    dataUrl,
    name: name || '',
    date: new Date().toISOString()
  });
  saveStore();
}

function deleteComeOnImage(id) {
  if (!store.comeOn) return;
  store.comeOn.images = store.comeOn.images.filter(img => img.id !== id);
  saveStore();
}

function addComeOnMessage(text) {
  if (!store.comeOn) store.comeOn = { images: [], messages: [] };
  store.comeOn.messages.unshift({
    id: uuid(),
    text: text.trim(),
    date: new Date().toISOString()
  });
  saveStore();
}

function deleteComeOnMessage(id) {
  if (!store.comeOn) return;
  store.comeOn.messages = store.comeOn.messages.filter(m => m.id !== id);
  saveStore();
}

function clearComeOn() {
  if (!store.comeOn) return;
  store.comeOn = { images: [], messages: [] };
  saveStore();
}

/* ---- Spelling (per task) ---- */
function getSpelling(taskId) {
  const task = getTask(taskId);
  if (!task) return null;
  ensureSpellingData(task);
  return task.spelling;
}

function addSpellingChapter(taskId, name) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const chapter = { id: uuid(), name: name.trim() || t('chapterDefault'), words: [] };
  task.spelling.chapters.push(chapter);
  saveStore();
  return chapter;
}

function updateSpellingChapter(taskId, chapterId, name) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const chapter = task.spelling.chapters.find(c => c.id === chapterId);
  if (chapter) chapter.name = name.trim();
  saveStore();
}

function deleteSpellingChapter(taskId, chapterId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  task.spelling.chapters = task.spelling.chapters.filter(c => c.id !== chapterId);
  saveStore();
}

function addSpellingWords(taskId, chapterId, words) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const chapter = task.spelling.chapters.find(c => c.id === chapterId);
  if (!chapter) return;
  const added = [];
  words.forEach(w => {
    if (!w || !w.en || !w.en.trim() || !w.cn || !w.cn.trim()) return;
    const existing = chapter.words.find(x => x.en.toLowerCase() === w.en.trim().toLowerCase());
    if (existing) {
      existing.cn = w.cn.trim();
      added.push(existing);
    } else {
      chapter.words.push({ id: uuid(), en: w.en.trim(), cn: w.cn.trim() });
      added.push(chapter.words[chapter.words.length - 1]);
    }
  });
  saveStore();
  return added;
}

function deleteSpellingWord(taskId, chapterId, wordId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const chapter = task.spelling.chapters.find(c => c.id === chapterId);
  if (chapter) chapter.words = chapter.words.filter(w => w.id !== wordId);
  saveStore();
}

function addWrongWord(taskId, en, cn) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const key = en.trim().toLowerCase();
  let item = task.spelling.wrongWords.find(w => w.en.toLowerCase() === key);
  if (item) {
    item.cn = cn.trim();
    item.correctCount = 0;
    item.totalAttempts += 1;
    item.lastWrongAt = new Date().toISOString();
  } else {
    item = {
      id: uuid(),
      en: en.trim(),
      cn: cn.trim(),
      correctCount: 0,
      totalAttempts: 1,
      lastWrongAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    task.spelling.wrongWords.unshift(item);
  }
  saveStore();
  return item;
}

function recordWrongWordAttempt(taskId, en, isCorrect) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  const key = en.trim().toLowerCase();
  const item = task.spelling.wrongWords.find(w => w.en.toLowerCase() === key);
  if (!item) return null;
  item.totalAttempts += 1;
  if (isCorrect) {
    item.correctCount += 1;
    item.lastCorrectAt = new Date().toISOString();
  } else {
    item.correctCount = 0;
    item.lastWrongAt = new Date().toISOString();
  }
  saveStore();
  return item;
}

function removeWrongWord(taskId, wordId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  task.spelling.wrongWords = task.spelling.wrongWords.filter(w => w.id !== wordId);
  saveStore();
}

function clearWrongWords(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  ensureSpellingData(task);
  task.spelling.wrongWords = [];
  saveStore();
}
