// ✅ task-dispatch.js - 智慧手寫任務教師端腳本
// 功能：發布任務、特定區域截圖並派送、生成學生連結、開啟預覽/批閱、複製連結、載入進度、載入繳交清單。
// 使用 Firebase JS SDK v9+ 和 html2canvas。

import html2canvas from 'https://cdn.skypack.dev/html2canvas';
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
  measurementId: "G-6C92GYSX3F" // <-- 請替換 (如果不需要 Analytics 可以移除相關代碼)
};

// 初始化 Firebase App 和服務
const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app); // 初始化 Analytics，如果不需要可以註解掉
  console.log('Firebase Analytics initialized.');
} catch (error) {
  console.warn('Firebase Analytics initialization failed:', error);
  // Analytics 初始化失敗通常不影響其他服務
}
const db = getDatabase(app);
const storage = getStorage(app);
console.log('Firebase Database and Storage initialized.');


// --- 核心功能函數 (匯出供 HTML 或其他模組使用) ---

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

/**
 * 📸 一鍵截圖指定元素 → 上傳 Storage → 更新背景圖連結 → 發送任務.
 */
export async function lazySuperScreenshotDispatch() {
  const questionIdInput = document.getElementById('questionId');
  const titleInput = document.getElementById('title');
  const backgroundUrlInput = document.getElementById('backgroundUrl');
  const targetElement = document.querySelector('#captureTarget');
  const statusEl = document.getElementById('status');
  const lastScreenshotInfoEl = document.getElementById('lastScreenshotInfo'); // 新增：顯示截圖連結的區域

  // 從輸入框獲取或生成預設值
  const questionId = questionIdInput.value.trim() || `Q-${Date.now()}`;
  const title = titleInput.value.trim() || '未命名手寫任務';

  // 更新 UI 輸入框值，即使是預設值
  questionIdInput.value = questionId;
  titleInput.value = title;

  if (!targetElement) {
    statusEl.innerText = '❌ 錯誤：找不到截圖區塊 #captureTarget，請確認頁面中有該區塊。';
    if (lastScreenshotInfoEl) lastScreenshotInfoEl.innerHTML = ''; // 清空舊資訊
    return;
  }

  statusEl.innerText = '📸 擷取畫面中…';
  if (lastScreenshotInfoEl) lastScreenshotInfoEl.innerHTML = ''; // 截圖前清空舊資訊

  try {
    // 1. 截圖
    const canvas = await html2canvas(targetElement);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    // 2. 上傳 Storage
    statusEl.innerText = '⬆️ 上傳圖片中…';
    const fileRef = storageRef(storage, `screenshots/${questionId}.png`);
    await uploadBytes(fileRef, blob);
    const downloadUrl = await getDownloadURL(fileRef);

    // 3. 更新介面背景圖輸入框
    backgroundUrlInput.value = downloadUrl;

    // 4. 在指定區域顯示截圖連結並提供複製按鈕
    if (lastScreenshotInfoEl) {
        lastScreenshotInfoEl.innerHTML = `
            <p class="text-green-600">✅ 截圖成功！圖片連結:</p>
            <code id="screenshotUrlCode" class="block word-break-all">${downloadUrl}</code>
            <button id="copyScreenshotUrlBtn" class="copy-btn mt-2">📋 複製此連結</button>
        `;
        // 綁定複製按鈕事件 (注意：如果在 DOMContentLoaded 中綁定，這裡需要額外處理或委託)
        // 最簡單是在這裡直接綁定，或依賴 DOMContentLoaded 中的事件委託
        // 我們在 DOMContentLoaded 中使用事件委託來處理 .copy-btn，因此這裡不額外綁定
    }


    // 5. 發送任務 (使用截圖作為背景圖 URL)
    statusEl.innerText = '🚀 發送任務中…';
    await dispatchHandwriteTask(questionId, title, downloadUrl);

    statusEl.innerText = '✅ 一鍵截圖派送成功！';
    console.log('[一鍵截圖派送完成] 任務 ID:', questionId, '背景圖連結:', downloadUrl);

  } catch (err) {
    console.error('📸 圖像派送失敗', err);
    statusEl.innerText = '❌ 截圖派送失敗：' + err.message;
    if (lastScreenshotInfoEl) lastScreenshotInfoEl.innerHTML = '';
  }
}

