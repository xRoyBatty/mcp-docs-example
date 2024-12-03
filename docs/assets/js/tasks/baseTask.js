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
        // Initialize global voice selector if not exists
        this.initGlobalVoiceSelector();

        // Find instruction elements
        const instructions = this.element.querySelectorAll('.task-instructions, .task-content');
        instructions.forEach(instruction => {
            // Create speak button
            const speakButton = document.createElement('button');
            speakButton.className = 'speak-button';
            speakButton.innerHTML = '<span>🔊</span>';
            speakButton.title = 'Read aloud';
            
            // Add click handler
            speakButton.addEventListener('click', () => this.speakText(instruction.textContent));
            
            // Insert button after instruction
            instruction.parentNode.insertBefore(speakButton, instruction.nextSibling);
        });
    }

    initGlobalVoiceSelector() {
        const selector = document.getElementById('globalVoice');
        if (!selector || selector.children.length > 0) return;

        // Initialize voices
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
                const filteredVoices = this.voices.filter(voice => 
                    this.allowedVoices.includes(voice.name));

                selector.innerHTML = '';
                
                filteredVoices.forEach((voice, index) => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = voice.name;
                    selector.appendChild(option);
                });

                // Set default voice
                if (filteredVoices.length > 0) {
                    selector.value = filteredVoices[0].name;
                }
            };

            loadVoices();
            this.synthesis.addEventListener('voiceschanged', loadVoices);
        }
    }

    getSelectedVoice() {
        const selector = document.getElementById('globalVoice');
        if (selector) {
            const selectedVoiceName = selector.value;
            return this.synthesis.getVoices().find(voice => 
                voice.name === selectedVoiceName
            );
        }
        return null;
    }

    speakText(text) {
        if (!text || this.synthesis.speaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = this.getSelectedVoice();
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
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