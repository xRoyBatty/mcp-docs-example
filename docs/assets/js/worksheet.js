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
        
        this.initializeAudio();
        this.initializeInteractions();
    }
    
    initializeAudio() {
        this.instructorVoice = document.getElementById('instructor-voice');
        this.studentVoice = document.getElementById('student-voice');
        
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
    
    async playAudio(type) {
        const text = document.querySelector(`[data-audio-text="${type}"]`).textContent;
        const voice = type === 'instructions' ? this.voiceConfig.instructor : this.voiceConfig.student;
        
        try {
            // Here you would integrate with your preferred text-to-speech service
            // For now, we'll use a placeholder
            console.log(`Playing audio for ${type} with voice ${voice.primary}`);
            
            // Placeholder for audio playback
            const audioElement = type === 'instructions' ? this.instructorVoice : this.studentVoice;
            // audioElement.src = await this.getAudioUrl(text, voice);
            // await audioElement.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
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