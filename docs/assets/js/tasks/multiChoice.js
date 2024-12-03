import BaseTask from './baseTask.js';

export default class MultipleChoice extends BaseTask {
    constructor(element) {
        super(element);
        this.questions = element.querySelectorAll('.question');
    }

    async check() {
        let correct = 0;
        const total = this.questions.length;

        this.questions.forEach(question => {
            const selected = question.querySelector('input:checked');
            if (selected) {
                const isCorrect = selected.dataset.correct === 'true';
                this.setState(selected.parentElement, isCorrect ? 'correct' : 'incorrect');
                if (isCorrect) correct++;
            }
        });

        return { correct, total };
    }

    reset() {
        this.questions.forEach(question => {
            const options = question.querySelectorAll('.option');
            options.forEach(option => {
                option.classList.remove('correct', 'incorrect');
                option.querySelector('input').checked = false;
            });
        });
    }
}