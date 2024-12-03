import BaseTask from './baseTask.js';

export default class FillBlanksTask extends BaseTask {
    constructor(element) {
        super(element);
        this.blanks = Array.from(element.querySelectorAll('.blank-input'));
        this.state = {
            ...this.state,
            answers: new Map(),
            feedback: new Map()
        };
        
        this.initializeTask();
    }

    initializeTask() {
        this.addNumbers();
        this.setupInteractions();
        this.handleAriaLabels();
        this.addErrorHandling();
    }

    handleAriaLabels() {
        this.element.setAttribute('role', 'form');
        this.element.setAttribute('aria-label', 'Fill in the blanks task');
        
        // Add aria-live region for feedback
        const feedbackRegion = document.createElement('div');
        feedbackRegion.setAttribute('aria-live', 'polite');
        feedbackRegion.className = 'visually-hidden feedback-region';
        this.element.appendChild(feedbackRegion);
        this.feedbackRegion = feedbackRegion;
    }

    addNumbers() {
        this.element.querySelectorAll('.sentence').forEach((sentence, index) => {
            const number = document.createElement('span');
            number.className = 'sentence-number';
            number.textContent = `${index + 1}.`;
            number.setAttribute('aria-hidden', 'true');
            sentence.prepend(number);
        });
    }

    setupInteractions() {
        this.blanks.forEach((blank, index) => {
            blank.setAttribute('autocomplete', 'off');
            blank.setAttribute('spellcheck', 'false');
            blank.setAttribute('aria-label', `Answer for blank ${index + 1}`);
            blank.setAttribute('data-index', index + 1);

            blank.addEventListener('focus', () => this.handleFocus(blank));
            blank.addEventListener('blur', () => this.handleBlur(blank));
            blank.addEventListener('input', (e) => this.handleInput(e, blank));
            blank.addEventListener('keydown', (e) => this.handleKeydown(e, blank));
        });
    }

    handleFocus(blank) {
        blank.classList.add('focused');
        if (this.state.feedback.has(blank.dataset.index)) {
            this.showTooltip(blank, this.state.feedback.get(blank.dataset.index));
        }
    }

    handleBlur(blank) {
        blank.classList.remove('focused');
        this.hideTooltip(blank);
    }

    handleInput(event, blank) {
        const value = event.target.value.trim();
        this.state.answers.set(blank.dataset.index, value);
        
        blank.classList.toggle('has-content', value.length > 0);
        this.dispatchProgressEvent();
    }

    handleKeydown(event, blank) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.focusNextBlank(blank);
        }
    }

    focusNextBlank(currentBlank) {
        const currentIndex = this.blanks.indexOf(currentBlank);
        if (currentIndex < this.blanks.length - 1) {
            this.blanks[currentIndex + 1].focus();
        }
    }

    showTooltip(blank, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        blank.parentNode.appendChild(tooltip);

        // Position tooltip
        const blankRect = blank.getBoundingClientRect();
        tooltip.style.top = `${blankRect.top - tooltip.offsetHeight - 5}px`;
        tooltip.style.left = `${blankRect.left + (blankRect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    }

    hideTooltip(blank) {
        const tooltip = blank.parentNode.querySelector('.tooltip');
        if (tooltip) tooltip.remove();
    }

    dispatchProgressEvent() {
        const progress = this.calculateProgress();
        document.dispatchEvent(new CustomEvent('taskProgress', {
            detail: {
                taskId: this.element.id,
                progress
            }
        }));
    }

    calculateProgress() {
        const answered = Array.from(this.state.answers.values()).filter(Boolean).length;
        return answered / this.blanks.length;
    }

    async check() {
        let correct = 0;
        let answered = 0;

        this.blanks.forEach(blank => {
            const userAnswer = blank.value.trim().toLowerCase();
            const correctAnswer = blank.dataset.correct.toLowerCase();
            
            if (userAnswer) {
                answered++;
                const isCorrect = userAnswer === correctAnswer;
                
                // Update visual state
                blank.classList.remove('correct', 'incorrect', 'has-content');
                blank.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                // Update feedback
                if (!isCorrect) {
                    this.state.feedback.set(blank.dataset.index, `Correct answer: ${correctAnswer}`);
                    if (blank.matches(':focus')) {
                        this.showTooltip(blank, this.state.feedback.get(blank.dataset.index));
                    }
                }
                
                if (isCorrect) correct++;
            }
        });

        // Update feedback region for screen readers
        this.feedbackRegion.textContent = `${correct} out of ${this.blanks.length} answers correct`;

        const score = this.calculateScore(correct, this.blanks.length);
        this.state = {
            ...this.state,
            score,
            checked: true,
            answered
        };

        return {
            correct: score === 1,
            score,
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
            this.hideTooltip(blank);
        });

        this.state = {
            ...this.state,
            checked: false,
            score: 0,
            answered: 0,
            answers: new Map(),
            feedback: new Map()
        };

        this.feedbackRegion.textContent = '';
        this.dispatchProgressEvent();
    }

    addErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.target === this.element || this.element.contains(event.target)) {
                console.error('FillBlanks task error:', event.error);
                this.feedbackRegion.textContent = 'An error occurred. Please try again.';
            }
        });
    }
}