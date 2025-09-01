// script.js (リッチUI版)
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

    // --- Helper Functions ---
    const showSpinner = (button) => {
        const span = button.querySelector('span');
        const spinner = button.querySelector('.spinner');
        if (span) span.style.display = 'none';
        if (spinner) spinner.classList.remove('hidden');
        button.disabled = true;
    };

    const hideSpinner = (button) => {
        const span = button.querySelector('span');
        const spinner = button.querySelector('.spinner');
        if (span) span.style.display = 'inline';
        if (spinner) spinner.classList.add('hidden');
        button.disabled = false;
    };
    
    const switchSection = (hideSection, showSection) => {
        hideSection.classList.add('fade-out');
        setTimeout(() => {
            hideSection.classList.add('hidden');
            hideSection.classList.remove('fade-out');
            
            showSection.classList.remove('hidden');
            // DOMが更新されるのを待つために微小な遅延を入れる
            setTimeout(() => {
                showSection.style.opacity = 1;
                showSection.style.transform = 'scale(1)';
            }, 10);
        }, 300); // CSSのtransition時間と合わせる
    };

    const showError = (message) => {
        errorMessage.textContent = message;
    };
    
    const showWelcomeScreen = (username) => {
        welcomeMessage.textContent = `Welcome, ${username}. We know your darkness.`;
        switchSection(quizSection, welcomeSection);
        showError("");
    };

    // --- Event Listeners ---
    getQuestionBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        if (!username) {
            showError("Please enter a username.");
            return;
        }

        showSpinner(getQuestionBtn);
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
            // グローバルスコープの代わりに、ボタンのdatasetに保存する方が安全
            loginBtn.dataset.questionId = data.question_id;

            switchSection(usernameSection, quizSection);
            showError("");
        } catch (error) {
            showError(error.message);
        } finally {
            hideSpinner(getQuestionBtn);
        }
    });

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const answer = answerInput.value;
        const questionId = loginBtn.dataset.questionId;
        
        if (!answer) {
            showError("Please enter the answer!");
            return;
        }

        showSpinner(loginBtn);
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('question_id', questionId);
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
            localStorage.setItem('accessToken', data.access_token);
            
            showWelcomeScreen(username);

        } catch (error) {
            showError(error.message);
        } finally {
            hideSpinner(loginBtn);
        }
    });

    generatePoemBtn.addEventListener('click', () => {
        const user = usernameInput.value;
        const poems = [
            `A cry from ${user} echoes in the dark night.\nIs it a tear of jet black,\nor merely hunger's bite?`,
            `The wind whispers the legend of ${user}.\nNever forget those summer days,\nrunning with the Gigadestroyer.`,
            `A melody engraved in the heart.\nThe first CD ${user} ever bought,\nstill makes the soul start.`
        ];
        poemOutput.textContent = poems[Math.floor(Math.random() * poems.length)];
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        // 各入力値をクリア
        usernameInput.value = "";
        answerInput.value = "";
        poemOutput.textContent = "";

        // 表示を初期状態に戻す
        welcomeSection.style.opacity = 0;
        welcomeSection.style.transform = 'scale(0.95)';
        setTimeout(() => {
            welcomeSection.classList.add('hidden');
            switchSection(welcomeSection, usernameSection);
        }, 300)
    });
});