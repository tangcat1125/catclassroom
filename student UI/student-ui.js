// --- START OF FILE student-ui.js (v5：重寫整合版) ---

console.log("載入 student-ui.js (v5 重寫版)...");

// --------------------------------------------------
// 1. 引入 Firebase 功能
// --------------------------------------------------
import { getDatabase, ref, onValue, set, push, off } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
console.log("Firebase DB 功能已引入。");

// --------------------------------------------------
// 2. 取得 Firebase 實例 (從 HTML)
// --------------------------------------------------
if (!window.db) {
    console.error("Firebase Database (window.db) 未定義！");
    alert("頁面錯誤：無法連接後端服務！");
    throw new Error("window.db is not defined");
}
const db = window.db;
console.log("Firebase DB 實例已獲取。");

// --------------------------------------------------
// 3. 學生資訊與常數
// --------------------------------------------------
let studentId, studentName, studentSeat;
const TOTAL_STUDENTS = 13; // *** 修改為實際人數 ***

function loadStudentInfo() {
    studentId = sessionStorage.getItem("studentId");
    studentName = sessionStorage.getItem("studentName");
    studentSeat = sessionStorage.getItem("studentSeatId");

    if (!studentId) {
        console.warn("未登入，啟用訪客模式。");
        const now = Date.now();
        studentId = `guest_${now}`;
        studentName = "訪客";
        studentSeat = `Guest (${studentId.substring(6, 10)})`;
        // 嘗試保存訪客信息
        try {
            sessionStorage.setItem("studentId", studentId);
            sessionStorage.setItem("studentName", studentName);
            sessionStorage.setItem("studentSeatId", studentSeat);
        } catch (e) { console.warn("無法寫入 sessionStorage"); }
    }
    console.log(`學生資訊: ID=${studentId}, Name=${studentName}, Seat=${studentSeat}`);
}

// --------------------------------------------------
// 4. 獲取 DOM 元素
// --------------------------------------------------
const studentNameSpan = document.getElementById("student-name");
const studentSeatSpan = document.getElementById("student-seat");
const redLight = document.getElementById("red-light");
const systemMessageDiv = document.getElementById("systemMessage");
const answerPanel = document.getElementById("answerPanel");
const questionTextDiv = document.getElementById("questionText");
const answerButtonsDiv = document.getElementById("answerButtons");
const chatListDiv = document.getElementById("chatList");
const chatInput = document.getElementById("chatInput");
const chatContextLabel = document.getElementById("chatContextLabel");
const progressBarFill = document.getElementById("progressFill");
const helpBtn = document.getElementById("help-button");
const helpForm = document.getElementById("helpForm");
const helpTextInput = document.getElementById("helpText");
const helpStatusDiv = document.getElementById("helpStatus");
console.log("DOM 元素已獲取。");

// --------------------------------------------------
// 5. 全域狀態變數
// --------------------------------------------------
let currentChatListenerRef = null;
let currentChatId = 'lobby';
let lastHandledTaskId = null;
console.log("全域狀態已初始化。");

