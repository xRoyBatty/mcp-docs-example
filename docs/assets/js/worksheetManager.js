export class WorksheetManager {
    constructor() {
        this.tasks = new Map();
        this.init();
    }

    async init() {
        // Find progress elements
        this.progressBar = document.querySelector('.progress-bar');
        this.progressText = document.querySelector('.progress-text');

        // Load tasks
        const taskElements = document.querySelectorAll('.task');
        for (const element of taskElements) {
            const taskType = element.classList[1];  // multiple-choice, fill-blanks, etc.
            try {
                const TaskModule = await import(`./tasks/${taskType}.js`);
                const task = new TaskModule.default(element);
                this.tasks.set(taskType, task);
            } catch (error) {
                console.error(`Failed to load task: ${taskType}`, error);
            }
        }

        // Setup buttons
        document.getElementById('check')?.addEventListener('click', () => this.checkAnswers());
        document.getElementById('retry')?.addEventListener('click', () => this.reset());

        // Load saved progress
        this.loadProgress();
    }

    async checkAnswers() {
        let totalCorrect = 0;
        let totalQuestions = 0;

        // Check each task
        for (const task of this.tasks.values()) {
            const result = await task.check();
            if (result.total) {
                totalCorrect += result.correct;
                totalQuestions += result.total;
            }
        }

        // Update progress
        const progress = Math.round((totalCorrect / totalQuestions) * 100);
        this.updateProgress(progress);
        this.saveProgress(progress);

        // Show feedback
        this.showFeedback(progress === 100);
    }

    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${percentage}% Complete`;
        }
    }

    showFeedback(allCorrect) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${allCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = allCorrect ? 
            'Great job! All answers are correct!' : 
            'Some answers need correction. Try again!';

        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    saveProgress(percentage) {
        const id = location.pathname.split('/').slice(-2)[0];
        localStorage.setItem(`progress_${id}`, percentage);
    }

    loadProgress() {
        const id = location.pathname.split('/').slice(-2)[0];
        const saved = localStorage.getItem(`progress_${id}`);
        if (saved) {
            this.updateProgress(parseInt(saved, 10));
        }
    }

    reset() {
        for (const task of this.tasks.values()) {
            task.reset();
        }
        this.updateProgress(0);
        const id = location.pathname.split('/').slice(-2)[0];
        localStorage.removeItem(`progress_${id}`);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.worksheetManager = new WorksheetManager();
});