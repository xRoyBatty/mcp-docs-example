import BaseTask from './baseTask.js';

export default class Matching extends BaseTask {
    constructor(element) {
        super(element);
        this.pairs = element.querySelector('.pairs');
        this.items = element.querySelectorAll('.item');
        this.selected = null;
        this.connections = [];
        this.setupSVG();
        this.setupEvents();
    }

    setupSVG() {
        // Create SVG overlay for lines
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.pointerEvents = 'none';
        this.pairs.style.position = 'relative';
        this.pairs.insertBefore(this.svg, this.pairs.firstChild);
        
        // Update SVG size on window resize
        window.addEventListener('resize', () => this.updateLines());
    }

    setupEvents() {
        this.items.forEach(item => {
            item.addEventListener('click', () => this.handleClick(item));
            
            // Keyboard navigation
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleClick(item);
                }
            });
        });
    }

    handleClick(item) {
        if (!this.selected) {
            // First item selected
            this.selected = item;
            item.classList.add('selected');
        } else if (this.selected === item) {
            // Deselect if same item
            this.selected.classList.remove('selected');
            this.selected = null;
        } else {
            // Try to make a connection
            const pair1 = this.selected.dataset.pair;
            const pair2 = item.dataset.pair;
            
            if (pair1 === pair2) {
                // Valid match
                this.connections.push({
                    from: this.selected,
                    to: item,
                    correct: true
                });
                this.selected.classList.remove('selected');
                this.drawLines();
            } else {
                // Invalid match - show feedback
                this.selected.classList.add('incorrect');
                item.classList.add('incorrect');
                setTimeout(() => {
                    this.selected.classList.remove('incorrect', 'selected');
                    item.classList.remove('incorrect');
                }, 1000);
            }
            this.selected = null;
        }
    }

    drawLines() {
        // Clear existing lines
        this.svg.innerHTML = '';
        
        // Draw new lines
        this.connections.forEach(conn => {
            const rect1 = conn.from.getBoundingClientRect();
            const rect2 = conn.to.getBoundingClientRect();
            const pairsRect = this.pairs.getBoundingClientRect();

            const x1 = rect1.right - pairsRect.left;
            const y1 = rect1.top + rect1.height/2 - pairsRect.top;
            const x2 = rect2.left - pairsRect.left;
            const y2 = rect2.top + rect2.height/2 - pairsRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', conn.correct ? '#28a745' : '#dc3545');
            line.setAttribute('stroke-width', '2');
            this.svg.appendChild(line);
        });
    }

    updateLines() {
        // Update SVG size
        const rect = this.pairs.getBoundingClientRect();
        this.svg.setAttribute('width', rect.width);
        this.svg.setAttribute('height', rect.height);
        this.drawLines();
    }

    async check() {
        let correct = 0;
        const totalPairs = Array.from(this.items).filter(item => 
            item.closest('.left') !== null
        ).length;

        // Check each connection
        this.connections.forEach(conn => {
            if (conn.correct) correct++;
        });

        // Show feedback for unmatched items
        this.items.forEach(item => {
            const isMatched = this.connections.some(conn => 
                conn.from === item || conn.to === item
            );
            if (!isMatched) {
                item.classList.add('incorrect');
                setTimeout(() => item.classList.remove('incorrect'), 2000);
            }
        });

        return { correct, total: totalPairs };
    }

    reset() {
        // Clear all states and connections
        this.connections = [];
        this.selected = null;
        this.items.forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
        });
        this.svg.innerHTML = '';
    }
}