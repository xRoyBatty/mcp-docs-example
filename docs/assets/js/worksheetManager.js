// Core worksheet functionality
export class WorksheetManager {
    constructor() {
        this.tasks = new Map();
        this.initialized = false;
        this.init();
    }

    async init() {
        if (this.initialized) return;

        // Load task modules dynamically based on what's in the worksheet
        const taskElements = document.querySelectorAll('[data-task-type]');
        for (const element of taskElements) {
            const taskType = element.dataset.taskType;
            try {
                // Dynamically import task module
                const TaskModule = await import(`./tasks/${taskType}.js`);
                const task = new TaskModule.default(element);
                this.tasks.set(taskType, task);
            } catch (error) {
                console.error(`Failed to load task type: ${taskType}`, error);
            }
        }

        // Set up event listeners
        this.setupListeners();

        this.initialized = true;
    }

    setupListeners() {
        // Check answers button
        const checkButton = document.getElementById('check');
        if (checkButton) {
            checkButton.addEventListener('click', () => this.checkAnswers());
        }

        // Reset button
        const resetButton = document.getElementById('retry');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.reset());
        }
    }

    async checkAnswers() {
        let allCorrect = true;
        const results = new Map();

        // Check each task
        for (const [type, task] of this.tasks) {
            const taskResult = await task.check();
            results.set(type, taskResult);
            if (!taskResult.correct) allCorrect = false;
        }

        // Provide feedback
        this.showFeedback(allCorrect, results);

        return {
            correct: allCorrect,
            results: Object.fromEntries(results)
        };
    }

    showFeedback(allCorrect, results) {
        // Basic feedback
        const feedback = document.createElement('div');
        feedback.className = `feedback ${allCorrect ? 'success' : 'error'}`;
        feedback.textContent = allCorrect ? 
            'Great job! All answers are correct!' : 
            'Some answers need correction. Try again!';

        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    reset() {
        // Reset each task
        for (const task of this.tasks.values()) {
            task.reset();
        }
    }

    // Utility method to load task-specific CSS
    static async loadTaskStyles(taskType) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `../assets/css/tasks/${taskType}.css`;
        document.head.appendChild(link);
        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
        });
    }
}

// Initialize worksheet when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.worksheetManager = new WorksheetManager();
});