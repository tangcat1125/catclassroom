// ✅ 新版 uploadHandwrite - 使用扁平結構寫入 handwriting/uploads/{questionId}/{studentId}
import { database } from "./handwrite-config.js";
import { ref, set } from "firebase/database";

/**
 * 上傳手寫作答資料到 Firebase（新版：寫入 uploads）
 * @param {string} studentId - 學生代號
 * @param {string} questionId - 題目代號
 * @param {string} imageUrl - 圖片網址（Data URL）
 * @param {string} studentName - 學生名稱
 * @param {string} studentClass - 學生班級
 */
export async function uploadHandwrite(studentId, questionId, imageUrl, studentName, studentClass) {
  try {
    if (!studentId || !questionId || !imageUrl) {
      throw new Error("缺少必要資料，無法上傳手寫作答。");
    }

    const currentTime = Date.now();
    const refPath = ref(database, `handwriting/uploads/${questionId}/${studentId}`);

    const data = {
      imageUrl: imageUrl,
      timestamp: currentTime,
      studentName: studentName,
      studentClass: studentClass || "未知班級",
      fromCanvas: true
    };

    await set(refPath, data);
    console.log("✅ 手寫資料成功上傳至 uploads！");

  } catch (error) {
    console.error("❌ 上傳手寫資料錯誤：", error);
    throw error;
  }
}
