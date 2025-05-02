// -----------------------------------------------------------------------------
// login.js - 學生登入頁面腳本 (包含 Firebase 初始化與登入寫入)
// -----------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase 設定
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

// 初始化 Firebase
try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    console.log("[Firebase] 初始化成功！");

    document.addEventListener('DOMContentLoaded', () => {
        console.log("[DOM] 文件載入完成，開始執行腳本。");

        const loginForm = document.getElementById('loginForm');
        const identitySelect = document.getElementById('identitySelect');
        const nameInput = document.getElementById('nameInput');
        const seatArea = document.getElementById('seatArea');
        const loginButton = document.getElementById('loginButton');
        const seatLabel = document.getElementById('seatLabel'); // ✅ 修正這行！

        if (!loginForm || !identitySelect || !nameInput || !seatArea || !loginButton || !seatLabel) {
            console.error("[DOM] 錯誤：找不到必要的 HTML 元素，請檢查 ID 是否正確。");
            document.body.innerHTML = `<div style="color: red; padding: 20px;">頁面載入失敗，找不到必要的表單元素，請聯繫管理員。</div>`;
            return;
        }

        function updateSeatArea() {
            const selectedIdentity = identitySelect.value;
            seatArea.innerHTML = '';
            let seatElementId = '';

            if (selectedIdentity === '本班') {
                const seatSelect = document.createElement('select');
                seatSelect.id = 'seatSelect';
                seatElementId = seatSelect.id;
                seatSelect.name = 'seat';
                seatSelect.style.width = '100%';
                seatSelect.style.padding = '10px';
                seatSelect.style.border = '1px solid #ccc';
                seatSelect.style.borderRadius = '4px';
                seatSelect.style.boxSizing = 'border-box';

                for (let i = 1; i <= 52; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `${i}號`;
                    seatSelect.appendChild(option);
                }
                seatArea.appendChild(seatSelect);
                seatLabel.textContent = '請選擇您的座號：';

            } else if (selectedIdentity === '他班') {
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
                seatLabel.textContent = '請輸入您的臨時編號 (G1-G52)：';
            }

            if (seatElementId) {
                seatLabel.htmlFor = seatElementId;
            }
        }

        async function handleLogin(event) {
            event.preventDefault();
            const identity = identitySelect.value;
            let name = nameInput.value.trim();
            let seat = '';

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

            if (!seat) {
                alert('請選擇或輸入您的座號/編號！');
                return;
            }

            const guestSeatRegex = /^G([1-9]|[1-4][0-9]|5[0-2])$/i;
            if (identity === '他班' && !guestSeatRegex.test(seat)) {
                alert('他班編號格式錯誤，請輸入 G1 到 G52！');
                return;
            }

            if (name === '') {
                name = identity === '本班' ? `${seat}號` : seat;
            }

            try {
                loginButton.disabled = true;
                loginButton.textContent = '登入中...';

                const loginPath = `login/${identity}/${seat}`;
                const loginRef = ref(database, loginPath);

                const loginData = {
                    name: name,
                    loginTime: serverTimestamp()
                };

                await set(loginRef, loginData);

                const studentInfo = {
                    classType: identity,
                    name: name,
                    seat: seat
                };
                localStorage.setItem('studentInfo', JSON.stringify(studentInfo));

                alert('登入成功！準備跳轉...');
                window.location.href = 'student.html';

            } catch (error) {
                alert(`登入失敗：${error.message}`);
                loginButton.disabled = false;
                loginButton.textContent = '登入教室';
            }
        }

        identitySelect.addEventListener('change', updateSeatArea);
        loginButton.addEventListener('click', handleLogin);
        loginForm.addEventListener('submit', handleLogin);
        updateSeatArea();
    });

} catch (firebaseError) {
    document.body.innerHTML = `<div style="color: red; padding: 20px;">初始化失敗，錯誤: ${firebaseError.message}</div>`;
}
