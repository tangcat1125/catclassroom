// student.js

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

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

// ✅ 修正：抓正確 DOM 元素 ID
const systemMessageBox = document.getElementById('systemMessageContent');

// 🔁 原本監聽老師出題區
const questionRef = ref(db, 'teacher/currentQuestion');

onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text) {
    systemMessageBox.textContent = data.text;
  } else {
    systemMessageBox.textContent = "等待老師指令中...";
  }
});

// ✅ 新增：監聽 messages/announcement 來派送連結
const announcementRef = ref(db, 'messages/announcement');

onValue(announcementRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.title && data.url) {
    systemMessageBox.innerHTML = `
      <strong>📣 ${data.title}</strong><br/>
      ${data.content ? data.content + '<br/>' : ''}
      👉 <a href="${data.url}" target="_blank">點我前往查看</a>
    `;
  }
});
