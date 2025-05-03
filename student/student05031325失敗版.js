// ✅ 12:54 進化版 — 加入 announcement，不破壞班級資訊列
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 監聽老師派題（/teacher/currentQuestion）
const currentQuestionRef = ref(db, 'teacher/currentQuestion');
const systemMessageBox = document.getElementById('systemMessageContent');

onValue(currentQuestionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text && systemMessageBox) {
    systemMessageBox.textContent = data.text;
  } else if (systemMessageBox) {
    systemMessageBox.textContent = "等待老師指令中...";
  }
});

// ✅ 監聽 /messages/announcement，只顯示今日訊息
const announcementRef = ref(db, 'messages/announcement');

onValue(announcementRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || !data.timestamp) return;

  const now = new Date();
  const announcementDate = new Date(data.timestamp);
  const isToday = now.toDateString() === announcementDate.toDateString();

  if (!isToday) return;

  // 建立或更新通知顯示區塊（不破壞外層狀態列）
  let notify = document.getElementById('announcementBlock');
  if (!notify) {
    notify = document.createElement('div');
    notify.id = 'announcementBlock';
    notify.className = 'mt-2 text-yellow-800 text-sm';
    systemMessageBox.appendChild(notify);
  }

  notify.innerHTML = `
    <strong class="animate-pulse text-red-600">📣 ${data.title}</strong><br/>
    ${data.content ? data.content + '<br/>' : ''}
    👉 <a href="${data.url}" target="_blank">點我前往查看</a>
  `;

  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3");
  audio.play();
});
