// task-database.js - 白貓工作室 task-database管理

import { taskDatabase } from "./firebase-config-task.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 將正在派送的currentQuestion存到Firebase
export function uploadCurrentQuestion(currentQuestion) {
  if (!currentQuestion) {
    console.error("沒有存入任何題目！");
    return;
  }

  const questionRef = ref(taskDatabase, "/currentQuestion");
  set(questionRef, currentQuestion)
    .then(() => {
      console.log("currentQuestion已經成功存入Firebase！");
    })
    .catch((error) => {
      console.error("存入currentQuestion時錯誤：", error);
    });
}
