// =============================================================================
// main.js：白貓教師端互動邏輯 (v3.1 - 整合最終修正與按鈕邏輯)
// =============================================================================

// --- 步驟 1: Firebase SDK 匯入 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded, onChildChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"; // 引入需要的函數

// --- 步驟 2: Firebase 設定物件 ---
// ⚠️ 請務必替換成你的真實金鑰和 ID
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // <--- 換成你的真實 API Key
    authDomain: "YOUR_AUTH_DOMAIN", // <--- 換成你的 Auth Domain
    databaseURL: "YOUR_DATABASE_URL", // <--- 換成你的 Database URL
    projectId: "YOUR_PROJECT_ID", // <--- 換成你的 Project ID
    storageBucket: "YOUR_STORAGE_BUCKET", // <--- 換成你的 Storage Bucket
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <--- 換成你的 Sender ID
    appId: "YOUR_APP_ID", // <--- 換成你的 App ID
    measurementId: "YOUR_MEASUREMENT_ID" // <--- 你的 Measurement ID (可選)
};

// --- 步驟 3: 全局變數 ---
let app;
let db;
const knownStudents = new Set();         // 存儲已知的學生 SEAT ID (唯一標識)
let processedHelpTimestamps = {};      // 記錄已處理的求救時間戳 { "班級-座號": timestamp }
const CHAT_PATH = 'chat';              // 統一的聊天路徑
let chatListener = null;              // 用於存儲聊天監聽器引用，方便未來移除

// --- 步驟 4: Firebase 初始化 ---
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("[Firebase] 初始化成功！");
} catch (firebaseError) {
    console.error("[Firebase] 初始化失敗:", firebaseError);
    // 在頁面顯示錯誤，阻止後續執行
    document.addEventListener('DOMContentLoaded', () => {
         document.body.innerHTML = `<div class="error-message p-4 m-4">Firebase 初始化失敗！請檢查 Firebase 設定或網路連線。<br>錯誤：${firebaseError.message}</div>`;
    });
    // 拋出錯誤阻止後續 JS 執行
    throw new Error("Firebase initialization failed");
}

// --- 步驟 5: DOMContentLoaded 事件監聽器 (主執行入口) ---
window.addEventListener("DOMContentLoaded", () => {
    console.log("[DOM] 文件載入完成，開始設定功能。");

    // 確保 Firebase 初始化成功才繼續
    if (!db) {
        console.error("[App] Firebase Database 未初始化，無法設定監聽器和按鈕。");
        return;
    }

    // --- 設定按鈕事件 ---
    setupButtons();

    // --- 設定 Firebase 監聽器 ---
    setupLoginListener();
    setupHelpListener();
    setupChatListener(CHAT_PATH); // 監聽固定的聊天路徑
    // setupHandwritingListener(); // 如果需要手寫功能
    // setupDynamicChatListener(); // 暫緩動態題目聊天

    console.log("[App] 所有監聽器和按鈕已設定。");
});


// --- 步驟 6: 輔助函數 ---

// 複製連結
function copyLink() {
    const linkInput = document.getElementById("login-link");
    if (linkInput) {
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        try {
            // 使用 Clipboard API (更現代的方法)
            navigator.clipboard.writeText(linkInput.value).then(() => {
                 alert("連結已複製！");
            }, (err) => {
                 // Clipboard API 失敗，嘗試舊方法
                 console.warn('Clipboard API failed, trying execCommand...', err);
                 try {
                    document.execCommand('copy');
                    alert("已複製學生登入連結！(備用)");
                 } catch (execErr) {
                    alert("複製失敗，瀏覽器可能不支援或權限不足。請手動複製。");
                    console.error('execCommand copy failed', execErr);
                 }
            });
        } catch (e) { // navigator.clipboard 可能不存在
             try {
                document.execCommand('copy');
                alert("已複製學生登入連結！(舊方法)");
             } catch (execErr) {
                 alert("複製失敗，請手動複製。");
                 console.error('execCommand copy failed', execErr);
             }
        }
    } else {
        console.warn("[DOM] 找不到 login-link 輸入框。");
        alert("找不到連結輸入框！");
    }
}

// (佔位符函數，需要實際實現或移除)
function showQuestionPanel() { alert("👉 出題面板功能尚未實作。"); }
function takeScreenshot() { alert("📸 擷圖功能尚未實作。"); }
function classroomMgmt() { alert('🔧 教室管理功能尚未實作。'); }
function quizDispatch() { alert('✨ 出題小精靈功能尚未實作。'); }
function goBack() { history.back(); } // 返回上一頁

