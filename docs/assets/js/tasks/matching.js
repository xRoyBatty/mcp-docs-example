import BaseTask from './baseTask.js';

export default class MatchingTask extends BaseTask {
    constructor(element) {
        super(element);
        this.selectedItem = null;
        this.state = {
            ...this.state,
            matches: new Map(),
            lines: new Map()
        };
        
        this.initializeTask();
    }

    initializeTask() {
        this.initializeSVG();
        this.initializeItems();
        this.handleAriaLabels();
        this.setupKeyboardNav();
        this.addErrorHandling();
    }

    handleAriaLabels() {
        this.element.setAttribute('role', 'application');
        this.element.setAttribute('aria-label', 'Matching task');
        
        // Add aria-live region for feedback
        const feedbackRegion = document.createElement('div');
        feedbackRegion.setAttribute('aria-live', 'polite');
        feedbackRegion.className = 'visually-hidden feedback-region';
        this.element.appendChild(feedbackRegion);
        this.feedbackRegion = feedbackRegion;
    }

    initializeSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'connections-overlay');
        this.svg.setAttribute('aria-hidden', 'true');
        
        const container = this.element.querySelector('.pairs-container');
        container.style.position = 'relative';
        container.prepend(this.svg);

        // Resize observer for responsive SVG
        new ResizeObserver(() => this.updateAllLines()).observe(container);
    }

    initializeItems() {
        const leftItems = this.element.querySelectorAll('.left-items .match-item');
        const rightItems = this.element.querySelectorAll('.right-items .match-item');
        
        leftItems.forEach((item, index) => {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', `Left item ${index + 1}`);
            item.dataset.index = index;
            
            const number = document.createElement('span');
            number.className = 'item-number';
            number.textContent = index + 1;
            number.setAttribute('aria-hidden', 'true');
            item.prepend(number);
        });

        rightItems.forEach((item, index) => {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', `Right item ${index + 1}`);
            item.dataset.index = index;
            
            const number = document.createElement('span');
            number.className = 'item-number';
            number.textContent = index + 1;
            number.setAttribute('aria-hidden', 'true');
            item.prepend(number);
        });
    }

    setupKeyboardNav() {
        this.element.addEventListener('keydown', (e) => {
            const item = e.target.closest('.match-item');
            if (!item) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.handleClick({ currentTarget: item });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusAdjacentItem(item, 'prev');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusAdjacentItem(item, 'next');
                    break;
            }
        });

        this.element.addEventListener('click', (e) => {
            const item = e.target.closest('.match-item');
            if (item) this.handleClick(e);
        });
    }

    focusAdjacentItem(currentItem, direction) {
        const container = currentItem.closest('.left-items, .right-items');
        const items = Array.from(container.querySelectorAll('.match-item'));
        const currentIndex = items.indexOf(currentItem);
        const targetIndex = direction === 'prev' ? 
            (currentIndex - 1 + items.length) % items.length : 
            (currentIndex + 1) % items.length;
        
        items[targetIndex].focus();
    }

    handleClick(e) {
        const clickedItem = e.currentTarget;
        
        if (!this.selectedItem) {
            if (clickedItem.closest('.left-items')) {
                this.selectItem(clickedItem);
            }
            return;
        }
        
        if (this.selectedItem === clickedItem) {
            this.deselectItem();
            return;
        }
        
        if (clickedItem.closest('.right-items')) {
            this.createMatch(this.selectedItem, clickedItem);
            this.deselectItem();
        }
    }

    selectItem(item) {
        this.selectedItem = item;
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        this.feedbackRegion.textContent = `Selected left item ${item.dataset.index + 1}. Choose a matching item from the right.`;
    }

    deselectItem() {
        if (this.selectedItem) {
            this.selectedItem.classList.remove('selected');
            this.selectedItem.setAttribute('aria-selected', 'false');
            this.selectedItem = null;
            this.feedbackRegion.textContent = 'Selection cleared.';
        }
    }

    createMatch(leftItem, rightItem) {
        this.removeExistingMatches(leftItem, rightItem);
        
        const matchId = `${leftItem.dataset.pair}-${rightItem.dataset.pair}`;
        this.state.matches.set(leftItem.dataset.pair, rightItem.dataset.pair);
        
        const line = this.createLine(leftItem, rightItem);
        this.state.lines.set(leftItem.dataset.pair, line);
        
        leftItem.classList.add('matched');
        rightItem.classList.add('matched');
        leftItem.setAttribute('aria-label', `Left item ${parseInt(leftItem.dataset.index) + 1}, matched with right item ${parseInt(rightItem.dataset.index) + 1}`);
        rightItem.setAttribute('aria-label', `Right item ${parseInt(rightItem.dataset.index) + 1}, matched with left item ${parseInt(leftItem.dataset.index) + 1}`);
        
        this.dispatchProgressEvent();
        this.feedbackRegion.textContent = `Matched left item ${parseInt(leftItem.dataset.index) + 1} with right item ${parseInt(rightItem.dataset.index) + 1}`;
    }

    removeExistingMatches(leftItem, rightItem) {
        // Remove any existing match for the left item
        if (this.state.lines.has(leftItem.dataset.pair)) {
            const line = this.state.lines.get(leftItem.dataset.pair);
            line.remove();
            this.state.lines.delete(leftItem.dataset.pair);
            
            const oldMatch = this.state.matches.get(leftItem.dataset.pair);
            const oldRightItem = this.element.querySelector(`[data-pair="${oldMatch}"]`);
            if (oldRightItem) {
                oldRightItem.classList.remove('matched', 'correct', 'incorrect');
                oldRightItem.setAttribute('aria-label', `Right item ${parseInt(oldRightItem.dataset.index) + 1}`);
            }
        }
        
        // Remove any existing match for the right item
        Array.from(this.state.matches.entries()).forEach(([leftPair, rightPair]) => {
            if (rightPair === rightItem.dataset.pair) {
                const line = this.state.lines.get(leftPair);
                if (line) line.remove();
                this.state.lines.delete(leftPair);
                
                const oldLeftItem = this.element.querySelector(`[data-pair="${leftPair}"]`);
                if (oldLeftItem) {
                    oldLeftItem.classList.remove('matched', 'correct', 'incorrect');
                    oldLeftItem.setAttribute('aria-label', `Left item ${parseInt(oldLeftItem.dataset.index) + 1}`);
                }
                
                this.state.matches.delete(leftPair);
            }
        });
    }

    createLine(leftItem, rightItem) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('connection-line');
        this.updateLinePosition(line, leftItem, rightItem);
        this.svg.appendChild(line);
        return line;
    }

    updateLinePosition(line, leftItem, rightItem) {
        const leftRect = leftItem.getBoundingClientRect();
        const rightRect = rightItem.getBoundingClientRect();
        const svgRect = this.svg.getBoundingClientRect();
        
        const x1 = leftRect.right - svgRect.left;
        const y1 = leftRect.top - svgRect.top + leftRect.height/2;
        const x2 = rightRect.left - svgRect.left;
        const y2 = rightRect.top - svgRect.top + rightRect.height/2;
        
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
    }

    updateAllLines() {
        this.state.matches.forEach((rightPair, leftPair) => {
            const leftItem = this.element.querySelector(`[data-pair="${leftPair}"]`);
            const rightItem = this.element.querySelector(`[data-pair="${rightPair}"]`);
            const line = this.state.lines.get(leftPair);
            
            if (leftItem && rightItem && line) {
                this.updateLinePosition(line, leftItem, rightItem);
            }
        });
    }

    dispatchProgressEvent() {
        const progress = this.calculateProgress();
        document.dispatchEvent(new CustomEvent('taskProgress', {
            detail: {
                taskId: this.element.id,
                progress
            }
        }));
    }

    calculateProgress() {
        const totalPairs = this.element.querySelectorAll('.left-items .match-item').length;
        return this.state.matches.size / totalPairs;
    }

    async check() {
        let correct = 0;
        
        this.state.matches.forEach((rightPair, leftPair) => {
            const isCorrect = leftPair === rightPair;
            if (isCorrect) correct++;
            
            const leftItem = this.element.querySelector(`[data-pair="${leftPair}"]`);
            const rightItem = this.element.querySelector(`[data-pair="${rightPair}"]`);
            const line = this.state.lines.get(leftPair);
            
            if (leftItem && rightItem && line) {
                const state = isCorrect ? 'correct' : 'incorrect';
                leftItem.classList.add(state);
                rightItem.classList.add(state);
                line.classList.add(state);
            }
        });

        const totalPairs = this.element.querySelectorAll('.left-items .match-item').length;
        const score = this.calculateScore(correct, totalPairs);
        
        this.state.score = score;
        this.state.checked = true;
        
        this.feedbackRegion.textContent = `Check complete. ${correct} out of ${totalPairs} matches are correct.`;

        return {
            correct: score === 1,
            score,
            details: {
                total: totalPairs,
                correct,
                matched: this.state.matches.size
            }
        };
    }

    reset() {
        // Clear all matches and lines
        this.state.matches.clear();
        this.state.lines.forEach(line => line.remove());
        this.state.lines.clear();
        
        // Reset all items
        this.element.querySelectorAll('.match-item').forEach(item => {
            item.classList.remove('matched', 'selected', 'correct', 'incorrect');
            item.setAttribute('aria-selected', 'false');
            const isLeftItem = item.closest('.left-items');
            item.setAttribute('aria-label', 
                `${isLeftItem ? 'Left' : 'Right'} item ${parseInt(item.dataset.index) + 1}`);
        });
        
        // Clear selection
        this.deselectItem();
        
        this.state.score = 0;
        this.state.checked = false;
        
        this.feedbackRegion.textContent = 'Task reset. Ready to start matching.';
        this.dispatchProgressEvent();
    }

    addErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.target === this.element || this.element.contains(event.target)) {
                console.error('Matching task error:', event.error);
                this.feedbackRegion.textContent = 'An error occurred. Please try again.';
            }
        });
    }
}