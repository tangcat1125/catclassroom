// task-database.js - 白貓工作室 task-database 管理（含匿名登入）

import { taskDatabase } from "./firebase-config-task.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const auth = getAuth(); // 初始化 Auth

// 將正在派送的 currentQuestion 存到 Firebase
export function uploadCurrentQuestion(currentQuestion) {
  if (!currentQuestion) {
    console.error("❌ 沒有存入任何題目！");
    return;
  }

  // 匿名登入後再派送題目
  signInAnonymously(auth)
    .then(() => {
      const questionRef = ref(taskDatabase, "/currentQuestion");
      set(questionRef, currentQuestion)
        .then(() => {
          console.log("✅ currentQuestion 已成功存入 Firebase！");
        })
        .catch((error) => {
          console.error("❌ 寫入 currentQuestion 時錯誤：", error);
        });
    })
    .catch((error) => {
      console.error("❌ 匿名登入失敗：", error);
    });
}
