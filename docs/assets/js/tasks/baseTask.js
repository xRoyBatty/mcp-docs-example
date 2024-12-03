export default class BaseTask {
    constructor(element) {
        this.element = element;
        this.setupVoice();
    }

    setupVoice() {
        if ('speechSynthesis' in window) {
            // Find instructions
            const instructions = this.element.querySelector('.instructions');
            if (instructions) {
                const btn = document.createElement('button');
                btn.className = 'voice-btn';
                btn.innerHTML = '🔊';
                btn.addEventListener('click', () => this.speak(instructions.textContent));
                instructions.parentNode.insertBefore(btn, instructions.nextSibling);
            }

            // Initialize voice selector if not done
            this.initVoiceSelector();
        }
    }

    initVoiceSelector() {
        const selector = document.getElementById('globalVoice');
        if (!selector || selector.children.length > 0) return;

        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            selector.innerHTML = voices
                .filter(v => v.lang.startsWith('en'))
                .map(v => `<option value="${v.name}">${v.name}</option>`)
                .join('');
        };

        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        loadVoices();
    }

    speak(text) {
        if (!text || speechSynthesis.speaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const selector = document.getElementById('globalVoice');
        if (selector && selector.value) {
            const voice = speechSynthesis.getVoices()
                .find(v => v.name === selector.value);
            if (voice) utterance.voice = voice;
        }

        speechSynthesis.speak(utterance);
    }

    async check() {
        throw new Error('check() must be implemented by task class');
    }

    reset() {
        throw new Error('reset() must be implemented by task class');
    }

    // Utility methods
    setState(element, state) {
        element.classList.remove('correct', 'incorrect', 'partial');
        if (state) element.classList.add(state);
    }
}