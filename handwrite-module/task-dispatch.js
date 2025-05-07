// ✅ 強化貼圖偵錯版 task-dispatch.js - 搶修 ReferenceError 並保留核心偵錯
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import {
  getDatabase, ref, set, get, child
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA", // <-- 記得替換為你自己的金鑰
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
};

const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
  console.log('[Firebase] Analytics initialized.');
} catch (e) {
  console.warn('[Firebase] Analytics init failed:', e);
}
const db = getDatabase(app);
const storage = getStorage(app);
console.log('[Firebase] Database and Storage initialized.');

// --- 任務派送相關 ---
export async function dispatchHandwriteTask(questionId, title, backgroundUrl) {
  console.log('[dispatchHandwriteTask] Attempting to dispatch:', { questionId, title, backgroundUrl });
  const taskData = {
    title,
    backgroundUrl: backgroundUrl || '', // 確保 backgroundUrl 不是 undefined
    releaseTimestamp: Date.now()
  };
  try {
    await set(ref(db, `handwritingTasks/${questionId}`), taskData);
    console.log('[dispatchHandwriteTask] Successfully dispatched to handwritingTasks:', questionId);
  } catch (error) {
    console.error('[dispatchHandwriteTask] Error dispatching to handwritingTasks:', error);
    throw error; // 重新拋出錯誤，讓 publishTask 的 catch 也能捕獲
  }
}

export async function publishTask() {
  console.log('[publishTask] Initiated.');
  const questionIdInput = document.getElementById('questionId');
  const titleInput = document.getElementById('title');
  const backgroundUrlInput = document.getElementById('backgroundUrl');
  const fileInput = document.getElementById('backgroundImageFile');
  const statusEl = document.getElementById('status');

  if (!questionIdInput || !titleInput || !backgroundUrlInput || !fileInput || !statusEl) {
    console.error('[publishTask] Critical DOM element not found. Aborting.');
    alert('頁面結構錯誤，請聯繫管理員！');
    return;
  }

  const questionId = questionIdInput.value.trim();
  const title = titleInput.value.trim();

  if (!questionId || !title) {
    statusEl.innerText = '❗ 請填寫題目代碼與標題';
    console.log('[publishTask] Validation failed: questionId or title is empty.');
    return;
  }

  let finalBackgroundUrl = backgroundUrlInput.value.trim();
  const file = fileInput.files[0];
  statusEl.innerText = '🚀 準備發布任務…';

  try {
    if (file) {
      console.log('[publishTask] File selected for background:', file.name);
      statusEl.innerText = `⬆️ 正在上傳背景圖 ${file.name}…`;
      const ext = file.name.split('.').pop() || 'png'; // 提供默認擴展名
      const bgRef = storageRef(storage, `handwritingTasks/${questionId}.${ext}`);
      console.log('[publishTask] Uploading to Storage path:', `handwritingTasks/${questionId}.${ext}`);
      await uploadBytes(bgRef, file);
      console.log('[publishTask] Upload to Storage successful.');
      finalBackgroundUrl = await getDownloadURL(bgRef);
      console.log('[publishTask] Obtained download URL:', finalBackgroundUrl);
      backgroundUrlInput.value = finalBackgroundUrl;
      statusEl.innerText = '✅ 背景圖上傳成功，準備派送…';
    } else {
      console.log('[publishTask] No file selected for background. Using backgroundUrlInput value if any.');
    }

    // 測試用繞道策略 (如果需要，取消註解並調整)
    // if (!finalBackgroundUrl) {
    //     finalBackgroundUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/640px-Placeholder_view_vector.svg.png";
    //     console.log('[DEBUG] No background image provided or derived. Using default placeholder image.');
    //     if (backgroundUrlInput) {
    //         backgroundUrlInput.value = finalBackgroundUrl;
    //     }
    // }

    await dispatchHandwriteTask(questionId, title, finalBackgroundUrl);
    // dispatchHandwriteTask 內部已有日誌，這裡不再重複

    console.log('[DEBUG] Preparing to set teacher/currentQuestion.');
    console.log('[DEBUG] Values for teacher/currentQuestion - questionId:', questionId, 'title:', title, 'finalBackgroundUrl:', finalBackgroundUrl);

    const previewUrl = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&backgroundUrl=${encodeURIComponent(finalBackgroundUrl || '')}`; // 確保 finalBackgroundUrl 不是 undefined
    console.log('[DEBUG] previewUrl for teacher/currentQuestion:', previewUrl);

    try {
      await set(ref(db, 'teacher/currentQuestion'), {
        questionId,
        title,
        backgroundUrl: finalBackgroundUrl || '', // 確保 backgroundUrl 不是 undefined
        link: previewUrl,
        text: `📝 今日任務：${title} 👉 點我作答`,
        timestamp: Date.now()
      });
      console.log('[DEBUG] Successfully set teacher/currentQuestion.');
    } catch (teacherError) {
      console.error('[DEBUG] Error setting teacher/currentQuestion:', teacherError);
      // 不在這裡更新 statusEl，讓外層 catch 處理總體失敗狀態
    }

    statusEl.innerText = '✅ 任務已派送！';
    const previewEl = document.getElementById('generalLinkDisplay');
    if (previewEl) {
      previewEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" style="word-break:break-all;">${previewUrl}</code><button class="copy-btn" data-copy-target="generalLinkCode" style="margin-left:0.5rem;">📋 複製</button>`;
    } else {
      console.warn('[publishTask] Element with ID "generalLinkDisplay" not found for preview link.');
    }

  } catch (err) {
    console.error('❌ 發布任務失敗 (Outer Catch)', err);
    statusEl.innerText = '❌ 發布任務失敗：' + (err.message || '未知錯誤');
  }
}

