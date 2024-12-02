// Core worksheet functionality
export class WorksheetManager {
    constructor() {
        this.tasks = new Map();
        this.initialized = false;
        this.init();
    }

    async init() {
        if (this.initialized) return;

        // Initialize progress elements
        this.progressBar = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');

        // Load any saved progress
        this.loadProgress();

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

        // Set worksheet ID for progress tracking
        this.worksheetId = window.location.pathname.split('/').slice(-2)[0];

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
        let totalCorrect = 0;
        let totalQuestions = 0;
        const results = new Map();

        // Check each task
        for (const [type, task] of this.tasks) {
            const taskResult = await task.check();
            results.set(type, taskResult);
            
            // Accumulate totals for progress
            if (taskResult.details) {
                totalCorrect += taskResult.details.correct;
                totalQuestions += taskResult.details.total;
            }
        }

        // Calculate overall progress
        const progressPercentage = (totalCorrect / totalQuestions) * 100;
        
        // Update progress display
        this.updateProgress(progressPercentage);

        // Save progress
        this.saveProgress(progressPercentage);

        // Provide feedback
        this.showFeedback(progressPercentage === 100, results);

        return {
            correct: progressPercentage === 100,
            results: Object.fromEntries(results)
        };
    }

    updateProgress(percentage) {
        if (this.progressBar && this.progressText) {
            const roundedPercentage = Math.round(percentage);
            this.progressBar.style.width = `${roundedPercentage}%`;
            this.progressText.textContent = `${roundedPercentage}% Complete`;
        }
    }

    showFeedback(allCorrect, results) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback ${allCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = allCorrect ? 
            'Great job! All answers are correct!' : 
            'Some answers need correction. Try again!';

        // Show feedback
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    saveProgress(percentage) {
        if (this.worksheetId) {
            localStorage.setItem(
                `worksheet_progress_${this.worksheetId}`, 
                percentage.toString()
            );
        }
    }

    loadProgress() {
        if (this.worksheetId) {
            const savedProgress = localStorage.getItem(
                `worksheet_progress_${this.worksheetId}`
            );
            if (savedProgress) {
                this.updateProgress(parseFloat(savedProgress));
            } else {
                this.updateProgress(0); // Initialize at 0%
            }
        }
    }

    reset() {
        // Reset each task
        for (const task of this.tasks.values()) {
            task.reset();
        }

        // Reset progress
        this.updateProgress(0);
        // Clear saved progress
        if (this.worksheetId) {
            localStorage.removeItem(`worksheet_progress_${this.worksheetId}`);
        }
    }

    // Utility method to load task-specific CSS
    static async loadTaskStyles(taskType) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `../../assets/css/tasks/${taskType}.css`;
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