/**
 * 📨 一般派送任務 (使用輸入框中的背景圖 URL).
 */
export async function publishTask() {
  const questionId = document.getElementById('questionId').value.trim();
  const title = document.getElementById('title').value.trim();
  const backgroundUrl = document.getElementById('backgroundUrl').value.trim();
  const statusEl = document.getElementById('status');

  if (!questionId || !title) {
    statusEl.innerText = '❗ 請填寫題目代碼與標題';
    return;
  }

  statusEl.innerText = '🚀 發送任務中…';
  try {
    await dispatchHandwriteTask(questionId, title, backgroundUrl);
    statusEl.innerText = '✅ 任務已派送';
    console.log('[一般派送任務完成] 任務 ID:', questionId);
    // 在介面上顯示通用作答連結
    const previewLinkDisplayEl = document.getElementById('generalLinkDisplay'); // 更新 ID
    if (previewLinkDisplayEl) {
         const previewUrl = `studentUI.html?questionId=${encodeURIComponent(questionId)}`; // 假設通用連結格式
         previewLinkDisplayEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" class="word-break-all">${previewUrl}</code><button class="copy-btn ml-2" data-copy-target="generalLinkCode">📋 複製</button>`;
    }
  } catch (err) {
    console.error('❌ 發送任務失敗', err);
    statusEl.innerText = '❌ 派送失敗：' + err.message;
  }
}

/**
 * 🔗 根據學生資訊產生作答連結.
 */
export function generateLink() {
  const studentId = document.getElementById('studentId').value.trim();
  const studentName = document.getElementById('studentName').value.trim();
  const studentClass = document.getElementById('studentClass').value.trim();
  const questionId = document.getElementById('questionId').value.trim();
  const generatedLinkEl = document.getElementById('generatedLinkDisplay'); // 更新 ID

  if (!studentId || !questionId) { // 允許姓名班級為空
     if(generatedLinkEl) generatedLinkEl.innerHTML = '<p class="text-red-500">❗ 請輸入學生 ID 與題目代碼</p>';
     return;
  }

  const url = `studentUI.html?questionId=${encodeURIComponent(questionId)}&studentId=${encodeURIComponent(studentId)}&name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(studentClass)}`;

  if (generatedLinkEl) {
      generatedLinkEl.innerHTML = `👉 學生作答連結：<br><code id="studentLinkCode" class="word-break-all">${url}</code><button class="copy-btn ml-2" data-copy-target="studentLinkCode">📋 複製</button>`;
  }
  console.log('[產生學生連結]', url);
}

/**
 * 🖼️ 產生並開啟畫布預覽連結.
 */
