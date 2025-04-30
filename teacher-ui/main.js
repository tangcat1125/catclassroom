// --- START OF FILE main.js (全面修改版) ---

// main.js：白貓教師端互動邏輯 (監聽題目與答案修正版)

// 1. 引入需要的 Firebase 工具
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js"; // 主要用 onValue

// 2. Firebase 設定 (跟之前一樣)
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com", // 更正為 .appspot.com
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074", // 教師端主要 App ID
  measurementId: "G-6C92GYSX3F"
};

// 3. 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 4. 取得畫面上的元素
const responseBoard = document.querySelector(".response-board"); // 右側回應區
const studentList = document.querySelector(".student-status-list"); // 左側學生列表區域

// 5. 全域變數
let currentQuestionId = null; // 用來儲存目前老師派送的題目 ID
let answersListenerUnsubscribe = null; // 用來儲存停止監聽答案的功能

// --- 功能函數 ---

// 複製登入連結 (保留)
window.copyLink = function() { // 把它掛到 window 上，HTML 才能呼叫
  const linkInput = document.getElementById("login-link");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
    alert("連結已複製！");
  } catch (err) {
    alert("複製失敗，請手動複製。");
  }
}

// 顯示問題面板 (保留，目前只是提示)
window.showQuestionPanel = function() {
  alert("👉 未來將整合題目派送設定");
}

// 截圖 (保留，目前只是提示)
window.takeScreenshot = function() {
  alert("📸 請手動截圖或未來加入截圖功能");
}

// 紅色閃爍效果 (保留，給陌生訪客用)
function flashUnknownStudent(studentId) {
  console.warn(`偵測到未登記學生 ${studentId} 的作答！`);
  // 可以在這裡讓 responseBoard 閃爍，或是在學生列表新增紅色提示
  responseBoard.style.border = "3px dashed red";
  setTimeout(() => {
    responseBoard.style.border = "2px solid #ddd"; // 恢復原本樣式
  }, 1500); // 閃爍 1.5 秒
}

// 在右側回應區新增一條學生的作答訊息
function addStudentResponse(studentId, studentName, answerText) {
  const box = document.createElement("div");

  // 簡單判斷是否為 guest (實際應用應更複雜，需比對登入名單)
  const isGuest = studentId && studentId.toString().toLowerCase().startsWith('g'); // 假設 G 開頭是訪客
  const isUnknown = studentId === 'guest'; // 舊的 guest 判斷 (來自手寫)

  let displayName = `${studentName || '匿名'} (${studentId})`;
  let boxColor = "green"; // 預設顏色

  if (isGuest || isUnknown) {
    boxColor = "red";
    displayName = `⚠️ 訪客/未登記：${displayName}`;
  }

  box.className = `response-box ${boxColor}`;
  box.innerText = `${displayName}: 回答「${answerText}」`;
  responseBoard.appendChild(box); // 加到回應區

  // 如果是訪客/未登記，觸發閃爍
  if (isGuest || isUnknown) {
    flashUnknownStudent(studentId);
  }
}

// 更新左側學生列表的燈號狀態
function updateStudentStatusLights(allAnswersData, qid) {
  const studentRows = studentList.querySelectorAll(".student-row"); // 取得所有學生列

  studentRows.forEach(row => {
    const span = row.querySelector("span"); // 找到燈泡
    if (!span) return;

    // 從 HTML 文字中提取學生標識 (例如 'A', 'B', 'C')
    // 這是一個**非常不穩定**的方法，因為依賴 HTML 結構
    // 更好的方法是用 data-student-id 屬性
    const rowText = row.textContent.trim();
    const studentIdentifier = rowText.split(' ')[1]; // 假設第二個詞是標識符 (A, B...)

    // *** 關鍵問題：如何將 A, B, C... 映射到真實的 studentId (01, 02, G1...)? ***
    // *** 這裡做一個極度簡化的假設：直接用 A, B, C 作為 ID 來檢查 ***
    // *** 這在實際情況中很可能對不上，需要改成動態列表或 data-id ***
    const studentIdToCheck = studentIdentifier;

    // 檢查這個學生 ID 是否存在於答案資料中，並且是針對當前題目 qid
    if (allAnswersData && allAnswersData[studentIdToCheck] && allAnswersData[studentIdToCheck][qid]) {
      // 如果有作答紀錄，亮綠燈
      span.className = "green";
    } else {
      // 如果沒有作答紀錄，亮藍燈 (預設)
      // 未來可以結合登入狀態判斷是否亮紅燈 (未登入)
      span.className = "blue";
    }
  });
}

