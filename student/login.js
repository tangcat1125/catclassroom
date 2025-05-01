// -----------------------------------------------------------------------------
// login.js - 學生登入頁面腳本 (包含 Firebase 初始化與登入寫入)
// -----------------------------------------------------------------------------

// 步驟 1: Firebase SDK 匯入 (假設使用 10.12.0，請確認最新版本)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 步驟 2: Firebase 設定物件
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

// 步驟 3: 初始化 Firebase App 和 Database
try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    console.log("[Firebase] 初始化成功！");

    // --- DOMContentLoaded 事件監聽器 ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("[DOM] 文件載入完成，開始執行腳本。");

        // --- DOM 元素獲取 ---
        const loginForm = document.getElementById('loginForm');
        const identitySelect = document.getElementById('identitySelect');
        const nameInput = document.getElementById('nameInput');
        const seatArea = document.getElementById('seatArea');
        const loginButton = document.getElementById('loginButton');
        const seatLabel = document.querySelector('label[for="seatSelect"]');

        // 檢查 DOM 元素是否存在
        if (!loginForm || !identitySelect || !nameInput || !seatArea || !loginButton || !seatLabel) {
            console.error("[DOM] 錯誤：找不到必要的 HTML 元素，請檢查 ID 是否正確。");
            document.body.innerHTML = `<div style="color: red; padding: 20px;">頁面載入失敗，找不到必要的表單元素，請聯繫管理員。</div>`;
            return;
        }
        console.log("[DOM] 所有需要的元素已成功獲取。");

        // --- 函數：更新座號輸入區域 ---
        function updateSeatArea() {
            const selectedIdentity = identitySelect.value;
            console.log(`[UI] 身份變更為: ${selectedIdentity}，更新座號區域...`);
            seatArea.innerHTML = ''; // 清空當前座號區域

            let seatElementId = '';

            if (selectedIdentity === '本班') {
                // 創建本班座號下拉選單
                const seatSelect = document.createElement('select');
                seatSelect.id = 'seatSelect';
                seatElementId = seatSelect.id;
                seatSelect.name = 'seat';
                seatSelect.style.width = '100%';
                seatSelect.style.padding = '10px';
                seatSelect.style.border = '1px solid #ccc';
                seatSelect.style.borderRadius = '4px';
                seatSelect.style.boxSizing = 'border-box';

                // 添加 1 到 52 號選項
                for (let i = 1; i <= 52; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `${i}號`;
                    seatSelect.appendChild(option);
                }
                seatArea.appendChild(seatSelect);
                console.log("[UI] 已生成本班座號下拉選單。");
                seatLabel.textContent = '請選擇您的座號：';

            } else if (selectedIdentity === '他班') {
                // 創建他班座號輸入框
                const seatInput = document.createElement('input');
                seatInput.type = 'text';
                seatInput.id = 'seatInput';
                seatElementId = seatInput.id;
                seatInput.name = 'seat';
                seatInput.placeholder = '請輸入 G1 - G52';
                seatInput.style.width = '100%';
                seatInput.style.padding = '10px';
                seatInput.style.border = '1px solid #ccc';
                seatInput.style.borderRadius = '4px';
                seatInput.style.boxSizing = 'border-box';
                seatArea.appendChild(seatInput);
                console.log("[UI] 已生成他班編號文字輸入框。");
                seatLabel.textContent = '請輸入您的臨時編號 (G1-G52)：';
            }

            // 更新 Label 的 for 屬性
            if (seatElementId) {
                seatLabel.htmlFor = seatElementId;
                console.log(`[UI] Label 'for' 屬性已更新為: ${seatElementId}`);
            } else {
                console.warn("[UI] 未能確定座號元素的 ID 來更新 Label。");
            }
        }

        // --- 函數：處理登入 ---
        async function handleLogin(event) {
            event.preventDefault(); // 防止表單提交
            console.log("[登入] 登入按鈕被點擊或表單提交。");
            const identity = identitySelect.value;
            let name = nameInput.value.trim();
            let seat = '';

            // 獲取座號
            if (identity === '本班') {
                const seatSelectElement = document.getElementById('seatSelect');
                if (seatSelectElement) {
                    seat = seatSelectElement.value;
                }
            } else if (identity === '他班') {
                const seatInputElement = document.getElementById('seatInput');
                if (seatInputElement) {
                    seat = seatInputElement.value.trim().toUpperCase();
                }
            }

            // 驗證座號
            if (!seat) {
                alert('請選擇或輸入您的座號/編號！');
                console.warn("[驗證] 座號為空，已提示使用者。");
                return;
            }

            // 驗證他班座號格式 (G1-G52)
            const guestSeatRegex = /^G([1-9]|[1-4][0-9]|5[0-2])$/i; // 支援大小寫
            if (identity === '他班' && !guestSeatRegex.test(seat)) {
                alert('他班編號格式錯誤，請輸入 G1 到 G52 之間的編號！ (例如: G1, G25, G52)');
                console.warn(`[驗證] 他班編號格式錯誤: ${seat}`);
                return;
            }

            // 處理姓名
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
                loginButton.disabled = true;
                loginButton.textContent = '登入中...';
                console.log("[UI] 登入按鈕已禁用。");

                // 建構 Firebase 路徑
                const loginPath = `login/${identity}/${seat}`;
                const loginRef = ref(database, loginPath);
                console.log(`[Firebase] 準備寫入路徑: ${loginPath}`);

                // 準備資料
                const loginData = {
                    name: name,
                    loginTime: serverTimestamp()
                };
                console.log("[Firebase] 準備寫入的資料:", loginData);

                // 寫入 Firebase
                await set(loginRef, loginData);
                console.log('[Firebase] 登入資訊寫入成功！');

                // 儲存學生資訊到 localStorage
                const studentInfo = {
                    classType: identity,
                    name: name,
                    seat: seat
                };
                localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
                console.log('[儲存] 學生資訊已存入 localStorage:', studentInfo);

                // 提示並跳轉
                alert('登入成功！準備跳轉...');
                window.location.href = 'student.html';
                console.log("[跳轉] 正在跳轉到 student.html ...");

            } catch (error) {
                console.error("[Firebase] 寫入時發生錯誤:", error);
                alert(`登入失敗，無法寫入資料庫。\n請檢查網路連線或聯繫管理員。\n錯誤訊息: ${error.message}`);
                loginButton.disabled = false;
                loginButton.textContent = '登入教室';
            }
        }

        // --- 事件監聽器設定 ---
        identitySelect.addEventListener('change', updateSeatArea);
        console.log("[事件] 已為身份選擇添加 'change' 監聽器。");

        loginButton.addEventListener('click', handleLogin);
        console.log("[事件] 已為登入按鈕添加 'click' 監聽器。");

        // 添加表單提交事件，支援 Enter 鍵
        loginForm.addEventListener('submit', handleLogin);
        console.log("[事件] 已為表單添加 'submit' 監聽器。");

        // --- 初始化 ---
        console.log("[初始化] 執行首次 updateSeatArea...");
        updateSeatArea();
        console.log("[初始化] 頁面初始化完成。");

    }); // DOMContentLoaded 結束

} catch (firebaseError) {
    console.error("[Firebase] 初始化失敗:", firebaseError);
    document.body.innerHTML = `<div style="color: red; padding: 20px;">應用程式初始化失敗，請檢查網路連線或聯繫管理員。錯誤: ${firebaseError.message}</div>`;
}
