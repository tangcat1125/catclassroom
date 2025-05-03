// ✅ 修正版 student.js - 只顯示當日教師訊息，不覆蓋學生狀態列
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// ✅ 監聽教師出題指令
const questionRef = ref(db, 'teacher/currentQuestion');
const systemMessageBox = document.getElementById('systemMessageContent');

onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text) {
    systemMessageBox.textContent = data.text;
  } else {
    systemMessageBox.textContent = "等待老師指令中...";
  }
});

// ✅ 監聽 messages/announcement，只顯示當日訊息
const announcementRef = ref(db, 'messages/announcement');

onValue(announcementRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || !data.timestamp) return;

  const now = new Date();
  const announcementDate = new Date(data.timestamp);
  const isToday = now.toDateString() === announcementDate.toDateString();

  if (!isToday) return; // 非今日訊息不顯示

  // 移除原有通知（如果存在）
  const old = document.getElementById('dynamicAnnouncement');
  if (old) old.remove();

  const div = document.createElement('div');
  div.id = 'dynamicAnnouncement';
  div.className = 'mt-2 text-yellow-800 text-sm';
  div.innerHTML = `
    <strong class="animate-pulse text-red-600">📣 ${data.title}</strong><br/>
    ${data.content ? data.content + '<br/>' : ''}
    👉 <a href="${data.url}" target="_blank">點我前往查看</a>
  `;
  systemMessageBox.appendChild(div);

  // 播放音效提示
  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3");
  audio.play();
});
