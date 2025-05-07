// ✅ 強化貼圖偵錯版 task-dispatch.js
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
    console.log('[DEBUG] Dispatched to handwritingTasks.');
    console.log('[DEBUG] finalBackgroundUrl =', finalBackgroundUrl);

    const previewUrl = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&backgroundUrl=${encodeURIComponent(finalBackgroundUrl)}`;
    console.log('[DEBUG] previewUrl =', previewUrl);

    await set(ref(db, 'teacher/currentQuestion'), {
      questionId,
      title,
      backgroundUrl: finalBackgroundUrl,
      link: previewUrl,
      text: `📝 今日任務：${title} 👉 點我作答`,
      timestamp: Date.now()
    });

    console.log('[DEBUG] teacher/currentQuestion 已成功更新');
    statusEl.innerText = '✅ 任務已派送！';
    const previewEl = document.getElementById('generalLinkDisplay');
    if (previewEl) {
      previewEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" class="word-break-all">${previewUrl}</code><button class="copy-btn ml-2" data-copy-target="generalLinkCode">📋 複製</button>`;
    }
  } catch (err) {
    console.error('[DEBUG ❌] 任務派送失敗：', err);
    statusEl.innerText = '❌ 發布任務失敗：' + err.message;
  }
}

// 🔍 貼圖偵錯區塊
window.addEventListener('paste', async (e) => {
  console.log('[DEBUG] Paste event triggered!');
  const items = e.clipboardData?.items;
  if (items) {
    console.log('[DEBUG] Clipboard items found:', items.length);
    for (let item of items) {
      console.log('[DEBUG] Checking item type:', item.type);
      if (item.type.startsWith('image/')) {
        console.log('[DEBUG] Image item found! Getting file...');
        const file = item.getAsFile();
        if (file) {
          console.log('[DEBUG] File obtained from paste:', file.name, file.type);
          handlePastedImage(file);
        } else {
          console.log('[DEBUG] Could not get file from image item.');
        }
      }
    }
  } else {
    console.log('[DEBUG] No clipboard items found.');
  }
});

async function handlePastedImage(file) {
  const questionId = document.getElementById('questionId').value.trim();
  const preview = document.getElementById('imagePreview');
  const statusEl = document.getElementById('status');
  const backgroundUrlInput = document.getElementById('backgroundUrl');

  if (!questionId) {
    alert('❗ 請先輸入題目代碼再貼圖！');
    return;
  }
  try {
    statusEl.innerText = `⬆️ 正在上傳貼上的圖片…`;
    const ext = file.name.split('.').pop() || 'png';
    const bgRef = storageRef(storage, `handwritingTasks/${questionId}.${ext}`);
    await uploadBytes(bgRef, file);
    const url = await getDownloadURL(bgRef);
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    backgroundUrlInput.value = url;
    statusEl.innerText = `✅ 貼圖上傳成功，請點擊「發布任務」！`;
    console.log('[貼圖上傳]', url);
  } catch (err) {
    console.error('[貼圖上傳失敗]', err);
    statusEl.innerText = '❌ 貼圖上傳失敗：' + err.message;
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