// --------------------------------------------------
// 6. 輔助函數
// --------------------------------------------------
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    try {
        return String(unsafe)
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, """)
             .replace(/'/g, "'");
    } catch (e) {
        console.error("escapeHtml 錯誤:", e, unsafe);
        return "[轉換錯誤]";
    }
}

function displayStudentInfo() {
    if (studentNameSpan) studentNameSpan.innerText = studentName || '...';
    if (studentSeatSpan) studentSeatSpan.innerText = studentSeat || '...';
}

// --------------------------------------------------
// 7. 核心功能 - 聊天室
// --------------------------------------------------
function switchChatListener(chatId, contextName) {
    if (currentChatListenerRef) {
        try { off(currentChatListenerRef); } catch(e) { console.warn("移除舊監聽器失敗", e); }
    }
    currentChatId = chatId || 'lobby'; // 確保有預設值
    currentChatListenerRef = ref(db, `chat/${currentChatId}`);
    if (chatContextLabel) chatContextLabel.innerText = `(${contextName || '未知'})`;
    console.log(`切換監聽聊天室: ${currentChatId}`);
    if (chatListDiv) chatListDiv.innerHTML = "<p style='color:grey;'><i>讀取中...</i></p>";

    onValue(currentChatListenerRef, (snapshot) => {
        if (!chatListDiv) return;
        const data = snapshot.val(); chatListDiv.innerHTML = "";
        if (!data) { chatListDiv.innerHTML = "<p style='color:grey;'><i>無訊息</i></p>"; return; }
        try {
            Object.values(data).sort((a, b) => (a?.time && b?.time) ? (new Date(a.time) - new Date(b.time)) : 0)
            .forEach((msg) => {
                if (!msg || typeof msg !== 'object') return;
                const div = document.createElement("div");
                const selfClass = (msg.studentId === studentId) ? ' self-message' : '';
                div.className = `chat-item${selfClass}`;
                if (msg.type === "text") {
                    const isMention = msg.text?.includes("@");
                    div.innerHTML = `💬<strong class="chat-sender">${escapeHtml(msg.from||'匿名')}</strong>:<span class="chat-text"${isMention?" style='background-color:#fff9c4;'":""}>${escapeHtml(msg.text)}</span>`;
                } else { div.innerHTML = `📎<strong>${escapeHtml(msg.from||'匿名')}</strong>: 分享了內容`; }
                chatListDiv.appendChild(div);
            });
        } catch (loopError) {
             console.error("處理聊天訊息錯誤:", loopError);
             chatListDiv.innerHTML += "<p style='color:red;'>部分訊息顯示錯誤</p>";
        }
        setTimeout(() => { if(chatListDiv) chatListDiv.scrollTop = chatListDiv.scrollHeight; }, 50);
    }, (error) => {
        console.error(`監聽聊天室 ${currentChatId} 出錯:`, error);
        if (chatListDiv) chatListDiv.innerHTML = `<p style='color:red;'>讀取失敗！</p>`;
    });
}

window.sendChatMessage = function () {
    const targetChatId = sessionStorage.getItem("questionId") || 'lobby';
    const text = chatInput?.value.trim();
    if (!text) { alert("請輸入訊息！"); return; }
    if (!chatInput) { alert("錯誤：找不到輸入框！"); return; }
    const data = { from: studentName, studentId: studentId, type: "text", text: text, time: new Date().toISOString() };
    const chatRef = ref(db, `chat/${targetChatId}`);
    console.log(`發送訊息到: chat/${targetChatId}`);
    push(chatRef, data)
        .then(() => { chatInput.value = ""; chatInput.focus(); })
        .catch((err) => { console.error("發送聊天失敗:", err); alert("❌發送失敗:" + err.message); });
};

// --------------------------------------------------
// 8. 核心功能 - 作答區
// --------------------------------------------------
function showAnswerButtons(type, qid, qtext){ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; if(!p||!t||!b) return; console.log("顯示按鈕:",type); p.style.display="block"; t.innerText=qtext||''; b.innerHTML=""; const o=(type==="truefalse")?["是","否"]:["A","B","C","D"]; o.forEach(opt=>{const btn=document.createElement("button");btn.className="send-btn";btn.innerText=opt;btn.onclick=()=>submitAnswer(qid,opt);b.appendChild(btn);});}
function showShortAnswerBox(qid, qtext){ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; if(!p||!t||!b) return; console.log("顯示簡答框"); p.style.display="block"; t.innerText=qtext||''; b.innerHTML=`<textarea id="shortAnswerInput" rows="3" style="width:100%;padding:10px;" placeholder="請輸入..."></textarea><button class="send-btn" style="margin-top:10px;" onclick="submitShortAnswer('${qid}')">送出簡答</button>`; setTimeout(()=>{document.getElementById('shortAnswerInput')?.focus();},100);}
function showGenericMessage(message){ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; if(!p||!t||!b) return; p.style.display="block"; t.innerText=message||''; b.innerHTML="";}
window.submitShortAnswer = function (qid){ const i=document.getElementById("shortAnswerInput"),a=i?.value.trim(); if(!a){alert("請輸入！");return;}submitAnswer(qid,a);};
function submitAnswer(qid, answer){ if(!qid || answer === undefined || !studentId) return; console.log(`送出答案-QID:${qid},答案:${answer}`); const d={studentId,name:studentName,answer,questionId:qid,time:new Date().toISOString()}; const r=ref(db,`answers/${studentId}/${qid}`); set(r,d).then(()=>{console.log("答案送出成功");alert("✅答案送出！"); if(answerPanel)answerPanel.style.display="none";redLight?.classList.remove("active");}).catch(e=>{console.error("送出答案失敗:",e);alert("❌失敗:"+e.message);});}
function loadAnswers(qid) { if(!qid || !progressBarFill) return; const answersRef = ref(db, "answers"); onValue(answersRef, (snapshot) => { const data = snapshot.val(); let count = 0; if(data){Object.keys(data).forEach(sId=>{if(data[sId]?.[qid]) count++;});} const percent = TOTAL_STUDENTS > 0 ? Math.round((count / TOTAL_STUDENTS) * 100) : 0; progressBarFill.style.width=`${percent}%`; progressBarFill.innerText=`${count}/${TOTAL_STUDENTS}`;}, (error)=>{ console.error(`讀取答案 (QID:${qid}) 失敗:`, error); }); }

// --------------------------------------------------
// 9. 核心功能 - 截圖註記提示
// --------------------------------------------------
function showScreenshotTaskPrompt(encodedImageUrl, taskId){ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; if(!p||!t||!b) return; p.style.display="block"; t.innerHTML="<strong>老師發來截圖，點此註記：</strong>"; b.innerHTML=`<button class="send-btn highlight-blink" onclick="openHandwriteWithBackground('${encodedImageUrl}','${taskId}')" style="background-color:#f57c00;">🚀 前往註記</button>`;}
function hideScreenshotTaskPrompt(){ const p=answerPanel; if(p?.querySelector('.highlight-blink')){p.style.display="none"; if(questionTextDiv)questionTextDiv.innerHTML=""; if(answerButtonsDiv)answerButtonsDiv.innerHTML="";}}
window.openHandwriteWithBackground = function(encodedImageUrl, taskId){ const url=`handwrite-upload.html?backgroundUrl=${encodedImageUrl}&questionId=${taskId}&studentId=${studentId}`; console.log("開啟手寫頁:",url); window.open(url,'_blank'); hideScreenshotTaskPrompt(); if(systemMessageDiv)systemMessageDiv.innerText="已開啟註記畫面。"; redLight?.classList.remove("active");}

// --------------------------------------------------
// 10. 核心功能 - 求救
// --------------------------------------------------
if(helpBtn){helpBtn.addEventListener("click",()=>{if(helpForm) helpForm.style.display=helpForm.style.display==="none"?"block":"none";});}else{console.warn("找不到求救按鈕");}
window.sendHelp = function(){ const msg=helpTextInput?.value.trim(); if(!msg){alert("請輸入問題！");return;} const d={message:msg,from:studentName,studentId,class:studentSeat||'未知',time:new Date().toISOString()}; const r=ref(db,`help/${studentId}`); set(r,d).then(()=>{console.log("求救送出"); if(helpStatusDiv)helpStatusDiv.style.display="block"; if(helpTextInput)helpTextInput.value=""; if(helpForm)helpForm.style.display="none"; alert("✅求救已發送！");}).catch(e=>{console.error("求救失敗:",e);alert("❌失敗:"+e.message);});};

// --------------------------------------------------
// 11. Firebase 監聽器設置
// --------------------------------------------------
function listenForQuestions() {
    const questionRef = ref(db, "/teacher/currentQuestion");
    console.log("開始監聽老師出題...");
    onValue(questionRef, (snapshot) => {
        const question = snapshot.val();
        if(answerPanel) answerPanel.style.display = "none";
        hideScreenshotTaskPrompt();

        if (!question || typeof question !== 'object' || !question.type || !question.text) { // 更嚴格的檢查
            console.log("老師清除題目或格式錯誤");
            if(systemMessageDiv) systemMessageDiv.innerText = "等待老師出題中...";
            if(redLight) redLight.classList.remove("active");
            try { sessionStorage.removeItem("questionId"); sessionStorage.removeItem("currentQuestionText"); } catch(e){}
            switchChatListener('lobby', '大廳');
            if(progressBarFill){progressBarFill.style.width='0%'; progressBarFill.innerText=`0/${TOTAL_STUDENTS}`;}
            return;
        }

        const qid = question.id || question.questionId || `unknown_${Date.now()}`;
        const qtype = question.type;
        const qtext = question.text;
        console.log(`收到題目(ID:${qid}, Type:${qtype})`);

        if(systemMessageDiv) systemMessageDiv.innerText = `📢 老師出題：${qtext}`;
        try { sessionStorage.setItem("questionId", qid); sessionStorage.setItem("currentQuestionText", qtext); } catch(e){}
        if(redLight) redLight.classList.add("active");
        const chatContext = qtext.length > 15 ? qtext.substring(0, 15) + '...' : qtext;
        switchChatListener(qid, `題目: ${chatContext}`);

        if (qtype === 'screenshot_annotation') {
            console.log("收到截圖標記，等待任務URL...");
            if(systemMessageDiv) systemMessageDiv.innerText += " (等待老師截圖...)";
        } else if (qtype === "handwrite") {
            setTimeout(() => { window.open(`handwrite-upload.html?questionId=${qid}&studentId=${studentId}`, "_blank"); }, 800);
        } else if (qtype === "truefalse" || qtype === "choice") {
            showAnswerButtons(qtype, qid, qtext);
        } else if (qtype === "shortanswer") {
            showShortAnswerBox(qid, qtext);
        } else {
            console.warn("未知題型:", qtype);
            showGenericMessage("收到新題型，請依老師指示。");
        }
        loadAnswers(qid);
    }, (error) => {
         console.error("監聽老師題目出錯:", error);
         if(systemMessageDiv) systemMessageDiv.innerText = "讀取題目出錯！";
    });
}

function listenForScreenshotTasks() {
    const taskRef = ref(db, '/teacher/currentScreenshotAnnotationTask');
    console.log("開始監聽截圖任務...");
    onValue(taskRef, (snapshot) => {
        const taskData = snapshot.val();
        if (taskData?.imageUrl && taskData.taskId && taskData.taskId !== lastHandledTaskId) {
            lastHandledTaskId = taskData.taskId;
            console.log("收到新截圖任務！ID:", taskData.taskId);
             showScreenshotTaskPrompt(encodeURIComponent(taskData.imageUrl), taskData.taskId);
             if(redLight) redLight.classList.add("active");
             if(systemMessageDiv) systemMessageDiv.innerHTML = `老師發來截圖，請點下方按鈕註記！`;
             if(answerPanel) answerPanel.style.display = "block";
        } else if (!taskData && lastHandledTaskId !== null) {
            console.log("老師清除截圖任務");
            hideScreenshotTaskPrompt();
            lastHandledTaskId = null;
            const currentQid = sessionStorage.getItem("questionId");
            if (currentQid) {
                 const currentQText = sessionStorage.getItem("currentQuestionText");
                 if(systemMessageDiv) systemMessageDiv.innerText = `📢 老師出題：${currentQText || '...'}`;
            } else {
                  if(systemMessageDiv) systemMessageDiv.innerText = "等待老師出題中...";
            }
        }
    }, (error) => {
        console.error("監聽截圖任務出錯:", error);
    });
}

// --------------------------------------------------
// 12. 初始化函數
// --------------------------------------------------
function initializeStudentView() {
    console.log("初始化學生介面...");
    loadStudentInfo(); // 先載入學生資訊
    displayStudentInfo(); // 再顯示
    if(systemMessageDiv) systemMessageDiv.innerText = "正在連線...";
    if(chatListDiv) chatListDiv.innerHTML = "<p style='color:grey;'>連接聊天室...</p>";

    listenForQuestions();
    listenForScreenshotTasks();
    switchChatListener('lobby', '大廳');

    // 添加 CSS
    try {
        const style = document.createElement('style');
        style.textContent = `
            .chat-item.self-message { background-color: #e1f5fe !important; border-left: 4px solid #03a9f4; }
            .chat-item.self-message .chat-sender { color: #0277bd; }
            .highlight-blink { animation: blink 1.2s ease-in-out infinite alternate; }
            @keyframes blink { from { opacity: 1; } to { opacity: 0.7; transform: scale(1.02); } }
        `;
        document.head.appendChild(style);
    } catch(e) { console.warn("無法添加 CSS:", e); }
    console.log("學生介面初始化完成。");
}

// --------------------------------------------------
// 13. 執行初始化 (確保 DOM Ready)
// --------------------------------------------------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStudentView);
} else {
    initializeStudentView();
}

console.log("student-ui.js (v5 重寫版) 載入結束。");

// --- END OF FILE student-ui.js (v5：重寫整合版) ---
