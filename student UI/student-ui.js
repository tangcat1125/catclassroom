// --- START OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
console.log("載入 student-ui.js (v6.3)...");

// --------------------------------------------------
// 1. 引入 Firebase 功能
// --------------------------------------------------
import { getDatabase, ref, onValue, set, push, off } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js"; // 使用 9.x SDK
console.log("Firebase DB 功能已引入 (v9 SDK modular)。");

// --------------------------------------------------
// 2. Firebase 配置 (直接從 HTML 的 window.db 獲取)
// --------------------------------------------------
// ** 不再需要 firebaseConfig，直接使用 window.db **
if (!window.db) {
    console.error("Firebase Database (window.db from Compat) 未定義！");
    alert("頁面錯誤：無法獲取後端服務連接！");
    throw new Error("window.db is not defined from HTML script");
}
const db = window.db; // 使用 Compat 初始化提供的 db 實例
console.log("Firebase DB 實例 (from Compat) 已獲取。");

// --------------------------------------------------
// 3. 學生資訊與常數
// --------------------------------------------------
let studentId, studentName, studentClass; // studentClass 將儲存 "班級 座號號"
const TOTAL_STUDENTS = 13; // *** 修改為實際人數 ***
let el = {}; // 用於快取 DOM 元素
let currentChatListenerRef = null; // 儲存當前聊天監聽器的引用
console.log("全域變數已定義。");


// --------------------------------------------------
// 4. 程式進入點：監聽 DOM Ready
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM 已載入，開始初始化...");
  loadStudentInfo();
  cacheDOM();
  renderStudentInfo();
  setupEventListeners();
  setupFirebaseListeners();
  console.log('🎉 學生介面 v6.3 啟動完成');
});

// --------------------------------------------------
// 5. 初始化相關函數
// --------------------------------------------------
function loadStudentInfo(){
  studentId    = sessionStorage.getItem('studentId');
  studentName  = sessionStorage.getItem('studentName');
  studentClass = sessionStorage.getItem('studentClass'); // v6.2 rollcall 存的是 "班級 座號號"
  if(!studentId){
    console.warn("未登入，啟用訪客模式。");
    const now = Date.now(); studentId = `guest_${now}`; studentName = '訪客'; studentClass = '訪客';
    try { sessionStorage.setItem('studentId', studentId); sessionStorage.setItem('studentName', studentName); sessionStorage.setItem('studentClass', studentClass); } catch(e) { console.warn("無法寫入 sessionStorage"); }
  }
  console.log(`學生資訊已載入: ${studentName} (${studentClass}) [${studentId}]`);
}

function cacheDOM(){
  el = {
    nameSpan     : document.getElementById('student-name'),
    classSpan    : document.getElementById('student-class'), // HTML ID 應為 student-class
    redLight     : document.getElementById('red-light'),
    sysMsg       : document.getElementById('systemMessage'),
    answerPanel  : document.getElementById('answerPanel'),
    questionText : document.getElementById('questionText'),
    answerArea   : document.getElementById('answerButtons'), // 注意 HTML 中 ID 是 answerButtons
    progressFill : document.getElementById('progressFill'),
    chatList     : document.getElementById('chatList'),
    chatInput    : document.getElementById('chatInput'),
    chatContextLabel: document.getElementById('chatContextLabel'), // 需要 HTML 中有此 ID
    helpBtn      : document.getElementById('help-button'),
    helpForm     : document.getElementById('helpForm'),
    helpInput    : document.getElementById('helpText'),
    helpStatus   : document.getElementById('helpStatus'),
    chatSendBtn  : document.querySelector('.chat-input-box button') // 假設只有一個發送按鈕
  };
  console.log("DOM 元素已快取。");
}

function renderStudentInfo(){
  if(el.nameSpan)  el.nameSpan.textContent  = studentName || '...';
  if(el.classSpan) el.classSpan.textContent = studentClass || '...'; // 顯示班級座號
  console.log("學生資訊已渲染到畫面。");
}

