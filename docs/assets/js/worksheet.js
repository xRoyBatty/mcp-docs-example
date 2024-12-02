class WorksheetManager {
    constructor() {
        this.voiceConfig = {
            instructor: {
                primary: 'Microsoft Ava',
                fallback: 'Female'
            },
            student: {
                primary: 'Microsoft Andrew',
                fallback: 'Male'
            },
            features: ['instructions', 'feedback', 'examples']
        };
        
        this.initializeVoices();
        this.initializeInteractions();
    }
    
    async initializeVoices() {
        // Wait for speech synthesis voices to be loaded
        if (window.speechSynthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                window.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
            });
        }

        // Initialize voice objects
        const voices = window.speechSynthesis.getVoices();
        this.instructorVoice = voices.find(voice => 
            voice.name === this.voiceConfig.instructor.primary ||
            voice.name.includes(this.voiceConfig.instructor.fallback)
        ) || voices[0];

        this.studentVoice = voices.find(voice => 
            voice.name === this.voiceConfig.student.primary ||
            voice.name.includes(this.voiceConfig.student.fallback)
        ) || voices[0];
        
        // Initialize audio buttons
        document.querySelectorAll('.play-audio').forEach(button => {
            button.addEventListener('click', (e) => {
                const audioType = e.target.dataset.audio;
                this.playAudio(audioType);
            });
        });
    }
    
    initializeInteractions() {
        // Initialize exercise controls
        const checkButton = document.getElementById('check-answers');
        const hintsButton = document.getElementById('show-hints');
        const resetButton = document.getElementById('reset-exercise');
        
        if (checkButton) {
            checkButton.addEventListener('click', () => this.checkAnswers());
        }
        
        if (hintsButton) {
            hintsButton.addEventListener('click', () => this.showHints());
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetExercise());
        }
        
        // Initialize fill-in-the-blanks
        this.initializeBlanks();
        
        // Initialize multiple choice
        this.initializeMultipleChoice();
        
        // Initialize matching exercises
        this.initializeMatching();
    }
    
    initializeBlanks() {
        document.querySelectorAll('.fill-blank').forEach(blank => {
            blank.addEventListener('input', (e) => {
                this.validateInput(e.target);
            });
        });
    }
    
    initializeMultipleChoice() {
        document.querySelectorAll('.multiple-choice').forEach(choice => {
            choice.addEventListener('change', (e) => {
                this.handleChoice(e.target);
            });
        });
    }
    
    initializeMatching() {
        document.querySelectorAll('.matching-item').forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }
    
    playAudio(type) {
        // Find the text content from the data-audio-text attribute
        const textElement = document.querySelector(`[data-audio-text="${type}"]`);
        if (!textElement) {
            console.error(`No text element found for audio type: ${type}`);
            return;
        }

        const text = textElement.textContent.trim();
        if (!text) {
            console.error('No text content found to speak');
            return;
        }

        // Create and configure speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = type === 'instructions' ? this.instructorVoice : this.studentVoice;
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1.0;

        // Stop any current speech
        window.speechSynthesis.cancel();

        // Play the speech
        window.speechSynthesis.speak(utterance);
    }
    
    validateInput(input) {
        const correct = input.dataset.correct.toLowerCase();
        const current = input.value.toLowerCase();
        
        if (current === correct) {
            input.classList.add('correct');
            input.classList.remove('incorrect');
            this.provideFeedback(true, 'Correct!');
        } else if (current && current.length >= correct.length) {
            input.classList.add('incorrect');
            input.classList.remove('correct');
            this.provideFeedback(false, 'Try again');
        }
    }
    
    handleChoice(choice) {
        const correct = choice.dataset.correct === 'true';
        const feedbackEl = choice.closest('.multiple-choice-container').querySelector('.feedback');
        
        if (correct) {
            feedbackEl.textContent = 'Correct!';
            feedbackEl.classList.add('correct');
        } else {
            feedbackEl.textContent = 'Try again';
            feedbackEl.classList.add('incorrect');
        }
    }
    
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDrop(e) {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        const sourceEl = document.getElementById(sourceId);
        const targetEl = e.target.closest('.matching-item');
        
        if (sourceEl && targetEl) {
            this.checkMatch(sourceEl, targetEl);
        }
    }
    
    checkMatch(source, target) {
        const isCorrect = source.dataset.match === target.dataset.match;
        
        if (isCorrect) {
            source.classList.add('matched');
            target.classList.add('matched');
            this.provideFeedback(true, 'Correct match!');
        } else {
            this.provideFeedback(false, 'Try a different match');
        }
    }
    
    provideFeedback(correct, message) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
        feedbackEl.textContent = message;
        
        // Remove after 2 seconds
        setTimeout(() => feedbackEl.remove(), 2000);
        
        document.body.appendChild(feedbackEl);
    }
    
    checkAnswers() {
        document.querySelector('.answers').classList.remove('hidden');
    }
    
    showHints() {
        document.querySelectorAll('.hint').forEach(hint => {
            hint.classList.remove('hidden');
        });
    }
    
    resetExercise() {
        // Reset fill-in-the-blanks
        document.querySelectorAll('.fill-blank').forEach(blank => {
            blank.value = '';
            blank.classList.remove('correct', 'incorrect');
        });
        
        // Reset multiple choice
        document.querySelectorAll('.multiple-choice').forEach(choice => {
            choice.checked = false;
        });
        
        // Reset matching
        document.querySelectorAll('.matching-item').forEach(item => {
            item.classList.remove('matched');
        });
        
        // Hide answers
        document.querySelector('.answers').classList.add('hidden');
        
        // Hide hints
        document.querySelectorAll('.hint').forEach(hint => {
            hint.classList.add('hidden');
        });
    }
}

// Initialize the worksheet manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.worksheetManager = new WorksheetManager();
});