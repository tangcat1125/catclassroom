// ✅ 整合修正版 task-dispatch.js - 包含正確配置、貼圖、teacher/currentQuestion、學生連結背景圖
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"; // 使用 Grok 的 Firebase SDK 版本
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"; // 注意 child 的引入
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
// getAnalytics 可以選擇性保留，如果需要分析功能
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";


// 【重要】使用你自己的 Firebase 配置！
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA", // <-- 你的金鑰
  authDomain: "catclassroom-login.firebaseapp.com",  // <-- 你的網域
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app", // <-- 你的資料庫URL
  projectId: "catclassroom-login",                   // <-- 你的專案ID
  storageBucket: "catclassroom-login.appspot.com",   // <-- 你的 Storage 儲存桶 (注意：Grok 的規則是 .firebasestorage.app，但你的配置是 .appspot.com，請確認哪個是正確的，通常 SDK 會處理)
  messagingSenderId: "123487233181",               // <-- 你的 Sender ID
  appId: "1:123487233181:web:aecc2891dc2d1096962074", // <-- 你的 App ID
  measurementId: "G-6C92GYSX3F"                      // <-- 你的 Measurement ID (可選)
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
// try { getAnalytics(app); console.log('[Firebase] Analytics initialized.'); } catch(e) { console.warn('[Firebase] Analytics init failed:', e); }
console.log('[Firebase] Database and Storage initialized.');


// --- 任務派送相關 (合併 Grok 的 timeLimit) ---
export async function dispatchHandwriteTask(questionId, title, backgroundUrl) {
  console.log('[dispatchHandwriteTask] Attempting to dispatch:', { questionId, title, backgroundUrl });
  const taskData = {
    title: title,
    backgroundUrl: backgroundUrl || '', // 確保 backgroundUrl 不是 undefined
    releaseTimestamp: Date.now(),
    timeLimit: 10 * 60 * 1000 // 10 分鐘限制 (來自 Grok)
  };
  try {
    await set(ref(db, `handwritingTasks/${questionId}`), taskData);
    console.log('[dispatchHandwriteTask] Successfully dispatched to handwritingTasks:', questionId);
  } catch (error) {
    console.error('[dispatchHandwriteTask] Error dispatching to handwritingTasks:', error);
    throw error;
  }
}

// --- 發布任務主函數 (整合並修正) ---
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
      const fileExtension = file.name.split('.').pop() || 'png';
      // ✅ 使用 Grok 建議的 backgrounds/ 路徑
      const backgroundFileRef = storageRef(storage, `backgrounds/${questionId}.${fileExtension}`);
      console.log('[publishTask] Uploading to Storage path:', `backgrounds/${questionId}.${fileExtension}`);
      await uploadBytes(backgroundFileRef, file);
      console.log('[publishTask] Upload to Storage successful.');
      finalBackgroundUrl = await getDownloadURL(backgroundFileRef);
      console.log('[publishTask] Obtained download URL:', finalBackgroundUrl);
      backgroundUrlInput.value = finalBackgroundUrl;
      statusEl.innerText = '✅ 背景圖上傳成功，準備派送…';
    } else {
      console.log('[publishTask] No file selected for background. Using backgroundUrlInput value if any.');
    }

    await dispatchHandwriteTask(questionId, title, finalBackgroundUrl);

    // ✅ 修正學生連結，加入 backgroundUrl
    const studentLinkUrl = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&backgroundUrl=${encodeURIComponent(finalBackgroundUrl || '')}`;
    console.log('[DEBUG] studentLinkUrl for generalLinkDisplay and teacher/currentQuestion:', studentLinkUrl);

    // ✅ 同步到 /teacher/currentQuestion
    try {
      await set(ref(db, 'teacher/currentQuestion'), {
        questionId,
        title,
        backgroundUrl: finalBackgroundUrl || '',
        link: studentLinkUrl, // 使用修正後的學生連結
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
      previewEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" style="word-break:break-all;">${studentLinkUrl}</code><button class="copy-btn" data-copy-target="generalLinkCode" style="margin-left:0.5rem;">📋 複製</button>`;
    } else {
      console.warn('[publishTask] Element with ID "generalLinkDisplay" not found for preview link.');
    }

  } catch (err) {
    console.error('❌ 發布任務失敗 (Outer Catch)', err);
    statusEl.innerText = '❌ 發布任務失敗：' + (err.message || '未知錯誤');
    // 可以考慮在 fileInput.value = ''; 清空選擇的檔案，避免重複提交相同檔案
    if(fileInput) fileInput.value = '';
  }
}

