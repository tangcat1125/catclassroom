// --- START OF FILE main.js (最終整合版：核心監聽 + 截圖 + 顯示手寫) ---

// -----------------------------------------------------------------------------
// 1. 引入 Firebase 和必要的工具
// -----------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
// 引入 Realtime Database 的工具：
// getDatabase: 取得資料庫
// ref: 指定路徑
// onValue: 持續監聽值的變化 (適合監聽單一節點如 currentQuestion 或整個 answers)
// onChildAdded: 監聽某個路徑下新增的子節點 (適合監聽像 handwriting 這樣會一直增加的路徑)
import { getDatabase, ref, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// -----------------------------------------------------------------------------
// 2. Firebase 設定 (請確認與你的 Firebase 專案一致)
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com", // 確認是 .appspot.com
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074", // 教師端 Web App ID
  measurementId: "G-6C92GYSX3F" // 可選
};

// -----------------------------------------------------------------------------
// 3. 初始化 Firebase
// -----------------------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -----------------------------------------------------------------------------
// 4. 取得重要的畫面元素
// -----------------------------------------------------------------------------
const responseBoard = document.querySelector(".response-board"); // 右側顯示學生回應的區塊
const studentListContainer = document.querySelector(".student-status-list"); // 左側顯示學生列表的容器

// -----------------------------------------------------------------------------
// 5. 全域變數，用來追蹤狀態
// -----------------------------------------------------------------------------
let currentQuestionId = null; // 目前老師派送的題目 ID
let currentQuestionText = "老師尚未出題"; // 目前老師派送的題目文字
let answersListenerUnsubscribe = null; // 用來儲存「停止監聽答案」的功能
let handwritingListeners = {}; // 用來儲存每個學生的手寫監聽器，以便移除

// -----------------------------------------------------------------------------
// 6. 按鈕功能函數 (掛載到 window 讓 HTML 可以呼叫)
// -----------------------------------------------------------------------------

/**
 * 複製學生登入連結到剪貼簿
 */
window.copyLink = function() {
  const linkInput = document.getElementById("login-link");
  if (!linkInput) return alert("錯誤：找不到連結輸入框！");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999); // For mobile devices
  try {
    document.execCommand("copy"); // 舊方法，但相容性較好
    alert("✅ 學生登入連結已複製！");
  } catch (err) {
    // 如果舊方法失敗，嘗試新的 Clipboard API
    navigator.clipboard.writeText(linkInput.value).then(() => {
        alert("✅ 學生登入連結已複製！ (API)");
    }).catch(err => {
        console.error('複製失敗:', err);
        alert("❌ 複製失敗，請手動複製連結。");
    });
  }
  // 取消選取，避免輸入框一直是選取狀態
  window.getSelection().removeAllRanges();
}

/**
 * 顯示題目設定面板 (目前僅為提示)
 */
window.showQuestionPanel = function() {
  alert("👉 此功能尚未實作。\n請使用「開啟派題中心」按鈕來選擇並派送題目。");
}

/**
 * 擷取右側回應區畫面 (使用 html2canvas)
 */
