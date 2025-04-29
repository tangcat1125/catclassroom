// task-editor.js - 海量貼題模式（全題型版）

import { taskDatabase } from "./firebase-config-task.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 取得DOM元素
const bulkQuestionInput = document.getElementById('bulkQuestionInput');
const questionDateInput = document.getElementById('questionDate');
const courseLevelSelect = document.getElementById('courseLevel');
const subjectSelect = document.getElementById('subject');
const saveBulkQuestionsBtn = document.getElementById('saveBulkQuestionsBtn');

// 儲存按鈕點擊
saveBulkQuestionsBtn.addEventListener('click', saveBulkQuestions);

// 主功能：解析大量題目並儲存
function saveBulkQuestions() {
  const rawInput = bulkQuestionInput.value.trim();
  const date = questionDateInput.value;
  const courseLevel = courseLevelSelect.value;
  const subject = subjectSelect.value;

  if (!rawInput) {
    alert('請貼上題目內容！');
    return;
  }
  if (!date) {
    alert('請選擇出題日期！');
    return;
  }

  const lines = rawInput.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    alert('沒有有效的題目行，請檢查格式！');
    return;
  }

  let successCount = 0;
  let errorLines = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line.startsWith('(') || line.indexOf(')') === -1) {
      errorLines.push(line);
      return;
    }

    const firstBracket = line.indexOf(')');
    const marker = line.substring(1, firstBracket);
    const text = line.slice(firstBracket + 1).trim();

    if (!marker || !text) {
      errorLines.push(line);
      return;
    }

    let type = "";
    let answer = "";

    // 判斷題型
    if (marker === "○" || marker === "×") {
      type = "truefalse";
      answer = (marker === "○") ? "是" : "否";
    } else if (/^[A-E]$/.test(marker)) {
      type = "choice";
      answer = marker;
    } else if (/^[A-E](,[A-E])+$/i.test(marker)) {
      type = "multichoice";
      answer = marker.split(',').map(x => x.trim());
    } else if (/^\d+$/.test(marker)) {
      type = "calculation";
      answer = Number(marker);
    } else {
      type = "shortanswer";
      answer = marker;
    }

    const questionData = {
      type,
      text,
      date,
      courseLevel,
      subject,
      answer
    };

    const newQuestionRef = push(ref(taskDatabase, '/questions'));
    set(newQuestionRef, questionData)
      .then(() => {
        successCount++;
      })
      .catch((error) => {
        console.error('❌ 儲存失敗：', error);
        errorLines.push(line);
      });
  });

  setTimeout(() => {
    if (successCount > 0) {
      alert(`✅ 成功儲存 ${successCount} 題到 Firebase！`);
    }
    if (errorLines.length > 0) {
      console.warn('這些行有問題沒有成功儲存：', errorLines);
      alert(`⚠️ 有 ${errorLines.length} 行格式錯誤，請檢查！`);
    }
    bulkQuestionInput.value = ''; // 清空輸入框
  }, 1000); // 稍微延遲讓Firebase寫入完成
}
