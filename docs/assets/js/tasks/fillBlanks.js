import BaseTask from './baseTask.js';

export default class FillBlanksTask extends BaseTask {
    constructor(element) {
        super(element);
        this.blanks = Array.from(element.querySelectorAll('.blank'));
        this.addNumbers();
        this.setupInteractions();
    }

    addNumbers() {
        // Add numbers to sentences if they don't already have them
        this.element.querySelectorAll('.task-content > p').forEach((sentence, index) => {
            if (!sentence.textContent.trim().startsWith(`${index + 1}.`)) {
                sentence.textContent = `${index + 1}. ${sentence.textContent.trim()}`;
            }
        });
    }

    setupInteractions() {
        this.blanks.forEach(blank => {
            // Set initial attributes
            blank.setAttribute('autocomplete', 'off');
            blank.setAttribute('spellcheck', 'false');
            
            // Add placeholder
            blank.setAttribute('placeholder', '...');
            
            // Add aria label
            const index = blank.dataset.index;
            blank.setAttribute('aria-label', `Answer for blank ${index}`);

            // Add interaction handlers
            blank.addEventListener('focus', () => this.handleFocus(blank));
            blank.addEventListener('blur', () => this.handleBlur(blank));
            blank.addEventListener('input', () => this.handleInput(blank));
            
            // Add keydown handler for Enter key
            blank.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.focusNextBlank(blank);
                }
            });
        });
    }

    handleFocus(blank) {
        blank.classList.add('focused');
    }

    handleBlur(blank) {
        blank.classList.remove('focused');
    }

    handleInput(blank) {
        // Clear any previous feedback
        blank.classList.remove('correct', 'incorrect');
        
        // Add typing feedback
        if (blank.value.length > 0) {
            blank.classList.add('has-content');
        } else {
            blank.classList.remove('has-content');
        }
    }

    focusNextBlank(currentBlank) {
        const currentIndex = this.blanks.indexOf(currentBlank);
        if (currentIndex < this.blanks.length - 1) {
            this.blanks[currentIndex + 1].focus();
        }
    }

    async check() {
        let correct = 0;
        let answered = 0;

        for (const blank of this.blanks) {
            const userAnswer = blank.value.trim().toLowerCase();
            const correctAnswer = blank.dataset.correct.toLowerCase();

            if (userAnswer) {
                answered++;
                
                // Check if answer is correct
                const isCorrect = userAnswer === correctAnswer;
                
                // Remove previous feedback
                blank.classList.remove('correct', 'incorrect', 'has-content');
                
                // Add new feedback
                blank.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                if (isCorrect) {
                    correct++;
                } else {
                    // Show correct answer tooltip
                    blank.setAttribute('title', `Correct answer: ${correctAnswer}`);
                }
            }
        }

        this.state.score = this.calculateScore(correct, this.blanks.length);
        this.state.checked = true;
        this.state.answered = answered;

        return {
            correct: this.state.score === 1,
            score: this.state.score,
            details: {
                total: this.blanks.length,
                correct,
                answered
            }
        };
    }

    reset() {
        this.blanks.forEach(blank => {
            blank.value = '';
            blank.classList.remove('correct', 'incorrect', 'has-content', 'focused');
            blank.removeAttribute('title');
        });

        this.state.checked = false;
        this.state.score = 0;
        this.state.answered = 0;
    }
}