window.takeScreenshot = function() {
  const boardToCapture = document.querySelector(".response-board");

  if (!boardToCapture) {
    alert("錯誤：找不到可以截圖的回應區！");
    return;
  }

  console.log("開始擷取畫面...");
  // 暫時加個提示，讓使用者知道正在處理
  const originalBorder = boardToCapture.style.border;
  boardToCapture.style.border = "3px dashed #007bff"; // 顯示截取中
  const loadingMsg = document.createElement('p');
  loadingMsg.textContent = '正在產生截圖，請稍候...';
  loadingMsg.style.textAlign = 'center';
  loadingMsg.style.fontWeight = 'bold';
  boardToCapture.prepend(loadingMsg);


  html2canvas(boardToCapture, {
      useCORS: true,      // 處理跨來源圖片 (如果有的話)
      allowTaint: true,    // 同上 (可能有安全限制)
      scale: window.devicePixelRatio * 1.5, // 提高截圖解析度
      logging: false, // 關閉 html2canvas 在控制台的囉嗦訊息
      onclone: (clonedDoc) => {
          // 在複製的 DOM 上移除載入訊息，避免它被截進去
          const clonedLoadingMsg = clonedDoc.querySelector(".response-board > p:first-child");
          if (clonedLoadingMsg && clonedLoadingMsg.textContent.includes('正在產生截圖')) {
              clonedLoadingMsg.remove();
          }
          // 也可以在這裡做其他的清理或樣式調整，只影響截圖結果
      }
  }).then(canvas => {
      console.log("截圖完成！");
      // 移除載入訊息和邊框
      loadingMsg.remove();
      boardToCapture.style.border = originalBorder;

      // --- 選擇處理方式 ---
      // 選項 B：讓使用者下載圖片
      try {
          const imageURL = canvas.toDataURL("image/png"); // 直接取得 base64 URL
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
          link.download = `課堂回應截圖_${timestamp}.png`;
          link.href = imageURL;
          link.click(); // 觸發下載
          console.log("截圖下載已觸發。");
          // 下載通常很快，這裡不再跳 alert 避免干擾
      } catch (e) {
           console.error("產生或下載截圖失敗:", e);
           alert("❌ 產生或下載截圖失敗。");
           // 如果 toDataURL 失敗 (例如 Canvas 太大)，可以嘗試 toBlob
      }

      /*
      // 選項 A：在新分頁開啟 (可能被瀏覽器阻擋)
      const imageURL = canvas.toDataURL("image/png");
      const newTab = window.open();
      newTab.document.write(`<title>課堂截圖</title><style>body{margin:0;}</style><img src="${imageURL}" alt="截圖" style="max-width:100%;">`);

      // 選項 C：上傳到 Firebase Storage (需要額外設定和引入 SDK)
      canvas.toBlob(function(blob) {
          if (!blob) {
              console.error("無法產生 Blob 檔案");
              return;
          }
          // import { getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
          // const storage = getStorage(); // 需要初始化 Storage
          // const screenshotRef = storageRef(storage, `screenshots/screenshot_${Date.now()}.png`);
          // uploadBytes(screenshotRef, blob).then((snapshot) => {
          //     console.log('截圖已上傳！', snapshot);
          //     alert('✅ 截圖已上傳！');
          // }).catch(uploadError => {
          //     console.error("上傳截圖失敗:", uploadError);
          //     alert("❌ 上傳截圖失敗。");
          // });
      }, 'image/png');
      */

  }).catch(err => {
      console.error("html2canvas 截圖失敗:", err);
      alert("❌ 截圖失敗，詳細錯誤請查看控制台。");
      // 移除載入訊息和邊框
      loadingMsg.remove();
      boardToCapture.style.border = originalBorder;
  });
}

// -----------------------------------------------------------------------------
// 7. 輔助函數
// -----------------------------------------------------------------------------

/**
 * 讓元素邊框閃爍紅色 (用於提示陌生訪客)
 * @param {string} studentId 學生 ID (用於 Log)
 */
function flashUnknownElement(element) {
    if (!element) return;
    const originalBorder = element.style.border;
    element.style.border = "3px dashed red";
    setTimeout(() => {
        element.style.border = originalBorder || "2px solid #ddd"; // 恢復
    }, 1500);
}

/**
 * 在右側回應區新增一條學生的「一般作答」訊息
 * @param {string} studentId 學生 ID
 * @param {string} studentName 學生姓名
 * @param {string} answerText 學生答案
 */
function addStudentResponse(studentId, studentName, answerText) {
  const box = document.createElement("div");

  const isGuest = studentId && studentId.toString().toLowerCase().startsWith('g');
  let displayName = `${studentName || '匿名'} (${studentId})`;
  let boxColor = "green"; // 已知學生預設綠色

  if (isGuest) {
    boxColor = "red"; // 訪客用紅色
    displayName = `⚠️ 訪客：${displayName}`;
  }

  box.className = `response-box ${boxColor}`;
  box.innerText = `${displayName}: 回答「${answerText}」`;
  responseBoard.appendChild(box);

  if (isGuest) {
    flashUnknownElement(box); // 讓訪客的回答框閃一下
  }
}

