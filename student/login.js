// 等待 HTML 文件完全載入並解析完畢
document.addEventListener('DOMContentLoaded', (event) => {

    // --- DOM 元素獲取 ---
    const identitySelect = document.getElementById('identitySelect');
    const nameInput = document.getElementById('nameInput');
    const seatArea = document.getElementById('seatArea'); // 包裹座號輸入的容器
    const loginButton = document.getElementById('loginButton');
    const loginForm = document.getElementById('loginForm'); // 獲取表單元素

    // --- 函數：更新座號輸入區域 ---
    function updateSeatArea() {
        const selectedIdentity = identitySelect.value;
        seatArea.innerHTML = ''; // 清空當前座號區域的內容

        if (selectedIdentity === '本班') {
            // 創建本班座號的下拉選單
            const seatSelect = document.createElement('select');
            seatSelect.id = 'seatSelect'; // 給予 ID，方便之後取值
            seatSelect.name = 'seat';

            // 添加預設選項 (可選)
            // const defaultOption = document.createElement('option');
            // defaultOption.value = "";
            // defaultOption.textContent = "-- 請選擇座號 --";
            // defaultOption.disabled = true; // 不可選
            // defaultOption.selected = true; // 預設顯示
            // seatSelect.appendChild(defaultOption);

            // 添加 1 到 52 號的選項
            for (let i = 1; i <= 52; i++) {
                const option = document.createElement('option');
                option.value = i; // value 設為數字
                option.textContent = `${i}號`; // 顯示文字
                seatSelect.appendChild(option);
            }
            seatArea.appendChild(seatSelect); // 將下拉選單加入到區域中

            // 更新 Label 文字 (可選)
            const seatLabel = document.querySelector('label[for="seatInput"]'); // 找到對應的 label
             if (seatLabel) {
                 seatLabel.textContent = '請選擇您的座號：'; // 修改文字
             }

        } else if (selectedIdentity === '他班') {
            // 創建他班座號的文字輸入框
            const seatInput = document.createElement('input');
            seatInput.type = 'text'; // 使用 text 才能輸入 G1 這種格式
            seatInput.id = 'seatInput'; // 給予 ID
            seatInput.name = 'seat';
            seatInput.placeholder = '請輸入 G1 - G52';
            seatArea.appendChild(seatInput); // 將輸入框加入到區域中

            // 更新 Label 文字 (可選)
            const seatLabel = document.querySelector('label[for="seatInput"]');
             if (seatLabel) {
                 seatLabel.textContent = '請輸入您的臨時編號 (G1-G52)：';
             }
        }
    }

    // --- 函數：處理登入按鈕點擊 ---
    function handleLogin() {
        const identity = identitySelect.value;
        let name = nameInput.value.trim(); // .trim() 去除前後空白
        let seat = '';

        // 根據當前是下拉選單還是輸入框來獲取座號
        if (identity === '本班') {
            const seatSelectElement = document.getElementById('seatSelect');
            if (seatSelectElement) { // 確保元素存在
                 seat = seatSelectElement.value;
            }
        } else if (identity === '他班') {
            const seatInputElement = document.getElementById('seatInput');
             if (seatInputElement) { // 確保元素存在
                 seat = seatInputElement.value.trim().toUpperCase(); // 轉大寫方便比對或儲存
                 // 可在此處加入 G1-G52 的格式驗證 (暫略)
            }
        }

        // 檢查座號是否為空 (本班時如果沒選，或是他班時沒填)
        if (!seat) {
            alert('請選擇或輸入您的座號！');
            return; // 阻止後續執行
        }

        // 處理姓名：如果姓名為空，則用座號代替
        if (name === '') {
            // 如果是他班，座號可能是 G1，直接用
            // 如果是本班，座號是數字，可以考慮加上 "號"
            name = identity === '本班' ? `${seat}號` : seat;
        }

        // --- 暫停點：在控制台輸出結果 ---
        console.log('--- 登入資訊 ---');
        console.log('身份:', identity);
        console.log('姓名:', name);
        console.log('座號:', seat);
        console.log('------------------');

        // TODO (第三階段): 在此處加入 Firebase 寫入邏輯
        // TODO (第四階段): 在此處加入 localStorage 儲存和頁面跳轉邏輯
    }

    // --- 事件監聽器設定 ---
    // 1. 監聽身份選擇變化，更新座號區域
    identitySelect.addEventListener('change', updateSeatArea);

    // 2. 監聽登入按鈕點擊
    loginButton.addEventListener('click', handleLogin);

    // (可選) 防止按下 Enter 鍵時觸發表單提交 (如果用了 <form>)
    // loginForm.addEventListener('submit', function(event) {
    //     event.preventDefault(); // 阻止預設提交行為
    //     handleLogin(); // 手動觸發登入處理
    // });

    // --- 初始化 ---
    // 頁面載入時，根據預設選中的身份，初始化一次座號區域
    updateSeatArea();

}); // DOMContentLoaded 結束
