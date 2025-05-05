// ✅ main.js - 教師端邏輯整合包（穩定合併 & 混合跳轉方案）

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ 輔助：判斷是否為今日
const isToday = (ts) => {
  const today = new Date();
  const target = new Date(ts);
  return today.toDateString() === target.toDateString();
};

// ✅ Firebase 設定
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

// ✅ 出席顯示
const loginRef = ref(db, 'login');
const studentStatusList = document.getElementById('studentStatusList');

onValue(loginRef, (snapshot) => {
  if (!studentStatusList) return;
  const data = snapshot.val();
  studentStatusList.innerHTML = '';
  const allStudents = [];

  Object.entries(data || {}).forEach(([classType, students]) => {
    Object.entries(students).forEach(([seat, info]) => {
      if (!info.loginTime || !isToday(info.loginTime)) return;
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

  const title = document.createElement('div');
  title.innerHTML = `<strong class="block text-green-600 mb-2">🟢 今日出席人數：${allStudents.length} 人</strong>`;
  studentStatusList.appendChild(title);

  allStudents.forEach(({ classType, seat, name }) => {
    const row = document.createElement('div');
    row.className = 'student-row';
    row.innerHTML = `<span class="status-dot"></span> ${name}（${classType} ${seat}）`;
    studentStatusList.appendChild(row);
  });
});

// ✅ 求救訊號
const sosRef = ref(db, 'help');
const responseBoard = document.getElementById('responseBoard');

onValue(sosRef, (snapshot) => {
  if (!responseBoard) return;
  const data = snapshot.val();
  responseBoard.innerHTML = '';
  const now = Date.now();
  const MAX_AGE = 60000;
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

  document.querySelectorAll('[data-seat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const seat = e.target.getAttribute('data-seat');
      const seatRef = ref(db, `help/${seat}`);
      remove(seatRef);
    });
  });
});

// ✅ 公告派送
const announcementBtn = document.getElementById("sendAnnouncementButton");
if (announcementBtn) {
  announcementBtn.addEventListener("click", () => {
    const title = document.getElementById("linkTitle").value.trim();
    const content = document.getElementById("linkContent").value.trim();
    const url = document.getElementById("linkURL").value.trim();

    if (!title || !url) {
      alert("❗請輸入標題與網址");
      return;
    }

    const announcementRef = ref(db, 'messages/announcement');
    set(announcementRef, {
      title,
      content,
      url,
      timestamp: Date.now()
    }).then(() => {
      alert("✅ 已派送給學生！");
      document.getElementById("linkTitle").value = "";
      document.getElementById("linkContent").value = "";
      document.getElementById("linkURL").value = "";
    }).catch((error) => {
      console.error("❌ 發送失敗：", error);
      alert("發送失敗，請稍後重試");
    });
  });
}

// ✅ 公告顯示
const announcementRef = ref(db, 'messages/announcement');
const systemMessageBox = document.getElementById('systemMessageContent');

onValue(announcementRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.title && data.url) {
    systemMessageBox.innerHTML = `
      <strong class="animate-pulse text-red-600">📣 ${data.title}</strong><br/>
      ${data.content ? data.content + '<br/>' : ''}
      👉 <a href="${data.url}" target="_blank">點我前往查看</a>
    `;

    const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3");
    audio.play();
  }
});

// ✅ 聊天室監聽（chat/question1）
const teacherChatDisplay = document.getElementById("teacherChatDisplay");
const chatRef = ref(db, "chat/question1");

onValue(chatRef, (snapshot) => {
  if (!teacherChatDisplay) return;
  const messages = snapshot.val();
  teacherChatDisplay.innerHTML = '';

  Object.values(messages || {}).forEach(msg => {
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '❓';
    const p = document.createElement("p");
    p.innerHTML = `<strong>${msg.name}</strong>: ${msg.text} <small>🕒 ${time}</small>`;
    teacherChatDisplay.appendChild(p);
  });

  teacherChatDisplay.scrollTop = teacherChatDisplay.scrollHeight;
});

// ✅ 混合跳轉策略（跳窗優先，失敗則開新分頁）
function openLink(url, windowName) {
  const features = "width=800,height=600,resizable=yes,scrollbars=yes";
  const popup = window.open(url, windowName, features);
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    alert("❗ 彈出視窗被瀏覽器攔截，將改用新分頁開啟！");
    window.open(url, "_blank");
  }
}

const questionPanelButton = document.getElementById("questionPanelButton");
const screenshotButton = document.getElementById("screenshotButton");

if (questionPanelButton) {
  questionPanelButton.addEventListener("click", () => {
    openLink("https://tangcat1125.github.io/catclassroom/task-system/task-center.html", "TaskCenter");
  });
}

if (screenshotButton) {
  screenshotButton.addEventListener("click", () => {
    openLink("https://tangcat1125.github.io/catclassroom/handwrite-module/index.html", "HandwriteModule");
  });
}
