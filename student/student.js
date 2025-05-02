// student.js - 學生作答區頁面腳本
// 功能：顯示學生資訊、監聽聊天訊息、發送聊天訊息、求救功能

// 導入 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase 設定（與 login.js 相同）
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

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log("[Firebase] 初始化成功！");

// 當頁面載入完成時執行
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DOM] student.html 文件載入完成.");

    // 從 localStorage 讀取學生資訊
    const storedStudentInfo = localStorage.getItem('studentInfo');
    let studentInfo = null;
    if (storedStudentInfo) {
        try {
            console.log("[LocalStorage] 讀取到的 studentInfo 字串:", storedStudentInfo);
            studentInfo = JSON.parse(storedStudentInfo);
            console.log("[LocalStorage] 解析後的 studentInfo 物件:", studentInfo);
            if (!studentInfo || typeof studentInfo !== 'object' || !studentInfo.classType || !studentInfo.name || !studentInfo.seat) {
                throw new Error("儲存的學生資訊格式錯誤。");
            }
        } catch (error) {
            console.error("[LocalStorage] 解析 studentInfo 字串時發生錯誤:", error);
            localStorage.removeItem('studentInfo');
            alert("讀取使用者資訊時發生錯誤，將返回登入頁面。");
            window.location.href = 'index.html';
            return;
        }
    }

    // 如果有學生資訊，更新頂部資訊欄
    if (studentInfo) {
        const infoClassElement = document.getElementById('infoClass');
        const infoSeatElement = document.getElementById('infoSeat');
        const infoNameElement = document.getElementById('infoName');
        if (infoClassElement && infoSeatElement && infoNameElement) {
            console.log("[UI] 找到有效的學生資訊，準備更新頂部資訊欄...");
            infoClassElement.textContent = studentInfo.classType;
            console.log("[UI] 已將班級資訊更新為:", studentInfo.classType);
            infoSeatElement.textContent = studentInfo.seat;
            console.log("[UI] 已將座號資訊更新為:", studentInfo.seat);
            infoNameElement.textContent = studentInfo.name;
            console.log("[UI] 已將姓名資訊更新為:", studentInfo.name);
            console.log("[UI] 頂部資訊欄已更新。");
        } else {
            console.error("[DOM] 錯誤：找不到頂部資訊欄的 span 元素。");
            alert("頁面結構錯誤，無法顯示學生資訊。");
        }
    } else {
        alert("無法獲取學生資訊，請先登入。將返回登入頁面。");
        window.location.href = 'index.html';
        return;
    }

    // 獲取聊天和求救相關的 DOM 元素
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const sosButton = document.getElementById('sosButton');

    // 檢查 DOM 元素是否存在
    if (!chatMessages || !chatInput || !sendButton || !sosButton) {
        console.error("[DOM] 錯誤：找不到聊天或求救相關元素。");
        return;
    }

    // 聊天功能：監聽 Firebase 聊天訊息
    function setupChatListener(questionId = 'question1') { // 預設 questionId，可動態從 teacher/currentQuestion 獲取
        const chatRef = ref(database, `chat/${questionId}`);
        onValue(chatRef, (snapshot) => {
            const messages = snapshot.val();
            chatMessages.innerHTML = '';
            if (messages) {
                Object.values(messages).forEach(msg => {
                    const p = document.createElement('p');
                    // 顯示訊息和時間戳記
                    p.innerHTML = `<strong>${msg.name}:</strong> ${msg.text} <small>(${new Date(msg.timestamp).toLocaleTimeString()})</small>`;
                    chatMessages.appendChild(p);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight; // 自動滾動到底部
            } else {
                chatMessages.innerHTML = '<p style="color: #888;">(聊天室尚無訊息...)</p>';
            }
        }, (error) => {
            console.error("[Chat] 監聽錯誤:", error);
        });
    }

    // 聊天功能：發送訊息
    sendButton.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) {
            const chatRef = ref(database, 'chat/question1'); // 預設 questionId
            push(chatRef, {
                name: studentInfo.name,
                text: text,
                timestamp: serverTimestamp()
            }).then(() => {
                chatInput.value = ''; // 清空輸入框
                console.log("[Chat] 訊息發送成功");
            }).catch(error => {
                console.error("[Chat] 發送失敗:", error);
                alert(`發送訊息失敗：${error.message}`);
            });
        } else {
            alert("請輸入訊息！");
        }
    });

    // 支援 Enter 鍵發送（Shift+Enter 可換行）
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // 求救功能：點擊「我要求救」按鈕
    sosButton.addEventListener('click', () => {
        const helpRef = ref(database, `help/${studentInfo.seat}`);
        set(helpRef, {
            name: studentInfo.name,
            seat: studentInfo.seat,
            timestamp: serverTimestamp()
        }).then(() => {
            alert('求救訊號已發送！');
            console.log("[SOS] 求救訊號發送成功");
        }).catch(error => {
            console.error("[SOS] 發送失敗:", error);
            alert(`發送求救訊號失敗：${error.message}`);
        });
    });

    // 初始化聊天監聽
    setupChatListener();

    // 動態監聽當前題目（可選，未來可擴展）
    const questionRef = ref(database, 'teacher/currentQuestion');
    onValue(questionRef, (snapshot) => {
        const question = snapshot.val();
        if (question && question.id) {
            console.log("[Question] 當前題目 ID:", question.id);
            setupChatListener(question.id); // 動態切換聊天路徑
        }
    });
});