/**
 * 在右側回應區新增一條學生的「手寫作答」訊息 (包含圖片)
 * @param {string} studentId 學生 ID
 * @param {object} data 手寫資料 (包含 studentName, questionId, imageUrl, timestamp)
 */
function addHandwritingResponse(studentId, data) {
    const questionId = data.questionId || '未知題目';
    console.log(`顯示學生 ${studentId} 的手寫作答 (題目: ${questionId})`);

    const box = document.createElement("div");
    const isGuest = studentId && studentId.toString().toLowerCase().startsWith('g');
    let displayName = `${data.studentName || '匿名'} (${studentId})`;
    let boxColor = "blue"; // 手寫用藍色

    if (isGuest) {
        boxColor = "orange"; // 訪客手寫用橘色
        displayName = `⚠️ 訪客：${displayName}`;
    }

    box.className = `response-box ${boxColor}`; // 可以為手寫定義不同樣式
    box.style.lineHeight = '1.4'; // 調整行高讓圖片和文字更好看

    // 顯示圖片和相關資訊
    box.innerHTML = `
        <strong style="display: block; margin-bottom: 3px;">${displayName}</strong>
        對題目 "<strong>${questionId}</strong>" 提交了手寫：<br>
        <img src="${data.imageUrl}" alt="學生 ${studentId} 的手寫 (題目 ${questionId})"
             style="max-width: 90%; max-height: 150px; margin-top: 5px; border: 1px solid #ccc; cursor: pointer; display: block; margin-left: auto; margin-right: auto;"
             onclick="window.open('${data.imageUrl}', '_blank')"
             onerror="this.alt='圖片載入失敗'; this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span style="display: none; color: red; font-size: 0.9em;">圖片載入失敗</span>
        <small style="display: block; margin-top: 4px; font-size: 0.8em; color: #666;">
            提交時間: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : '未知'}
        </small>
    `;

    // 將手寫回饋加到回應區，通常放在最前面比較好找
    const firstResponseBox = responseBoard.querySelector('.response-box');
    if (firstResponseBox) {
        responseBoard.insertBefore(box, firstResponseBox);
    } else {
        // 如果回應區還沒有其他回答，就加在標題後面
        const titleElement = responseBoard.querySelector('h3') || responseBoard.querySelector('p');
         if (titleElement) {
             titleElement.insertAdjacentElement('afterend', box);
         } else {
             responseBoard.appendChild(box); // 最後的備案
         }
    }

    if (isGuest) {
        flashUnknownElement(box);
    }
}


/**
 * 更新左側靜態學生列表的燈號狀態
 * **注意：** 由於列表是靜態的，此功能依賴於不穩定的 ID 映射。
 * @param {object} allAnswersData 所有學生的答案資料
 * @param {string} qid 當前題目 ID
 */
function updateStudentStatusLights(allAnswersData, qid) {
  if (!studentListContainer) return; // 如果找不到列表容器就跳過
  const studentRows = studentListContainer.querySelectorAll(".student-row");

  studentRows.forEach(row => {
    const span = row.querySelector("span");
    if (!span) return;

    // *** 再次強調：這是基於靜態列表的不穩定方法 ***
    // 嘗試從 data-id 屬性讀取 ID (如果在 HTML 有加的話)
    let studentIdToCheck = row.getAttribute('data-id');

    // 如果沒有 data-id，退而求其次從文字猜測 (非常不推薦)
    if (!studentIdToCheck) {
        const rowText = row.textContent.trim();
        studentIdToCheck = rowText.split(' ')[1]; // 假設 ID 是第二個詞 (A, B...)
        // console.warn("學生列缺少 data-id，燈號更新可能不準確！行內容:", rowText);
    }

    if (!studentIdToCheck) return; // 還是找不到 ID 就放棄這一行

    // 檢查這個學生 ID 是否對當前題目 qid 有作答紀錄
    if (allAnswersData && allAnswersData[studentIdToCheck] && allAnswersData[studentIdToCheck][qid]) {
      span.className = "green"; // 已作答
    } else {
      // TODO: 未來可結合登入狀態判斷，未登入可能亮紅燈
      span.className = "blue"; // 未作答或未登入（預設）
    }
  });
}