// --------------------------------------------------
// 6. 輔助函數
// --------------------------------------------------
function escapeHtml(s=''){ return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'''); }
function hideAnswerPanel(){ if(el.answerPanel) el.answerPanel.style.display='none'; }
function showAnswerPanel(){ if(el.answerPanel) el.answerPanel.style.display='block'; }
function resetProgress(){ if(el.progressFill){ el.progressFill.style.width='0%'; el.progressFill.textContent=`0/${TOTAL_STUDENTS}`; } }

// --------------------------------------------------
// 7. 事件綁定 (非 Firebase)
// --------------------------------------------------
function setupEventListeners() {
    if(el.helpBtn && el.helpForm) {
        el.helpBtn.addEventListener('click', () => {
            el.helpForm.style.display = (el.helpForm.style.display === "none" || !el.helpForm.style.display) ? "block" : "none";
        });
    }
     // 注意：由於按鈕是動態添加到 answerArea 的，不能在這裡直接綁定 submitShort
     // 我們需要在生成按鈕時，直接在 onclick 屬性中調用 window.submitShort
     // 對於聊天按鈕和求救按鈕，因為它們是靜態的，可以在這裡綁定，但需要確保對應的函數已掛載到 window
     // if (el.chatSendBtn) { el.chatSendBtn.addEventListener('click', window.sendChatMessage); }
     // if (el.helpForm?.querySelector('button')) { el.helpForm.querySelector('button').addEventListener('click', window.sendHelp); }
     // ** 為了兼容 HTML 中的 onclick，我們還是主要依賴將函數掛載到 window **
     console.log("非 Firebase 事件監聽器已部分設置 (求救按鈕)。");
}

// --------------------------------------------------
// 8. Firebase 監聽器設置
// --------------------------------------------------
function setupFirebaseListeners(){
  const questionRef = ref(db,'teacher/currentQuestion');
  console.log("設置題目監聽器...");
  onValue(questionRef, (snapshot) => handleQuestion(snapshot.val()), (error) => {
      console.error("監聽題目失敗:", error);
      if(el.sysMsg) el.sysMsg.textContent = '讀取題目失敗!';
  });
  // 初始監聽大廳聊天室
  switchChatListener('lobby','大廳');
  console.log("Firebase 監聽器已設置。");
}

// --------------------------------------------------
// 9. 核心功能 - 處理題目
// --------------------------------------------------
function handleQuestion(q){
  hideAnswerPanel(); resetProgress();
  if(!q || typeof q !== 'object' || !q.type || !q.text){
    if(el.sysMsg) el.sysMsg.textContent = '等待老師出題中…';
    if(el.redLight) el.redLight.classList.remove('active');
    switchChatListener('lobby','大廳');
    try { sessionStorage.removeItem('questionId'); } catch(e){}
    console.log("題目已清除或格式錯誤。"); return;
  }
  const qid = String(q.id || q.questionId || Date.now()); const qtype = q.type; const qtext = q.text;
  console.log(`處理題目: ID=${qid}, Type=${qtype}`);
  try { sessionStorage.setItem('questionId',qid); } catch(e) { console.warn("無法寫入 questionId"); }
  if(el.sysMsg) el.sysMsg.textContent = `📢 老師: ${qtext}`;
  if(el.redLight) el.redLight.classList.add('active');

  if(qtype ==='choice' || qtype ==='truefalse') { showChoices(qtype, qid, qtext); }
  else if(qtype ==='shortanswer') { showShortAnswer(qid, qtext); }
  else if (qtype === 'handwrite') { setTimeout(() => { window.open(`handwrite-upload.html?questionId=${qid}&studentId=${studentId}`, "_blank"); }, 800); }
  // 暫不處理截圖任務 else if (qtype === 'screenshot_annotation') { ... }
  else { console.warn("未知題型:", qtype); showGenericMessage("收到未知題型..."); }

  if (qtype !== 'handwrite' && qtype !== 'screenshot_annotation') { updateProgress(qid); }
  const chatContext = qtext.length > 10 ? qtext.substring(0, 10) + '…' : qtext;
  switchChatListener(qid, `題目: ${chatContext}`);
}

// --------------------------------------------------
// 10. 核心功能 - 顯示作答介面
// --------------------------------------------------
function showChoices(type, qid, text){
  if(!el.answerPanel || !el.questionText || !el.answerArea) return;
  const opts = type==='truefalse' ? ['是','否'] : ['A','B','C','D'];
  el.questionText.textContent = text || '';
  // ** 修正 onclick 調用方式，確保能找到 window 上的函數 **
  el.answerArea.innerHTML = opts.map(o=>
    `<button class="send-btn" onclick="window.submitAnswer('${qid}','${escapeHtml(o)}')">${escapeHtml(o)}</button>`
  ).join('');
  showAnswerPanel();
}
function showShortAnswer(qid, text){
  if(!el.answerPanel || !el.questionText || !el.answerArea) return;
  el.questionText.textContent = text || '';
  el.answerArea.innerHTML=`
    <textarea id="shortAnswerInput" rows="3" placeholder="請輸入…" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
    <button class="send-btn" onclick="window.submitShort('${qid}')" style="margin-top: 8px;">送出</button>
  `; // ** 使用 window.submitShort **
  showAnswerPanel();
  setTimeout(()=>{document.getElementById('shortAnswerInput')?.focus();},100);
}
function showGenericMessage(message){ if(!el.answerPanel || !el.questionText || !el.answerArea) return; el.questionText.textContent = message || ''; el.answerArea.innerHTML = ''; showAnswerPanel(); }

// --------------------------------------------------
// 11. 核心功能 - 提交答案 (掛載到 window)
// --------------------------------------------------
window.submitAnswer = (qid, ans) => { /* ... v6.3 內容不變 ... */ if (!qid || ans === undefined || !studentId || !db) { console.error("提交失敗：缺少參數或DB"); alert("❌ 提交失敗！"); return; } console.log(`提交答案: QID=${qid}, Ans=${ans}`); const d = { studentId, name: studentName, answer: ans, questionId: qid, time: new Date().toISOString() }; const r = ref(db, `answers/${studentId}/${qid}`); set(r, d).then(() => { console.log("答案寫入 Firebase 成功"); alert('✅ 答案已送出'); hideAnswerPanel(); if(el.redLight) el.redLight.classList.remove('active'); }).catch(e => { console.error('答案寫入 Firebase 失敗:', e); alert('❌ 答案送出失敗: ' + e.message); }); };
window.submitShort = qid => { /* ... v6.3 內容不變 ... */ const textarea = document.getElementById('shortAnswerInput'); const text = textarea?.value.trim(); if (!text) { alert('請輸入文字內容！'); return; } window.submitAnswer(qid, text); };

// --------------------------------------------------
// 12. 核心功能 - 更新進度條 (與 v6.3 相同)
// --------------------------------------------------
function updateProgress(qid){ if(!qid || !el.progressFill || !db) return; const answersRef = ref(db,'answers'); onValue(answersRef, (snapshot) => { const allAnswersData = snapshot.val() || {}; let answeredCount = 0; Object.keys(allAnswersData).forEach(sId => { if(allAnswersData[sId]?.[qid]) { answeredCount++; } }); const percent = TOTAL_STUDENTS > 0 ? Math.round((answeredCount / TOTAL_STUDENTS) * 100) : 0; el.progressFill.style.width = percent + '%'; el.progressFill.textContent = `${answeredCount} / ${TOTAL_STUDENTS}`; }, (error) => { console.error(`讀取答案進度 (QID:${qid}) 失敗:`, error); el.progressFill.style.width = '100%'; el.progressFill.style.backgroundColor = 'red'; el.progressFill.textContent = '錯誤'; setTimeout(() => { el.progressFill.style.backgroundColor = '#66bb6a'; resetProgress(); }, 2000); }); }

// --------------------------------------------------
// 13. 核心功能 - 聊天室 (與 v6.3 相同, sendChatMessage 掛載到 window)
// --------------------------------------------------
function switchChatListener(chatId, contextName) { /* ... v6.3 內容不變 ... */ if (currentChatListenerRef) { try { off(currentChatListenerRef); } catch(e) {} } currentChatId = chatId || 'lobby'; currentChatListenerRef = ref(db, `chat/${currentChatId}`); if (el.chatContextLabel) el.chatContextLabel.innerText = `(${contextName || '未知'})`; console.log(`切換監聽聊天室: ${currentChatId}`); if (el.chatList) el.chatList.innerHTML = "<p style='color:grey;'><i>讀取中...</i></p>"; onValue(currentChatListenerRef, (snapshot) => { if (!el.chatList) return; const data = snapshot.val(); el.chatList.innerHTML = ""; if (!data) { el.chatList.innerHTML = "<p style='color:grey;'><i>無訊息</i></p>"; return; } try { Object.values(data).sort((a, b) => (a?.time && b?.time) ? (new Date(a.time) - new Date(b.time)) : 0).forEach((msg) => { if (!msg || typeof msg !== 'object') return; const div = document.createElement("div"); const selfClass = (msg.studentId === studentId) ? ' self-message' : ''; div.className = `chat-item${selfClass}`; if (msg.type === "text") { const isMention = msg.text?.includes("@"); div.innerHTML = `💬<strong class="chat-sender">${escapeHtml(msg.from||'匿名')}</strong>:<span class="chat-text"${isMention?" style='background-color:#fff9c4;'":""}>${escapeHtml(msg.text)}</span>`; } else { div.innerHTML = `📎<strong>${escapeHtml(msg.from||'匿名')}</strong>: 分享了內容`; } el.chatList.appendChild(div); }); } catch (loopError) { console.error("處理聊天訊息錯誤:", loopError); el.chatList.innerHTML += "<p style='color:red;'>部分訊息顯示錯誤</p>"; } setTimeout(() => { if(el.chatList) el.chatList.scrollTop = el.chatList.scrollHeight; }, 50); }, (error) => { console.error(`監聽聊天室 ${currentChatId} 出錯:`, error); if (el.chatList) el.chatList.innerHTML = `<p style='color:red;'>讀取失敗！</p>`; }); }
window.sendChatMessage = () => { /* ... v6.3 內容不變 ... */ const targetChatId = sessionStorage.getItem('questionId') || 'lobby'; const textInput = el.chatInput; if (!textInput) { console.error("找不到聊天輸入框！"); return; } const text = textInput.value.trim(); if (!text) { alert('請輸入訊息！'); return; } if (!db) { alert("錯誤：未連接服務。"); return; } const messageData = { from: studentName, studentId: studentId, text: text, type: "text", time: new Date().toISOString() }; const chatRef = ref(db, `chat/${targetChatId}`); console.log(`發送訊息到 chat/${targetChatId}`); push(chatRef, messageData).then(() => { textInput.value = ''; textInput.focus(); }).catch(e => { console.error("發送聊天失敗:", e); alert('❌ 發送失敗: ' + e.message); }); };

// --------------------------------------------------
// 14. 核心功能 - 求救 (與 v6.3 相同, sendHelp 掛載到 window)
// --------------------------------------------------
window.sendHelp = () => { /* ... v6.3 內容不變 ... */ const msgInput = el.helpInput; if (!msgInput) { console.error("找不到求救輸入框！"); return;} const msg = msgInput.value.trim(); if (!msg) { alert('請輸入求救內容！'); return; } if (!db) { alert("錯誤：未連接服務。"); return; } const helpData = { from: studentName, studentId: studentId, class: studentClass || '未知', message: msg, time: new Date().toISOString() }; const helpRef = ref(db, `help/${studentId}`); console.log(`發送求救 for ${studentId}`); set(helpRef, helpData).then(() => { alert('✅ 求救已發送！'); if(el.helpStatus) el.helpStatus.style.display = 'block'; msgInput.value = ''; if(el.helpForm) el.helpForm.style.display = 'none'; setTimeout(() => { if(el.helpStatus) el.helpStatus.style.display = 'none'; }, 3000); }).catch(e => { console.error("發送求救失敗:", e); alert('❌ 求救失敗: ' + e.message); }); };

console.log("student-ui.js (v6.3) 所有函數定義完畢。");

// --- END OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
