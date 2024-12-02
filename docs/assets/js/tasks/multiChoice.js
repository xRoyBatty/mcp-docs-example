import BaseTask from './baseTask.js';

export default class MultiChoiceTask extends BaseTask {
    constructor(element) {
        super(element);
        this.questions = Array.from(element.querySelectorAll('.question'));
    }

    async check() {
        let correct = 0;

        for (const question of this.questions) {
            const selected = question.querySelector('input:checked');
            if (!selected) continue;

            const option = selected.closest('.option');
            const isCorrect = selected.dataset.correct === 'true';

            this.setState(option, isCorrect ? 'correct' : 'incorrect');
            if (isCorrect) correct++;
        }

        this.state.score = this.calculateScore(correct, this.questions.length);
        this.state.checked = true;

        return {
            correct: this.state.score === 1,
            score: this.state.score,
            details: {
                total: this.questions.length,
                correct
            }
        };
    }

    reset() {
        // Uncheck all options
        this.element.querySelectorAll('input[type="radio"]')
            .forEach(input => {
                input.checked = false;
                const option = input.closest('.option');
                if (option) this.clearState(option);
            });

        this.state.checked = false;
        this.state.score = 0;
    }
}