// -----------------------------------------------------------------------------
// 8. Firebase 資料監聽器
// -----------------------------------------------------------------------------

/**
 * 開始監聽指定題目的「一般答案」(/answers)
 * @param {string} qid 題目 ID
 */
function listenToAnswers(qid) {
  console.log(`老師端：準備監聽題目 ${qid} 的一般答案...`);

  // 停止舊的監聽器 (如果有的話)
  if (answersListenerUnsubscribe) {
    console.log("老師端：停止監聽舊題目的一般答案。");
    answersListenerUnsubscribe();
    answersListenerUnsubscribe = null;
  }

  if (!qid) {
    console.log("老師端：沒有題目 ID，無法監聽一般答案。");
    return;
  }

  const answersRef = ref(db, `answers`); // 監聽整個 /answers

  // 開始新的監聽
  console.log(`老師端：正在監聽 /answers 以取得題目 ${qid} 的回饋...`);
  answersListenerUnsubscribe = onValue(answersRef, (snapshot) => {
    console.log(`老師端：收到題目 ${qid} 的一般答案更新！`);
    const allAnswersData = snapshot.val();

    // 清理回應區 (只清除舊的 *一般答案*，保留手寫或其他)
    responseBoard.querySelectorAll('.response-box.green, .response-box.red').forEach(box => box.remove());
    // 移除"尚無學生作答"的提示 (如果有的話)
     const noAnswerMsg = Array.from(responseBoard.querySelectorAll('p')).find(p => p.textContent.includes('尚無學生對此題作答'));
     if(noAnswerMsg) noAnswerMsg.remove();


    let answersFoundCount = 0;
    if (allAnswersData) {
      Object.keys(allAnswersData).forEach(studentId => {
        // 檢查是否有對 *當前題目 qid* 的作答
        if (allAnswersData[studentId] && allAnswersData[studentId][qid]) {
          const answerData = allAnswersData[studentId][qid];
          // 確保有答案內容才顯示
          if(answerData.answer !== undefined && answerData.answer !== null) {
             addStudentResponse(studentId, answerData.name || studentId, answerData.answer);
             answersFoundCount++;
          }
        }
      });
    }

    // 如果遍歷完發現這題沒有任何答案，加個提示
    if (answersFoundCount === 0 && responseBoard.querySelectorAll('.response-box').length === 0) { // 確保連手寫都沒有才加
        const p = document.createElement('p');
        p.textContent = '目前尚無學生對此題作答。';
        p.style.color = 'grey';
        p.style.fontStyle = 'italic';
        responseBoard.appendChild(p);
    }


    // 更新燈號
    updateStudentStatusLights(allAnswersData, qid);

  }, (error) => {
      console.error(`老師端：監聽題目 ${qid} 一般答案時發生錯誤:`, error);
      const errorP = document.createElement('p');
      errorP.textContent = `讀取一般答案時發生錯誤！`;
      errorP.style.color = 'red';
      responseBoard.appendChild(errorP);
  });
}

/**
 * 開始監聽所有學生的「手寫答案」(/handwriting)
 */
function listenToHandwriting() {
    console.log("老師端：開始監聽 /handwriting 路徑以接收手寫作答...");
    const handwritingRef = ref(db, "handwriting");

    // 監聽是否有新的學生 ID 加入 /handwriting
    onChildAdded(handwritingRef, (studentSnapshot) => {
        const studentId = studentSnapshot.key;
        console.log(`老師端：偵測到學生 ${studentId} 的手寫資料夾。`);

        // 為這個學生建立一個新的監聽器，監聽他提交的每一份手寫
        const studentHandwritingRef = ref(db, `handwriting/${studentId}`);
        const listener = onChildAdded(studentHandwritingRef, (questionSnapshot) => {
            const questionId = questionSnapshot.key; // 這其實是題目 ID
            const data = questionSnapshot.val(); // 手寫資料 (imageUrl, timestamp etc.)

            // 呼叫函數在畫面上顯示手寫圖片
            if (data && data.imageUrl) {
                 // 清除舊的相同作答 (避免重複顯示)
                 const oldBoxes = responseBoard.querySelectorAll(`.response-box[data-hw-id="${studentId}-${questionId}"]`);
                 oldBoxes.forEach(box => box.remove());

                addHandwritingResponse(studentId, data);
                 // 給新加的 box 加個標記，方便下次清除
                 const newBox = responseBoard.querySelector(`.response-box img[src="${data.imageUrl}"]`)?.closest('.response-box');
                 if(newBox) newBox.setAttribute('data-hw-id', `${studentId}-${questionId}`);

            } else {
                console.warn(`學生 ${studentId} 的手寫資料 (題目 ${questionId}) 格式不完整或缺少 imageUrl。`);
            }
        }, (error) => {
             console.error(`老師端：監聽學生 ${studentId} 手寫時發生錯誤:`, error);
        });

        // 把這個學生的監聽器存起來，雖然目前沒有用到移除它的邏輯
        handwritingListeners[studentId] = listener;

    }, (error) => {
        console.error("老師端：監聽 /handwriting 主路徑時發生錯誤:", error);
    });
}


