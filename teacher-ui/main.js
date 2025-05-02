// main.js：白貓教師端互動邏輯（新增手寫圖批閱功能）

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// 已知的學生名單
const knownStudents = new Set();

function copyLink() {
    const linkInput = document.getElementById("login-link");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("連結已複製，請貼給學生！");
}

function showQuestionPanel() {
    alert("👉 後續版本將整合題目派送功能");
}

function takeScreenshot() {
    alert("📸 此處可加入 html2canvas 擷圖功能或手動截圖");
}

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

function flashUnknownStudent(id) {
    const board = document.querySelector(".response-board");
    board.style.border = "3px dashed red";
    setTimeout(() => {
        board.style.border = "none";
    }, 1200);
}

function isToday(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp).toISOString().split('T')[0];
    return date === currentDate;
}

// 監聽學生登入
function setupLoginListener() {
    const loginRef = ref(db, "login");
    onValue(loginRef, (snapshot) => {
        const students = snapshot.val() || {};
        const list = document.querySelector(".student-status-list");
        list.innerHTML = '';
        knownStudents.clear();

        Object.keys(students).forEach(identity => {
            Object.entries(students[identity]).forEach(([seat, data]) => {
                const studentId = data.name || seat;
                const studentName = data.name || seat;
                const timestamp = data.timestamp;

                if (timestamp && isToday(timestamp)) {
                    const displayText = `${studentName} (${seat}) [${identity}]`;
                    const row = document.createElement("div");
                    row.className = "student-row";
                    row.innerHTML = `<span class="${knownStudents.has(studentId) ? 'green' : 'red'}"></span> ${displayText}`;
                    list.appendChild(row);
                    knownStudents.add(studentId);
                    addStudentResponse(studentName, "已登入", "green", identity);
                }
            });
        });
    }, (error) => {
        console.error("[Login] 監聽錯誤:", error);
    });
}

// 監聽求救訊號
function setupHelpListener() {
    const helpRef = ref(db, "help");
    onValue(helpRef, (snapshot) => {
        const helpData = snapshot.val() || {};
        const board = document.querySelector(".response-board");
        board.innerHTML = '';

        Object.keys(helpData).forEach(classType => {
            Object.entries(helpData[classType]).forEach(([seat, data]) => {
                const studentName = data.name || seat;
                const identity = classType;

                if (data.timestamp && isToday(data.timestamp)) {
                    const timestamp = new Date(data.timestamp).toLocaleString();
                    addStudentResponse(studentName, `發送求救訊號！(${timestamp})`, "red", identity);

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

// 監聽聊天訊息
function setupChatListener(questionId = "question1") {
    const chatRef = ref(db, `chat/${questionId}`);
    onChildAdded(chatRef, (snapshot) => {
        const message = snapshot.val();
        const studentName = message.name || "匿名";
        const identity = "未知";
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : "未知時間";

        if (isToday(message.timestamp)) {
            addStudentResponse(studentName, `${message.text} (${timestamp})`, "green", identity);

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

// 監聽手寫圖作答並新增批閱功能
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

            // 添加批閱按鈕
            const btnContainer = document.createElement("div");
            const correctBtn = document.createElement("button");
            correctBtn.innerText = "○ (正確)";
            correctBtn.onclick = () => reviewHandwriting(questionId, "correct");
            const incorrectBtn = document.createElement("button");
            incorrectBtn.innerText = "X (錯誤)";
            incorrectBtn.onclick = () => reviewHandwriting(questionId, "incorrect");

            btnContainer.appendChild(correctBtn);
            btnContainer.appendChild(incorrectBtn);
            alertBox.appendChild(btnContainer);
            board.appendChild(alertBox);

            flashUnknownStudent(studentId);
        }
    }, (error) => {
        console.error("[Handwriting] 監聽錯誤:", error);
    });
}

// 批閱手寫圖並更新 Firebase
function reviewHandwriting(questionId, result) {
    const reviewRef = ref(db, `handwriting/guest/${questionId}/review`);
    const historyRef = ref(db, `learningHistory/guest/${questionId}`);
    set(reviewRef, {
        result: result,
        timestamp: new Date().toISOString()
    }).then(() => {
        set(historyRef, {
            questionId: questionId,
            result: result,
            timestamp: new Date().toISOString()
        });
        alert(`已批閱 ${questionId} 為 ${result === "correct" ? "正確" : "錯誤"}`);
    }).catch((error) => {
        console.error("[Review] 批閱錯誤:", error);
    });
}

// 初始化監聽
setupLoginListener();
setupHelpListener();
setupChatListener();
setupHandwritingListener();

// 動態監聽當前題目
const questionRef = ref(db, "teacher/currentQuestion");
onValue(questionRef, (snapshot) => {
    const question = snapshot.val();
    if (question && question.id) {
        console.log("[Question] 當前題目 ID:", question.id);
        setupChatListener(question.id);
    }
});
