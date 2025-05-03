
// Firebase 初始化模組（需配合 HTML 已載入 Firebase SDK）
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase 設定（請根據實際設定替換）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase App 與 Realtime Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 監聽 /teacher/currentQuestion 的變化，更新系統訊息區塊
const currentQuestionRef = ref(db, 'teacher/currentQuestion');
const systemMessageBox = document.querySelector('.system-message');

onValue(currentQuestionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text && systemMessageBox) {
    systemMessageBox.textContent = data.text;
  } else if (systemMessageBox) {
    systemMessageBox.textContent = "等待老師指令中...";
  }
});