// 添加訊息到回應區 (用於登入、求救等狀態)
function addStudentResponse(seatId, text, boxClass, identity = "未知") {
    const board = document.getElementById("responseBoard");
    if (!board) return;

    const box = document.createElement("div");
    // 注意：這裡的 isKnown 邏輯可能需要在 login listener 更新後才有意義
    // const isKnown = knownStudents.has(seatId);
    // const displayName = isKnown ? `${seatId} (${identity})` : `⚠️ 未登記：${seatId} (${identity})`;
    const displayName = `${seatId} (${identity})`; // 簡化顯示，不依賴 knownStudents

    box.className = `response-box ${boxClass}`; // 使用傳入的 class (e.g., 'green-box', 'red-box')
    box.textContent = `${displayName}: ${text}`;
    board.appendChild(box);
    board.scrollTop = board.scrollHeight;
}

// 紅燈閃爍效果 (可選)
function flashUnknownStudent(seatId) { /* ... */ }

// 正確的日期過濾函數：比較時間戳
function isTimestampToday(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') return false;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTodayTimestamp = startOfDay.getTime();
    return timestamp >= startOfTodayTimestamp;
}

// 格式化時間戳為 HH:MM:SS
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
        return new Date(timestamp).toLocaleTimeString('zh-TW', { hour12: false });
    } catch (e) { return ''; }
}

// --- 步驟 7: Firebase 監聽器設定函數 ---

// 監聽學生登入（已修正日期過濾和 ID）
function setupLoginListener() {
    const loginRef = ref(db, "login");
    const list = document.getElementById("studentStatusList");
    const responseBoard = document.getElementById("responseBoard");

    if (!list || !responseBoard) {
        console.error("[Login] 找不到 studentStatusList 或 responseBoard 元素。");
        return;
    }

    let processedTodayLogins = new Set();

    onValue(loginRef, (snapshot) => {
        const students = snapshot.val() || {};
        list.innerHTML = '';
        knownStudents.clear();
        processedTodayLogins.clear();
        console.log("[Login] 收到數據更新，處理今日登入...");

        let todayStudentCount = 0; // 計算今日登入學生數

        Object.keys(students).forEach(identity => {
            Object.entries(students[identity]).forEach(([seat, data]) => {
                const loginTime = data.loginTime; // ✅ 讀取 loginTime
                const seatId = seat;           // ✅ 使用 seat 作為 ID

                if (isTimestampToday(loginTime)) { // ✅ 正確過濾
                    todayStudentCount++;
                    const studentName = data.name || seatId;
                    const displayText = `${studentName} (${seatId}) [${identity}]`;

                    // 更新學生列表
                    const row = document.createElement("div");
                    row.className = "student-row";
                    row.innerHTML = `<span class="status-dot green"></span> ${displayText}`;
                    list.appendChild(row);
                    knownStudents.add(seatId); // ✅ 添加 seatId

                    // 顯示 "已登入" 到回應區 (僅一次)
                    const loginIdentifier = `${identity}-${seatId}`;
                    if (!processedTodayLogins.has(loginIdentifier)) {
                        const loginTimeString = formatTimestamp(loginTime);
                        // ✅ 使用 seatId
                        addStudentResponse(seatId, `已登入 (${loginTimeString})`, "green-box", identity);
                        processedTodayLogins.add(loginIdentifier);
                    }
                }
            });
        });

        if (todayStudentCount === 0) {
            list.innerHTML = '<p class="text-gray-400 text-sm italic">（今日尚無學生登入...）</p>';
        }
        console.log(`[Login] 登入列表更新完成，今日登入 ${todayStudentCount} 位。`);
    }, (error) => {
        console.error("[Login] 監聽錯誤:", error);
        list.innerHTML = '<p class="text-red-500 text-sm italic">（載入學生列表失敗）</p>';
    });
}