// 開始監聽指定題目的答案
function listenToAnswers(qid) {
  console.log(`老師端：開始監聽題目 ${qid} 的答案...`);

  // 1. 如果之前有在監聽別的題目，先停止舊的監聽
  if (answersListenerUnsubscribe) {
    console.log("老師端：停止監聽舊題目的答案。");
    answersListenerUnsubscribe(); // 呼叫停止函數
    answersListenerUnsubscribe = null;
  }

  // 2. 如果沒有題目 ID，就不用監聽了
  if (!qid) {
    console.log("老師端：沒有題目 ID，停止監聽答案。");
    return;
  }

  // 3. 設定要監聽的路徑：整個 /answers
  const answersRef = ref(db, `answers`);

  // 4. 開始用 onValue 持續監聽 /answers 路徑的變化
  answersListenerUnsubscribe = onValue(answersRef, (snapshot) => {
    console.log(`老師端：收到題目 ${qid} 的答案更新！`);
    const allAnswersData = snapshot.val(); // 取得所有學生的答案資料

    // 清空舊的答案顯示 (保留題目資訊)
    const currentQuestionText = responseBoard.querySelector('h3') ? responseBoard.querySelector('h3').innerText : `題目 ID: ${qid}`;
    responseBoard.innerHTML = `<h3>${currentQuestionText}</h3>`; // 清空只留標題

    let answersFoundCount = 0;
    if (allAnswersData) {
      // 遍歷所有學生 ID
      Object.keys(allAnswersData).forEach(studentId => {
        // 檢查這個學生底下，是否有針對 *目前題目 qid* 的作答紀錄
        if (allAnswersData[studentId] && allAnswersData[studentId][qid]) {
          const answerData = allAnswersData[studentId][qid];
          // 如果有，就呼叫 addStudentResponse 顯示出來
          addStudentResponse(studentId, answerData.name || studentId, answerData.answer || '未知答案');
          answersFoundCount++;
        }
      });
    }

    if (answersFoundCount === 0) {
       responseBoard.innerHTML += '<p>目前尚無學生對此題作答。</p>';
    }

    // 每次答案更新後，都去更新左邊的燈號
    updateStudentStatusLights(allAnswersData, qid);

  }, (error) => {
      // 監聽發生錯誤的處理
      console.error(`老師端：監聽題目 ${qid} 答案時發生錯誤:`, error);
      responseBoard.innerHTML += `<p style="color:red;">讀取答案時發生錯誤！</p>`;
  });
}

// --- 主要監聽邏輯 ---

// 監聽老師派題路徑 /teacher/currentQuestion
const currentQuestionRef = ref(db, "/teacher/currentQuestion");
console.log("老師端：開始監聽 /teacher/currentQuestion 路徑...");

onValue(currentQuestionRef, (snapshot) => {
  const questionData = snapshot.val(); // 取得老師派送的題目資料

  if (questionData && questionData.id) {
    // 如果有題目資料，而且裡面有 id 欄位
    const newQuestionId = questionData.id;
    console.log(`老師端：收到新題目！ ID: ${newQuestionId}, 題目: ${questionData.text}`);

    // 檢查是否是新的題目 (避免重複觸發)
    if (newQuestionId !== currentQuestionId) {
        currentQuestionId = newQuestionId; // 更新目前題目 ID

        // 清空右側回應區，並顯示新題目資訊
        responseBoard.innerHTML = `<h3>題目：${questionData.text || '未知題目'} (ID: ${currentQuestionId})</h3><p>等待學生作答...</p>`;

        // 開始監聽這個新題目的答案
        listenToAnswers(currentQuestionId);

        // 重設燈號為藍色 (可選)
        studentList.querySelectorAll(".student-row span").forEach(span => span.className = 'blue');

    } else {
        console.log("老師端：題目 ID 未變，不重新監聽答案。");
    }

  } else {
    // 如果老師清空了題目 (例如設為 null)
    console.log("老師端：題目已被清除。");
    currentQuestionId = null; // 清除目前題目 ID
    responseBoard.innerHTML = "<p>老師尚未出題或已清除題目。</p>"; // 更新回應區顯示
    // 停止監聽答案
    if (answersListenerUnsubscribe) {
      console.log("老師端：停止監聽答案。");
      answersListenerUnsubscribe();
      answersListenerUnsubscribe = null;
    }
     // 重設燈號為藍色
     studentList.querySelectorAll(".student-row span").forEach(span => span.className = 'blue');
  }
}, (error) => {
    // 監聽派題路徑本身發生錯誤
    console.error("老師端：監聽 /teacher/currentQuestion 時發生錯誤:", error);
    responseBoard.innerHTML = `<p style="color:red;">讀取老師題目時發生錯誤！</p>`;
    currentQuestionId = null;
     if (answersListenerUnsubscribe) {
      answersListenerUnsubscribe();
      answersListenerUnsubscribe = null;
    }
});

// --- 初始化 ---
// 頁面載入時，顯示等待訊息
responseBoard.innerHTML = "<p>正在初始化，等待老師出題...</p>";

// --- END OF FILE main.js (全面修改版) ---
