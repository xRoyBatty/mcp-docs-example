import BaseTask from './baseTask.js';

export default class MultiChoiceTask extends BaseTask {
    constructor(element) {
        super(element);
        this.questions = Array.from(element.querySelectorAll('.question'));
        this.addNumbers();
        this.setupInteractions();
    }

    addNumbers() {
        // Add numbers to all questions
        this.questions.forEach((question, index) => {
            const questionText = question.querySelector('.question-text');
            if (questionText && !questionText.textContent.startsWith(`${index + 1}.`)) {
                questionText.textContent = `${index + 1}. ${questionText.textContent.replace(/^\d+\.\s*/, '')}`;
            }

            // Add option letters (a, b, c, etc.)
            const options = question.querySelectorAll('.option');
            options.forEach((option, optIndex) => {
                const letter = String.fromCharCode(97 + optIndex); // 97 is 'a' in ASCII
                const text = option.querySelector('.option-text');
                if (text) {
                    const prefix = document.createElement('span');
                    prefix.className = 'option-prefix';
                    prefix.textContent = `${letter}) `;
                    text.prepend(prefix);
                }
            });
        });
    }

    setupInteractions() {
        // Add interaction feedback
        this.questions.forEach(question => {
            const options = question.querySelectorAll('input[type="radio"]');
            options.forEach(option => {
                option.addEventListener('change', (e) => {
                    // Remove previous selections visual feedback
                    question.querySelectorAll('.option').forEach(opt => 
                        opt.classList.remove('selected'));
                    
                    // Add visual feedback for new selection
                    const selectedLabel = e.target.closest('.option');
                    if (selectedLabel) {
                        selectedLabel.classList.add('selected');
                    }
                });
            });
        });
    }

    async check() {
        let correct = 0;
        let answered = 0;

        this.questions.forEach(question => {
            const selected = question.querySelector('input:checked');
            if (selected) {
                answered++;
                const option = selected.closest('.option');
                const isCorrect = selected.dataset.correct === 'true';

                // Remove any previous feedback
                option.classList.remove('correct', 'incorrect', 'selected');
                
                // Add new feedback
                option.classList.add(isCorrect ? 'correct' : 'incorrect');

                if (isCorrect) correct++;

                // Show correct answer if wrong
                if (!isCorrect) {
                    const correctOption = question.querySelector('input[data-correct="true"]');
                    if (correctOption) {
                        correctOption.closest('.option').classList.add('correct', 'dimmed');
                    }
                }
            }
        });

        // Update state
        this.state.score = this.calculateScore(correct, this.questions.length);
        this.state.checked = true;
        this.state.answered = answered;

        return {
            correct: this.state.score === 1,
            score: this.state.score,
            details: {
                total: this.questions.length,
                correct,
                answered
            }
        };
    }

    reset() {
        // Uncheck all options
        this.element.querySelectorAll('input[type="radio"]').forEach(input => {
            input.checked = false;
            const option = input.closest('.option');
            if (option) {
                option.classList.remove('selected', 'correct', 'incorrect', 'dimmed');
            }
        });

        // Reset state
        this.state.checked = false;
        this.state.score = 0;
        this.state.answered = 0;
    }
}