// 監聽求救訊號（已修正路徑和 UI 更新）
function setupHelpListener() {
    const responseBoard = document.getElementById("responseBoard");
    if (!responseBoard) return;

    const identities = ['本班', '他班'];
    identities.forEach(identity => {
        const helpPathRef = ref(db, `help/${identity}`);
        console.log(`[Help] 設定監聽器: help/${identity}`);

        const handleHelpUpdate = (snapshot) => {
            const seatId = snapshot.key;
            const data = snapshot.val();
            if (!data || !data.timestamp) return;

            const helpTimestamp = data.timestamp;
            if (isTimestampToday(helpTimestamp)) {
                const helpIdentifier = `${identity}-${seatId}`;
                // ✅ 只有當時間戳更新時才顯示，避免重複
                if (processedHelpTimestamps[helpIdentifier] !== helpTimestamp) {
                    const studentName = data.name || seatId;
                    const helpTimeString = formatTimestamp(helpTimestamp);
                    addStudentResponse(seatId, `🆘 發送求救訊號！ (${helpTimeString})`, "red-box", identity);
                    processedHelpTimestamps[helpIdentifier] = helpTimestamp;
                }
            }
        };
        onChildAdded(helpPathRef, handleHelpUpdate);
        onChildChanged(helpPathRef, handleHelpUpdate); // 監聽 changed 以處理 set 覆蓋
    });
    console.log("[Help] 求救監聽器設定完成。");
}

// 監聽聊天訊息（已重寫）
function setupChatListener(path) {
    const chatDisplay = document.getElementById("teacherChatDisplay");
    if (!chatDisplay) {
        console.error("[Chat] 找不到 teacherChatDisplay 元素。");
        return;
    }

    const chatRef = ref(db, path); // ✅ 監聽傳入的路徑
    let isChatDisplayInitialized = false;
    console.log(`[Chat] 設定監聽器於路徑: ${path}`);

    // 清除舊的監聽器（如果存在），防止重複掛載 (適用於動態切換路徑)
    if (chatListener) {
        chatListener(); // Firebase v9+ returns an unsubscribe function
        console.log("[Chat] 已移除舊的聊天監聽器。");
    }

    // 掛載新的監聽器並保存其 unsubscribe 函數
    chatListener = onChildAdded(chatRef, (snapshot) => {
        const msgData = snapshot.val();
        if (!msgData || !msgData.message || !msgData.timestamp) return;

        if (isTimestampToday(msgData.timestamp)) { // ✅ 正確過濾日期
            if (!isChatDisplayInitialized) {
                chatDisplay.innerHTML = '';
                isChatDisplayInitialized = true;
            }

            const p = document.createElement('p');
            const name = msgData.name || '匿名';
            const seat = msgData.seat || '?';
            const classType = msgData.classType || '?';
            const message = msgData.message; // ✅ 讀取 message
            const time = formatTimestamp(msgData.timestamp); // ✅ 格式化時間

            p.innerHTML = `<strong>${name} (${classType}${seat}):</strong> ${message} <small>(${time})</small>`;
            chatDisplay.appendChild(p);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    }, (error) => {
        console.error("[Chat] 監聽錯誤:", error);
        if (!isChatDisplayInitialized) {
            chatDisplay.innerHTML = '<p class="text-red-500 text-sm italic">（載入聊天失敗）</p>';
            isChatDisplayInitialized = true;
        }
    });
     console.log("[Chat] 新的聊天監聽器已設定。");
}


// --- 步驟 8: 按鈕事件掛載函數 ---
function setupButtons() {
    console.log("[Setup] 開始設定按鈕事件...");
    // (小白寫的按鈕邏輯，略作調整)
    const copyLinkBtn = document.getElementById('copyLinkButton');
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyLink);

    const questionPanelBtn = document.getElementById('questionPanelButton');
    if (questionPanelBtn) questionPanelBtn.addEventListener('click', showQuestionPanel);

    const screenshotBtn = document.getElementById('screenshotButton');
    if (screenshotBtn) screenshotBtn.addEventListener('click', takeScreenshot);

    const classroomMgmtBtn = document.getElementById('classroomMgmtButton');
    if (classroomMgmtBtn) classroomMgmtBtn.addEventListener('click', classroomMgmt);

    const quizBtn = document.getElementById('quizButton');
    if (quizBtn) quizBtn.addEventListener('click', quizDispatch);

    // 派題中心按鈕由 HTML <a> 處理

    const backBtn = document.getElementById('backButton');
    if (backBtn) backBtn.addEventListener('click', goBack);

    console.log("[Setup] 按鈕事件設定完成。");
}

// --- (可選) 其他監聽器或函數 ---
// function setupHandwritingListener() { ... }
// function setupDynamicChatListener() { ... }
