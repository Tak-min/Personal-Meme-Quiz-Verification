document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const registerBtn = document.getElementById('register-btn');
    const errorMessage = document.getElementById('error-message');
    const quizInputs = document.querySelectorAll('.quiz-input');
    const recommendBtn = document.getElementById('recommend-btn'); // 追加

    // ▼▼▼ ここから追加 ▼▼▼
    // レコメンドボタンのイベント
    recommendBtn.addEventListener('click', async () => {
        recommendBtn.textContent = "AIが考えています...";
        recommendBtn.disabled = true;
        showError(""); // エラーメッセージをクリア

        try {
            const response = await fetch('/quizzes/recommendations');
            if (!response.ok) {
                throw new Error("AIがスランプのようです。少し待ってからもう一度試してください。");
            }
            const recommendations = await response.json();

            // 取得した提案をフォームにセット
            quizInputs.forEach((quizDiv, index) => {
                if (recommendations[index]) {
                    quizDiv.querySelector('.question').value = recommendations[index].question;
                    quizDiv.querySelector('.answer').value = recommendations[index].answer;
                }
            });

        } catch (error) {
            showError(error.message);
        } finally {
            recommendBtn.textContent = "ネタに困ったら？ (AIが提案)";
            recommendBtn.disabled = false;
        }
    });
    // ▲▲▲ ここまで追加 ▲▲▲

    // 登録ボタンのイベント
    registerBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (!username) {
            showError("ユーザー名を入力してください。");
            return;
        }

        const quizzes = [];
        let allValid = true;
        quizInputs.forEach(quizDiv => {
            const question = quizDiv.querySelector('.question').value.trim();
            const answer = quizDiv.querySelector('.answer').value.trim();

            if (!question || !answer) {
                allValid = false;
            }
            quizzes.push({ question, answer });
        });

        if (!allValid) {
            showError("すべてのクイズと答えを入力してください。");
            return;
        }

        try {
            const response = await fetch('/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, quizzes })
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "登録に失敗しました。");
            }

            alert("登録が完了しました！ログイン画面に戻ります。");
            window.location.href = '/'; // ログインページにリダイレクト

        } catch (error) {
            showError(error.message);
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
    }
});