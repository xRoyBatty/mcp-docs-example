import BaseTask from './baseTask.js';

export default class MultiChoiceTask extends BaseTask {
    constructor(element) {
        super(element);
        this.questions = Array.from(element.querySelectorAll('.question'));
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
        this.element.setAttribute('aria-label', 'Multiple choice task');
        
        // Add aria-live region for feedback
        const feedbackRegion = document.createElement('div');
        feedbackRegion.setAttribute('aria-live', 'polite');
        feedbackRegion.className = 'visually-hidden feedback-region';
        this.element.appendChild(feedbackRegion);
        this.feedbackRegion = feedbackRegion;
    }

    addNumbers() {
        this.questions.forEach((question, index) => {
            const questionText = question.querySelector('.question-text');
            if (questionText) {
                questionText.setAttribute('id', `question-${index + 1}`);
                const number = document.createElement('span');
                number.className = 'question-number';
                number.textContent = `${index + 1}.`;
                number.setAttribute('aria-hidden', 'true');
                questionText.prepend(number);
            }

            // Add option letters and enhance accessibility
            const options = question.querySelectorAll('.option');
            options.forEach((option, optIndex) => {
                const letter = String.fromCharCode(97 + optIndex);
                const input = option.querySelector('input[type="radio"]');
                const label = option.querySelector('label');
                
                if (input && label) {
                    const id = `question-${index + 1}-option-${letter}`;
                    input.id = id;
                    label.setAttribute('for', id);
                    
                    // Add option prefix
                    const prefix = document.createElement('span');
                    prefix.className = 'option-prefix';
                    prefix.textContent = `${letter}) `;
                    prefix.setAttribute('aria-hidden', 'true');
                    label.prepend(prefix);
                    
                    // Update input attributes
                    input.setAttribute('name', `question-${index + 1}`);
                    input.setAttribute('aria-labelledby', `question-${index + 1} ${id}`);
                }
            });
        });
    }

    setupInteractions() {
        this.questions.forEach(question => {
            const options = question.querySelectorAll('input[type="radio"]');
            options.forEach(option => {
                option.addEventListener('change', (e) => this.handleOptionSelect(e));
                option.addEventListener('keydown', (e) => this.handleKeyboardNav(e));
            });
        });
    }

    handleOptionSelect(event) {
        const option = event.target;
        const question = option.closest('.question');
        const questionId = question.querySelector('.question-text').id;
        
        // Remove previous selections visual feedback
        question.querySelectorAll('.option').forEach(opt => 
            opt.classList.remove('selected'));
        
        // Add visual feedback for new selection
        const selectedLabel = option.closest('.option');
        if (selectedLabel) {
            selectedLabel.classList.add('selected');
        }
        
        // Update state
        this.state.answers.set(questionId, {
            value: option.value,
            isCorrect: option.dataset.correct === 'true'
        });
        
        this.dispatchProgressEvent();
        
        // Provide feedback for screen readers
        this.feedbackRegion.textContent = `Selected option ${option.value} for question ${questionId}`;
    }

    handleKeyboardNav(event) {
        const option = event.target;
        const question = option.closest('.question');
        const options = Array.from(question.querySelectorAll('input[type="radio"]'));
        const currentIndex = options.indexOf(option);

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                const nextOption = options[currentIndex + 1] || options[0];
                nextOption.focus();
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                const prevOption = options[currentIndex - 1] || options[options.length - 1];
                prevOption.focus();
                break;
        }
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
        return this.state.answers.size / this.questions.length;
    }

    async check() {
        let correct = 0;
        let answered = 0;

        this.questions.forEach(question => {
            const questionId = question.querySelector('.question-text').id;
            const answer = this.state.answers.get(questionId);
            
            if (answer) {
                answered++;
                const option = question.querySelector(`input[value="${answer.value}"]`);
                const optionEl = option.closest('.option');
                
                // Remove previous feedback
                optionEl.classList.remove('correct', 'incorrect', 'selected');
                
                // Add new feedback
                if (answer.isCorrect) {
                    correct++;
                    optionEl.classList.add('correct');
                } else {
                    optionEl.classList.add('incorrect');
                    // Show correct answer
                    const correctOption = question.querySelector('input[data-correct="true"]')
                        .closest('.option');
                    correctOption.classList.add('correct', 'dimmed');
                }
            }
        });

        // Update feedback region for screen readers
        this.feedbackRegion.textContent = `${correct} out of ${this.questions.length} questions answered correctly`;

        const score = this.calculateScore(correct, this.questions.length);
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
                total: this.questions.length,
                correct,
                answered
            }
        };
    }

    reset() {
        // Uncheck all options and remove feedback
        this.element.querySelectorAll('input[type="radio"]').forEach(input => {
            input.checked = false;
            const option = input.closest('.option');
            if (option) {
                option.classList.remove('selected', 'correct', 'incorrect', 'dimmed');
            }
        });

        // Reset state
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
                console.error('MultiChoice task error:', event.error);
                this.feedbackRegion.textContent = 'An error occurred. Please try again.';
            }
        });
    }
}