// -----------------------------------------------------------------------------
// login.js - 學生登入頁面腳本 (包含 Firebase 初始化與登入寫入)
// -----------------------------------------------------------------------------

// 步驟 1: Firebase SDK 匯入 (確保 HTML <script> 標籤有 type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"; // 建議檢查最新版本
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // 建議檢查最新版本

// 步驟 2: 你的 Firebase 設定物件
// --- Firebase Configuration ---
// ⚠️ 重要安全提醒：請務必替換成你的真實金鑰和 ID，並注意安全管理。
const firebaseConfig = {
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.firebasestorage.app",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

// 步驟 3: 初始化 Firebase App 和 Database
// --- Initialize Firebase ---
try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    console.log("[Firebase] 初始化成功！");

    // --- DOMContentLoaded 事件監聽器 ---
    // 確保 HTML 完全載入後才執行與 DOM 相關的操作
    document.addEventListener('DOMContentLoaded', () => {
        console.log("[DOM] 文件載入完成，開始執行腳本。");

        // --- DOM 元素獲取 ---
        const identitySelect = document.getElementById('identitySelect');
        const nameInput = document.getElementById('nameInput');
        const seatArea = document.getElementById('seatArea'); // 包裹座號輸入的容器
        const loginButton = document.getElementById('loginButton');
        const seatLabel = document.querySelector('label[for="seatInput"]'); // 獲取座號的 label

        if (!identitySelect || !nameInput || !seatArea || !loginButton || !seatLabel) {
            console.error("[DOM] 錯誤：找不到必要的 HTML 元素，請檢查 ID 是否正確。");
            return; // 停止執行，防止後續錯誤
        }
        console.log("[DOM] 所有需要的元素已成功獲取。");


        // --- 函數：更新座號輸入區域 ---
        function updateSeatArea() {
            const selectedIdentity = identitySelect.value;
            console.log(`[UI] 身份變更為: ${selectedIdentity}，更新座號區域...`);
            seatArea.innerHTML = ''; // 清空當前座號區域的內容

            let seatElementId = ''; // 用於更新 label 的 for 屬性

            if (selectedIdentity === '本班') {
                // 創建本班座號的下拉選單
                const seatSelect = document.createElement('select');
                seatSelect.id = 'seatSelect'; // ID for JS access
                seatElementId = seatSelect.id;
                seatSelect.name = 'seat'; // Form submission name (if needed)
                // Apply styles consistently
                seatSelect.style.width = '100%';
                seatSelect.style.padding = '10px';
                seatSelect.style.border = '1px solid #ccc';
                seatSelect.style.borderRadius = '4px';

                // 添加 1 到 52 號的選項
                for (let i = 1; i <= 52; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `${i}號`;
                    seatSelect.appendChild(option);
                }
                seatArea.appendChild(seatSelect);
                console.log("[UI] 已生成本班座號下拉選單。");

                // 更新 Label 文字
                seatLabel.textContent = '請選擇您的座號：';

            } else if (selectedIdentity === '他班') {
                // 創建他班座號的文字輸入框
                const seatInput = document.createElement('input');
                seatInput.type = 'text'; // Allows 'G' prefix
                seatInput.id = 'seatInput'; // ID for JS access
                seatElementId = seatInput.id;
                seatInput.name = 'seat';
                seatInput.placeholder = '請輸入 G1 - G52';
                // Apply styles consistently
                seatInput.style.width = '100%';
                seatInput.style.padding = '10px';
                seatInput.style.border = '1px solid #ccc';
                seatInput.style.borderRadius = '4px';
                seatInput.style.boxSizing = 'border-box'; // Important for consistent width
                seatArea.appendChild(seatInput);
                console.log("[UI] 已生成他班編號文字輸入框。");

                // 更新 Label 文字
                seatLabel.textContent = '請輸入您的臨時編號 (G1-G52)：';
            }

             // 更新 Label 的 for 屬性，使其能正確對應到新生成的元素 ID
            if (seatElementId) {
                seatLabel.htmlFor = seatElementId;
                 console.log(`[UI] Label 'for' 屬性已更新為: ${seatElementId}`);
            } else {
                 console.warn("[UI] 未能確定座號元素的 ID 來更新 Label。");
            }
        }

        // --- 函數：處理登入按鈕點擊 ---
        async function handleLogin() {
            console.log("[登入] 登入按鈕被點擊。");
            const identity = identitySelect.value;
            let name = nameInput.value.trim();
            let seat = '';

            // 根據當前介面獲取座號
            if (identity === '本班') {
                const seatSelectElement = document.getElementById('seatSelect');
                if (seatSelectElement) { seat = seatSelectElement.value; }
            } else if (identity === '他班') {
                const seatInputElement = document.getElementById('seatInput');
                 if (seatInputElement) { seat = seatInputElement.value.trim().toUpperCase(); }
            }

            // 基本驗證：檢查座號是否已選擇/輸入
            if (!seat) {
                alert('請選擇或輸入您的座號/編號！');
                console.warn("[驗證] 座號為空，已提示使用者。");
                return; // 阻止後續執行
            }

            // (可選) 驗證他班座號格式 G1-G52
            const guestSeatRegex = /^G([1-9]|[1-4][0-9]|5[0-2])$/; // G1-G52
            if (identity === '他班' && !guestSeatRegex.test(seat)) {
                 alert('他班編號格式錯誤，請輸入 G1 到 G52 之間的編號！ (例如: G1, G25, G52)');
                 console.warn(`[驗證] 他班編號格式錯誤: ${seat}`);
                 return;
            }

            // 處理姓名：如果姓名為空，則用座號代替
            if (name === '') {
                name = identity === '本班' ? `${seat}號` : seat;
                console.log(`[處理] 姓名為空，已自動設為: ${name}`);
            }

            console.log('--- 準備提交的登入資訊 ---');
            console.log('身份:', identity);
            console.log('姓名:', name);
            console.log('座號:', seat);
            console.log('-----------------------------');

            // --- Firebase 寫入邏輯 ---
            try {
                // 禁用按鈕，防止重複提交
                loginButton.disabled = true;
                loginButton.textContent = '登入中...';
                console.log("[UI] 登入按鈕已禁用。");

                // 1. 建構 Firebase 路徑 (使用 "login/身份/座號" 結構)
                //    請確保這個結構符合你的 Firebase 規則設計
                const loginPath = `login/${identity}/${seat}`;
                const loginRef = ref(database, loginPath);
                console.log(`[Firebase] 準備寫入路徑: ${loginPath}`);

                // 2. 準備要寫入的資料
                const loginData = {
                    name: name,
                    loginTime: serverTimestamp() // 使用 Firebase 伺服器時間戳
                };
                console.log("[Firebase] 準備寫入的資料:", loginData);

                // 3. 執行寫入操作 (使用 await 等待完成)
                await set(loginRef, loginData);
                console.log('[Firebase] 登入資訊寫入成功！');

                // 4. 寫入成功後的操作
                alert('登入成功！準備跳轉...'); // 提示使用者

                // ==================================================
                // == 第四階段：頁面跳轉與資訊傳遞 (在此處添加) ==
                // ==================================================
                try {
                    const studentInfo = {
                        classType: identity,
                        name: name,
                        seat: seat
                    };
                    localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
                    console.log('[儲存] 學生資訊已存入 localStorage:', studentInfo);

                    // 跳轉到作答區頁面 (假設檔名為 student.html)
                    window.location.href = 'student.html';
                    console.log("[跳轉] 正在跳轉到 student.html ...");

                } catch (storageError) {
                    console.error("[儲存/跳轉] 儲存到 localStorage 或跳轉時發生錯誤:", storageError);
                    alert("登入成功，但儲存資訊或跳轉頁面時發生錯誤，請聯繫管理員。");
                     // 即使跳轉失敗，也要恢復按鈕狀態
                     loginButton.disabled = false;
                     loginButton.textContent = '登入教室';
                }
                // ==================================================


            } catch (error) {
                // 5. 處理 Firebase 寫入失敗
                console.error("[Firebase] 寫入時發生錯誤:", error);
                alert(`登入失敗，無法寫入資料庫。\n請檢查網路連線或 Firebase 設定/規則。\n錯誤訊息: ${error.message}`);
                // 寫入失敗時恢復按鈕
                loginButton.disabled = false;
                loginButton.textContent = '登入教室';

            }
            // finally 塊不再需要，因為成功跳轉後不會執行到這裡，
            // 而失敗時 catch 塊已經處理了按鈕恢復。
            // 如果跳轉前的成功提示後不跳轉，則需要 finally。
            // --- Firebase 寫入邏輯結束 ---
        }

        // --- 事件監聽器設定 ---
        // 1. 監聽身份選擇變化，更新座號區域
        identitySelect.addEventListener('change', updateSeatArea);
        console.log("[事件] 已為身份選擇添加 'change' 監聽器。");

        // 2. 監聽登入按鈕點擊
        loginButton.addEventListener('click', handleLogin);
        console.log("[事件] 已為登入按鈕添加 'click' 監聽器。");

        // --- 初始化 ---
        // 頁面載入時，根據預設選中的身份，初始化一次座號區域
        console.log("[初始化] 執行首次 updateSeatArea...");
        updateSeatArea();
        console.log("[初始化] 頁面初始化完成。");

    }); // DOMContentLoaded 結束

} catch (firebaseError) {
    // 捕獲 Firebase 初始化時可能發生的錯誤
    console.error("[Firebase] 初始化失敗:", firebaseError);
    alert("無法初始化應用程式，請檢查 Firebase 設定或網路連線。");
    // 在頁面上顯示錯誤訊息可能更友好
    document.body.innerHTML = `<div style="color: red; padding: 20px;">應用程式初始化失敗，請檢查 Firebase 設定並刷新頁面。錯誤: ${firebaseError.message}</div>`;
}
