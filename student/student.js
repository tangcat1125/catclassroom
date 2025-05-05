// ✅ 修正版 student.js — 顯示學生身份、當日老師出題訊息、SOS 與聊天室功能
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 顯示學生基本資料（從 localStorage 正確解析 JSON）
const infoClass = document.getElementById("infoClass");
const infoSeat = document.getElementById("infoSeat");
const infoName = document.getElementById("infoName");

// 從 localStorage 讀取學生資訊
const studentInfo = JSON.parse(localStorage.getItem("studentInfo")) || {};
const savedClass = studentInfo.classType || "未知班級";
const savedSeat = studentInfo.seat || "未知座號";
const savedName = studentInfo.name || "未知姓名";

// 顯示學生資訊
infoClass.textContent = savedClass;
infoSeat.textContent = savedSeat;
infoName.textContent = savedName;

// ❗ 除錯：檢查讀取的資料
console.log("🔍 studentInfo 讀取結果：", localStorage.getItem("studentInfo"));

// 檢查 localStorage 是否有資料，如果沒有，顯示警告並跳轉回登入頁
if (!studentInfo.classType || !studentInfo.seat || !studentInfo.name) {
  console.warn("警告：localStorage 中缺少學生資訊，將跳轉回登入頁！");
  alert("無法載入學生資訊，請重新登入！");
  window.location.href = "index.html";
}

// ✅ 監聽老師出題內容並過濾當日資料
const systemMessageBox = document.getElementById("systemMessageContent");
const questionRef = ref(db, "teacher/currentQuestion");

onValue(questionRef, (snapshot) => {
  try {
    const data = snapshot.val();
    console.log("教師出題資料：", data);
    if (data && data.text && data.timestamp) {
      const questionDate = new Date(data.timestamp);
      const today = new Date();
      if (questionDate.toDateString() === today.toDateString()) {
        systemMessageBox.textContent = data.text;
        console.log("顯示當日題目：", data.text);
      } else {
        systemMessageBox.textContent = "等待今日老師指令中...";
      }
    } else {
      systemMessageBox.textContent = "等待今日老師指令中...";
    }
  } catch (error) {
    console.error("監聽出題錯誤：", error);
  }
}, (error) => {
  console.error("出題監聽器錯誤：", error);
});

// ✅ 監聽老師派送訊息（公告）
const announcementRef = ref(db, "messages/announcement");
onValue(announcementRef, (snapshot) => {
  try {
    const data = snapshot.val();
    console.log("教師公告資料：", data);
    if (data && data.title && data.url && data.timestamp) {
      const messageDate = new Date(data.timestamp);
      const today = new Date();
      if (messageDate.toDateString() === today.toDateString()) {
        systemMessageBox.innerHTML = `
          <strong class="animate-pulse text-red-600">📣 ${data.title}</strong><br/>
          ${data.content ? data.content + '<br/>' : ''}
          👉 <a href="${data.url}" target="_blank">點我前往查看</a>
        `;
        const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3");
        audio.play();
        console.log("顯示當日公告：", data.title);
      } else {
        systemMessageBox.innerHTML = "等待今日老師派送...";
      }
    }
  } catch (error) {
    console.error("監聽公告錯誤：", error);
  }
}, (error) => {
  console.error("公告監聽器錯誤：", error);
});

// ✅ SOS 求救功能
const sosButton = document.getElementById("sosButton");
if (sosButton) {
  sosButton.addEventListener("click", () => {
    try {
      console.log("觸發 SOS 按鈕");
      const sosRef = ref(db, `help/${savedSeat}`);
      const sosData = {
        name: savedName,
        seat: savedSeat,
        timestamp: Date.now()
      };
      set(sosRef, sosData)
        .then(() => {
          alert("🆘 求救訊號已發送！");
          sosButton.disabled = true;
          setTimeout(() => {
            sosButton.disabled = false;
          }, 60000);
          console.log("SOS 發送成功");
        })
        .catch((error) => {
          console.error("SOS 發送失敗：", error);
          alert("求救訊號發送失敗，請稍後再試！");
        });
    } catch (error) {
      console.error("SOS 處理錯誤：", error);
    }
  });
} else {
  console.warn("警告：未找到 sosButton 元素");
}

// ✅ 聊天室功能
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

if (chatMessages && chatInput && sendButton) {
  // 監聽聊天訊息
  const chatRef = ref(db, "chat");
  onValue(chatRef, (snapshot) => {
    try {
      const messages = snapshot.val();
      console.log("聊天室資料：", messages);
      chatMessages.innerHTML = "";
      if (messages) {
        Object.entries(messages).forEach(([key, msg]) => {
          const messageElement = document.createElement("p");
          const messageTime = new Date(msg.timestamp).toLocaleTimeString();
          messageElement.textContent = `[${messageTime}] ${msg.name}: ${msg.text}`;
          chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight; // 自動滾動到底部
      } else {
        chatMessages.innerHTML = "<p style='color: #888;'>(暫無聊天訊息)</p>";
      }
    } catch (error) {
      console.error("聊天室監聽錯誤：", error);
    }
  }, (error) => {
    console.error("聊天室監聽器錯誤：", error);
  });

  // 發送聊天訊息
  sendButton.addEventListener("click", () => {
    try {
      console.log("觸發發送訊息");
      const messageText = chatInput.value.trim();
      if (messageText === "") {
        alert("請輸入訊息！");
        return;
      }

      const newMessageRef = push(chatRef);
      const messageData = {
        name: savedName,
        text: messageText,
        timestamp: Date.now()
      };

      set(newMessageRef, messageData)
        .then(() => {
          chatInput.value = ""; // 清空輸入框
          console.log("訊息發送成功");
        })
        .catch((error) => {
          console.error("訊息發送失敗：", error);
          alert("訊息發送失敗，請稍後再試！");
        });
    } catch (error) {
      console.error("發送訊息處理錯誤：", error);
    }
  });
} else {
  console.warn("警告：未找到聊天室相關元素 (chatMessages, chatInput, sendButton)");
}
