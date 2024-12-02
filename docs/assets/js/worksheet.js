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
            }
        };
        
        // Store matched pairs and their positions
        this.matchedPairs = new Map();
        this.originalPositions = new Map();
        
        this.initializeVoices();
        this.initializeInteractions();
    }
    
    // ... voice initialization code stays the same ...

    initializeMatching() {
        const matchingItems = document.querySelectorAll('.matching-item');
        
        // Store original positions
        matchingItems.forEach(item => {
            this.originalPositions.set(item.id, {
                parent: item.parentElement,
                nextSibling: item.nextElementSibling
            });
            
            item.setAttribute('draggable', 'true');
            
            // Add drag event listeners
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }
    
    handleDragStart(e) {
        // Only allow dragging if item isn't part of a confirmed match
        if (!e.target.classList.contains('confirmed-match')) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Highlight valid drop targets
            document.querySelectorAll('.matching-item').forEach(item => {
                if (!item.classList.contains('confirmed-match') && item !== e.target) {
                    item.classList.add('valid-target');
                }
            });
        } else {
            e.preventDefault();
        }
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.matching-item').forEach(item => {
            item.classList.remove('valid-target', 'drag-over');
        });
    }
    
    handleDragOver(e) {
        if (!e.target.classList.contains('confirmed-match')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    }
    
    handleDragEnter(e) {
        if (!e.target.classList.contains('confirmed-match')) {
            e.target.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        e.target.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedEl = document.getElementById(draggedId);
        const dropZone = e.target.closest('.matching-item');
        
        if (!draggedEl || !dropZone || draggedEl === dropZone || 
            dropZone.classList.contains('confirmed-match')) {
            return;
        }
        
        // Store the match
        this.storeMatch(draggedEl, dropZone);
        
        // Swap positions visually
        this.swapElements(draggedEl, dropZone);
        
        // Add visual connection
        this.createVisualConnection(draggedEl, dropZone);
        
        // Clean up
        draggedEl.classList.remove('dragging');
        dropZone.classList.remove('drag-over');
        document.querySelectorAll('.valid-target').forEach(item => {
            item.classList.remove('valid-target');
        });
    }
    
    storeMatch(element1, element2) {
        const pair = {
            first: element1,
            second: element2,
            isCorrect: element1.dataset.match === element2.dataset.match
        };
        this.matchedPairs.set(element1.id, pair);
    }
    
    swapElements(elem1, elem2) {
        const parent1 = elem1.parentNode;
        const parent2 = elem2.parentNode;
        const next1 = elem1.nextElementSibling;
        const next2 = elem2.nextElementSibling;
        
        parent2.insertBefore(elem1, next2);
        parent1.insertBefore(elem2, next1);
    }
    
    createVisualConnection(elem1, elem2) {
        // Add a class to show they're paired (but not necessarily correctly)
        elem1.classList.add('matched-pair');
        elem2.classList.add('matched-pair');
        
        // Store the pairing ID on both elements
        const pairId = `pair-${Date.now()}`;
        elem1.dataset.pairId = pairId;
        elem2.dataset.pairId = pairId;
    }
    
    checkMatching() {
        let allCorrect = true;
        
        this.matchedPairs.forEach((pair) => {
            const isCorrect = pair.isCorrect;
            
            if (isCorrect) {
                pair.first.classList.add('correct-match');
                pair.second.classList.add('correct-match');
                pair.first.classList.add('confirmed-match');
                pair.second.classList.add('confirmed-match');
            } else {
                pair.first.classList.add('incorrect-match');
                pair.second.classList.add('incorrect-match');
                allCorrect = false;
            }
        });
        
        return allCorrect;
    }
    
    resetMatching() {
        // Reset all matches
        this.matchedPairs.clear();
        
        // Reset all items to original positions
        this.originalPositions.forEach((position, id) => {
            const element = document.getElementById(id);
            if (element) {
                const { parent, nextSibling } = position;
                parent.insertBefore(element, nextSibling);
                element.classList.remove(
                    'matched-pair',
                    'correct-match',
                    'incorrect-match',
                    'confirmed-match'
                );
                delete element.dataset.pairId;
            }
        });
    }
    
    // ... rest of the code stays the same ...
}
