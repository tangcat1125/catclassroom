// ✅ task-dispatch.js - 智慧手寫任務教師端腳本 (手動上傳版本)
// 功能：發布任務（支持手動上傳背景圖）、生成學生連結、開啟預覽/批閱、複製連結、載入進度、載入繳交清單。
// 使用 Firebase JS SDK v9+

// 移除 html2canvas import
// import html2canvas from 'https://cdn.skypack.dev/html2canvas';

// 導入 Firebase 核心、分析、儲存、即時資料庫模塊
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import {
  getDatabase, ref, set, get, child
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// 🛠️ Firebase 設定：請務必替換為你自己的專案參數
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA", // <-- 請替換
  authDomain: "catclassroom-login.firebaseapp.com", // <-- 請替換
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app", // <-- 請替換
  projectId: "catclassroom-login", // <-- 請替換
  storageBucket: "catclassroom-login.appspot.com", // <-- 請替換
  messagingSenderId: "123487233181", // <-- 請替換
  appId: "1:123487233181:web:aecc2891dc2d1096962074", // <-- 請替換
  measurementId: "G-6C92GYSX3F" // <-- 請替換
};

// 初始化 Firebase App 和服務
const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
  console.log('Firebase Analytics initialized.');
} catch (error) {
  console.warn('Firebase Analytics initialization failed:', error);
}
const db = getDatabase(app);
const storage = getStorage(app);
console.log('Firebase Database and Storage initialized.');


// --- 核心功能函數 ---

/**
 * 📝 發送任務到 Firebase Realtime Database.
 * @param {string} questionId 題目代碼.
 * @param {string} title 任務標題.
 * @param {string} backgroundUrl 背景圖片 URL (選填).
 */
export async function dispatchHandwriteTask(questionId, title, backgroundUrl) {
  const taskData = {
    title,
    backgroundUrl: backgroundUrl || '',
    timestamp: Date.now()
  };
  await set(ref(db, `handwritingTasks/${questionId}`), taskData);
}

// 移除 lazySuperScreenshotDispatch 函數
/*
export async function lazySuperScreenshotDispatch() { ... }
*/

/**
 * 🚀 發布任務：檢查是否有選定的背景圖檔案，若有則上傳，否則使用輸入框的 URL.
 */
export async function publishTask() {
  const questionId = document.getElementById('questionId').value.trim();
  const title = document.getElementById('title').value.trim();
  const backgroundUrlInput = document.getElementById('backgroundUrl'); // 背景圖 URL 輸入框
  const fileInput = document.getElementById('backgroundImageFile'); // 背景圖檔案選擇器
  const statusEl = document.getElementById('status');

  if (!questionId || !title) {
    statusEl.innerText = '❗ 請填寫題目代碼與標題';
    return;
  }

  let finalBackgroundUrl = backgroundUrlInput.value.trim(); // 預設使用輸入框的 URL
  const file = fileInput.files[0]; // 獲取選中的檔案

  statusEl.innerText = '🚀 準備發布任務…';

  try {
    // 檢查是否有選擇檔案
    if (file) {
      statusEl.innerText = `⬆️ 正在上傳背景圖 ${file.name}…`;
      // 為檔案創建一個引用路徑，例如 backgrounds/任務ID.檔案後綴名
      const fileExtension = file.name.split('.').pop();
      const backgroundFileRef = storageRef(storage, `backgrounds/${questionId}.${fileExtension}`);

      // 上傳檔案
      const uploadResult = await uploadBytes(backgroundFileRef, file);
      console.log('Upload successful:', uploadResult);

      // 獲取下載 URL
      finalBackgroundUrl = await getDownloadURL(backgroundFileRef);
      console.log('Background image URL:', finalBackgroundUrl);
      backgroundUrlInput.value = finalBackgroundUrl; // 更新輸入框的值
      statusEl.innerText = '✅ 背景圖上傳成功！正在派送任務…';
    }

    // 無論是否上傳檔案，都執行派送任務
    await dispatchHandwriteTask(questionId, title, finalBackgroundUrl);
    statusEl.innerText = '✅ 任務已派送！';
    console.log('[任務派送完成] 任務 ID:', questionId, '背景 URL:', finalBackgroundUrl || '無');

    // 在介面上顯示通用作答連結
    const previewLinkDisplayEl = document.getElementById('generalLinkDisplay');
    if (previewLinkDisplayEl) {
         const previewUrl = `studentUI.html?questionId=${encodeURIComponent(questionId)}`;
         previewLinkDisplayEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" class="word-break-all">${previewUrl}</code><button class="copy-btn ml-2" data-copy-target="generalLinkCode">📋 複製</button>`;
    }

  } catch (err) {
    console.error('❌ 發布任務失敗', err);
    statusEl.innerText = '❌ 派送失敗：' + err.message;
  } finally {
    // 清空文件選擇器，避免下次誤用舊檔案
    fileInput.value = '';
    // 清空圖片預覽
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
      imagePreview.src = '#';
      imagePreview.style.display = 'none';
    }
  }
}

