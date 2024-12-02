import BaseTask from './baseTask.js';

export default class FillBlanksTask extends BaseTask {
    constructor(element) {
        super(element);
        this.blanks = Array.from(element.querySelectorAll('.blank'));
    }

    async check() {
        let correct = 0;

        for (const blank of this.blanks) {
            const userAnswer = blank.value.trim().toLowerCase();
            const correctAnswer = blank.dataset.correct.toLowerCase();

            if (userAnswer === correctAnswer) {
                this.setState(blank, 'correct');
                correct++;
            } else if (userAnswer) {
                this.setState(blank, 'incorrect');
            }
        }

        this.state.score = this.calculateScore(correct, this.blanks.length);
        this.state.checked = true;

        return {
            correct: this.state.score === 1,
            score: this.state.score,
            details: {
                total: this.blanks.length,
                correct
            }
        };
    }

    reset() {
        for (const blank of this.blanks) {
            blank.value = '';
            this.clearState(blank);
        }
        this.state.checked = false;
        this.state.score = 0;
    }
}