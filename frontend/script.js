// script.js
document.addEventListener('DOMContentLoaded', () => {
    // 各セクションの要素を取得
    const usernameSection = document.getElementById('username-section');
    const quizSection = document.getElementById('quiz-section');
    const welcomeSection = document.getElementById('welcome-section');

    // 各フォームの要素を取得
    const usernameInput = document.getElementById('username');
    const getQuestionBtn = document.getElementById('get-question-btn');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');

    // ログイン後コンテンツの要素を取得
    const welcomeMessage = document.getElementById('welcome-message');
    const generatePoemBtn = document.getElementById('generate-poem-btn');
    const poemOutput = document.querySelector('#poem-output .poem');
    const logoutBtn = document.getElementById('logout-btn');

    let currentQuestionId = null;

    // クイズ取得ボタンのイベント
    getQuestionBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        if (!username) {
            showError("Please enter a username.");
            return;
        }

        try {
            const response = await fetch('/login/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username })
            });

            if (!response.ok) {
                throw new Error("User not found or server error occurred.");
            }

            const data = await response.json();
            questionText.textContent = data.question;
            currentQuestionId = data.question_id;

            // 画面切り替え
            usernameSection.classList.add('hidden');
            quizSection.classList.remove('hidden');
            showError(""); // エラーメッセージをクリア
        } catch (error) {
            showError(error.message);
        }
    });

    // 認証（ログイン）ボタンのイベント
    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const answer = answerInput.value;
        
        if (!answer) {
            showError("Please enter the answer!");
            return;
        }

        try {
            // FastAPIの /token エンドポイントは特殊な形式(form-data)で送る必要がある
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('question_id', currentQuestionId);
            formData.append('answer', answer);

            const response = await fetch('/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error("The answer seems to be incorrect. Face your past.");
            }
            
            const data = await response.json();
            // 取得したトークンをブラウザに保存
            localStorage.setItem('accessToken', data.access_token);
            
            // ログイン成功画面へ
            showWelcomeScreen(username);

        } catch (error) {
            showError(error.message);
        }
    });

    // ポエム生成ボタンのイベント
    generatePoemBtn.addEventListener('click', () => {
        // ここではダミーのポエムを生成
        const user = usernameInput.value;
        const poems = [
            `A cry from ${user} echoes in the dark night.\nIs it a tear of jet black,\nor merely hunger's bite?`,
            `The wind whispers the legend of ${user}.\nNever forget those summer days,\nrunning with the Gigadestroyer.`,
            `A melody engraved in the heart.\nThe first CD ${user} ever bought,\nstill makes the soul start.`
        ];
        poemOutput.textContent = poems[Math.floor(Math.random() * poems.length)];
    });

    // ログアウトボタンのイベント
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        // 初期画面に戻す
        welcomeSection.classList.add('hidden');
        usernameSection.classList.remove('hidden');
        usernameInput.value = "";
        answerInput.value = "";
        poemOutput.textContent = "";
    });

    // ログイン成功画面を表示する関数
    function showWelcomeScreen(username) {
        quizSection.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
        welcomeMessage.textContent = `Welcome, ${username}. We know your darkness.`;
        showError("");
    }

    // エラーメッセージを表示する関数
    function showError(message) {
        errorMessage.textContent = message;
    }
});