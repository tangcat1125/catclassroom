// handwrite-config.js
// （這是手寫模組專用的 Firebase 初始化設定檔）

// 1. 載入需要的 Firebase 函式
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 2. 手寫模組用的 firebaseConfig（用最新 App ID）
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.firebasestorage.app",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:4b4bcf62c167a514962074",  // ← 這是你剛剛提供的新appId！
  measurementId: "G-KEP8YF75NR"
};

// 3. 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 4. 初始化 Database
const database = getDatabase(app);

// 5. 匯出 database 供其他模組使用
export { database };
