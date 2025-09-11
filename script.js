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

        // 지도 관련 속성
        this.map = null;
        this.markers = [];
        this.polylines = [];
        this.mapInitialized = false; // 지도 초기화 상태 추가
        this.dayColors = {
            0: '#ff69b4', // 일요일 - 헬로키티 핑크
            1: '#4285f4', // 월요일 - 파랑
            2: '#34a853', // 화요일 - 초록
            3: '#fbbc04', // 수요일 - 노랑
            4: '#ff6d01', // 목요일 - 주황
            5: '#ea4335', // 금요일 - 빨강
            6: '#9c27b0'  // 토요일 - 보라
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.setupCategoryFilters();
        this.loadData();
        this.updateUI();
        this.initMap();
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
        
        // 지도가 초기화되었으면 마커 업데이트
        if (this.map) {
            this.displayAllMarkers();
        }
    }

    // 🗺️ 지도 초기화
    initMap() {
        // 이미 초기화된 경우 중복 실행 방지
        if (this.mapInitialized) {
            console.log('지도가 이미 초기화되었습니다.');
            return;
        }

        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('지도 컨테이너를 찾을 수 없습니다.');
            return;
        }

        // Kakao Maps API가 로드되었는지 확인 (한 번만)
        if (typeof kakao === 'undefined' || !kakao.maps) {
            console.error('Kakao Maps API가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            return;
        }

        // 지도 옵션 설정
        const mapOption = {
            center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울시청 기본 위치
            level: 8 // 확대 레벨 (1~14)
        };

        // 지도 생성
        this.map = new kakao.maps.Map(mapContainer, mapOption);

        // 현재 위치 가져기기
        this.getCurrentLocation();

        // Places 서비스 초기화
        this.places = new kakao.maps.services.Places();

        // 검색 기능 연결
        this.setupSearch();

        // 초기화 완료 표시
        this.mapInitialized = true;

        console.log('🎀 Kakao Maps 초기화 완료!');
    }

    // 📍 현재 위치 가져오기
    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const locPosition = new kakao.maps.LatLng(lat, lng);

                    // 지도 중심을 현재 위치로 이동
                    this.map.setCenter(locPosition);

                    // 현재 위치 마커 추가
                    this.addCurrentLocationMarker(locPosition);
                },
                (error) => {
                    console.warn('현재 위치를 가져올 수 없습니다:', error);
                    // 기본 위치 (서울시청) 사용
                }
            );
        }
    }

    // 🌸 현재 위치 마커 추가
    addCurrentLocationMarker(position) {
        const markerImage = new kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + btoa(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#ff69b4" stroke="white" stroke-width="3"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                    <text x="16" y="20" text-anchor="middle" font-size="12" fill="#ff69b4">💕</text>
                </svg>
            `),
            new kakao.maps.Size(32, 32),
            {
                offset: new kakao.maps.Point(16, 16)
            }
        );

        const marker = new kakao.maps.Marker({
            position: position,
            image: markerImage
        });

        marker.setMap(this.map);

        // 정보창 추가
        const infoWindow = new kakao.maps.InfoWindow({
            content: '<div style="padding:5px; font-size:12px; color:#ff69b4;">💕 현재 위치</div>'
        });

        // 마커 클릭 시 정보창 표시
        kakao.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(this.map, marker);
        });
    }

    // 🏷️ 장소 마커 추가
    addLocationMarker(location) {
        const position = new kakao.maps.LatLng(location.lat, location.lng);
        
        // 카테고리별 마커 색상 및 이모지
        const categoryStyles = {
            restaurant: { color: '#ff6b6b', emoji: '🍽️' },
            cafe: { color: '#4ecdc4', emoji: '☕' },
            travel: { color: '#45b7d1', emoji: '✈️' },
            culture: { color: '#96ceb4', emoji: '🎨' },
            etc: { color: '#feca57', emoji: '📍' }
        };

        const style = categoryStyles[location.category] || categoryStyles.etc;

        // 헬로키티 테마 마커 이미지 생성
        const markerImage = new kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="${style.color}" stroke="white" stroke-width="2"/>
                    <circle cx="20" cy="20" r="12" fill="white"/>
                    <text x="20" y="25" text-anchor="middle" font-size="12" fill="${style.color}">${style.emoji}</text>
                </svg>
            `),
            new kakao.maps.Size(40, 40),
            { offset: new kakao.maps.Point(20, 20) }
        );

        const marker = new kakao.maps.Marker({
            position: position,
            image: markerImage
        });

        marker.setMap(this.map);

        // 마커에 location 정보 저장
        marker.locationData = location;

        // 정보창 내용 생성
        const infoContent = `
            <div style="padding:10px; min-width:200px;">
                <h3 style="margin:0 0 5px 0; color:${style.color}; font-size:14px;">
                    ${style.emoji} ${location.name}
                </h3>
                <p style="margin:0 0 5px 0; font-size:12px; color:#666;">
                    📍 ${location.address || '주소 없음'}
                </p>
                <p style="margin:0 0 5px 0; font-size:12px;">
                    📅 ${location.date} ${location.time || ''}
                </p>
                <p style="margin:0 0 5px 0; font-size:12px;">
                    ⭐ ${location.rating ? '★'.repeat(location.rating) + '☆'.repeat(5-location.rating) : '평점 없음'}
                </p>
                ${location.memo ? `<p style="margin:0; font-size:12px; color:#888;">${location.memo}</p>` : ''}
            </div>
        `;

        const infoWindow = new kakao.maps.InfoWindow({
            content: infoContent
        });

        // 마커 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', () => {
            // 다른 정보창 닫기
            this.closeAllInfoWindows();
            
            // 현재 정보창 열기
            infoWindow.open(this.map, marker);
            
            // 헬로키티 클릭 이벤트 (하트 파티클)
            this.createHeartParticle(marker);
        });

        // 마커를 배열에 저장
        this.markers.push({ marker, infoWindow, location });

        return marker;
    }

    // 💖 마커 클릭 시 하트 파티클 효과
    createHeartParticle(marker) {
        const hearts = ['💖', '💕', '💝', '🌸', '✨', '🎀'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                heart.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    font-size: 1.5rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: heartFloat 2s ease-out forwards;
                `;
                document.body.appendChild(heart);
                
                setTimeout(() => document.body.removeChild(heart), 2000);
            }, i * 100);
        }
    }

    // 📍 모든 정보창 닫기
    closeAllInfoWindows() {
        this.markers.forEach(item => {
            if (item.infoWindow) {
                item.infoWindow.close();
            }
        });
    }

    // 🗺️ 모든 마커 표시
    displayAllMarkers() {
        // 기존 마커 제거
        this.clearMarkers();

        // 현재 필터된 장소들의 마커 추가
        const filteredLocations = this.getFilteredLocations();
        filteredLocations.forEach(location => {
            this.addLocationMarker(location);
        });

        // 요일별 라인 그리기
        this.drawDateLines();
    }

    // 🧹 모든 마커 제거
    clearMarkers() {
        this.markers.forEach(item => {
            item.marker.setMap(null);
        });
        this.markers = [];
    }

    // 🔍 검색 기능 설정
    setupSearch() {
        const searchInput = document.getElementById('mainSearchInput');
        if (!searchInput) return;

        let searchTimeout;
        let searchResults = [];

        // 검색 결과 드롭다운 생성
        const searchContainer = searchInput.parentElement;
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        searchContainer.appendChild(dropdown);

        // 입력 시 자동완성 검색
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // 검색어가 2글자 이상일 때 검색
            if (query.length >= 2) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchPlaces(query, dropdown);
                }, 300);
            } else {
                dropdown.style.display = 'none';
            }
        });

        // 검색창 포커스 아웃 시 드롭다운 숨기기
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });
    }

    // 🔍 장소 검색 (Kakao Places API)
    searchPlaces(keyword, dropdown) {
        this.places.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                this.displaySearchResults(data.slice(0, 5), dropdown);
            } else {
                dropdown.style.display = 'none';
            }
        });
    }

    // 📋 검색 결과 표시
    displaySearchResults(results, dropdown) {
        dropdown.innerHTML = '';
        
        if (results.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        results.forEach(place => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s ease;
            `;
            
            // 카테고리에 따른 이모지 결정
            const categoryEmoji = this.getCategoryEmoji(place.category_name);
            
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${categoryEmoji}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: #333; margin-bottom: 2px;">
                            ${place.place_name}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            📍 ${place.address_name}
                        </div>
                        ${place.phone ? `<div style="font-size: 11px; color: #888;">📞 ${place.phone}</div>` : ''}
                    </div>
                </div>
            `;

            // 호버 효과
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f8f9fa';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
            });

            // 클릭 시 지도로 이동 및 마커 추가
            item.addEventListener('click', () => {
                this.selectPlace(place);
                dropdown.style.display = 'none';
                document.getElementById('mainSearchInput').value = place.place_name;
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    // 🏷️ 카테고리별 이모지 결정
    getCategoryEmoji(categoryName) {
        if (categoryName.includes('음식')) return '🍽️';
        if (categoryName.includes('카페')) return '☕';
        if (categoryName.includes('숙박')) return '🏨';
        if (categoryName.includes('관광')) return '🗺️';
        if (categoryName.includes('문화')) return '🎨';
        if (categoryName.includes('쇼핑')) return '🛍️';
        if (categoryName.includes('병원')) return '🏥';
        if (categoryName.includes('학교')) return '🏫';
        return '📍';
    }

    // 📍 선택된 장소로 지도 이동
    selectPlace(place) {
        const position = new kakao.maps.LatLng(place.y, place.x);
        
        // 지도 중심 이동
        this.map.setCenter(position);
        this.map.setLevel(3); // 확대

        // 임시 마커 추가 (검색된 위치 표시)
        this.addTempMarker(place);
        
        // 헬로키티 효과
        setTimeout(() => {
            this.createSearchEffect();
        }, 500);
    }

    // 🌸 임시 마커 추가
    addTempMarker(place) {
        // 기존 임시 마커 제거
        if (this.tempMarker) {
            this.tempMarker.setMap(null);
        }

        const position = new kakao.maps.LatLng(place.y, place.x);
        
        // 펄싱 마커 이미지
        const markerImage = new kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + btoa(`
                <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="25" r="20" fill="#ff69b4" stroke="white" stroke-width="3" opacity="0.8">
                        <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="25" cy="25" r="12" fill="white"/>
                    <text x="25" y="30" text-anchor="middle" font-size="12" fill="#ff69b4">🔍</text>
                </svg>
            `),
            new kakao.maps.Size(50, 50),
            { offset: new kakao.maps.Point(25, 25) }
        );

        this.tempMarker = new kakao.maps.Marker({
            position: position,
            image: markerImage
        });

        this.tempMarker.setMap(this.map);

        // 정보창 추가
        const infoWindow = new kakao.maps.InfoWindow({
            content: `
                <div style="padding:10px; min-width:200px;">
                    <h3 style="margin:0 0 5px 0; color:#ff69b4; font-size:14px;">
                        🔍 ${place.place_name}
                    </h3>
                    <p style="margin:0 0 5px 0; font-size:12px; color:#666;">
                        📍 ${place.address_name}
                    </p>
                    ${place.phone ? `<p style="margin:0 0 5px 0; font-size:12px;">📞 ${place.phone}</p>` : ''}
                    <button onclick="window.app.addSearchedPlace('${place.id}')" 
                            style="background:#ff69b4; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; margin-top:8px;">
                        💕 추억 장소로 추가
                    </button>
                </div>
            `
        });

        // 마커 클릭 시 정보창 표시
        kakao.maps.event.addListener(this.tempMarker, 'click', () => {
            infoWindow.open(this.map, this.tempMarker);
        });

        // 5초 후 자동으로 정보창 표시
        setTimeout(() => {
            infoWindow.open(this.map, this.tempMarker);
        }, 500);

        // 임시 마커 정보 저장
        this.tempMarkerInfo = place;
    }

    // ✨ 검색 성공 이펙트
    createSearchEffect() {
        const effects = ['✨', '🌸', '💕', '🎀'];
        effects.forEach((effect, index) => {
            setTimeout(() => {
                const element = document.createElement('div');
                element.textContent = effect;
                element.style.cssText = `
                    position: fixed;
                    top: 30%;
                    left: 50%;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: searchEffect 1.5s ease-out forwards;
                `;
                document.body.appendChild(element);
                
                setTimeout(() => document.body.removeChild(element), 1500);
            }, index * 200);
        });
    }

    // 🌈 요일별 라인 그리기 (같은 날 방문한 장소들 연결)
    drawDateLines() {
        // 기존 라인 제거
        this.clearPolylines();

        // 날짜별로 장소 그룹화
        const dateGroups = this.groupLocationsByDate();

        // 각 날짜별로 라인 그리기
        Object.keys(dateGroups).forEach(date => {
            const locations = dateGroups[date];
            
            // 2개 이상의 장소가 있을 때만 라인 그리기
            if (locations.length >= 2) {
                this.drawLineForDate(date, locations);
            }
        });
    }

    // 📅 날짜별로 장소 그룹화
    groupLocationsByDate() {
        const groups = {};
        
        this.getFilteredLocations().forEach(location => {
            if (location.date && location.lat && location.lng) {
                if (!groups[location.date]) {
                    groups[location.date] = [];
                }
                groups[location.date].push(location);
            }
        });

        // 각 날짜별로 시간순 정렬
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => {
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                return timeA.localeCompare(timeB);
            });
        });

        return groups;
    }

    // 🎨 특정 날짜의 라인 그리기
    drawLineForDate(date, locations) {
        // 날짜로부터 요일 계산
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();
        const lineColor = this.dayColors[dayOfWeek];

        // 라인 경로 생성
        const linePath = locations.map(location => 
            new kakao.maps.LatLng(location.lat, location.lng)
        );

        // 폴리라인 생성
        const polyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 4,
            strokeColor: lineColor,
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
        });

        // 지도에 표시
        polyline.setMap(this.map);

        // 라인에 마우스 호버 이벤트
        const overlayPath = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 12,
            strokeColor: 'transparent',
            strokeOpacity: 0
        });

        overlayPath.setMap(this.map);

        // 정보창 생성 (라인 정보)
        const infoContent = this.createLineInfoContent(date, locations, dayOfWeek);
        const infoWindow = new kakao.maps.InfoWindow({
            content: infoContent,
            removable: true
        });

        // 오버레이 패스에 이벤트 추가
        kakao.maps.event.addListener(overlayPath, 'mouseover', (mouseEvent) => {
            // 라인 강조
            polyline.setOptions({
                strokeWeight: 6,
                strokeOpacity: 1.0
            });

            // 정보창 표시
            const position = mouseEvent.latLng;
            infoWindow.setPosition(position);
            infoWindow.open(this.map);
        });

        kakao.maps.event.addListener(overlayPath, 'mouseout', () => {
            // 라인 원래 상태로
            polyline.setOptions({
                strokeWeight: 4,
                strokeOpacity: 0.8
            });

            // 정보창 닫기
            infoWindow.close();
        });

        // 폴리라인 저장
        this.polylines.push({
            polyline,
            overlayPath,
            infoWindow,
            date,
            locations
        });
    }

    // 📋 라인 정보창 내용 생성
    createLineInfoContent(date, locations, dayOfWeek) {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[dayOfWeek];
        const dayColor = this.dayColors[dayOfWeek];

        let timelineHtml = locations.map((location, index) => {
            const time = location.time || '';
            const isLast = index === locations.length - 1;
            
            return `
                <div style="display: flex; align-items: center; margin: 4px 0;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dayColor}; margin-right: 8px;"></div>
                    <div style="flex: 1; font-size: 12px;">
                        <strong>${time}</strong> ${location.name}
                    </div>
                    ${!isLast ? `<div style="color: ${dayColor}; font-size: 10px;">→</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div style="padding: 12px; min-width: 250px; max-width: 300px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${dayColor}; margin-right: 8px;"></div>
                    <strong style="color: ${dayColor}; font-size: 14px;">
                        ${date} (${dayName}요일) 데이트 코스
                    </strong>
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                    총 ${locations.length}곳 방문
                </div>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${timelineHtml}
                </div>
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center;">
                    💕 ${dayName}요일의 추억 라인
                </div>
            </div>
        `;
    }

    // 🧹 모든 폴리라인 제거
    clearPolylines() {
        this.polylines.forEach(item => {
            item.polyline.setMap(null);
            if (item.overlayPath) {
                item.overlayPath.setMap(null);
            }
        });
        this.polylines = [];
    }

    // 📊 필터된 장소 목록 반환
    getFilteredLocations() {
        let filtered = this.locations;

        // 카테고리 필터
        if (this.activeCategories.size > 0) {
            filtered = filtered.filter(location =>
                this.activeCategories.has(location.category)
            );
        }

        // 검색어 필터
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(location =>
                location.name.toLowerCase().includes(query) ||
                (location.address && location.address.toLowerCase().includes(query)) ||
                (location.memo && location.memo.toLowerCase().includes(query))
            );
        }

        return filtered;
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