// firebase-config-task.js - 白貓工作室 task-database firebase設定

// Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Your web app's Firebase configuration for task-database
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:bd52b47483b4c527962074",
  measurementId: "G-ZTJCCQQX75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const taskDatabase = getDatabase(app);
