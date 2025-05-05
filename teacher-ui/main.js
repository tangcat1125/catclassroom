// ✅ main.js - 教師端邏輯整合包

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { isToday } from './utils.js'; // 導入 isToday 函數

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

// 🟢 教師端：今日出席學生清單
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
    return parseInt(a.seat.replace(/^G/i, '99')) - parseInt(b.seat.replace(/^G/i, '99'));
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

// 🆘 求救訊號監聽區塊
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

  document.querySelectorAll('[data-seat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const seat = e.target.getAttribute('data-seat');
      const seatRef = ref(db, `help/${seat}`);
      remove(seatRef);
    });
  });
});

// 🔗 超連結派送功能
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

// ✅ student.js 需搭配這段：顯示新訊息動畫
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

// ✅ 教師端聊天室監聽
const teacherChatDisplay = document.getElementById("teacherChatDisplay");
const chatRef = ref(db, "chat");

onValue(chatRef, (snapshot) => {
  if (!teacherChatDisplay) return;
  try {
    const messages = snapshot.val();
    console.log("教師端聊天室資料：", messages); // 除錯用
    teacherChatDisplay.innerHTML = "";

    if (messages) {
      Object.entries(messages).forEach(([key, msg]) => {
        if (!msg.timestamp) return; // 無時間戳跳過
        if (!isToday(msg.timestamp)) return; // 不是今天的跳過

        const msgElem = document.createElement("p");
        const time = new Date(msg.timestamp).toLocaleTimeString();
        msgElem.textContent = `[${time}] ${msg.name}: ${msg.text}`;
        teacherChatDisplay.appendChild(msgElem);
      });

      if (teacherChatDisplay.innerHTML === "") {
        teacherChatDisplay.innerHTML = "<p class='text-gray-400 text-sm italic'>（今日尚無聊天訊息）</p>";
      } else {
        teacherChatDisplay.scrollTop = teacherChatDisplay.scrollHeight;
      }
    } else {
      teacherChatDisplay.innerHTML = "<p class='text-gray-400 text-sm italic'>（尚無聊天訊息）</p>";
    }
  } catch (err) {
    console.error("教師端聊天室錯誤：", err);
  }
});

// ✅ 新增：為按鈕綁定功能（使用 window.open)
const questionPanelButton = document.getElementById("questionPanelButton");
const screenshotButton = document.getElementById("screenshotButton");

if (questionPanelButton) {
  questionPanelButton.addEventListener("click", () => {
    window.open("https://tangcat1125.github.io/catclassroom/task-system/task-center.html", "_blank");
  });
}

if (screenshotButton) {
  screenshotButton.addEventListener("click", () => {
    window.open("https://tangcat1125.github.io/catclassroom/handwrite-module/index.html", "_blank");
  });
}
