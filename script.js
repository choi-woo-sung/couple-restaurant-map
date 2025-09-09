// Modern Couple FootPrint App - JavaScript
class CoupleFootprintApp {
    constructor() {
        this.currentView = 'map';
        this.activeCategories = new Set();
        this.searchQuery = '';
        this.locations = [];
        this.categories = [
            { id: 'restaurant', name: '맛집', emoji: '🍽️' },
            { id: 'cafe', name: '카페', emoji: '☕' },
            { id: 'travel', name: '여행', emoji: '✈️' },
            { id: 'culture', name: '문화', emoji: '🎨' },
            { id: 'etc', name: '기타', emoji: '📍' }
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.setupCategoryFilters();
        this.loadData();
        this.updateUI();
    }

    setupEventListeners() {
        // Tab navigation (원형 버튼 포함)
        const tabButtons = document.querySelectorAll('.tab-button, .tab-button-circle');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-button, .tab-button-circle').dataset.view);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('mainSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Add location button
        const addLocationBtn = document.getElementById('addLocationBtn');
        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', () => {
                this.openAddLocationModal();
            });
        }

        // Category filter chips
        const categoryChips = document.querySelectorAll('.category-chip');
        categoryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const category = e.target.closest('.category-chip').dataset.category;
                this.toggleCategory(category);
            });
        });

        // Modal functionality
        this.setupModal();
    }

    setupTabs() {
        // Tab functionality is now handled in the header
        // No need for additional setup since tabs are already in HTML
    }

    setupCategoryFilters() {
        const categoryContainer = document.querySelector('.category-chips');
        if (!categoryContainer) return;

        // Add "전체" chip first
        const allChip = document.createElement('button');
        allChip.className = 'category-chip active';
        allChip.dataset.category = 'all';
        allChip.innerHTML = `
            <span>🌟</span>
            <span>전체</span>
        `;
        allChip.addEventListener('click', () => this.clearAllCategories());
        categoryContainer.appendChild(allChip);

        // Add category chips
        this.categories.forEach(category => {
            const chip = document.createElement('button');
            chip.className = 'category-chip';
            chip.dataset.category = category.id;
            chip.innerHTML = `
                <span>${category.emoji}</span>
                <span>${category.name}</span>
            `;
            chip.addEventListener('click', () => this.toggleCategory(category.id));
            categoryContainer.appendChild(chip);
        });
    }

    switchTab(view) {
        this.currentView = view;
        
        // Update tab buttons (원형 버튼 포함)
        document.querySelectorAll('.tab-button, .tab-button-circle').forEach(button => {
            button.classList.toggle('active', button.dataset.view === view);
        });

        // Update view containers
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.toggle('active', container.id === view + 'View');
        });

        // Add smooth transition effect
        const activeContainer = document.getElementById(view + 'View');
        if (activeContainer) {
            activeContainer.style.opacity = '0';
            activeContainer.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                activeContainer.style.transition = 'all 0.3s ease';
                activeContainer.style.opacity = '1';
                activeContainer.style.transform = 'translateY(0)';
            });
        }

        this.updateViewContent();
    }

    toggleCategory(categoryId) {
        if (categoryId === 'all') {
            this.clearAllCategories();
            return;
        }

        if (this.activeCategories.has(categoryId)) {
            this.activeCategories.delete(categoryId);
        } else {
            this.activeCategories.add(categoryId);
        }

        this.updateCategoryChips();
        this.filterLocations();
    }

    clearAllCategories() {
        this.activeCategories.clear();
        this.updateCategoryChips();
        this.filterLocations();
    }

    updateCategoryChips() {
        document.querySelectorAll('.category-chip').forEach(chip => {
            const category = chip.dataset.category;
            if (category === 'all') {
                chip.classList.toggle('active', this.activeCategories.size === 0);
            } else {
                chip.classList.toggle('active', this.activeCategories.has(category));
            }
        });
    }

    handleSearch(query) {
        this.searchQuery = query;
        this.filterLocations();
    }

    filterLocations() {
        // Filter locations based on active categories and search query
        let filteredLocations = this.locations;

        // Filter by categories
        if (this.activeCategories.size > 0) {
            filteredLocations = filteredLocations.filter(location =>
                this.activeCategories.has(location.category)
            );
        }

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredLocations = filteredLocations.filter(location =>
                location.name.toLowerCase().includes(query) ||
                location.address.toLowerCase().includes(query) ||
                location.memo.toLowerCase().includes(query)
            );
        }

        this.displayLocations(filteredLocations);
        this.updateStats(filteredLocations);
    }

    displayLocations(locations) {
        if (this.currentView === 'map') {
            this.updateMapMarkers(locations);
        } else if (this.currentView === 'timeline') {
            this.updateTimeline(locations);
        }
    }

    updateMapMarkers(locations) {
        // Map marker updates will be handled by Google Maps API
        console.log('Updating map markers:', locations.length);
    }

    updateTimeline(locations) {
        const timelineContent = document.getElementById('timelineContent');
        if (!timelineContent) return;

        if (locations.length === 0) {
            timelineContent.innerHTML = `
                <div class="empty-timeline">
                    <div class="empty-icon">📝</div>
                    <h3>표시할 추억이 없어요</h3>
                    <p>검색 조건을 확인하거나 새로운 장소를 추가해보세요!</p>
                    <button class="btn-primary" onclick="app.openAddLocationModal()">
                        첫 추억 기록하기
                    </button>
                </div>
            `;
            return;
        }

        // Group locations by date
        const grouped = this.groupLocationsByDate(locations);
        let timelineHTML = '';

        Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(date => {
                const dateLocations = grouped[date];
                timelineHTML += this.createTimelineSection(date, dateLocations);
            });

        timelineContent.innerHTML = timelineHTML;
    }

    groupLocationsByDate(locations) {
        return locations.reduce((groups, location) => {
            const date = location.visitDate || location.createdAt;
            const dateKey = new Date(date).toISOString().split('T')[0];
            
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(location);
            return groups;
        }, {});
    }

    createTimelineSection(date, locations) {
        const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        let locationsHTML = locations.map(location => `
            <div class="timeline-item">
                <div class="timeline-marker">
                    <span class="category-icon">${this.getCategoryEmoji(location.category)}</span>
                </div>
                <div class="timeline-content-item">
                    <div class="timeline-item-header">
                        <h4>${location.name}</h4>
                        <div class="timeline-rating">
                            ${'⭐'.repeat(location.rating || 0)}
                        </div>
                    </div>
                    <div class="timeline-address">${location.address}</div>
                    ${location.memo ? `<div class="timeline-memo">"${location.memo}"</div>` : ''}
                    ${location.photos && location.photos.length > 0 ? 
                        `<div class="timeline-photos">
                            ${location.photos.map(photo => 
                                `<img src="${photo}" alt="추억 사진" class="timeline-photo" onclick="app.openPhotoModal('${photo}')">`
                            ).join('')}
                        </div>` : ''
                    }
                </div>
            </div>
        `).join('');

        return `
            <div class="timeline-date-section">
                <div class="timeline-date-header">
                    <h3>${formattedDate}</h3>
                    <span class="timeline-count">${locations.length}개 장소</span>
                </div>
                <div class="timeline-items">
                    ${locationsHTML}
                </div>
            </div>
        `;
    }

    getCategoryEmoji(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.emoji : '📍';
    }

    updateStats(locations) {
        // Update map stats
        const locationCount = document.getElementById('locationCount');
        const averageRating = document.getElementById('averageRating');
        
        if (locationCount) {
            locationCount.textContent = `${locations.length}개 장소`;
        }

        if (averageRating && locations.length > 0) {
            const avgRating = locations.reduce((sum, loc) => sum + (loc.rating || 0), 0) / locations.length;
            averageRating.textContent = `평점 ${avgRating.toFixed(1)}`;
        } else if (averageRating) {
            averageRating.textContent = '평점 -';
        }

        // Update quick stats
        this.updateQuickStats(locations);
    }

    updateQuickStats(locations) {
        const totalVisits = document.getElementById('totalVisits');
        const favoriteCategory = document.getElementById('favoriteCategory');
        const recentVisits = document.getElementById('recentVisits');

        if (totalVisits) {
            totalVisits.textContent = locations.length;
        }

        if (favoriteCategory) {
            const categoryCounts = {};
            locations.forEach(loc => {
                categoryCounts[loc.category] = (categoryCounts[loc.category] || 0) + 1;
            });

            const mostFrequent = Object.keys(categoryCounts).reduce((a, b) => 
                categoryCounts[a] > categoryCounts[b] ? a : b, '기타'
            );

            const category = this.categories.find(c => c.id === mostFrequent);
            favoriteCategory.textContent = category ? category.emoji : '📍';
        }

        if (recentVisits) {
            const thisMonth = new Date();
            thisMonth.setDate(1);
            const recentCount = locations.filter(loc => {
                const visitDate = new Date(loc.visitDate || loc.createdAt);
                return visitDate >= thisMonth;
            }).length;
            recentVisits.textContent = recentCount;
        }
    }

    setupModal() {
        const modal = document.getElementById('addLocationModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('locationForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitLocationForm();
            });
        }

        // Photo preview
        const photoInput = document.getElementById('photos');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                this.handlePhotoPreview(e.target.files);
            });
        }

        // Set default date to today
        const visitDateInput = document.getElementById('visitDate');
        if (visitDateInput) {
            visitDateInput.valueAsDate = new Date();
        }
    }

    openAddLocationModal() {
        const modal = document.getElementById('addLocationModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('addLocationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset form
            const form = document.getElementById('locationForm');
            if (form) {
                form.reset();
                
                // Reset date to today
                const visitDateInput = document.getElementById('visitDate');
                if (visitDateInput) {
                    visitDateInput.valueAsDate = new Date();
                }
                
                // Clear photo preview
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.innerHTML = '';
                }
            }
        }
    }

    handlePhotoPreview(files) {
        const photoPreview = document.getElementById('photoPreview');
        if (!photoPreview) return;

        photoPreview.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    img.style.border = '2px solid var(--border)';
                    photoPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async submitLocationForm() {
        const form = document.getElementById('locationForm');
        const formData = new FormData(form);
        
        const locationData = {
            name: formData.get('locationName') || document.getElementById('locationName').value,
            category: formData.get('locationCategory') || document.getElementById('locationCategory').value,
            address: formData.get('locationAddress') || document.getElementById('locationAddress').value,
            visitDate: formData.get('visitDate') || document.getElementById('visitDate').value,
            rating: parseInt(formData.get('rating') || document.getElementById('rating').value),
            memo: formData.get('memo') || document.getElementById('memo').value,
            photos: [], // Will be populated after photo upload
            createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!locationData.name || !locationData.category || !locationData.address || !locationData.visitDate || !locationData.rating) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        try {
            // Here you would typically save to your backend/database
            // For now, we'll just add to local array
            locationData.id = Date.now();
            this.locations.push(locationData);
            
            // Show success message
            this.showNotification('새로운 추억이 저장되었습니다! 💕', 'success');
            
            // Close modal and refresh display
            this.closeModal();
            this.filterLocations();
            
        } catch (error) {
            console.error('Error saving location:', error);
            this.showNotification('저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #f87171, #dc2626)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #60a5fa, #3b82f6)';
        }

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }


    loadData() {
        // Load data from localStorage or API
        const savedData = localStorage.getItem('footprintData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.locations = data.locations || [];
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
    }

    saveData() {
        // Save data to localStorage
        const data = {
            locations: this.locations,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('footprintData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    updateViewContent() {
        if (this.currentView === 'map') {
            // Initialize or update map
            this.initializeMap();
        } else if (this.currentView === 'timeline') {
            // Update timeline content
            this.filterLocations();
        }
    }

    initializeMap() {
        // Google Maps initialization will be handled separately
        console.log('Initializing map view');
    }

    updateUI() {
        this.updateCategoryChips();
        this.filterLocations();
        this.updateStats(this.locations);
    }

    // Auto-save data periodically
    startAutoSave() {
        setInterval(() => {
            this.saveData();
        }, 30000); // Save every 30 seconds
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoupleFootprintApp();
    window.app.startAutoSave();
});

// Handle page visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.app) {
        window.app.saveData();
    }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.saveData();
    }
});