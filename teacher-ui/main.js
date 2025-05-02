// --- 按鈕功能設定 ---

// 1. 複製連結按鈕 (Grok 版本可能已有類似函數 copyLink)
const copyLinkBtn = document.getElementById('copyLinkButton');
if (copyLinkBtn) {
    // 確保 copyLink 函數存在
    if (typeof copyLink === 'function') {
        copyLinkBtn.addEventListener('click', copyLink);
         console.log("[Setup] 複製連結按鈕已設定。");
    } else {
         console.warn("[Setup] 找不到 copyLink 函數。");
         copyLinkBtn.addEventListener('click', () => alert('複製功能未定義！'));
    }
} else { console.warn("[DOM] 找不到複製連結按鈕。"); }

// 2. 出題面板按鈕 (Grok 版本可能已有類似函數 showQuestionPanel)
const questionPanelBtn = document.getElementById('questionPanelButton');
if (questionPanelBtn) {
    if (typeof showQuestionPanel === 'function') {
         questionPanelBtn.addEventListener('click', showQuestionPanel);
          console.log("[Setup] 出題面板按鈕已設定。");
    } else {
         console.warn("[Setup] 找不到 showQuestionPanel 函數。");
         questionPanelBtn.addEventListener('click', () => alert('顯示面板功能未定義！'));
    }
} else { console.warn("[DOM] 找不到出題面板按鈕。"); }

// 3. 擷圖按鈕 (Grok 版本可能已有類似函數 takeScreenshot)
const screenshotBtn = document.getElementById('screenshotButton');
if (screenshotBtn) {
     if (typeof takeScreenshot === 'function') {
          screenshotBtn.addEventListener('click', takeScreenshot);
           console.log("[Setup] 擷圖按鈕已設定。");
     } else {
          console.warn("[Setup] 找不到 takeScreenshot 函數。");
          screenshotBtn.addEventListener('click', () => alert('擷圖功能未定義！'));
     }
} else { console.warn("[DOM] 找不到擷圖按鈕。"); }

// 4. 教室管理按鈕 (添加新功能)
const classroomMgmtBtn = document.getElementById('classroomMgmtButton');
if (classroomMgmtBtn) {
    classroomMgmtBtn.addEventListener('click', () => {
        alert('教室管理功能正在開發中...');
        // 在這裡加入你希望執行的程式碼
    });
     console.log("[Setup] 教室管理按鈕已設定。");
} else { console.warn("[DOM] 找不到教室管理按鈕。"); }

// 5. 出題小精靈按鈕 (添加新功能)
const quizBtn = document.getElementById('quizButton');
if (quizBtn) {
    quizBtn.addEventListener('click', () => {
        alert('出題小精靈功能正在開發中...');
        // 在這裡加入你希望執行的程式碼
    });
     console.log("[Setup] 出題小精靈按鈕已設定。");
} else { console.warn("[DOM] 找不到出題小精靈按鈕。"); }

// 6. 派題中心按鈕 (添加新功能)
const dispatchBtn = document.getElementById('dispatchButton');
if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
        alert('派題中心功能正在開發中...');
        // 在這裡加入你希望執行的程式碼
    });
     console.log("[Setup] 派題中心按鈕已設定。");
} else { console.warn("[DOM] 找不到派題中心按鈕。"); }

 // 7. 返回首頁按鈕 (添加新功能)
 const backBtn = document.getElementById('backButton');
 if (backBtn) {
     backBtn.addEventListener('click', () => {
         alert('觸發返回首頁操作 (待實現)...');
         // 例如: window.history.back(); // 返回上一頁
         // 或者 window.location.href = '/'; // 跳轉到網站根目錄
     });
     console.log("[Setup] 返回首頁按鈕已設定。");
 } else { console.warn("[DOM] 找不到返回首頁按鈕。"); }
