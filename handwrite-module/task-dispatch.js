// ✅ 修正版 task-dispatch.js - 支援貼圖上傳、背景圖參數連結、自動同步 teacher/currentQuestion
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
await set(ref(db, handwritingTasks/${questionId}), taskData);
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
statusEl.innerText = ⬆️ 正在上傳背景圖 ${file.name}…;
const ext = file.name.split('.').pop();
const bgRef = storageRef(storage, handwritingTasks/${questionId}.${ext});
await uploadBytes(bgRef, file);
finalBackgroundUrl = await getDownloadURL(bgRef);
backgroundUrlInput.value = finalBackgroundUrl;
statusEl.innerText = '✅ 背景圖上傳成功！正在派送任務…';
}
await dispatchHandwriteTask(questionId, title, finalBackgroundUrl);
const previewUrl = `handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&backgroundUrl=${encodeURIComponent(finalBackgroundUrl)}`;

// ✅ 同步寫入 /teacher/currentQuestion
await set(ref(db, 'teacher/currentQuestion'), {
  questionId,
  title,
  backgroundUrl: finalBackgroundUrl,
  link: previewUrl,
  timestamp: Date.now()
});

statusEl.innerText = '✅ 任務已派送！';
const previewEl = document.getElementById('generalLinkDisplay');
if (previewEl) {
  previewEl.innerHTML = `📎 通用作答連結：<br><code id="generalLinkCode" class="word-break-all">${previewUrl}</code><button class="copy-btn ml-2" data-copy-target="generalLinkCode">📋 複製</button>`;
}
Use code with caution.
} catch (err) {
console.error('❌ 發布任務失敗', err);
statusEl.innerText = '❌ 發布任務失敗：' + err.message;
}
}
export function generateLink() {
const studentId = document.getElementById('studentId').value.trim();
const studentName = document.getElementById('studentName').value.trim();
const studentClass = document.getElementById('studentClass').value.trim();
const questionId = document.getElementById('questionId').value.trim();
const backgroundUrl = document.getElementById('backgroundUrl').value.trim();
const generatedLinkEl = document.getElementById('generatedLinkDisplay');
if (!studentId || !questionId) {
if (generatedLinkEl) generatedLinkEl.innerHTML = '<p class="text-red-500">❗ 請輸入學生 ID 與題目代碼</p>';
return;
}
const url = handwrite-upload.html?questionId=${encodeURIComponent(questionId)}&studentId=${encodeURIComponent(studentId)}&name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(studentClass)}&backgroundUrl=${encodeURIComponent(backgroundUrl)};
if (generatedLinkEl) {
generatedLinkEl.innerHTML = 👉 學生作答連結：<br><code id="studentLinkCode" class="word-break-all">${url}</code><button class="copy-btn ml-2" data-copy-target="studentLinkCode">📋 複製</button>;
}
console.log('[產生學生連結]', url);
}
// 🖼️ 支援貼圖與拖曳圖片上傳為背景圖
window.addEventListener('paste', async (e) => {
const items = e.clipboardData?.items;
if (items) {
for (let item of items) {
if (item.type.startsWith('image/')) {
const file = item.getAsFile();
if (file) handlePastedImage(file);
}
}
}
});
document.getElementById('pasteZone')?.addEventListener('drop', async (e) => {
e.preventDefault();
const file = e.dataTransfer.files[0];
if (file && file.type.startsWith('image/')) {
handlePastedImage(file);
}
});
document.getElementById('pasteZone')?.addEventListener('dragover', (e) => e.preventDefault());
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
statusEl.innerText = ⬆️ 正在上傳貼上的圖片…;
const ext = file.name.split('.').pop() || 'png';
const bgRef = storageRef(storage, handwritingTasks/${questionId}.${ext});
await uploadBytes(bgRef, file);
const url = await getDownloadURL(bgRef);
preview.src = URL.createObjectURL(file);
preview.style.display = 'block';
backgroundUrlInput.value = url;
statusEl.innerText = ✅ 貼圖上傳成功，請點擊「發布任務」！;
console.log('[貼圖上傳]', url);
} catch (err) {
console.error('[貼圖上傳失敗]', err);
statusEl.innerText = '❌ 貼圖上傳失敗：' + err.message;
}
}
warning
