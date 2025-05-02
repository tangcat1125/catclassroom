// --- Firebase SDK 初始化（CDN 模組） ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, serverTimestamp, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// 出席狀態顯示（含統計）
const loginRef = ref(db, 'login');
const studentStatusList = document.getElementById('studentStatusList');

onValue(loginRef, (snapshot) => {
  if (!studentStatusList) return;
  const data = snapshot.val();
  studentStatusList.innerHTML = '';
  const allStudents = [];

  Object.entries(data || {}).forEach(([classType, students]) => {
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

  const total = allStudents.length;
  const title = document.createElement('div');
  title.innerHTML = `<strong class="block text-green-600 mb-2">🟢 總出席人數：${total} 人</strong>`;
  studentStatusList.appendChild(title);

  allStudents.forEach(({ classType, seat, name }) => {
    const row = document.createElement('div');
    row.className = 'student-row';
    row.innerHTML = `<span class="status-dot"></span> ${name}（${classType} ${seat}）`;
    studentStatusList.appendChild(row);
  });
});

// 聊天室顯示
const chatRef = ref(db, 'chat/question1');
const chatDisplay = document.getElementById('teacherChatDisplay');

onValue(chatRef, (snapshot) => {
  if (!chatDisplay) return;
  const messages = snapshot.val();
  chatDisplay.innerHTML = '';

  Object.values(messages || {}).forEach(msg => {
    const p = document.createElement('p');
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '❓';
    p.innerHTML = `<strong>${msg.name}</strong>: ${msg.text} <small>🕒 ${time}</small>`;
    chatDisplay.appendChild(p);
  });

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

// 求救訊號顯示＋可點選清除
const sosRef = ref(db, 'help');
const responseBoard = document.getElementById('responseBoard');

onValue(sosRef, (snapshot) => {
  if (!responseBoard) return;
  const data = snapshot.val();
  responseBoard.innerHTML = '';

  const now = Date.now();
  const MAX_AGE = 60 * 1000;
  let count = 0;

  Object.entries(data || {}).forEach(([seat, info]) => {
    if (!info.name || !info.seat || !info.timestamp) return;
    if (now - info.timestamp > MAX_AGE) return;

    const box = document.createElement('div');
    box.className = 'response-box red';
    const time = new Date(info.timestamp).toLocaleTimeString();
    box.innerHTML = `🆘 ${info.name}（座號 ${info.seat}）發出求救訊號！⏰ ${time} <button class="ml-4 text-sm text-blue-600 underline" data-seat="${seat}">清除</button>`;
    responseBoard.appendChild(box);
    count++;
  });

  if (count === 0) {
    responseBoard.innerHTML = '<p class="text-gray-400 text-sm italic">（目前尚無學生求救訊號）</p>';
  }

  // 綁定清除事件
  document.querySelectorAll('[data-seat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const seat = e.target.getAttribute('data-seat');
      const seatRef = ref(db, `help/${seat}`);
      remove(seatRef);
    });
  });
});
