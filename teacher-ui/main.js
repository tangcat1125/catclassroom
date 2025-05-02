// main.js：白貓教師端互動邏輯（更新版，顯示完整時間並過濾當天）

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
    authDomain: "catclassroom-login.firebaseapp.com",
    databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "catclassroom-login",
    storageBucket: "catclassroom-login.firebasestorage.app",
    messagingSenderId: "123487233181",
    appId: "1:123487233181:web:aecc2891dc2d1096962074",
    measurementId: "G-92GYSX3F"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 當前日期 (2025-05-02)
const currentDate = new Date("2025-05-02").toISOString().split('T')[0];

// 已知的學生名單（從 HTML 載入，作為基礎名單）
const knownStudents = new Set(Array.from(document.querySelectorAll(".student-row"))
    .map(row => row.textContent.trim()));

// 複製登入連結
function copyLink() {
    const linkInput = document.getElementById("login-link");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("連結已複製，請貼給學生！");
}

// 顯示出題面板（未來功能）
function showQuestionPanel() {
    alert("👉 後續版本將整合題目派送功能");
}

// 擷圖功能（未來功能）
function takeScreenshot() {
    alert("📸 此處可加入 html2canvas 擷圖功能或手動截圖");
}

// 添加回應訊息到 .response-board，顯示完整時間
function addStudentResponse(id, text, color = "green", identity = "未知") {
    const board = document.querySelector(".response-board");
    const box = document.createElement("div");

    const isKnown = knownStudents.has(id);
    const boxColor = isKnown ? color : "red";
    const displayName = isKnown ? `${id} (${identity})` : `⚠️ 未登記：${id} (${identity})`;

    box.className = `response-box ${boxColor}`;
    box.innerText = `${displayName}: ${text}`;
    board.appendChild(box);

    if (!isKnown) flashUnknownStudent(id);
}

// 紅燈閃爍效果
function flashUnknownStudent(id) {
    const board = document.querySelector(".response-board");
    board.style.border = "3px dashed red";
    setTimeout(() => {
        board.style.border = "none";
    }, 1200);
}

// 檢查是否為當天數據
function isToday(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp).toISOString().split('T')[0];
    return date === currentDate;
}

// 監聽學生登入（login 路徑）
function setupLoginListener() {
    const loginRef = ref(db, "login");
    onValue(loginRef, (snapshot) => {
        const students = snapshot.val() || {};
        const list = document.querySelector(".student-status-list");
        list.innerHTML = ''; // 清空現有名單

        Object.keys(students).forEach(identity => {
            Object.entries(students[identity]).forEach(([seat, data]) => {
                const studentId = data.name || seat;
                const studentName = data.name || seat;
                const displayText = `${studentName} (${seat}) [${identity}]`;
                const row = document.createElement("div");
                row.className = "student-row";
                row.innerHTML = `<span class="${knownStudents.has(studentId) ? 'green' : 'red'}"></span> ${displayText}`;
                list.appendChild(row);
                knownStudents.add(studentId);

                // 顯示登入訊息（僅當天）
                if (data.timestamp && isToday(data.timestamp)) {
                    addStudentResponse(studentName, "已登入", "green", identity);
                }
            });
        });
    }, (error) => {
        console.error("[Login] 監聽錯誤:", error);
    });
}

// 監聽求救訊號（help 路徑，help/{classType}/{seat}）
function setupHelpListener() {
    const helpRef = ref(db, "help");
    onValue(helpRef, (snapshot) => {
        const helpData = snapshot.val() || {};
        const board = document.querySelector(".response-board");
        board.innerHTML = ''; // 清空現有求救訊息

        Object.keys(helpData).forEach(classType => {
            Object.entries(helpData[classType]).forEach(([seat, data]) => {
                const studentName = data.name || seat;
                const identity = classType;

                // 僅顯示當天求救訊息
                if (data.timestamp && isToday(data.timestamp)) {
                    const timestamp = new Date(data.timestamp).toLocaleString();
                    addStudentResponse(studentName, `發送求救訊號！(${timestamp})`, "red", identity);

                    // 更新名單（如果尚未添加）
                    if (!knownStudents.has(studentName)) {
                        const list = document.querySelector(".student-status-list");
                        const row = document.createElement("div");
                        row.className = "student-row";
                        row.innerHTML = `<span class="red"></span> ${studentName} (${seat}) [${identity}]`;
                        list.appendChild(row);
                        knownStudents.add(studentName);
                    }
                }
            });
        });
    }, (error) => {
        console.error("[Help] 監聽錯誤:", error);
    });
}

// 監聽聊天訊息（chat 路徑）
function setupChatListener(questionId = "question1") {
    const chatRef = ref(db, `chat/${questionId}`);
    onChildAdded(chatRef, (snapshot) => {
        const message = snapshot.val();
        const studentName = message.name || "匿名";
        const identity = "未知"; // 聊天訊息目前無身份信息，可從 login 推斷
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : "未知時間";

        // 僅顯示當天聊天訊息
        if (isToday(message.timestamp)) {
            addStudentResponse(studentName, `${message.text} (${timestamp})`, "green", identity);

            // 更新名單（如果尚未添加）
            if (!knownStudents.has(studentName)) {
                const list = document.querySelector(".student-status-list");
                const row = document.createElement("div");
                row.className = "student-row";
                row.innerHTML = `<span class="green"></span> ${studentName} (未知) [${identity}]`;
                list.appendChild(row);
                knownStudents.add(studentName);
            }
        }
    }, (error) => {
        console.error("[Chat] 監聽錯誤:", error);
    });
}

// 監聽手寫圖作答（原功能，保持不變）
function setupHandwritingListener() {
    const guestRef = ref(db, "handwriting/guest");
    onChildAdded(guestRef, (answerSnap) => {
        const questionId = answerSnap.key;
        const data = answerSnap.val();
        const studentId = "guest";

        if (!knownStudents.has(studentId)) {
            const list = document.querySelector(".student-status-list");
            const row = document.createElement("div");
            row.className = "student-row";
            row.innerHTML = `<span class="red"></span> ${studentId}（陌生）`;
            list.appendChild(row);
            knownStudents.add(studentId);

            const board = document.querySelector(".response-board");
            const alertBox = document.createElement("div");
            alertBox.className = "response-box red";
            alertBox.innerText = `⚠️ 陌生學生 ${studentId}：手寫圖作答於「${questionId}」`;
            board.appendChild(alertBox);

            flashUnknownStudent(studentId);
        }
    }, (error) => {
        console.error("[Handwriting] 監聽錯誤:", error);
    });
}

// 初始化監聽
setupLoginListener();
setupHelpListener();
setupChatListener(); // 監聽預設聊天室
setupHandwritingListener();

// 動態監聽當前題目（與學生端同步）
const questionRef = ref(db, "teacher/currentQuestion");
onValue(questionRef, (snapshot) => {
    const question = snapshot.val();
    if (question && question.id) {
        console.log("[Question] 當前題目 ID:", question.id);
        setupChatListener(question.id); // 動態切換聊天路徑
    }
});
