// student-ui.js 版本:v6.3 修正時間:2025-05-01 13:05
// --- START OF FILE student-ui.js (v6.3：修正 escapeHtml + 求救功能) ---
console.log("載入 student-ui.js (v6.3)...");

// --------------------------------------------------
// 1. 引入 Firebase 模組
// --------------------------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getDatabase, ref, onValue, set, push, off } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

// --------------------------------------------------
// 2. Firebase 配置 (請自行替換成實際專案設定)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// --------------------------------------------------
// 3. 初始化 Firebase
// --------------------------------------------------
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log('✅ Firebase 已完成初始化');
} catch (e) {
  console.error('Firebase 初始化失敗！', e);
  alert('頁面初始化失敗(Firebase Init Error)，請檢查網路或聯繫管理員。');
  throw e;
}

// --------------------------------------------------
// 4. 全域變數
// --------------------------------------------------
const TOTAL_STUDENTS = 13;
let studentId, studentName, studentClass;
let el = {}, currentChatListenerRef = null;

// --------------------------------------------------
// 5. DOM Ready 處理
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadStudentInfo();
  cacheDOM();
  renderStudentInfo();
  setupEventListeners();
  setupFirebaseListeners();
});

// --------------------------------------------------
// 6. 載入與渲染學生資訊
// --------------------------------------------------
function loadStudentInfo() {
  studentId = sessionStorage.getItem('studentId') || '';
  studentName = sessionStorage.getItem('studentName') || '匿名';
  studentClass = sessionStorage.getItem('studentClass') || '';
  if (!studentId) {
    const now = Date.now();
    studentId = `guest_${now}`;
    studentName = '訪客';
    studentClass = '訪客';
    sessionStorage.setItem('studentId', studentId);
    sessionStorage.setItem('studentName', studentName);
    sessionStorage.setItem('studentClass', studentClass);
  }
}

function renderStudentInfo() {
  if (el.nameSpan) el.nameSpan.textContent = studentName;
  if (el.classSpan) el.classSpan.textContent = studentClass;
}

// --------------------------------------------------
// 7. 安全 HTML 轉義
// --------------------------------------------------
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --------------------------------------------------
// 8. 快取 DOM 元素
// --------------------------------------------------
function cacheDOM() {
  el.nameSpan = document.getElementById('student-name');
  el.classSpan = document.getElementById('student-class');
  el.sysMsg = document.getElementById('systemMessage');
  el.chatList = document.getElementById('chatList');
  el.chatInput = document.getElementById('chatInput');
  el.sendBtn = document.querySelector('.send-btn');
  // 求救元素
  el.helpBtn = document.getElementById('help-button');
  el.helpForm = document.getElementById('help-form');
  el.helpInput = document.getElementById('help-text');
  el.helpSendBtn = document.getElementById('help-send-btn');
  el.helpStatus = document.getElementById('help-status');
  // 其他元素略...
}

// --------------------------------------------------
// 9. 綁定事件監聽
// --------------------------------------------------
function setupEventListeners() {
  // 聊天送出
  if (el.sendBtn) el.sendBtn.addEventListener('click', sendChatMessage);
  // 求救切換
  if (el.helpBtn && el.helpForm) {
    el.helpBtn.addEventListener('click', () => {
      el.helpForm.style.display = el.helpForm.style.display === 'block' ? 'none' : 'block';
    });
  }
  // 求救送出
  if (el.helpSendBtn) el.helpSendBtn.addEventListener('click', sendHelp);
}

// --------------------------------------------------
// 10. Firebase 監聽設定
// --------------------------------------------------
function setupFirebaseListeners() {
  // 老師出題
  const qRef = ref(db, 'teacher/currentQuestion');
  onValue(qRef, snap => handleQuestion(snap.val()), err => console.error('監聽題目失敗:', err));
  // 初始聊天室
  switchChatListener('lobby', '大廳');
}

// --------------------------------------------------
// 11. 切換聊天室監聽 & 送訊息
// --------------------------------------------------
function switchChatListener(qid, title) {
  if (currentChatListenerRef) off(currentChatListenerRef);
  currentChatListenerRef = ref(db, `chat/${qid}`);
  onValue(currentChatListenerRef, snap => {
    const data = snap.val() || {};
    el.chatList.innerHTML = '';
    Object.values(data).forEach(msg => {
      const li = document.createElement('li');
      li.textContent = `${msg.from || msg.studentId}: ${msg.text || msg.message}`;
      el.chatList.appendChild(li);
    });
  });
  if (el.sysMsg) el.sysMsg.textContent = `聊天室：${title}`;
}

window.sendChatMessage = () => {
  const target = sessionStorage.getItem('questionId') || 'lobby';
  const text = el.chatInput.value.trim();
  if (!text) return;
  push(ref(db, `chat/${target}`), {
    studentId,
    from: studentName,
    text,
    time: new Date().toISOString()
  });
  el.chatInput.value = '';
};

// 12. 處理題目 & 作答
function handleQuestion(q) { /* 原有 handleQuestion 實作 */ }

// 13. 求救功能
function sendHelp() {
  const msg = el.helpInput.value.trim();
  if (!msg) return alert('請輸入求救內容！');
  el.helpStatus.textContent = '🚧 傳送中...';
  el.helpStatus.style.display = 'block';
  set(ref(db, `help/${studentId}`), {
    from: studentName,
    studentId,
    class: studentClass,
    message: msg,
    time: new Date().toISOString()
  })
    .then(() => {
      el.helpStatus.textContent = '✅ 已傳送！老師正在查看中…';
      el.helpInput.value = '';
      setTimeout(() => {
        el.helpForm.style.display = 'none';
        el.helpStatus.style.display = 'none';
      }, 3000);
    })
    .catch(e => {
      console.error('求救失敗', e);
      alert('❌ 求救失敗：' + e.message);
      el.helpStatus.style.display = 'none';
    });
}

console.log('student-ui.js (v6.3 顯示) 完成載入');
// --- END OF FILE student-ui.js ---
