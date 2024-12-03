// Base class for all task types
export default class BaseTask {
    constructor(element) {
        this.element = element;
        this.type = element.dataset.taskType;
        this.state = {
            checked: false,
            score: 0
        };
        
        // Initialize voice synthesis
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.allowedVoices = [
            'Microsoft Ryan Online (Natural) - English (United Kingdom)',
            'Microsoft Sonia Online (Natural) - English (United Kingdom)',
            'Microsoft AvaMultilingual Online (Natural) - English (United States)',
            'Microsoft AndrewMultilingual Online (Natural) - English (United States)'
        ];
        
        // Load task-specific styles
        this.loadStyles();
        // Set up voice support
        this.setupVoiceSupport();
    }

    async loadStyles() {
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `../../assets/css/tasks/${this.type}.css`;
            document.head.appendChild(link);
            await new Promise((resolve, reject) => {
                link.onload = resolve;
                link.onerror = reject;
            });
        } catch (error) {
            console.error(`Failed to load styles for task type: ${this.type}`, error);
        }
    }

    setupVoiceSupport() {
        // Find instruction element
        const instructions = this.element.querySelector('.task-instructions');
        if (!instructions) return;

        // Create speak button
        const speakButton = document.createElement('button');
        speakButton.className = 'speak-button';
        speakButton.innerHTML = '<span>🔊</span>';
        speakButton.title = 'Read instructions';
        
        // Add click handler
        speakButton.addEventListener('click', () => this.speakText(instructions.textContent));
        
        // Insert button after instructions
        instructions.parentNode.insertBefore(speakButton, instructions.nextSibling);

        // Initialize voices
        if ('speechSynthesis' in window) {
            this.loadVoices();
            this.synthesis.addEventListener('voiceschanged', () => this.loadVoices());
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        this.selectedVoice = this.voices.find(voice => 
            this.allowedVoices.includes(voice.name)
        ) || this.voices[0];
    }

    speakText(text) {
        if (!text || this.synthesis.speaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        this.synthesis.speak(utterance);
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