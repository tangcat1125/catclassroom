// ✅ 修正版 student.js - 學生端接收教師端訊息區 + 連結公告
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

// ✅ 監聽 messages/announcement 顯示教師派送的連結公告
const announcementRef = ref(db, 'messages/announcement');

onValue(announcementRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.title && data.url) {
    systemMessageBox.innerHTML = `
      <strong class="animate-pulse text-red-600">📣 ${data.title}</strong><br/>
      ${data.content ? data.content + '<br/>' : ''}
      👉 <a href="${data.url}" target="_blank">點我前往查看</a>
    `;

    // 播放通知音效
    const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3");
    audio.play();
  }
});