// --- 其他函數 (generateLink, openPreview, openReview, copyToClipboard, loadProgress, loadImageList) 保持不變 ---
export function generateLink() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();
    const questionId = document.getElementById('questionId').value.trim();
    const generatedLinkEl = document.getElementById('generatedLinkDisplay');

    if (!studentId || !questionId) {
        if(generatedLinkEl) generatedLinkEl.innerHTML = '<p class="text-red-500">❗ 請輸入學生 ID 與題目代碼</p>';
        return;
    }
    const url = `studentUI.html?questionId=${encodeURIComponent(questionId)}&studentId=${encodeURIComponent(studentId)}&name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(studentClass)}`;
    if (generatedLinkEl) {
        generatedLinkEl.innerHTML = `👉 學生作答連結：<br><code id="studentLinkCode" class="word-break-all">${url}</code><button class="copy-btn ml-2" data-copy-target="studentLinkCode">📋 複製</button>`;
    }
    console.log('[產生學生連結]', url);
}
export function openPreview() {
    const questionId = document.getElementById('questionId').value.trim();
    const previewLinkDisplayEl = document.getElementById('previewLinkDisplay');
    if (!questionId) {
        if(previewLinkDisplayEl) previewLinkDisplayEl.innerHTML = '<p class="text-red-500">❗ 請輸入題目代碼</p>';
        return;
    }
    const url = `studentUI.html?questionId=${encodeURIComponent(questionId)}&preview=true`;
    if (previewLinkDisplayEl) {
        previewLinkDisplayEl.innerHTML = `📋 畫布預視連結：<br><code id="previewLinkCode" class="word-break-all">${url}</code><button class="copy-btn ml-2" data-copy-target="previewLinkCode">📋 複製</button>`;
    }
    window.open(url, '_blank');
    console.log('[開啟預覽]', url);
}
export function openReview() {
    const questionId = document.getElementById('questionId').value.trim();
    const reviewLinkDisplayEl = document.getElementById('reviewLinkDisplay');
    if (!questionId) {
        if(reviewLinkDisplayEl) reviewLinkDisplayEl.innerHTML = '<p class="text-red-500">❗ 請輸入題目代碼</p>';
        return;
    }
    const url = `review-handwrite.html?questionId=${encodeURIComponent(questionId)}`;
    if (reviewLinkDisplayEl) {
        reviewLinkDisplayEl.innerHTML = `📝 批閱圖像頁面連結：<br><code id="reviewLinkCode" class="word-break-all">${url}</code><button class="copy-btn ml-2" data-copy-target="reviewLinkCode">📋 複製</button>`;
    }
    window.open(url, '_blank');
    console.log('[開啟批閱]', url);
}
export function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Copy failed: Element with ID "${elementId}" not found.`);
        alert('❌ 複製失敗：找不到指定的元素。');
        return;
    }
    const text = element.innerText;
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('✅ 已複製到剪貼簿！');
            console.log(`[複製成功] 內容來自 ID "${elementId}"`);
        })
        .catch(err => {
            console.error('❌ 複製失敗:', err);
            alert('❌ 複製失敗，請手動複製。');
        });
}
export async function loadProgress() {
    const questionId = document.getElementById('questionId').value.trim();
    const total = parseInt(document.getElementById('totalStudents').value || '0');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    progressStatus.innerText = '統計中...';
    progressBar.style.width = '0%';
    progressBar.innerText = '0%';
    if (!questionId || total <= 0) {
        progressStatus.innerText = '❗ 請輸入題目代碼與有效的出席人數 (> 0)';
        return;
    }
    try {
        const snapshot = await get(child(ref(db), `handwriting/${questionId}`));
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        progressBar.style.width = `${percent}%`;
        progressBar.innerText = `${percent}%`;
        progressStatus.innerText = `📊 已作答 ${count} / ${total} 人`;
        console.log('[作答進度統計完成]', { questionId, submitted: count, total: total });
        // 可以在這裡觸發 loadImageList
        // loadImageList();
    } catch (err) {
        console.error('❌ 載入進度失敗', err);
        progressStatus.innerText = '❌ 載入進度失敗：' + err.message;
        progressBar.style.width = '0%';
        progressBar.innerText = '錯誤';
    }
}
export async function loadImageList() {
    const questionId = document.getElementById('questionId').value.trim();
    const imageListEl = document.getElementById('imageList');
    imageListEl.innerHTML = '載入中...';
    if (!questionId) {
        imageListEl.innerText = '❗ 請輸入題目代碼以載入圖像清單';
        return;
    }
    try {
        const snapshot = await get(child(ref(db), `handwriting/${questionId}`));
        if (!snapshot.exists()) {
            imageListEl.innerText = '🖼️ 目前無此題目的繳交資料';
            console.log('[載入圖像清單] 無資料', { questionId });
            return;
        }
        const data = snapshot.val();
        imageListEl.innerHTML = '';
        Object.entries(data).forEach(([studentId, studentData]) => {
            const imageUrl = studentData.imageUrl || studentData;
            if (imageUrl && typeof imageUrl === 'string') {
                const imgContainer = document.createElement('div');
                imgContainer.style.cssText = 'display:inline-block;text-align:center;margin: 5px; vertical-align: top;';
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `學生 ${studentId}`;
                img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; border: 1px solid #ccc; cursor: pointer;';
                img.title = `學生 ${studentId}`;
                img.onclick = () => window.open(imageUrl, '_blank');
                const studentIdSpan = document.createElement('div');
                studentIdSpan.innerText = studentId;
                studentIdSpan.style.fontSize = '0.8rem';
                studentIdSpan.style.color = '#555';
                imgContainer.appendChild(img);
                imgContainer.appendChild(studentIdSpan);
                imageListEl.appendChild(imgContainer);
            } else {
                console.warn(`[載入圖像清單] 學生 ${studentId} 的數據結構不符預期或無 imageUrl`, studentData);
            }
        });
        console.log('[載入圖像清單完成]', { questionId, count: Object.keys(data).length });
    } catch (err) {
        console.error('❌ 載入圖像清單失敗', err);
        imageListEl.innerText = '❌ 載入圖像清單失敗：' + err.message;
    }
}

// --- DOMContentLoaded 事件監聽器：綁定按鈕事件 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Binding event listeners.');
    const bindClick = (elementId, handler) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
            console.log(`Event listener bound to #${elementId}`);
        } else {
            console.warn(`Element with ID #${elementId} not found for event binding.`);
        }
    };

    bindClick('publishTaskBtn', publishTask);
    // 移除對 lazyScreenshotBtn 的綁定
    // bindClick('lazyScreenshotBtn', lazySuperScreenshotDispatch);
    bindClick('generateLinkBtn', generateLink);
    bindClick('openPreviewBtn', openPreview);
    bindClick('openReviewBtn', openReview);
    bindClick('loadProgressBtn', loadProgress);

    document.body.addEventListener('click', (event) => {
        const copyButton = event.target.closest('.copy-btn');
        if (copyButton) {
            const targetId = copyButton.dataset.copyTarget;
            if (targetId) {
                copyToClipboard(targetId);
            } else {
                console.warn('Copy button clicked but no data-copy-target attribute found.');
            }
        }
    });
    console.log('Event delegation set up for .copy-btn');

    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.warn("請更新 task-dispatch.js 中的 firebaseConfig 為你的專案設定！");
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerText = "⚠️ 請在 task-dispatch.js 中填入你的 Firebase 專案設定！";
    }
});
