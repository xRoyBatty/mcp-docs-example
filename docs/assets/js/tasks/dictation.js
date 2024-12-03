import BaseTask from './baseTask.js';

export default class DictationTask extends BaseTask {
    constructor(element) {
        super(element);
        this.type = 'dictation';
        this.correctText = element.dataset.text || '';
        this.attempts = 0;
        this.maxAttempts = parseInt(element.dataset.maxAttempts) || 3;
        this.selectedVoice = null;
        this.isPlaying = false;
        
        // Initialize components
        this.createElements();
        this.setupEventListeners();
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.className = 'dictation-container';
        
        // Create controls container
        this.controls = document.createElement('div');
        this.controls.className = 'dictation-controls';

        // Create play button
        this.playButton = document.createElement('button');
        this.playButton.className = 'dictation-button';
        this.playButton.innerHTML = '<span>Play Dictation</span>';
        this.playButton.disabled = true;

        // Create speaking indicator
        this.speakingIndicator = document.createElement('div');
        this.speakingIndicator.className = 'speaking-indicator';

        // Create input area
        this.input = document.createElement('textarea');
        this.input.className = 'dictation-input';
        this.input.placeholder = 'Type the dictation here...';

        // Create feedback area
        this.feedback = document.createElement('div');
        this.feedback.className = 'dictation-feedback';

        // Create help text
        this.helpText = document.createElement('div');
        this.helpText.className = 'dictation-help';
        this.helpText.textContent = `Attempts remaining: ${this.maxAttempts}`;

        // Assemble elements
        this.controls.appendChild(this.playButton);
        this.controls.appendChild(this.speakingIndicator);
        
        this.container.appendChild(this.controls);
        this.container.appendChild(this.input);
        this.container.appendChild(this.feedback);
        this.container.appendChild(this.helpText);

        this.element.appendChild(this.container);
    }

    setupEventListeners() {
        this.playButton.addEventListener('click', () => this.playDictation());
        this.input.addEventListener('input', () => this.validateInput());
        
        // Initialize voices when they're available
        if ('speechSynthesis' in window) {
            this.loadVoices();
            window.speechSynthesis.addEventListener('voiceschanged', () => this.loadVoices());
        }
    }

    loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        const globalVoiceSelect = document.getElementById('globalVoice');
        if (globalVoiceSelect) {
            this.selectedVoice = voices.find(voice => 
                voice.name === globalVoiceSelect.value
            ) || voices[0];
        } else {
            this.selectedVoice = voices[0];
        }
        this.playButton.disabled = false;
    }

    async playDictation() {
        if (this.isPlaying) {
            window.speechSynthesis.cancel();
            this.isPlaying = false;
            this.speakingIndicator.classList.remove('active');
            this.playButton.querySelector('span').textContent = 'Play Dictation';
            return;
        }

        const utterance = new SpeechSynthesisUtterance(this.correctText);
        utterance.voice = this.selectedVoice;

        utterance.onstart = () => {
            this.isPlaying = true;
            this.speakingIndicator.classList.add('active');
            this.playButton.querySelector('span').textContent = 'Stop';
        };

        utterance.onend = () => {
            this.isPlaying = false;
            this.speakingIndicator.classList.remove('active');
            this.playButton.querySelector('span').textContent = 'Play Dictation';
        };

        window.speechSynthesis.speak(utterance);
    }

    validateInput() {
        const userInput = this.input.value.trim().toLowerCase();
        const correctText = this.correctText.trim().toLowerCase();
        
        if (userInput === correctText) {
            this.showFeedback(true);
            return true;
        }
        return false;
    }

    showFeedback(isCorrect) {
        this.feedback.className = `dictation-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        this.feedback.textContent = isCorrect ? 
            'Perfect! Your dictation matches exactly!' : 
            'Keep trying! The text doesn\'t match exactly.';
        
        if (!isCorrect) {
            this.attempts++;
            this.helpText.textContent = `Attempts remaining: ${this.maxAttempts - this.attempts}`;
        }
    }

    async check() {
        const isCorrect = this.validateInput();
        if (!isCorrect && this.attempts >= this.maxAttempts) {
            this.feedback.textContent = `Maximum attempts reached. The correct text was: ${this.correctText}`;
        }
        
        return {
            correct: isCorrect,
            details: {
                correct: isCorrect ? 1 : 0,
                total: 1,
                attempts: this.attempts
            }
        };
    }

    reset() {
        this.input.value = '';
        this.attempts = 0;
        this.feedback.className = 'dictation-feedback';
        this.feedback.textContent = '';
        this.helpText.textContent = `Attempts remaining: ${this.maxAttempts}`;
        if (this.isPlaying) {
            window.speechSynthesis.cancel();
            this.isPlaying = false;
            this.speakingIndicator.classList.remove('active');
            this.playButton.querySelector('span').textContent = 'Play Dictation';
        }
    }
}