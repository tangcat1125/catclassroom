// --- START OF FILE task-database.js (修改後) ---

// task-database.js - 白貓工作室 task-database管理 (修正派題路徑版)

// 1. 引入必要的東西
// 從 './firebase-config-task.js' 這個檔案，把我們設定好的 Firebase 資料庫連線 (叫做 taskDatabase) 拿過來用。
import { taskDatabase } from "./firebase-config-task.js";
// 從 Firebase 的官方工具箱裡，拿出兩個工具：
// - ref: 用來告訴 Firebase 我們要操作資料庫的哪個「位置」(路徑)。
// - set: 用來把資料「放」到指定的位置。
import { ref, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 2. 定義一個「功能」叫做 uploadCurrentQuestion
// 這個功能的作用是：接收老師選好的題目 (currentQuestion)，然後把它上傳到 Firebase。
// export 的意思是，這個功能可以被其他檔案 (例如 task-manage.js) 叫去使用。
export function uploadCurrentQuestion(currentQuestion) {

  // 3. 檢查一下老師有沒有真的選題目
  // 如果 currentQuestion 是空的 (null 或 undefined)，就印出錯誤訊息，然後停止執行。
  if (!currentQuestion) {
    console.error("❌ 錯誤：沒有傳入任何題目資料，無法上傳！");
    return; // return 會結束這個功能的執行
  }

  // 4. 告訴 Firebase 我們要把題目放到哪個「位置」
  // 這裡就是最關鍵的修改！
  // 我們用 ref() 工具，告訴 Firebase 資料庫 (taskDatabase)，
  // 我們要操作的路徑是 "/teacher/currentQuestion"。
  // 這個路徑必須跟學生端 student-ui.js 監聽的路徑一模一樣！
  // (原本這裡是 "/currentQuestion"，是不對的)
  const questionRef = ref(taskDatabase, "/teacher/currentQuestion");

  // 5. 把題目資料「放」到指定的位置
  // 我們用 set() 工具，把老師選好的題目資料 (currentQuestion)
  // 放到我們剛剛指定的 questionRef 位置 (/teacher/currentQuestion)。
  set(questionRef, currentQuestion)
    .then(() => {
      // 6. 如果成功放進去...
      // .then() 裡面的程式碼會在 set() 成功完成後執行。
      // 在控制台印出成功訊息，讓開發者知道成功了。
      console.log("✅ 成功：題目已成功派送到 Firebase 的 /teacher/currentQuestion 路徑！");
      // 你也可以在這裡加一個彈出視窗，告訴使用者成功
      // alert("題目已成功派送！");
    })
    .catch((error) => {
      // 7. 如果放進去的時候發生錯誤...
      // .catch() 裡面的程式碼會在 set() 失敗時執行。
      // 在控制台印出詳細的錯誤訊息，方便除錯。
      console.error("❌ 失敗：存入題目到 /teacher/currentQuestion 時發生錯誤：", error);
      // 也可以加個彈出視窗告訴使用者失敗
      // alert("錯誤：派送題目失敗，請檢查網路或稍後再試。");
    });
}

// --- END OF FILE task-database.js (修改後) ---
