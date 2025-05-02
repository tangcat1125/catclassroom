// --- Firebase SDK 初始化（CDN 模組） ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Firebase 配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.firebasestorage.app",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 白貓教師端 main.js：正確設定所有按鈕功能與連結 ---

// 1. 複製學生登入連結
const copyLinkBtn = document.getElementById('copyLinkButton');
if (copyLinkBtn) {
  copyLinkBtn.addEventListener('click', () => {
    const input = document.getElementById('login-link');
    input.select();
    document.execCommand('copy');
    alert("已複製學生登入連結！");
  });
} else {
  console.warn("[DOM] 找不到 copyLinkButton");
}

// 2. 出題面板（目前尚未實作）
const questionPanelBtn = document.getElementById('questionPanelButton');
if (questionPanelBtn) {
  questionPanelBtn.addEventListener('click', () => {
    alert("👉 出題面板功能尚未實作，可用於單題設計。");
  });
}

// 3. 擷圖派題（✅ 正確連結 capture.html）
const screenshotBtn = document.getElementById('screenshotButton');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', () => {
    window.location.href = 'https://tangcat1125.github.io/catclassroom/teacher-ui/task-capture/capture.html';
  });
}

// 4. 教室管理（尚未實作）
const classroomMgmtBtn = document.getElementById('classroomMgmtButton');
if (classroomMgmtBtn) {
  classroomMgmtBtn.addEventListener('click', () => {
    alert("🔧 教室管理功能尚未實作。");
  });
}

// 5. 出題小精靈（尚未實作）
const quizBtn = document.getElementById('quizButton');
if (quizBtn) {
  quizBtn.addEventListener('click', () => {
    alert("✨ 出題小精靈功能尚未實作。");
  });
}

// 6. 派題中心（✅ 正確連結 task-center.html）
const dispatchBtn = document.getElementById('dispatchButton');
if (dispatchBtn) {
  dispatchBtn.addEventListener('click', () => {
    window.location.href = 'https://tangcat1125.github.io/catclassroom/task-system/task-center.html';
  });
}

// 7. 返回首頁
const backBtn = document.getElementById('backButton');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = 'https://tangcat1125.github.io/catclassroom/';
  });
}

// 8. 監聽學生求救訊號（/help）
const sosRef = ref(db, 'help');
const responseBoard = document.getElementById('responseBoard');

onValue(sosRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    responseBoard.innerHTML = '<p class="text-gray-400 text-sm italic">（尚無學生求救...）</p>';
    return;
  }

  responseBoard.innerHTML = ''; // 清空舊資料

  Object.entries(data).forEach(([seat, info]) => {
    const box = document.createElement('div');
    box.className = 'response-box red';
    const time = new Date(info.timestamp).toLocaleTimeString();
    box.textContent = `🆘 ${info.name}（座號 ${info.seat}）發出求救訊號！⏰ ${time}`;
    responseBoard.appendChild(box);
  });
});