// -----------------------------------------------------------------------------
// 9. 主要的程式進入點：監聽老師派題
// -----------------------------------------------------------------------------
function initializeTeacherUI() {
    console.log("老師端：UI 初始化，開始監聽老師派題...");
    responseBoard.innerHTML = "<p>正在初始化，等待老師從「派題中心」出題...</p>";

    const currentQuestionRef = ref(db, "/teacher/currentQuestion");

    onValue(currentQuestionRef, (snapshot) => {
      const questionData = snapshot.val();

      if (questionData && questionData.id) {
        const newQuestionId = questionData.id;
        const newQuestionText = questionData.text || '題目文字未提供';
        console.log(`老師端：偵測到題目更新！ ID: ${newQuestionId}, 題目: ${newQuestionText}`);

        if (newQuestionId !== currentQuestionId) {
            currentQuestionId = newQuestionId;
            currentQuestionText = newQuestionText;

            // 清空回應區 (只留標題)
            responseBoard.innerHTML = `<h3>題目：${currentQuestionText} (ID: ${currentQuestionId})</h3>`;

            // 開始監聽這題的一般答案
            listenToAnswers(currentQuestionId);

            // 重設左側燈號為預設藍色
            if(studentListContainer) {
                studentListContainer.querySelectorAll(".student-row span").forEach(span => span.className = 'blue');
            } else {
                 console.warn("找不到 studentListContainer 無法重設燈號");
            }

        } else {
            console.log("老師端：題目 ID 未變，僅更新文字 (如果有的話)。");
            // 如果只是文字更新，可能只需要更新標題
            if (responseBoard.querySelector('h3')) {
                responseBoard.querySelector('h3').innerText = `題目：${newQuestionText} (ID: ${currentQuestionId})`;
            }
        }
      } else {
        console.log("老師端：偵測到題目被清除。");
        currentQuestionId = null;
        currentQuestionText = "老師尚未出題或已清除題目";
        responseBoard.innerHTML = `<p>${currentQuestionText}</p>`;
        // 停止監聽一般答案
        if (answersListenerUnsubscribe) {
          console.log("老師端：停止監聽一般答案。");
          answersListenerUnsubscribe();
          answersListenerUnsubscribe = null;
        }
        // 重設燈號
         if(studentListContainer) {
            studentListContainer.querySelectorAll(".student-row span").forEach(span => span.className = 'blue');
         }
      }
    }, (error) => {
        console.error("老師端：監聽 /teacher/currentQuestion 時發生嚴重錯誤:", error);
        responseBoard.innerHTML = `<p style="color:red;">讀取老師題目時發生嚴重錯誤！請檢查 Firebase 連線或權限。</p>`;
        currentQuestionId = null;
        if (answersListenerUnsubscribe) {
          answersListenerUnsubscribe();
          answersListenerUnsubscribe = null;
        }
    });

    // 不論老師是否出題，都開始監聽手寫答案
    listenToHandwriting();
}

// -----------------------------------------------------------------------------
// 10. 執行初始化
// -----------------------------------------------------------------------------
initializeTeacherUI();


// --- END OF FILE main.js (最終整合版) ---
