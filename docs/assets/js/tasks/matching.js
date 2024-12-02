import BaseTask from './baseTask.js';

export default class MatchingTask extends BaseTask {
    constructor(element) {
        super(element);
        this.items = Array.from(element.querySelectorAll('.matching-item'));
        this.matches = new Map(); // Stores current matches
        
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        this.items.forEach(item => {
            item.setAttribute('draggable', 'true');
            
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        
        const draggedIndex = e.dataTransfer.getData('text/plain');
        const draggedItem = this.items.find(item => item.dataset.index === draggedIndex);
        const dropTarget = e.target.closest('.matching-item');
        
        if (draggedItem && dropTarget && draggedItem !== dropTarget) {
            // Store the match
            this.matches.set(
                draggedItem.dataset.pair,
                dropTarget.dataset.pair
            );
            
            // Swap positions
            const temp = document.createElement('div');
            draggedItem.parentNode.insertBefore(temp, draggedItem);
            dropTarget.parentNode.insertBefore(draggedItem, dropTarget);
            temp.parentNode.insertBefore(dropTarget, temp);
            temp.remove();
        }
    }

    async check() {
        let correct = 0;
        
        this.matches.forEach((targetPair, sourcePair) => {
            const isCorrect = sourcePair === targetPair;
            if (isCorrect) correct++;
            
            // Mark matched pairs
            const sourceItem = this.items.find(item => item.dataset.pair === sourcePair);
            const targetItem = this.items.find(item => item.dataset.pair === targetPair);
            
            if (sourceItem && targetItem) {
                this.setState(sourceItem, isCorrect ? 'correct' : 'incorrect');
                this.setState(targetItem, isCorrect ? 'correct' : 'incorrect');
            }
        });

        this.state.score = this.calculateScore(correct, this.matches.size);
        this.state.checked = true;

        return {
            correct: this.state.score === 1,
            score: this.state.score,
            details: {
                total: this.matches.size,
                correct
            }
        };
    }

    reset() {
        // Clear matches
        this.matches.clear();
        
        // Reset item states
        this.items.forEach(item => {
            this.clearState(item);
        });
        
        // Return items to original positions
        const container = this.element.querySelector('.matching-container');
        const originalOrder = Array.from(this.items)
            .sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index));
            
        originalOrder.forEach(item => container.appendChild(item));
        
        this.state.checked = false;
        this.state.score = 0;
    }
}