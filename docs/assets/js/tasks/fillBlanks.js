import BaseTask from './baseTask.js';

export default class FillBlanks extends BaseTask {
    constructor(element) {
        super(element);
        this.inputs = element.querySelectorAll('input[type="text"]');
        this.setupInputHandling();
    }

    setupInputHandling() {
        this.inputs.forEach(input => {
            // Clean value on focus
            input.addEventListener('focus', () => {
                this.setState(input, '');
            });

            // Handle Enter key to move to next input
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = Array.from(this.inputs)
                        .find(inp => !inp.value && inp !== input);
                    if (nextInput) nextInput.focus();
                }
            });
        });
    }

    async check() {
        let correct = 0;
        const total = this.inputs.length;

        this.inputs.forEach(input => {
            const expectedAnswer = input.dataset.correct;
            const userAnswer = input.value.trim().toLowerCase();
            const isCorrect = userAnswer === expectedAnswer.toLowerCase();

            // Show correct/incorrect state
            this.setState(input, isCorrect ? 'correct' : 'incorrect');

            // Show correct answer for incorrect responses
            if (!isCorrect) {
                input.title = `Correct answer: ${expectedAnswer}`;
            }

            if (isCorrect) correct++;
        });

        return { correct, total };
    }

    reset() {
        this.inputs.forEach(input => {
            input.value = '';
            input.title = '';
            this.setState(input, '');
        });
    }
}