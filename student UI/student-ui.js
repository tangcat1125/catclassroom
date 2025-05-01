// student-ui.js 版本:v6.3 修正時間:2025-05-01 12:15
// --- START OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
console.log("載入 student-ui.js (v6.3)...");

// --------------------------------------------------
// 1. 引入 Firebase 功能
// --------------------------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getDatabase, ref, onValue,
  set, push, off // off 用於移除監聽器
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';
console.log("Firebase DB 功能已引入。");

// --------------------------------------------------
// 2. Firebase 配置 (請替換為你真實配置)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074"
};

// --------------------------------------------------
// 3. 初始化 Firebase
// --------------------------------------------------
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db  = getDatabase(app);
  console.log('✅ Firebase 已完成初始化');
} catch (e) {
  console.error("Firebase 初始化失敗！", e);
  alert("頁面初始化失敗(Firebase Init Error)，請檢查網路或聯繫管理員。");
  throw e;
}

// --------------------------------------------------
// 4. 全域設定與變數
// --------------------------------------------------
const TOTAL_STUDENTS = 13;
let studentId, studentName, studentClass;
let el = {}, currentChatListenerRef = null;
console.log("全域變數已定義。");

// --------------------------------------------------
// 5. 程式進入點：監聽 DOM Ready
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
// 6. 資訊載入與渲染
// --------------------------------------------------
function loadStudentInfo(){
  studentId    = sessionStorage.getItem('studentId');
  studentName  = sessionStorage.getItem('studentName');
  studentClass = sessionStorage.getItem('studentClass');
  if(!studentId){
    const now = Date.now();
    studentId    = `guest_${now}`;
    studentName  = '訪客';
    studentClass = '訪客';
    sessionStorage.setItem('studentId', studentId);
    sessionStorage.setItem('studentName', studentName);
    sessionStorage.setItem('studentClass', studentClass);
  }
  console.log(`學生資訊已載入: ${studentName} (${studentClass}) [${studentId}]`);
}

function cacheDOM(){
  el = {
    nameSpan    : document.getElementById('student-name'),
    classSpan   : document.getElementById('student-class'),
    sysMsg      : document.getElementById('systemMessage'),
    chatList    : document.getElementById('chatList'),
    chatInput   : document.getElementById('chatInput'),
    chatSendBtn : document.querySelector('.chat-input-box button'),
    helpBtn     : document.getElementById('help-button'),
    helpForm    : document.getElementById('helpForm'),
    helpInput   : document.getElementById('helpText'),
    helpStatus  : document.getElementById('helpStatus'),
    answerPanel : document.getElementById('answerPanel'),
    questionText: document.getElementById('questionText'),
    answerArea  : document.getElementById('answerButtons'),
    progressFill: document.getElementById('progressFill')
  };
  console.log("DOM 元素已快取。");
}

function renderStudentInfo(){
  if(el.nameSpan) el.nameSpan.textContent  = studentName;
  if(el.classSpan) el.classSpan.textContent = studentClass;
  console.log("學生資訊已渲染到畫面。");
}

// --------------------------------------------------
// 7. 事件與監聽
// --------------------------------------------------
function setupEventListeners(){
  if(el.helpBtn && el.helpForm){
    el.helpBtn.addEventListener('click', ()=>{
      el.helpForm.style.display = el.helpForm.style.display === 'block' ? 'none' : 'block';
    });
  }
  if(el.chatSendBtn){
    el.chatSendBtn.addEventListener('click', window.sendChatMessage);
  } else console.warn("找不到聊天發送按鈕！");
  console.log("非 Firebase 事件監聽器已設置。");
}

function setupFirebaseListeners(){
  const qRef = ref(db,'teacher/currentQuestion');
  onValue(qRef, snap => handleQuestion(snap.val()), err => {
    console.error("監聽題目失敗:", err);
    if(el.sysMsg) el.sysMsg.textContent = '讀取題目失敗!';
  });
  switchChatListener('lobby','大廳');
  console.log("Firebase 監聽器已設置。");
}

// --------------------------------------------------
// 8. 切換聊天室監聽與送訊息
// --------------------------------------------------
function switchChatListener(qid, title){
  if(currentChatListenerRef) off(currentChatListenerRef);
  currentChatListenerRef = ref(db, `chat/${qid}`);
  onValue(currentChatListenerRef, snap =>{
    const data = snap.val() || {};
    el.chatList.innerHTML = '';
    Object.values(data).forEach(msg=>{
      const li = document.createElement('li');
      li.textContent = `${msg.from||msg.studentId}: ${msg.text||msg.message}`;
      el.chatList.appendChild(li);
    });
  }, err=>console.error('聊天室監聽錯誤:', err));
  if(el.sysMsg) el.sysMsg.textContent = `聊天室：${title}`;
}

window.sendChatMessage = ()=>{
  const target = sessionStorage.getItem('questionId')||'lobby';
  const txt = el.chatInput.value.trim();
  if(!txt) return alert('請輸入訊息！');
  push(ref(db,`chat/${target}`),{
    from: studentName,
    studentId,
    text: txt,
    time: new Date().toISOString()
  }).then(()=> el.chatInput.value='').catch(e=>alert('發送失敗:'+e.message));
};

// --------------------------------------------------
// 9. 處理題目與作答
// --------------------------------------------------
function handleQuestion(q){
  if(!q||!q.type){
    if(el.sysMsg) el.sysMsg.textContent='等待老師出題中…';
    switchChatListener('lobby','大廳'); return;
  }
  const qid = String(q.id||q.questionId||Date.now());
  sessionStorage.setItem('questionId',qid);
  if(el.sysMsg) el.sysMsg.textContent=`📢 老師: ${q.text}`;
  switchChatListener(qid, `題目: ${q.text.slice(0,10)}…`);
  // 顯示作答
  showAnswerPanel(q);
  updateProgress(qid);
}

function showAnswerPanel(q){
  // 實作略
}

function updateProgress(qid){
  // 實作略
}

console.log("student-ui.js (v6.3) 完整載入。");
// --- END OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
