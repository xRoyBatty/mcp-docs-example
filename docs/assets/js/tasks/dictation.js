import BaseTask from './baseTask.js';

export default class Dictation extends BaseTask {
    constructor(element) {
        super(element);
        this.textarea = element.querySelector('textarea');
        this.text = this.textarea?.dataset.text || '';
        this.maxAttempts = parseInt(this.textarea?.dataset.maxAttempts || '3', 10);
        this.attempts = this.maxAttempts;
        this.currentSpeed = 1;

        // Setup play button
        this.playBtn = element.querySelector('.play-btn');
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.play());
        }

        // Setup speed buttons
        element.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                element.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSpeed = parseFloat(btn.dataset.speed);
            });
        });

        // Update attempts display
        this.updateAttempts();
    }

    updateAttempts() {
        const attemptsDisplay = this.element.querySelector('.attempts');
        if (attemptsDisplay) {
            attemptsDisplay.textContent = `Plays left: ${this.attempts}`;
        }

        if (this.playBtn) {
            if (this.attempts > 0) {
                this.playBtn.removeAttribute('disabled');
            } else {
                this.playBtn.setAttribute('disabled', 'true');
            }
        }
    }

    play() {
        if (this.attempts <= 0 || !this.text) return;

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(this.text);
        
        // Set voice from global selector
        const selector = document.getElementById('globalVoice');
        if (selector && selector.value) {
            const voice = speechSynthesis.getVoices()
                .find(v => v.name === selector.value);
            if (voice) utterance.voice = voice;
        }

        // Set speed
        utterance.rate = this.currentSpeed;

        // Play audio
        speechSynthesis.speak(utterance);

        // Update attempts
        this.attempts--;
        this.updateAttempts();
    }

    async check() {
        if (!this.textarea || !this.text) return { correct: 0, total: 1 };

        const userText = this.textarea.value.trim().toLowerCase();
        const correctText = this.text.toLowerCase();

        // Calculate similarity
        const isCorrect = userText === correctText;
        const isPartial = !isCorrect && correctText.includes(userText);

        // Show feedback
        this.setState(this.textarea, isCorrect ? 'correct' : isPartial ? 'partial' : 'incorrect');

        // Show correct answer if wrong
        if (!isCorrect) {
            this.textarea.title = `Correct text: ${this.text}`;
        }

        return {
            correct: isCorrect ? 1 : 0,
            total: 1
        };
    }

    reset() {
        if (this.textarea) {
            this.textarea.value = '';
            this.textarea.title = '';
            this.setState(this.textarea, '');
        }
        this.attempts = this.maxAttempts;
        this.updateAttempts();
    }
}