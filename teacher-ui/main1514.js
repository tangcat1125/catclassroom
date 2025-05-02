// --- Firebase SDK 初始化（CDN 模組） ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// 1. 複製學生登入連結
const copyLinkBtn = document.getElementById('copyLinkButton');
if (copyLinkBtn) {
  copyLinkBtn.addEventListener('click', () => {
    const input = document.getElementById('login-link');
    input.select();
    document.execCommand('copy');
    alert("已複製學生登入連結！");
  });
}

// 2. 功能按鈕跳轉（略）... 保留原樣略去顯示

// 3. 出席狀態燈號顯示，依「本班優先、座號排序」
const loginRef = ref(db, 'login');
const studentStatusList = document.getElementById('studentStatusList');

onValue(loginRef, (snapshot) => {
  const data = snapshot.val();
  studentStatusList.innerHTML = '';

  if (!data) {
    studentStatusList.innerHTML = '<p class="text-gray-400 text-sm italic">（尚無學生登入）</p>';
    return;
  }

  const allStudents = [];

  Object.entries(data).forEach(([classType, students]) => {
    Object.entries(students).forEach(([seat, info]) => {
      allStudents.push({ classType, seat, name: info.name });
    });
  });

  allStudents.sort((a, b) => {
    if (a.classType === '本班' && b.classType !== '本班') return -1;
    if (a.classType !== '本班' && b.classType === '本班') return 1;
    const numA = parseInt(a.seat.replace(/^G/i, '99')) || 999;
    const numB = parseInt(b.seat.replace(/^G/i, '99')) || 999;
    return numA - numB;
  });

  allStudents.forEach(({ classType, seat, name }) => {
    const row = document.createElement('div');
    row.className = 'student-row';
    row.innerHTML = `<span class="status-dot green"></span> ${name}（${classType} ${seat}）`;
    studentStatusList.appendChild(row);
  });
});

// 4. 課程聊天室訊息同步
const chatRef = ref(db, 'chat/question1');
const chatDisplay = document.getElementById('teacherChatDisplay');

onValue(chatRef, (snapshot) => {
  const messages = snapshot.val();
  chatDisplay.innerHTML = '';

  if (!messages) {
    chatDisplay.innerHTML = '<p class="text-gray-400 text-sm italic">（聊天室尚無訊息...）</p>';
    return;
  }

  Object.values(messages).forEach(msg => {
    const p = document.createElement('p');
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '❓';
    p.innerHTML = `<strong>${msg.name}</strong>: ${msg.text} <small>🕒 ${time}</small>`;
    chatDisplay.appendChild(p);
  });

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

// 5. 監聽學生求救訊號（/help）
const sosRef = ref(db, 'help');
const responseBoard = document.getElementById('responseBoard');

onValue(sosRef, (snapshot) => {
  const data = snapshot.val();
  responseBoard.innerHTML = '';

  const now = Date.now();
  const MAX_AGE = 60 * 1000; // 顯示 60 秒內的訊號

  if (!data) {
    responseBoard.innerHTML = '<p class="text-gray-400 text-sm italic">（目前尚無學生求救訊號）</p>';
    return;
  }

  let count = 0;

  Object.entries(data).forEach(([seat, info]) => {
    if (!info.name || !info.seat || !info.timestamp) return;
    if (now - info.timestamp > MAX_AGE) return;

    const box = document.createElement('div');
    box.className = 'response-box red';
    const time = new Date(info.timestamp).toLocaleTimeString();
    box.textContent = `🆘 ${info.name}（座號 ${info.seat}）發出求救訊號！⏰ ${time}`;
    responseBoard.appendChild(box);
    count++;
  });

  if (count === 0) {
    responseBoard.innerHTML = '<p class="text-gray-400 text-sm italic">（目前尚無學生求救訊號）</p>';
  }
});