// --- 貼圖相關 (從我們之前的版本複製過來) ---
window.addEventListener('paste', async (e) => {
  console.log('[DEBUG][Paste] Paste event triggered!');
  if (!e.clipboardData) {
    console.log('[DEBUG][Paste] clipboardData is not available.');
    return;
  }
  const items = e.clipboardData.items;
  if (items && items.length > 0) {
    console.log('[DEBUG][Paste] Clipboard items found:', items.length);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`[DEBUG][Paste] Checking item ${i} type:`, item.type, 'kind:', item.kind);
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        console.log('[DEBUG][Paste] Image file item found! Getting file...');
        const file = item.getAsFile();
        if (file) {
          console.log('[DEBUG][Paste] File obtained:', file.name, file.type, file.size, 'bytes');
          handlePastedImage(file);
          return;
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
    // ✅ 使用 Grok 建議的 backgrounds/ 路徑
    const bgRef = storageRef(storage, `backgrounds/${questionId}.${ext}`);
    console.log('[handlePastedImage] Uploading to Storage path:', `backgrounds/${questionId}.${ext}`);
    await uploadBytes(bgRef, file);
    console.log('[handlePastedImage] Upload to Storage successful.');
    const url = await getDownloadURL(bgRef);
    console.log('[handlePastedImage] Obtained download URL:', url);

    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    backgroundUrlInput.value = url;
    statusEl.innerText = `✅ 貼圖上傳成功，請點擊「發布任務」！`;
    console.log('[handlePastedImage] Paste upload successful. URL:', url);

  } catch (err) {
    console.error('[handlePastedImage] 貼圖上傳或獲取URL失敗:', err);
    statusEl.innerText = '❌ 貼圖上傳失敗：' + (err.message || '未知錯誤');
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

// --- DOMContentLoaded (註解掉 generateLink 的綁定) ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DOMContentLoaded] DOM fully loaded. Binding core event listeners.');
  bindClick('publishTaskBtn', publishTask);
  // bindClick('generateLinkBtn', generateLink); // <-- 暫時註解，除非你已恢復 generateLink 函數並有對應HTML

  if (firebaseConfig.apiKey === "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA") {
    console.warn("⚠️ 偵測到示例 Firebase 設定，請記得更新為你自己的專案金鑰！");
    const statusEl = document.getElementById('status');
    if (statusEl && statusEl.parentNode) { // 確保 statusEl 及其父節點存在
        const warningDiv = document.createElement('div');
        warningDiv.textContent = "⚠️ 請在 task-dispatch.js 中填入你自己的 Firebase 專案設定！";
        warningDiv.style.color = "orange";
        warningDiv.style.fontWeight = "bold";
        statusEl.parentNode.insertBefore(warningDiv, statusEl.nextSibling);
    }
  }
});

// 如果需要 generateLink 功能，請取消以下註解並確保 HTML 中有對應的元素
/*
export function generateLink() {
    const studentIdInput = document.getElementById('studentId');
    const studentNameInput = document.getElementById('studentName');
    const studentClassInput = document.getElementById('studentClass');
    const questionIdInput = document.getElementById('questionId');
    const backgroundUrlInput = document.getElementById('backgroundUrl');
    const generatedLinkEl = document.getElementById('generatedLinkDisplayForStudent'); // 建議不同 ID

    const studentId = studentIdInput ? studentIdInput.value.trim() : '';
    const studentName = studentNameInput ? studentNameInput.value.trim() : '';
    const studentClass = studentClassInput ? studentClassInput.value.trim() : '';
    const questionId = questionIdInput ? questionIdInput.value.trim() : '';
    const backgroundUrl = backgroundUrlInput ? backgroundUrlInput.value.trim() : '';

    if (!studentId && generatedLinkEl) {
        generatedLinkEl.innerHTML = '<p style="color:red;">❗ 請輸入學生 ID</p>';
        return;
    }
    if (!questionId && generatedLinkEl) {
        generatedLinkEl.innerHTML = '<p style="color:red;">❗ 請確保題目代碼已填寫</p>';
        return;
    }

    const studentParams = studentId ? `&studentId=${encodeURIComponent(studentId)}&name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(studentClass)}` : '';
    const url = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}${studentParams}&backgroundUrl=${encodeURIComponent(backgroundUrl)}`;

    if (generatedLinkEl) {
        generatedLinkEl.innerHTML = `👉 學生作答連結：<br><code id="studentLinkCode" style="word-break:break-all;">${url}</code><button class="copy-btn" data-copy-target="studentLinkCode" style="margin-left:0.5rem;">📋 複製</button>`;
    } else {
        console.warn('Element with ID "generatedLinkDisplayForStudent" not found.');
    }
    console.log('[產生學生連結]', url);
}
*/
