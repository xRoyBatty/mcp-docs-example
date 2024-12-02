// Base class for all task types
export default class BaseTask {
    constructor(element) {
        this.element = element;
        this.type = element.dataset.taskType;
        this.state = {
            checked: false,
            score: 0
        };
        
        // Load task-specific styles
        this.loadStyles();
    }

    async loadStyles() {
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `../assets/css/tasks/${this.type}.css`;
            document.head.appendChild(link);
            await new Promise((resolve, reject) => {
                link.onload = resolve;
                link.onerror = reject;
            });
        } catch (error) {
            console.error(`Failed to load styles for task type: ${this.type}`, error);
        }
    }

    // Abstract methods that must be implemented by task classes
    async check() {
        throw new Error('check() must be implemented by task class');
    }

    reset() {
        throw new Error('reset() must be implemented by task class');
    }

    // Utility methods for task implementations
    setState(element, state) {
        // Remove all state classes
        element.classList.remove('correct', 'incorrect', 'partial');
        // Add new state class
        if (state) element.classList.add(state);
        // Update data attribute
        element.dataset.state = state || '';
    }

    clearState(element) {
        this.setState(element, null);
    }

    // Basic scoring
    calculateScore(correct, total) {
        return Math.round((correct / total) * 100) / 100;
    }
}