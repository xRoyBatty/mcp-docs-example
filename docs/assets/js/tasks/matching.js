import BaseTask from './baseTask.js';

export default class MatchingTask extends BaseTask {
    constructor(element) {
        super(element);
        this.selectedItem = null;
        this.matches = new Map(); // Stores current matches
        this.lines = new Map(); // Stores SVG lines for connections
        
        this.initializeSVG();
        this.initializeItems();
    }

    initializeSVG() {
        // Create SVG overlay for drawing lines
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.pointerEvents = 'none';
        
        // Add SVG to the matching container
        const container = this.element.querySelector('.matching-container');
        container.style.position = 'relative';
        container.prepend(this.svg);
    }

    initializeItems() {
        const items = this.element.querySelectorAll('.matching-item');
        
        items.forEach((item, index) => {
            // Add numbers to items
            const itemNumber = document.createElement('span');
            itemNumber.className = 'item-number';
            itemNumber.textContent = Math.floor(index/2) + 1;
            item.prepend(itemNumber);
            
            // Add click handlers
            item.addEventListener('click', (e) => this.handleClick(e));
        });
    }

    handleClick(e) {
        const clickedItem = e.currentTarget;
        
        // If no item is selected, select this one
        if (!this.selectedItem) {
            // Only allow selecting from left column
            if (clickedItem.closest('.matching-prompts')) {
                this.selectedItem = clickedItem;
                clickedItem.classList.add('selected');
            }
            return;
        }
        
        // If clicking the same item, deselect it
        if (this.selectedItem === clickedItem) {
            this.selectedItem.classList.remove('selected');
            this.selectedItem = null;
            return;
        }
        
        // If clicking an item in the right column when we have a selection
        if (clickedItem.closest('.matching-responses') && this.selectedItem) {
            this.createMatch(this.selectedItem, clickedItem);
            this.selectedItem.classList.remove('selected');
            this.selectedItem = null;
        }
    }

    createMatch(leftItem, rightItem) {
        // Remove any existing matches for these items
        this.removeMatch(leftItem);
        this.removeMatch(rightItem);
        
        // Create new match
        const matchId = `match-${Date.now()}`;
        this.matches.set(leftItem.dataset.pair, rightItem.dataset.pair);
        
        // Create SVG line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('matching-line');
        this.updateLinePosition(line, leftItem, rightItem);
        this.svg.appendChild(line);
        
        // Store line reference
        this.lines.set(leftItem.dataset.pair, line);
        
        // Add visual feedback
        leftItem.classList.add('matched');
        rightItem.classList.add('matched');
    }

    removeMatch(item) {
        const pair = item.dataset.pair;
        if (this.lines.has(pair)) {
            this.lines.get(pair).remove();
            this.lines.delete(pair);
            
            // Remove visual feedback
            item.classList.remove('matched');
            
            // Find and remove matching item's visual feedback
            const matchingPair = this.matches.get(pair);
            if (matchingPair) {
                const matchingItem = this.element.querySelector(`[data-pair="${matchingPair}"]`);
                if (matchingItem) matchingItem.classList.remove('matched');
            }
            
            this.matches.delete(pair);
        }
    }

    updateLinePosition(line, leftItem, rightItem) {
        const leftRect = leftItem.getBoundingClientRect();
        const rightRect = rightItem.getBoundingClientRect();
        const containerRect = this.svg.getBoundingClientRect();
        
        const x1 = leftRect.right - containerRect.left;
        const y1 = leftRect.top - containerRect.top + leftRect.height/2;
        const x2 = rightRect.left - containerRect.left;
        const y2 = rightRect.top - containerRect.top + rightRect.height/2;
        
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
    }

    async check() {
        let correct = 0;
        
        this.matches.forEach((targetPair, sourcePair) => {
            const isCorrect = sourcePair === targetPair;
            if (isCorrect) correct++;
            
            // Find matching items
            const sourceItem = this.element.querySelector(`[data-pair="${sourcePair}"]`);
            const targetItem = this.element.querySelector(`[data-pair="${targetPair}"]`);
            const line = this.lines.get(sourcePair);
            
            if (sourceItem && targetItem && line) {
                if (isCorrect) {
                    sourceItem.classList.add('correct');
                    targetItem.classList.add('correct');
                    line.classList.add('correct');
                } else {
                    sourceItem.classList.add('incorrect');
                    targetItem.classList.add('incorrect');
                    line.classList.add('incorrect');
                }
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
        // Clear all matches and lines
        this.matches.clear();
        this.lines.forEach(line => line.remove());
        this.lines.clear();
        
        // Reset all items
        this.element.querySelectorAll('.matching-item').forEach(item => {
            item.classList.remove('matched', 'selected', 'correct', 'incorrect');
        });
        
        // Clear selection
        if (this.selectedItem) {
            this.selectedItem.classList.remove('selected');
            this.selectedItem = null;
        }
        
        this.state.checked = false;
        this.state.score = 0;
    }
}
