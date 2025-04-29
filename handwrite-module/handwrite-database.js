export function uploadHandwrite(studentId, questionId, imageUrl, releaseTimestamp) {
  if (!studentId || !questionId || !imageUrl || !releaseTimestamp) {
    console.error("❌ 上傳手寫資料失敗：缺少必要資訊！");
    return;
  }

  const currentTime = Date.now();
  const timeLimit = 5 * 60 * 1000; // 30分鐘（毫秒）

  // 檢查是否超時
  if (currentTime - releaseTimestamp > timeLimit) {
    console.error("❌ 上傳失敗：超過作答時間限制！");
    alert("作答時間已結束，無法上傳！");
    return;
  }

  // 如果沒超時，繼續上傳
  const handwriteRef = ref(database, `handwriting/${studentId}/${questionId}`);

  const data = {
    imageUrl: imageUrl,
    timestamp: currentTime
  };

  set(handwriteRef, data)
    .then(() => {
      console.log("✅ 手寫資料成功上傳！");
    })
    .catch((error) => {
      console.error("❌ 上傳失敗：", error);
    });
}
