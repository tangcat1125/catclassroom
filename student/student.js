// -----------------------------------------------------------------------------
// student.js - 學生作答區頁面腳本 (階段 5: 顯示學生資訊)
// -----------------------------------------------------------------------------

// --- DOMContentLoaded 事件監聽器 ---
// 確保 HTML 完全載入後才執行
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DOM] student.html 文件載入完成。");

    // --- 步驟 1: 嘗試從 localStorage 讀取學生資訊 ---
    const storedStudentInfo = localStorage.getItem('studentInfo');
    console.log("[LocalStorage] 讀取到的 studentInfo 字串:", storedStudentInfo);

    let studentInfo = null; // 用來存放解析後的學生資訊物件

    if (storedStudentInfo) {
        try {
            studentInfo = JSON.parse(storedStudentInfo);
            console.log("[LocalStorage] 解析後的 studentInfo 物件:", studentInfo);

            // 簡單驗證一下物件結構是否符合預期
            if (!studentInfo || typeof studentInfo !== 'object' || !studentInfo.classType || !studentInfo.name || !studentInfo.seat) {
                console.error("[LocalStorage] 解析出的 studentInfo 結構不完整或格式錯誤:", studentInfo);
                studentInfo = null; // 視為無效資訊
                 throw new Error("儲存的學生資訊格式錯誤。"); // 拋出錯誤以便 catch 處理
            }

        } catch (error) {
            console.error("[LocalStorage] 解析 studentInfo 字串時發生錯誤:", error);
            // 清除可能已損壞的 localStorage 項目
            localStorage.removeItem('studentInfo');
            alert("讀取使用者資訊時發生錯誤，將返回登入頁面。");
            window.location.href = 'index.html'; // 跳轉回登入頁
            return; // 阻止後續代碼執行
        }
    }

    // --- 步驟 2: 根據讀取結果處理 ---
    if (studentInfo) {
        // --- 步驟 2a: 成功讀取到有效資訊，更新頂部資訊欄 ---
        console.log("[UI] 找到有效的學生資訊，準備更新頂部資訊欄...");

        const infoClassElement = document.getElementById('infoClass');
        const infoSeatElement = document.getElementById('infoSeat');
        const infoNameElement = document.getElementById('infoName');

        // 確保元素都存在
        if (infoClassElement && infoSeatElement && infoNameElement) {
            infoClassElement.textContent = studentInfo.classType; // 顯示身份 (本班/他班)
            infoSeatElement.textContent = studentInfo.seat;     // 顯示座號
            infoNameElement.textContent = studentInfo.name;       // 顯示姓名
            console.log("[UI] 頂部資訊欄已更新。");

            // ======================================================
            // == 在這裡初始化 Firebase 和其他功能 (後續階段) ==
            // ======================================================
            // 例如: initializeFirebaseAndFeatures(studentInfo);


        } else {
            console.error("[DOM] 錯誤：找不到頂部資訊欄的 span 元素 (#infoClass, #infoSeat, #infoName)。");
            alert("頁面結構錯誤，無法顯示學生資訊。");
             // 這裡也可以考慮跳轉回登入頁
             // window.location.href = 'index.html';
        }

    } else {
        // --- 步驟 2b: 沒有找到有效的學生資訊 ---
        console.warn("[驗證] localStorage 中沒有找到有效的 studentInfo。");
        alert("無法獲取學生資訊，請先登入。將返回登入頁面。");

        // 強制跳轉回登入頁面
        window.location.href = 'index.html';
    }

    console.log("[student.js] 腳本初始化流程結束。");

}); // DOMContentLoaded 結束


// --- 後續階段會在這裡添加 Firebase 初始化、監聽器等函數 ---
// 例如:
// function initializeFirebaseAndFeatures(studentInfo) {
//     // 初始化 Firebase App (如果需要新的初始化，或者可以從共享模組導入)
//     // ... firebaseConfig ...
//     // const app = initializeApp(firebaseConfig);
//     // const database = getDatabase(app);
//     console.log("[Firebase] 準備初始化 Firebase 功能 (聊天、題目監聽等)...");
//     // setupChatListener(database, studentInfo);
//     // setupQuestionListener(database, studentInfo);
//     // setupSosButton(database, studentInfo);
// }