export function openPreview() {
  const questionId = document.getElementById('questionId').value.trim();
  const previewLinkDisplayEl = document.getElementById('previewLinkDisplay'); // ID 不變，用於顯示

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

/**
 * ✏️ 產生並開啟批閱連結.
 */
export function openReview() {
  const questionId = document.getElementById('questionId').value.trim();
  const reviewLinkDisplayEl = document.getElementById('reviewLinkDisplay'); // 新增 ID

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

/**
 * 📋 複製指定元素的文字內容到剪貼簿.
 * @param {string} elementId 要複製內容的元素 ID.
 */
export function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
      console.error(`Copy failed: Element with ID "${elementId}" not found.`);
      alert('❌ 複製失敗：找不到指定的元素。');
      return;
  }
  const text = element.innerText; // 或者 element.textContent
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

/**
 * 📊 計算作答進度並更新介面.
 * 讀取 handwriting/{questionId} 下的學生數量。
 */
export async function loadProgress() {
  const questionId = document.getElementById('questionId').value.trim();
  const total = parseInt(document.getElementById('totalStudents').value || '0');
  const progressBar = document.getElementById('progressBar');
  const progressStatus = document.getElementById('progressStatus');

  // 清空舊狀態和進度條
  progressStatus.innerText = '統計中...';
  progressBar.style.width = '0%';
  progressBar.innerText = '0%';

  if (!questionId || total <= 0) {
    progressStatus.innerText = '❗ 請輸入題目代碼與有效的出席人數 (> 0)';
    return;
  }

  try {
    // 優化：只讀取特定題目的作答數據
    const snapshot = await get(child(ref(db), `handwriting/${questionId}`));
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    progressBar.style.width = `${percent}%`;
    progressBar.innerText = `${percent}%`;
    progressStatus.innerText = `📊 已作答 ${count} / ${total} 人`;
    console.log('[作答進度統計完成]', { questionId, submitted: count, total: total });

  } catch (err) {
    console.error('❌ 載入進度失敗', err);
    progressStatus.innerText = '❌ 載入進度失敗：' + err.message;
    progressBar.style.width = '0%';
    progressBar.innerText = '錯誤';
  }
}

/**
 * 🖼️ 載入特定題目已繳交的圖像清單.
 * 假設 Firebase 結構是 handwriting/{questionId}/{studentId} = imageUrl
 * 如果你的結構是 {studentId: {imageUrl: ..., timestamp: ...}} 需要修改此函數。
 */
export async function loadImageList() {
  const questionId = document.getElementById('questionId').value.trim();
  const imageListEl = document.getElementById('imageList');

  // 清空舊列表並顯示載入中
  imageListEl.innerHTML = '載入中...';

  if (!questionId) {
    imageListEl.innerText = '❗ 請輸入題目代碼以載入圖像清單';
    return;
  }

  try {
    // 優化：只讀取特定題目的作答數據
    const snapshot = await get(child(ref(db), `handwriting/${questionId}`));

    if (!snapshot.exists()) {
      imageListEl.innerText = '🖼️ 目前無此題目的繳交資料';
      console.log('[載入圖像清單] 無資料', { questionId });
      return;
    }

    const data = snapshot.val();
    imageListEl.innerHTML = ''; // 清空 "載入中..."

    // 遍歷每個學生的繳交資料
    Object.entries(data).forEach(([studentId, studentData]) => {
        // 假設數據結構是 { "studentId1": { imageUrl: "...", timestamp: ... }, ... }
        // 如果是 { "studentId1": "imageUrl1", ... }，請使用 const imageUrl = studentData;
        const imageUrl = studentData.imageUrl || studentData; // 兼容兩種可能的結構

        if (imageUrl && typeof imageUrl === 'string') {
            const imgContainer = document.createElement('div'); // 容器用於圖片和文字
            imgContainer.style.cssText = 'display:inline-block;text-align:center;margin: 5px; vertical-align: top;'; // 設置樣式

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `學生 ${studentId}`;
            img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; border: 1px solid #ccc; cursor: pointer;'; // 設置圖片樣式
            img.title = `學生 ${studentId}`; // Hover 提示
            img.onclick = () => window.open(imageUrl, '_blank'); // 點擊開啟大圖

            const studentIdSpan = document.createElement('div');
            studentIdSpan.innerText = studentId; // 顯示學生 ID
            studentIdSpan.style.fontSize = '0.8rem';
            studentIdSpan.style.color = '#555';

            imgContainer.appendChild(img);
            imgContainer.appendChild(studentIdSpan); // 在圖片下方顯示學生 ID
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


// --- DOMContentLoaded 事件監聽器：在頁面完全載入後綁定按鈕事件 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Binding event listeners.');

    // 輔助函數：安全地獲取元素並綁定事件
    const bindClick = (elementId, handler) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
            console.log(`Event listener bound to #${elementId}`);
        } else {
            console.warn(`Element with ID #${elementId} not found for event binding.`);
        }
    };

    // 綁定各功能按鈕
    bindClick('publishTaskBtn', publishTask);
    bindClick('lazyScreenshotBtn', lazySuperScreenshotDispatch);
    bindClick('generateLinkBtn', generateLink);
    bindClick('openPreviewBtn', openPreview);
    bindClick('openReviewBtn', openReview);
    bindClick('loadProgressBtn', loadProgress);
    // 綁定載入圖像清單按鈕 (假設需要額外按鈕觸發)
    // 如果希望 loadProgress 後自動載入圖像，可以在 loadProgress 函數結尾呼叫 loadImageList()
    // bindClick('loadImageListBtn', loadImageList); // 如果需要一個獨立按鈕

    // 綁定所有通用複製按鈕 (使用事件委託或直接遍歷)
    // 使用事件委託的好處是，即使是後續動態加入頁面的複製按鈕（如生成連結後），也能作用。
    document.body.addEventListener('click', (event) => {
        // 檢查點擊的元素或其父元素是否是 .copy-btn
        const copyButton = event.target.closest('.copy-btn');
        if (copyButton) {
            const targetId = copyButton.dataset.copyTarget; // 獲取 data-copy-target 屬性
            if (targetId) {
                copyToClipboard(targetId);
            } else {
                console.warn('Copy button clicked but no data-copy-target attribute found.');
            }
        }
    });
    console.log('Event delegation set up for .copy-btn');

    // 額外綁定針對一鍵截圖連結的複製按鈕 (如果在 #lastScreenshotInfo 區域內)
    // 由於 #lastScreenshotInfo 的內容是動態替換的，直接綁定 #copyScreenshotUrlBtn 無效。
    // 最好也是通過事件委託來處理。
    // 我們上面的 .copy-btn 事件委託已經可以處理 #copyScreenshotUrlBtn 了，只要 HTML 中該按鈕 class 是 .copy-btn
    // 並設定 data-copy-target="screenshotUrlCode"
    // 如果你不使用 .copy-btn class，需要另外一個事件委託來處理 #copyScreenshotUrlBtn 的點擊事件
    // 例如：
    /*
    if (lastScreenshotInfoEl) { // 如果 #lastScreenshotInfo 元素存在
        lastScreenshotInfoEl.addEventListener('click', (event) => {
            if (event.target.id === 'copyScreenshotUrlBtn') {
                 copyToClipboard('screenshotUrlCode');
            }
        });
        console.log('Event delegation set up for #copyScreenshotUrlBtn within #lastScreenshotInfo');
    }
    */

    // 提示使用者需要填寫 Firebase config
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.warn("請更新 task-dispatch.js 中的 firebaseConfig 為你的專案設定！");
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerText = "⚠️ 請在 task-dispatch.js 中填入你的 Firebase 專案設定！";
    }
});

// --- HTML 介面所需的元素 ID 列表 (供參考，確保你的 index.html 包含這些) ---
/*
期望存在的 HTML 元素 ID:
- #questionId (input)
- #title (input)
- #backgroundUrl (input)
- #captureTarget (要被截圖的區塊)
- #status (顯示狀態訊息)
- #lastScreenshotInfo (顯示截圖連結和複製按鈕的新區域)
- #studentId (input)
- #studentName (input)
- #studentClass (input)
- #totalStudents (input)
- #generalLinkDisplay (顯示通用連結)
- #generatedLinkDisplay (顯示學生專屬連結)
- #previewLinkDisplay (顯示預覽連結)
- #reviewLinkDisplay (顯示批閱連結)
- #progressStatus (顯示進度文字)
- #progressBar (顯示進度條)
- #imageList (顯示圖像清單)

期望存在的 HTML 按鈕 ID (或使用 class="copy-btn" data-copy-target="..." 配合委託):
- #publishTaskBtn
- #lazyScreenshotBtn
- #generateLinkBtn
- #openPreviewBtn
- #openReviewBtn
- #loadProgressBtn
- #copyScreenshotUrlBtn (位於 #lastScreenshotInfo 內，class="copy-btn" data-copy-target="screenshotUrlCode")
- 其他複製按鈕 (.copy-btn 配合 data-copy-target 屬性)
*/
