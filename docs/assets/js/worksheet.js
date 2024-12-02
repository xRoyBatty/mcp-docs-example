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
        
        // Store current matches for the matching exercise
        this.currentMatches = new Map();
        
        this.initializeVoices();
        this.initializeInteractions();
    }
    
    async initializeVoices() {
        if (window.speechSynthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                window.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
            });
        }

        const voices = window.speechSynthesis.getVoices();
        this.instructorVoice = voices.find(voice => 
            voice.name === this.voiceConfig.instructor.primary ||
            voice.name.includes(this.voiceConfig.instructor.fallback)
        ) || voices[0];

        this.studentVoice = voices.find(voice => 
            voice.name === this.voiceConfig.student.primary ||
            voice.name.includes(this.voiceConfig.student.fallback)
        ) || voices[0];
        
        document.querySelectorAll('.play-audio').forEach(button => {
            button.addEventListener('click', (e) => {
                const audioType = e.target.dataset.audio;
                this.playAudio(audioType);
            });
        });
    }
    
    initializeInteractions() {
        // Check Answers button
        const checkButton = document.getElementById('check-answers');
        if (checkButton) {
            checkButton.addEventListener('click', () => this.checkAllAnswers());
        }
        
        // Show Hints button
        const hintsButton = document.getElementById('show-hints');
        if (hintsButton) {
            hintsButton.addEventListener('click', () => this.showHints());
        }
        
        // Reset button
        const resetButton = document.getElementById('reset-exercise');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetExercise());
        }
        
        this.initializeBlanks();
        this.initializeMultipleChoice();
        this.initializeMatching();
    }
    
    initializeBlanks() {
        document.querySelectorAll('.fill-blank').forEach(blank => {
            blank.addEventListener('input', (e) => {
                // Remove any previous feedback classes
                e.target.classList.remove('correct', 'incorrect');
            });
        });
    }
    
    initializeMultipleChoice() {
        document.querySelectorAll('.multiple-choice').forEach(choice => {
            choice.addEventListener('change', (e) => {
                // Clear any previous feedback
                const container = e.target.closest('.multiple-choice-container');
                const feedback = container.querySelector('.feedback');
                feedback.textContent = '';
                feedback.className = 'feedback';
            });
        });
    }
    
    initializeMatching() {
        const matchingItems = document.querySelectorAll('.matching-item');
        
        matchingItems.forEach(item => {
            // Make all items draggable
            item.setAttribute('draggable', 'true');
            
            // Add drag event listeners
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            
            // Add visual feedback
            item.addEventListener('dragenter', (e) => {
                if (!e.target.classList.contains('dragging')) {
                    e.target.classList.add('drag-over');
                }
            });
            
            item.addEventListener('dragleave', (e) => {
                e.target.classList.remove('drag-over');
            });
        });
    }
    
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.matching-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedEl = document.getElementById(draggedId);
        const dropZone = e.target.closest('.matching-item');
        
        if (!draggedEl || !dropZone || draggedEl === dropZone) return;
        
        // Store the match
        this.currentMatches.set(draggedEl.dataset.match, dropZone.dataset.match);
        
        // Swap positions
        const draggedRect = draggedEl.getBoundingClientRect();
        const dropRect = dropZone.getBoundingClientRect();
        
        const draggedStyle = window.getComputedStyle(draggedEl);
        const dropStyle = window.getComputedStyle(dropZone);
        
        draggedEl.style.transform = `translate(${dropRect.left - draggedRect.left}px, ${dropRect.top - draggedRect.top}px)`;
        dropZone.style.transform = `translate(${draggedRect.left - dropRect.left}px, ${draggedRect.top - dropRect.top}px)`;
        
        // Clean up
        draggedEl.classList.remove('dragging');
        dropZone.classList.remove('drag-over');
        
        // Swap the elements in DOM
        const parent = draggedEl.parentNode;
        const dropNext = dropZone.nextSibling;
        const draggedNext = draggedEl.nextSibling;
        
        parent.insertBefore(draggedEl, dropNext);
        parent.insertBefore(dropZone, draggedNext);
    }
    
    playAudio(type) {
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

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = type === 'instructions' ? this.instructorVoice : this.studentVoice;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
    
    checkAllAnswers() {
        // Check fill-in-the-blanks
        document.querySelectorAll('.fill-blank').forEach(blank => {
            const correct = blank.dataset.correct.toLowerCase();
            const current = blank.value.toLowerCase();
            
            blank.classList.remove('correct', 'incorrect');
            blank.classList.add(current === correct ? 'correct' : 'incorrect');
        });
        
        // Check multiple choice
        document.querySelectorAll('.multiple-choice-container').forEach(container => {
            const selected = container.querySelector('input:checked');
            const feedback = container.querySelector('.feedback');
            
            if (selected) {
                const isCorrect = selected.dataset.correct === 'true';
                feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect';
                feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            }
        });
        
        // Check matching
        const allMatched = this.checkMatching();
        
        // Show the answers section
        document.querySelector('.answers').classList.remove('hidden');
        
        // Provide overall feedback
        this.provideFeedback(allMatched, 
            allMatched ? 'Great job! All matches are correct!' : 'Some matches need correction. Try again!');
    }
    
    checkMatching() {
        let allCorrect = true;
        this.currentMatches.forEach((value, key) => {
            if (key !== value) {
                allCorrect = false;
            }
        });
        return allCorrect;
    }
    
    provideFeedback(correct, message) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
        feedbackEl.textContent = message;
        
        // Remove after 3 seconds
        setTimeout(() => feedbackEl.remove(), 3000);
        
        document.body.appendChild(feedbackEl);
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
        document.querySelectorAll('.feedback').forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'feedback';
        });
        
        // Reset matching
        this.currentMatches.clear();
        document.querySelectorAll('.matching-item').forEach(item => {
            item.classList.remove('matched', 'incorrect');
            item.style.transform = '';
        });
        
        // Hide answers
        document.querySelector('.answers').classList.add('hidden');
        
        // Hide hints
        document.querySelectorAll('.hint').forEach(hint => {
            hint.classList.add('hidden');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.worksheetManager = new WorksheetManager();
});