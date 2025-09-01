// register.js (リッチUI版)
document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const registerBtn = document.getElementById('register-btn');
    const errorMessage = document.getElementById('error-message');
    const quizInputs = document.querySelectorAll('.quiz-input');
    const recommendBtn = document.getElementById('recommend-btn');

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
    
    const showError = (message) => {
        errorMessage.textContent = message;
    };

    // --- Event Listeners ---
    recommendBtn.addEventListener('click', async () => {
        showSpinner(recommendBtn);
        showError("");

        try {
            const response = await fetch('/quizzes/recommendations');
            if (!response.ok) {
                throw new Error("The AI seems to be in a slump. Please try again in a moment.");
            }
            const recommendations = await response.json();

            quizInputs.forEach((quizDiv, index) => {
                if (recommendations[index]) {
                    quizDiv.querySelector('.question').value = recommendations[index].question;
                    quizDiv.querySelector('.answer').value = recommendations[index].answer;
                }
            });

        } catch (error) {
            showError(error.message);
        } finally {
            hideSpinner(recommendBtn);
        }
    });

    registerBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (!username) {
            showError("Please enter a username.");
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
            showError("Please enter all questions and answers.");
            return;
        }

        showSpinner(registerBtn);
        try {
            const response = await fetch('/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, quizzes })
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Registration failed.");
            }

            alert("Registration complete! Returning to the login page.");
            window.location.href = '/';

        } catch (error) {
            showError(error.message);
        } finally {
            hideSpinner(registerBtn);
        }
    });
});