// --- 貼圖相關 ---
window.addEventListener('paste', async (e) => {
  console.log('[DEBUG][Paste] Paste event triggered!');
  if (!e.clipboardData) {
    console.log('[DEBUG][Paste] clipboardData is not available.');
    return;
  }
  const items = e.clipboardData.items; // 不需要 ?. 因為上面已檢查 e.clipboardData
  if (items && items.length > 0) {
    console.log('[DEBUG][Paste] Clipboard items found:', items.length);
    for (let i = 0; i < items.length; i++) { // 使用傳統 for 循環或 for...of
      const item = items[i];
      console.log(`[DEBUG][Paste] Checking item ${i} type:`, item.type, 'kind:', item.kind);
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        console.log('[DEBUG][Paste] Image file item found! Getting file...');
        const file = item.getAsFile();
        if (file) {
          console.log('[DEBUG][Paste] File obtained:', file.name, file.type, file.size, 'bytes');
          handlePastedImage(file); // 假設這是你要調用的函數
          return; // 通常剪貼簿裡只有一張圖片，處理完就返回
        } else {
          console.log('[DEBUG][Paste] Could not get file from image item.');
        }
      }
    }
    console.log('[DEBUG][Paste] No suitable image file found in clipboard items after iteration.');
  } else {
    console.log('[DEBUG][Paste] No clipboard items found or items array is empty.');
  }
});

async function handlePastedImage(file) {
  console.log('[handlePastedImage] Initiated with file:', file.name);
  const questionIdInput = document.getElementById('questionId');
  const preview = document.getElementById('imagePreview');
  const statusEl = document.getElementById('status');
  const backgroundUrlInput = document.getElementById('backgroundUrl');

  if (!questionIdInput || !preview || !statusEl || !backgroundUrlInput) {
      console.error('[handlePastedImage] Critical DOM element for pasting not found. Aborting.');
      alert('貼圖功能所需頁面元件缺失，請聯繫管理員！');
      return;
  }

  const questionId = questionIdInput.value.trim();
  if (!questionId) {
    alert('❗ 請先輸入題目代碼再貼圖！');
    console.log('[handlePastedImage] Validation failed: questionId is empty.');
    return;
  }

  try {
    statusEl.innerText = `⬆️ 正在上傳貼上的圖片 ${file.name}…`;
    console.log('[handlePastedImage] Uploading pasted image:', file.name);
    const ext = file.name.split('.').pop() || 'png';
    const bgRef = storageRef(storage, `handwritingTasks/${questionId}.${ext}`);
    console.log('[handlePastedImage] Uploading to Storage path:', `handwritingTasks/${questionId}.${ext}`);
    await uploadBytes(bgRef, file);
    console.log('[handlePastedImage] Upload to Storage successful.');
    const url = await getDownloadURL(bgRef);
    console.log('[handlePastedImage] Obtained download URL:', url);

    preview.src = URL.createObjectURL(file); // 顯示本地預覽
    preview.style.display = 'block';
    backgroundUrlInput.value = url; // 將 Storage URL 填入輸入框
    statusEl.innerText = `✅ 貼圖上傳成功，請點擊「發布任務」！`;
    console.log('[handlePastedImage] Paste upload successful. URL:', url);

  } catch (err) {
    console.error('[handlePastedImage] 貼圖上傳或獲取URL失敗:', err);
    statusEl.innerText = '❌ 貼圖上傳失敗：' + (err.message || '未知錯誤');
    // 可以考慮清除預覽和 backgroundUrlInput.value
    preview.src = '#';
    preview.style.display = 'none';
    backgroundUrlInput.value = '';
  }
}

// --- 事件綁定工具函數 ---
function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', handler);
    console.log(`[EventBinding] Click event bound to #${id}`);
  } else {
    console.warn(`[EventBinding] Element with ID #${id} not found for click binding.`);
  }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DOMContentLoaded] DOM fully loaded. Binding core event listeners.');
  bindClick('publishTaskBtn', publishTask);
  // bindClick('generateLinkBtn', generateLink); // <-- 已註解掉，避免 ReferenceError

  // 檢查 Firebase 配置是否為預設 (可選)
  if (firebaseConfig.apiKey === "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA") {
    console.warn("⚠️ 偵測到示例 Firebase 設定，請記得更新為你自己的專案金鑰！");
    const statusEl = document.getElementById('status');
    if (statusEl) {
        // 不直接覆蓋 statusEl，避免影響正常操作提示
        const warningDiv = document.createElement('div');
        warningDiv.textContent = "⚠️ 請在 task-dispatch.js 中填入你自己的 Firebase 專案設定！";
        warningDiv.style.color = "orange";
        warningDiv.style.fontWeight = "bold";
        statusEl.parentNode.insertBefore(warningDiv, statusEl.nextSibling);
    }
  }
});
