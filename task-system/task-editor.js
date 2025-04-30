// --- task-editor.js ---
// (import 和其他變數宣告不變)
import { taskDatabase } from "./firebase-config-task.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const bulkQuestionInput = document.getElementById('bulkQuestionInput');
const questionDateInput = document.getElementById('questionDate');
const courseLevelSelect = document.getElementById('courseLevel');
const subjectSelect = document.getElementById('subject');
const saveBulkQuestionsBtn = document.getElementById('saveBulkQuestionsBtn');

// *** 新版 saveBulkQuestions 函數 ***
async function saveBulkQuestions() { // 改成 async 方便未來擴展
    const rawInput = bulkQuestionInput.value; // 不先 trim
    const date = questionDateInput.value;
    const courseLevel = courseLevelSelect.value;
    const subject = subjectSelect.value;

    if (!rawInput || rawInput.trim() === '') { // 檢查是否為空或只有空白
        alert('請貼上題目內容！');
        return;
    }
    if (!date) {
        alert('請選擇出題日期！');
        return;
    }

    // 使用正規表達式分割行，更穩健地處理不同換行符，並過濾空行
    const lines = rawInput.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
        alert('沒有有效的題目行，請檢查格式！');
        return;
    }

    console.log(`準備處理 ${lines.length} 行題目...`);
    let successCount = 0;
    let errorLines = [];
    const promises = []; // 用來收集所有寫入 Firebase 的 Promise

    // 使用 for...of 迴圈取代 forEach，通常更穩定
    for (const originalLine of lines) {
        let line = originalLine.trim(); // 在迴圈內 trim

        // 檢查基本格式 (必須以 '(' 開頭，且必須有 ')')
        if (!line.startsWith('(') || line.indexOf(')') === -1 || line.indexOf(')') === 1) { // 排除 "()" 這種情況
            console.warn("格式錯誤 (缺少括號或括號內容為空):", originalLine);
            errorLines.push(originalLine);
            continue; // 跳過這一行，處理下一行
        }

        const firstBracket = line.indexOf(')');
        const marker = line.substring(1, firstBracket).trim(); // marker 也要 trim
        const text = line.slice(firstBracket + 1).trim(); // text 也要 trim

        if (!marker || !text) { // 再次檢查 marker 或 text 是否變為空
            console.warn("格式錯誤 (答案標記或題目為空):", originalLine);
            errorLines.push(originalLine);
            continue;
        }

        let type = "";
        let answer = null; // 初始化為 null

        // --- 判斷題型 ---
        if (marker === "○" || marker === "O" || marker === "o") { // 允許大小寫 O
            type = "truefalse";
            answer = "是";
        } else if (marker === "×" || marker === "X" || marker === "x") { // 允許大小寫 X
            type = "truefalse";
            answer = "否";
        } else if (/^[A-E]$/i.test(marker)) { // i 表示不分大小寫
            type = "choice";
            answer = marker.toUpperCase(); // 統一轉大寫
        } else if (/^[A-E](,[A-E])+$/i.test(marker)) {
            type = "multichoice";
            // 統一轉大寫並去空白
            answer = marker.toUpperCase().split(',').map(x => x.trim()).filter(x => x); // 過濾掉空字串
             if (answer.length < 2) { // 至少要有兩個答案
                 console.warn("格式錯誤 (複選題答案少於2個):", originalLine);
                 errorLines.push(originalLine);
                 continue;
             }
        } else if (/^[-+]?\d+(\.\d+)?$/.test(marker)) { // 判斷是否為數字 (包含負數和小數)
            type = "calculation";
            answer = Number(marker);
             if (isNaN(answer)) { // 再次確認轉換後是有效數字
                  console.warn("格式錯誤 (計算題答案無效):", originalLine);
                  errorLines.push(originalLine);
                  continue;
             }
        } else {
            // 其他情況都視為簡答題
            type = "shortanswer";
            answer = marker; // 簡答題答案就是括號內容
        }

        const questionData = {
            type: type,
            text: text,
            date: date,
            courseLevel: courseLevel,
            subject: subject,
            answer: answer,
            // 可以加上原始輸入方便追溯
            // rawMarker: marker,
            // sourceLine: originalLine
        };

        // 創建一個新的 Promise 來處理 Firebase 的寫入操作
        const newQuestionRef = push(ref(taskDatabase, '/questions'));
        const writePromise = set(newQuestionRef, questionData)
            .then(() => {
                successCount++;
                // console.log("成功儲存:", text); // 避免過多 log
            })
            .catch((error) => {
                console.error('❌ 儲存題目失敗:', error, '題目:', text);
                errorLines.push(originalLine);
            });
        promises.push(writePromise); // 將 Promise 加入陣列
    } // end for...of loop

    // 等待所有 Firebase 寫入操作完成
    Promise.allSettled(promises).then(() => {
        console.log("所有題目處理完成。");
        if (successCount > 0) {
            alert(`✅ 成功儲存 ${successCount} / ${lines.length} 題到 Firebase！`);
        }
        if (errorLines.length > 0) {
            console.warn('以下題目格式有問題，未成功儲存：\n', errorLines.join('\n'));
            alert(`⚠️ 有 ${errorLines.length} / ${lines.length} 行題目格式錯誤或儲存失敗，請檢查 Console (F12) 的詳細資訊！`);
        }
        // 清空輸入框只有在有成功儲存題目時才做 (可選)
        if (successCount > 0 && errorLines.length === 0) {
             bulkQuestionInput.value = '';
        }
    });
}

// 確保按鈕綁定了新函數
if (saveBulkQuestionsBtn) {
    saveBulkQuestionsBtn.removeEventListener('click', saveBulkQuestions); // 移除舊監聽器 (以防萬一)
    saveBulkQuestionsBtn.addEventListener('click', saveBulkQuestions); // 綁定新函數
} else {
     console.error("錯誤：找不到儲存按鈕！");
}

// --- task-editor.js 結尾 ---
