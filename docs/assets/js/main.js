document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('search-btn');
    const featuredGrid = document.getElementById('featured-grid');

    // Load featured worksheets
    loadFeaturedWorksheets();

    // Search event handlers
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function loadFeaturedWorksheets() {
        try {
            const response = await fetch('worksheets/featured.json');
            const data = await response.json();
            renderWorksheets(data.featured);
        } catch (error) {
            console.error('Error loading featured worksheets:', error);
        }
    }

    function renderWorksheets(worksheets) {
        featuredGrid.innerHTML = worksheets.map(worksheet => `
            <div class="worksheet-card">
                <h3>${worksheet.title}</h3>
                <div class="worksheet-meta">
                    <span>${worksheet.level}</span>
                    <span>${worksheet.skill}</span>
                </div>
                <p>${worksheet.description}</p>
                <a href="${worksheet.url}" class="btn">View Worksheet</a>
            </div>
        `).join('');
    }

    async function performSearch() {
        const query = searchInput.value.toLowerCase();
        try {
            const response = await fetch('worksheets/index.json');
            const data = await response.json();
            const results = data.worksheets.filter(worksheet =>
                worksheet.title.toLowerCase().includes(query) ||
                worksheet.description.toLowerCase().includes(query) ||
                worksheet.level.toLowerCase().includes(query) ||
                worksheet.skill.toLowerCase().includes(query)
            );
            renderWorksheets(results);
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }
});