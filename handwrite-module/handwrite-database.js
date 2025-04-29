// handwrite-database.js
// 手寫模組 - 管理學生手寫作答上傳

import { database } from "./handwrite-config.js";
import { ref, set } from "firebase/database";

/**
 * 上傳手寫作答資料到 Firebase
 * @param {string} studentId - 學生代號
 * @param {string} questionId - 題目代號
 * @param {string} imageUrl - 圖片網址（正式版應來自 Firebase Storage）
 * @param {number} releaseTimestamp - 題目發布時間（毫秒）
 */
export async function uploadHandwrite(studentId, questionId, imageUrl, releaseTimestamp) {
  try {
    if (!studentId || !questionId || !imageUrl || !releaseTimestamp) {
      throw new Error("缺少必要資料，無法上傳手寫作答。");
    }

    const currentTime = Date.now();
    const timeLimit = 5 * 60 * 1000; // 5分鐘限制

    if (currentTime - releaseTimestamp > timeLimit) {
      alert("⏰ 作答時間已超過，無法上傳！");
      throw new Error("作答超時，禁止上傳。");
    }

    const handwriteRef = ref(database, `handwriting/${studentId}/${questionId}`);

    const data = {
      imageUrl: imageUrl,
      timestamp: currentTime
    };

    await set(handwriteRef, data);
    console.log("✅ 手寫資料成功上傳！");

  } catch (error) {
    console.error("❌ 上傳手寫資料錯誤：", error);
    throw error; // 把錯誤拋出去，讓呼叫者（例如 HTML 的 try-catch）可以處理
  }
}
