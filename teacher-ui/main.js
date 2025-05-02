// --- 白貓教師端 main.js：控制按鈕功能與跳轉邏輯 ---

// 1. 複製登入連結按鈕
const copyLinkBtn = document.getElementById('copyLinkButton');
if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
        const input = document.getElementById('login-link');
        input.select();
        document.execCommand('copy');
        alert("已複製學生登入連結！");
    });
    console.log("[Setup] 複製連結按鈕已設定。");
} else {
    console.warn("[DOM] 找不到複製連結按鈕。");
}

// 2. 出題面板（尚未實作功能）
const questionPanelBtn = document.getElementById('questionPanelButton');
if (questionPanelBtn) {
    questionPanelBtn.addEventListener('click', () => {
        alert("👉 出題面板功能尚未實作，可用於編輯單題。");
    });
    console.log("[Setup] 出題面板按鈕已設定。");
} else {
    console.warn("[DOM] 找不到出題面板按鈕。");
}

// 3. 擷圖按鈕（✅ 連結至擷圖派題工具）
const screenshotBtn = document.getElementById('screenshotButton');
if (screenshotBtn) {
    screenshotBtn.addEventListener('click', () => {
        window.location.href = 'task-capture/capture.html';
    });
    console.log("[Setup] 擷圖按鈕已設定（跳轉）");
} else {
    console.warn("[DOM] 找不到擷圖按鈕。");
}

// 4. 教室管理（尚未實作）
const classroomMgmtBtn = document.getElementById('classroomMgmtButton');
if (classroomMgmtBtn) {
    classroomMgmtBtn.addEventListener('click', () => {
        alert("🔧 教室管理功能尚未實作，可用於學生名單、設定等。");
    });
    console.log("[Setup] 教室管理按鈕已設定。");
} else {
    console.warn("[DOM] 找不到教室管理按鈕。");
}

// 5. 出題小精靈（尚未實作）
const quizBtn = document.getElementById('quizButton');
if (quizBtn) {
    quizBtn.addEventListener('click', () => {
        alert("✨ 出題小精靈功能尚未實作，可用於 AI 出題指令生成。");
    });
    console.log("[Setup] 出題小精靈按鈕已設定。");
} else {
    console.warn("[DOM] 找不到出題小精靈按鈕。");
}

// 6. 派題中心（✅ 正確跳轉）
const dispatchBtn = document.getElementById('dispatchButton');
if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
        window.location.href = 'task-system/task-center.html';
    });
    console.log("[Setup] 派題中心按鈕已設定（跳轉）");
} else {
    console.warn("[DOM] 找不到派題中心按鈕。");
}

// 7. 返回首頁（可用 history.back 或導回主站）
const backBtn = document.getElementById('backButton');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = 'https://tangcat1125.github.io/catclassroom/';
    });
    console.log("[Setup] 返回首頁按鈕已設定。");
} else {
    console.warn("[DOM] 找不到返回按鈕。");
}
