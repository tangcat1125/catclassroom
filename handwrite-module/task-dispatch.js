// ✅ 修正版 task-dispatch.js with DEBUG logs for teacher/currentQuestion
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import {
  getDatabase, ref, set, get, child
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { console.warn('Analytics init failed:', e); }
const db = getDatabase(app);
const storage = getStorage(app);

export async function dispatchHandwriteTask(questionId, title, backgroundUrl) {
  const taskData = {
    title,
    backgroundUrl: backgroundUrl || '',
    releaseTimestamp: Date.now()
  };
  await set(ref(db, `handwritingTasks/${questionId}`), taskData);
}

export async function publishTask() {
  const questionId = document.getElementById('questionId').value.trim();
  const title = document.getElementById('title').value.trim();
  const backgroundUrlInput = document.getElementById('backgroundUrl');
  const fileInput = document.getElementById('backgroundImageFile');
  const statusEl = document.getElementById('status');

  if (!questionId || !title) {
    statusEl.innerText = '❗ 請填寫題目代碼與標題';
    return;
  }

  let finalBackgroundUrl = backgroundUrlInput.value.trim();
  const file = fileInput.files[0];
  statusEl.innerText = '🚀 準備發布任務…';

  try {
    if (file) {
      statusEl.innerText = `⬆️ 正在上傳背景圖 ${file.name}…`;
      const ext = file.name.split('.').pop();
      const bgRef = storageRef(storage, `handwritingTasks/${questionId}.${ext}`);
      await uploadBytes(bgRef, file);
      finalBackgroundUrl = await getDownloadURL(bgRef);
      backgroundUrlInput.value = finalBackgroundUrl;
      statusEl.innerText = '✅ 背景圖上傳成功，準備派送…';
    }

    await dispatchHandwriteTask(questionId, title, finalBackgroundUrl);
    console.log('[DEBUG] Dispatched to handwritingTasks. Preparing to set teacher/currentQuestion.');
    console.log('[DEBUG] Values for teacher/currentQuestion - questionId:', questionId, 'title:', title, 'finalBackgroundUrl:', finalBackgroundUrl);

    const previewUrl = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&backgroundUrl=${encodeURIComponent(finalBackgroundUrl)}`;
    console.log('[DEBUG] previewUrl for teacher/currentQuestion:', previewUrl);

    try {
      await set(ref(db, 'teacher/currentQuestion'), {
        questionId,
        title,
        backgroundUrl: finalBackgroundUrl,
        link: previewUrl,
        text: `📝 今日任務：${title} 👉 點我作答`,
        timestamp: Date.now()
      });
      console.log('[DEBUG] Successfully set teacher/currentQuestion.');
    } catch (teacherError) {
      console.error('[DEBUG] Error setting teacher/currentQuestion:', teacherError);
    }

    statusEl.innerText = '✅ 任務已派送！';
    const previewEl = document.getElementById('generalLinkDisplay');
    if (previewEl) {
      previewEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" class="word-break-all">${previewUrl}</code><button class="copy-btn ml-2" data-copy-target="generalLinkCode">📋 複製</button>`;
    }
  } catch (err) {
    console.error('❌ 發布任務失敗 (Outer Catch)', err);
    statusEl.innerText = '❌ 發布任務失敗：' + err.message;
  }
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}

document.addEventListener('DOMContentLoaded', () => {
  bindClick('publishTaskBtn', publishTask);
  bindClick('generateLinkBtn', generateLink);
});
