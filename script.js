let map;
let restaurants = [];
let markers = [];
let filteredRestaurants = [];
let anniversaryDate = null;
let searchResultMarkers = [];
let kakaoPlaces;
let currentCoupleCode = localStorage.getItem('coupleCode') || null;
let isDBMode = true;

// 지도 초기화
function initMap() {
    // 서울 중심으로 지도 초기화
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: 37.5665, lng: 126.9780 }, // 서울 시청 좌표
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // 카카오 Places 객체 초기화 (카카오 API 로드 후)
    if (typeof kakao !== 'undefined') {
        kakaoPlaces = new kakao.maps.services.Places();
    }

    // 지도 클릭 이벤트 리스너 추가
    map.addListener('click', function(mapsMouseEvent) {
        if (confirm('이 위치에 맛집을 등록하시겠습니까? 💕')) {
            const clickedLat = mapsMouseEvent.latLng.lat();
            const clickedLng = mapsMouseEvent.latLng.lng();
            
            // 클릭한 위치의 주소 가져오기
            getAddressFromCoords(clickedLat, clickedLng);
        }
    });

    // 기존 맛집들을 지도에 표시
    displayRestaurantsOnMap();
    displayRestaurantsList();
}

// 주소를 좌표로 변환하는 함수
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK') {
                resolve(results[0].geometry.location);
            } else {
                reject('주소를 찾을 수 없습니다: ' + status);
            }
        });
    });
}

// 맛집을 지도에 마커로 표시 (기본 버전)
function displayRestaurantsOnMap() {
    displayFilteredMarkersOnMap();
}

// 특정 맛집에 지도 포커스
function focusOnRestaurant(index) {
    const restaurant = restaurants[index];
    if (restaurant && restaurant.lat && restaurant.lng) {
        map.panTo({ lat: restaurant.lat, lng: restaurant.lng });
        map.setZoom(16);
        
        // 해당 마커 찾아서 정보창 열기
        const marker = markers.find(m => m.getTitle() === restaurant.name);
        if (marker) {
            google.maps.event.trigger(marker, 'click');
        }
    }
}

// 검색 및 필터링 함수
function filterRestaurants() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const ratingFilter = parseInt(document.getElementById('ratingFilter').value) || 0;

    filteredRestaurants = restaurants.filter(restaurant => {
        const matchesSearch = !searchTerm || 
            restaurant.name.toLowerCase().includes(searchTerm) ||
            restaurant.address.toLowerCase().includes(searchTerm) ||
            restaurant.memo.toLowerCase().includes(searchTerm);
        
        const matchesType = !typeFilter || restaurant.type === typeFilter;
        const matchesRating = !ratingFilter || restaurant.rating >= ratingFilter;
        
        return matchesSearch && matchesType && matchesRating;
    });

    displayRestaurantsList();
    displayFilteredMarkersOnMap();
    updateStats();
}

// 통계 업데이트
function updateStats() {
    const totalCount = document.getElementById('totalCount');
    const avgRating = document.getElementById('avgRating');
    
    const displayRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;
    
    totalCount.textContent = `총 ${displayRestaurants.length}개의 맛집`;
    
    if (displayRestaurants.length > 0) {
        const average = displayRestaurants.reduce((sum, r) => sum + r.rating, 0) / displayRestaurants.length;
        avgRating.textContent = `평균 평점: ${average.toFixed(1)}⭐`;
    } else {
        avgRating.textContent = '평균 평점: -';
    }
}

// 필터링된 마커들만 지도에 표시
function displayFilteredMarkersOnMap() {
    // 기존 마커들 제거
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    const displayRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;

    displayRestaurants.forEach((restaurant, index) => {
        if (restaurant.lat && restaurant.lng) {
            const marker = new google.maps.Marker({
                position: { lat: restaurant.lat, lng: restaurant.lng },
                map: map,
                title: restaurant.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#ff6b6b">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });

            // 마커 클릭 시 정보창 표시
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px;">
                        <h3 style="color: #667eea; margin-bottom: 5px;">${restaurant.name}</h3>
                        <p><strong>주소:</strong> ${restaurant.address}</p>
                        <p><strong>음식 종류:</strong> ${restaurant.type}</p>
                        <p><strong>방문 날짜:</strong> ${restaurant.date}</p>
                        <p><strong>평점:</strong> ${'⭐'.repeat(restaurant.rating)}</p>
                        ${restaurant.memo ? `<p><strong>메모:</strong> ${restaurant.memo}</p>` : ''}
                        ${restaurant.photos && restaurant.photos.length > 0 ? 
                            `<div style="margin-top: 10px;">
                                <strong>사진:</strong><br>
                                ${restaurant.photos.map(photo => 
                                    `<img src="${photo}" style="width: 100px; height: 60px; object-fit: cover; margin: 2px; border-radius: 5px;">`
                                ).join('')}
                            </div>` : ''
                        }
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            markers.push(marker);
        }
    });
}

// 맛집 리스트 표시 (업데이트된 버전)
function displayRestaurantsList() {
    const listContainer = document.getElementById('restaurantList');
    const displayRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;
    
    if (displayRestaurants.length === 0) {
        if (restaurants.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">아직 등록된 맛집이 없어요. 첫 번째 맛집을 등록해보세요! 💕</p>';
        } else {
            listContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">검색 조건에 맞는 맛집이 없어요. 다른 조건으로 검색해보세요! 🔍</p>';
        }
        return;
    }

    listContainer.innerHTML = displayRestaurants.map((restaurant, index) => {
        const originalIndex = restaurants.indexOf(restaurant);
        return `
            <div class="restaurant-item" data-original-index="${originalIndex}">
                <h3>${restaurant.name}</h3>
                <p><strong>주소:</strong> ${restaurant.address}</p>
                <p><strong>음식 종류:</strong> ${restaurant.type}</p>
                <p><strong>방문 날짜:</strong> ${restaurant.date}</p>
                <div class="rating">${'⭐'.repeat(restaurant.rating)}</div>
                ${restaurant.memo ? `<div class="memo">"${restaurant.memo}"</div>` : ''}
                ${restaurant.photos && restaurant.photos.length > 0 ? 
                    `<div class="restaurant-photos">
                        ${restaurant.photos.map((photo, photoIndex) => 
                            `<img src="${photo}" class="restaurant-photo" onclick="openPhotoModal('${photo}', '${restaurant.name}')">`
                        ).join('')}
                    </div>` : ''
                }
                <div class="restaurant-actions">
                    <button class="view-on-map-btn" onclick="focusOnRestaurant(${originalIndex})">지도에서 보기</button>
                    <button class="delete-btn" onclick="deleteRestaurant(${originalIndex})">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

// 맛집 삭제
async function deleteRestaurant(index) {
    if (confirm('정말로 이 맛집을 삭제하시겠습니까?')) {
        const restaurant = restaurants[index];
        
        // DB에서 삭제
        if (restaurant.id) {
            const success = await deleteRestaurantFromDB(restaurant.id);
            if (!success) {
                alert('맛집 삭제에 실패했습니다.');
                return;
            }
        }
        
        // 로컬 배열에서도 제거
        restaurants.splice(index, 1);
        filteredRestaurants = [];
        displayRestaurantsOnMap();
        displayRestaurantsList();
        updateStats();
        generateRecommendations();
    }
}

// 로딩 애니메이션 생성
function createLoadingAnimation() {
    const button = document.querySelector('button[type="submit"]');
    button.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
            등록 중...
        </div>
    `;
    button.disabled = true;
}

function resetButtonState() {
    const button = document.querySelector('button[type="submit"]');
    button.innerHTML = '💕 맛집 등록하기';
    button.disabled = false;
}

// 성공 애니메이션
function showSuccessAnimation() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💕</div>
            <h3 style="margin-bottom: 0.5rem;">맛집 등록 완료!</h3>
            <p>새로운 추억이 지도에 추가되었어요</p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 2000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes successPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);

// 사진 미리보기 처리
function handlePhotoPreview() {
    const photoInput = document.getElementById('photos');
    const previewContainer = document.getElementById('photoPreview');
    
    photoInput.addEventListener('change', function(e) {
        previewContainer.innerHTML = '';
        const files = Array.from(e.target.files);
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    img.onclick = () => removePhoto(index);
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

function removePhoto(index) {
    const photoInput = document.getElementById('photos');
    const files = Array.from(photoInput.files);
    
    // FileList는 수정 불가능하므로 새로운 FileList를 생성
    const dt = new DataTransfer();
    files.forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    photoInput.files = dt.files;
    
    // 미리보기 다시 렌더링
    const event = new Event('change');
    photoInput.dispatchEvent(event);
}

// 폼 제출 처리 (사진 지원 추가)
document.getElementById('restaurantForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('restaurantName').value;
    const address = document.getElementById('restaurantAddress').value;
    const type = document.getElementById('restaurantType').value;
    const date = document.getElementById('visitDate').value;
    const rating = parseInt(document.getElementById('rating').value);
    const memo = document.getElementById('memo').value;
    const photoFiles = document.getElementById('photos').files;

    // 로딩 애니메이션 시작
    createLoadingAnimation();

    try {
        // 주소를 좌표로 변환
        const location = await geocodeAddress(address);
        
        // 사진들을 Base64로 변환
        const photos = [];
        for (let i = 0; i < photoFiles.length; i++) {
            const photoData = await convertToBase64(photoFiles[i]);
            photos.push(photoData);
        }
        
        const restaurant = {
            name: name,
            address: address,
            type: type,
            date: date,
            rating: rating,
            memo: memo,
            photos: photos,
            lat: location.lat(),
            lng: location.lng()
        };

        // DB에 저장
        const savedRestaurant = await saveRestaurantToDB(restaurant);
        if (!savedRestaurant) {
            return; // 저장 실패 시 중단
        }
        
        // 로컬 배열에도 추가 (ID 포함)
        restaurants.push({
            ...restaurant,
            id: savedRestaurant.id
        });
        
        // 지도와 리스트 업데이트
        filteredRestaurants = [];
        displayRestaurantsOnMap();
        displayRestaurantsList();
        updateStats();
        generateRecommendations();
        
        // 임시 마커 제거
        if (window.tempMarker) {
            window.tempMarker.setMap(null);
            window.tempMarker = null;
        }
        if (window.tempInfoWindow) {
            window.tempInfoWindow.close();
            window.tempInfoWindow = null;
        }
        
        // 폼 초기화
        this.reset();
        document.getElementById('photoPreview').innerHTML = '';
        
        // 성공 애니메이션 표시
        showSuccessAnimation();
        
        // 새로 추가된 맛집으로 지도 이동
        map.panTo(location);
        map.setZoom(15);
        
    } catch (error) {
        alert('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.');
        console.error(error);
    } finally {
        // 버튼 상태 복구
        resetButtonState();
    }
});

// 파일을 Base64로 변환하는 함수
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 사진 모달 열기
function openPhotoModal(photoSrc, restaurantName) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.innerHTML = `
        <div class="photo-modal-content">
            <span class="photo-modal-close" onclick="closePhotoModal()">&times;</span>
            <img src="${photoSrc}" alt="${restaurantName}" class="photo-modal-image">
            <p class="photo-modal-caption">${restaurantName}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePhotoModal();
        }
    });
    
    // 모달 배경 클릭시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePhotoModal();
        }
    });
}

function closePhotoModal() {
    const modal = document.querySelector('.photo-modal');
    if (modal) {
        modal.remove();
    }
}

// 카카오 장소 검색 기능
function searchPlaces() {
    const keyword = document.getElementById('placeSearchInput').value.trim();
    
    if (!keyword) {
        alert('검색어를 입력해주세요!');
        return;
    }

    // 기존 저장된 맛집에서 먼저 검색
    const localResults = searchLocalRestaurants(keyword);
    
    // 카카오 API가 로드되어 있으면 외부 검색도 수행
    if (typeof kakao !== 'undefined' && kakaoPlaces) {
        kakaoPlaces.keywordSearch(keyword + ' 맛집', function(data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                displaySearchResults([...localResults, ...data]);
            } else {
                displaySearchResults(localResults);
            }
        });
    } else {
        // 카카오 API가 없으면 로컬 검색 결과만 표시
        displaySearchResults(localResults);
    }
}

// 로컬 저장된 맛집에서 검색
function searchLocalRestaurants(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(lowerKeyword) ||
        restaurant.address.toLowerCase().includes(lowerKeyword) ||
        restaurant.type.toLowerCase().includes(lowerKeyword) ||
        restaurant.memo.toLowerCase().includes(lowerKeyword)
    ).map(restaurant => ({
        place_name: restaurant.name + ' (저장된 맛집)',
        address_name: restaurant.address,
        category_name: restaurant.type,
        x: restaurant.lng,
        y: restaurant.lat,
        isLocal: true,
        originalData: restaurant
    }));
}

// 검색 결과 표시
function displaySearchResults(results) {
    const searchResultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">검색 결과가 없습니다.</div>';
        searchResultsContainer.classList.add('show');
        return;
    }

    // 기존 검색 결과 마커들 제거
    clearSearchResultMarkers();

    searchResultsContainer.innerHTML = results.map((place, index) => `
        <div class="search-result-item" onclick="selectSearchResult(${index})">
            <div class="result-title">${place.place_name}</div>
            <div class="result-address">${place.address_name || place.road_address_name || ''}</div>
            <div class="result-category">${place.category_name || place.type || ''}</div>
            <div class="result-actions">
                <button class="add-to-favorites" onclick="event.stopPropagation(); addToFavorites(${index})" 
                        ${place.isLocal ? 'style="display:none"' : ''}>
                    💕 저장하기
                </button>
            </div>
        </div>
    `).join('');

    searchResultsContainer.classList.add('show');
    
    // 전역 변수에 검색 결과 저장 (다른 함수에서 사용하기 위해)
    window.currentSearchResults = results;
}

// 검색 결과 선택 시 지도 이동
function selectSearchResult(index) {
    const place = window.currentSearchResults[index];
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    
    // 구글맵에서 해당 위치로 이동
    map.panTo({ lat: lat, lng: lng });
    map.setZoom(16);
    
    // 임시 마커 표시
    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        title: place.place_name,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#4CAF50">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    // 정보창 표시
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h3 style="color: #4CAF50; margin-bottom: 5px;">${place.place_name}</h3>
                <p><strong>주소:</strong> ${place.address_name || place.road_address_name || ''}</p>
                <p><strong>카테고리:</strong> ${place.category_name || ''}</p>
                ${place.isLocal ? '<p style="color: #667eea;"><strong>💕 이미 저장된 맛집입니다</strong></p>' : ''}
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // 검색 결과 마커 배열에 추가
    searchResultMarkers.push(marker);
    
    // 자동으로 정보창 열기
    infoWindow.open(map, marker);
}

// 검색 결과 마커들 제거
function clearSearchResultMarkers() {
    searchResultMarkers.forEach(marker => marker.setMap(null));
    searchResultMarkers = [];
}

// 검색 결과를 즐겨찾기에 추가
function addToFavorites(index) {
    const place = window.currentSearchResults[index];
    
    // 이미 저장된 맛집인지 확인
    const isAlreadySaved = restaurants.some(r => 
        r.name === place.place_name || 
        (Math.abs(r.lat - parseFloat(place.y)) < 0.0001 && Math.abs(r.lng - parseFloat(place.x)) < 0.0001)
    );
    
    if (isAlreadySaved) {
        alert('이미 저장된 맛집입니다! 💕');
        return;
    }
    
    // 맛집 등록 폼에 자동 입력
    document.getElementById('restaurantName').value = place.place_name;
    document.getElementById('restaurantAddress').value = place.address_name || place.road_address_name || '';
    
    // 카테고리 매핑
    const categoryMapping = {
        '한식': '한식',
        '중식': '중식', 
        '일식': '일식',
        '양식': '양식',
        '카페': '카페',
        '디저트': '카페'
    };
    
    let mappedType = '기타';
    for (const [key, value] of Object.entries(categoryMapping)) {
        if (place.category_name && place.category_name.includes(key)) {
            mappedType = value;
            break;
        }
    }
    document.getElementById('restaurantType').value = mappedType;
    
    // 오늘 날짜로 설정
    document.getElementById('visitDate').value = new Date().toISOString().split('T')[0];
    
    // 성공 메시지
    alert('맛집 정보가 등록 폼에 입력되었습니다! 평점과 메모를 추가해서 저장해주세요 💕');
    
    // 검색 결과 숨기기
    document.getElementById('searchResults').classList.remove('show');
    
    // 폼으로 스크롤 이동
    document.querySelector('.restaurant-form').scrollIntoView({ behavior: 'smooth' });
}

// 좌표를 주소로 변환하는 함수 (역지오코딩)
function getAddressFromCoords(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: lat, lng: lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                // 주소 정보를 폼에 자동 입력
                const address = results[0].formatted_address;
                
                // 임시 마커 생성
                const tempMarker = new google.maps.Marker({
                    position: { lat: lat, lng: lng },
                    map: map,
                    title: '새 맛집 등록 위치',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#FF9800">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(40, 40)
                    }
                });
                
                // 정보창 표시
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h3 style="color: #FF9800; margin-bottom: 5px;">새 맛집 등록 위치</h3>
                            <p><strong>주소:</strong> ${address}</p>
                            <p style="color: #667eea;"><strong>💡 등록 폼이 자동으로 입력됩니다!</strong></p>
                        </div>
                    `
                });
                
                infoWindow.open(map, tempMarker);
                
                // 폼에 자동 입력
                document.getElementById('restaurantAddress').value = address;
                document.getElementById('visitDate').value = new Date().toISOString().split('T')[0];
                
                // 폼으로 스크롤 이동
                document.querySelector('.restaurant-form').scrollIntoView({ behavior: 'smooth' });
                
                // 임시 마커 저장 (폼 제출 시 제거용)
                window.tempMarker = tempMarker;
                window.tempInfoWindow = infoWindow;
                
                // 성공 메시지
                showMapClickSuccessMessage();
                
            } else {
                alert('주소를 찾을 수 없습니다.');
            }
        } else {
            alert('역지오코딩이 실패했습니다: ' + status);
        }
    });
}

// 지도 클릭 성공 메시지
function showMapClickSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📍</div>
            <h3 style="margin-bottom: 0.5rem;">위치 선택 완료!</h3>
            <p>주소가 자동으로 입력되었어요</p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 2000);
}

// 데이터 내보내기 함수
function exportData() {
    const exportData = {
        restaurants: restaurants,
        exportDate: new Date().toISOString(),
        version: "1.0"
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `우리의맛집지도_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // 성공 메시지
    showExportSuccessMessage();
}

// 데이터 가져오기 함수
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.restaurants && Array.isArray(importedData.restaurants)) {
                const shouldMerge = confirm('기존 데이터와 합칠까요?\n(취소를 누르면 기존 데이터를 덮어씁니다)');
                
                if (shouldMerge) {
                    restaurants = [...restaurants, ...importedData.restaurants];
                } else {
                    restaurants = importedData.restaurants;
                }
                
                localStorage.setItem('restaurants', JSON.stringify(restaurants));
                filteredRestaurants = [];
                displayRestaurantsOnMap();
                displayRestaurantsList();
                updateStats();
                
                alert(`${importedData.restaurants.length}개의 맛집 데이터를 성공적으로 가져왔습니다! 💕`);
            } else {
                alert('올바른 맛집 데이터 파일이 아닙니다.');
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    
    // 파일 입력 초기화
    event.target.value = '';
}

function showExportSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📤</div>
            <h3 style="margin-bottom: 0.5rem;">데이터 내보내기 완료!</h3>
            <p>우리의 맛집 추억이 안전하게 저장되었어요</p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 2000);
}

// 기념일 관련 함수들
function setAnniversaryDate() {
    const modal = document.createElement('div');
    modal.className = 'anniversary-modal';
    modal.innerHTML = `
        <div class="anniversary-modal-content">
            <h3>💕 우리의 연애 기념일 설정</h3>
            <div class="anniversary-form">
                <label for="anniversaryInput">연애 시작일:</label>
                <input type="date" id="anniversaryInput" ${anniversaryDate ? `value="${anniversaryDate}"` : ''}>
                <div class="anniversary-buttons">
                    <button onclick="saveAnniversary()">저장</button>
                    <button onclick="closeAnniversaryModal()">취소</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function saveAnniversary() {
    const dateInput = document.getElementById('anniversaryInput').value;
    if (dateInput) {
        anniversaryDate = dateInput;
        localStorage.setItem('anniversaryDate', anniversaryDate);
        updateAnniversaryDisplay();
        closeAnniversaryModal();
        
        // 축하 애니메이션
        showAnniversarySuccessMessage();
    }
}

function closeAnniversaryModal() {
    const modal = document.querySelector('.anniversary-modal');
    if (modal) {
        modal.remove();
    }
}

function updateAnniversaryDisplay() {
    const display = document.getElementById('anniversaryDisplay');
    if (anniversaryDate) {
        const anniversary = new Date(anniversaryDate);
        const today = new Date();
        const daysTogether = Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
        
        display.innerHTML = `💕 함께한 지 ${daysTogether}일째! (${anniversary.toLocaleDateString('ko-KR')})`;
    } else {
        display.innerHTML = '💕 우리의 연애 기념일을 설정해보세요!';
    }
}

function showAnniversarySuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💕</div>
            <h3 style="margin-bottom: 0.5rem;">기념일 설정 완료!</h3>
            <p>소중한 날을 기억할게요</p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 2000);
}

// API 연동 함수들
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/.netlify/functions';

// 커플 코드 생성
async function createCoupleCode() {
    try {
        const response = await fetch(`${API_BASE}/api/couple/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anniversaryDate: anniversaryDate })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentCoupleCode = data.coupleCode;
            localStorage.setItem('coupleCode', currentCoupleCode);
            updateCoupleDisplay();
            alert(`커플 코드가 생성되었습니다!\n\n코드: ${currentCoupleCode}\n\n이 코드를 상대방과 공유하세요! 💕`);
            showCoupleSetupComplete();
        }
    } catch (error) {
        console.error('커플 코드 생성 오류:', error);
        alert('커플 코드 생성에 실패했습니다.');
    }
}

// 커플 코드 입력
function enterCoupleCode() {
    const code = prompt('커플 코드를 입력해주세요:');
    if (code) {
        verifyCoupleCode(code.toUpperCase());
    }
}

// 커플 코드 확인
async function verifyCoupleCode(code) {
    try {
        const response = await fetch(`${API_BASE}/api/couple/${code}`);
        const data = await response.json();
        
        if (data.success) {
            currentCoupleCode = code;
            anniversaryDate = data.couple.anniversary_date;
            localStorage.setItem('coupleCode', currentCoupleCode);
            localStorage.setItem('anniversaryDate', anniversaryDate);
            
            updateCoupleDisplay();
            loadRestaurantsFromDB();
            alert('커플 코드가 확인되었습니다! 💕');
            showCoupleSetupComplete();
        } else {
            alert('존재하지 않는 커플 코드입니다.');
        }
    } catch (error) {
        console.error('커플 코드 확인 오류:', error);
        alert('커플 코드 확인에 실패했습니다.');
    }
}

// 커플 디스플레이 업데이트
function updateCoupleDisplay() {
    const display = document.getElementById('coupleCodeDisplay');
    const buttons = document.querySelector('.couple-buttons');
    const anniversaryInfo = document.querySelector('.anniversary-info');
    
    if (currentCoupleCode) {
        display.innerHTML = `💕 커플 코드: <strong style="color: #667eea;">${currentCoupleCode}</strong>`;
        buttons.style.display = 'none';
        anniversaryInfo.style.display = 'block';
        updateAnniversaryDisplay();
    } else {
        display.innerHTML = '💕 커플 코드를 생성하거나 입력해주세요!';
        buttons.style.display = 'flex';
        anniversaryInfo.style.display = 'none';
    }
}

function showCoupleSetupComplete() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💕</div>
            <h3 style="margin-bottom: 0.5rem;">커플 코드 설정 완료!</h3>
            <p>이제 함께 맛집을 공유할 수 있어요</p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 2000);
}

// DB에서 맛집 목록 로드
async function loadRestaurantsFromDB() {
    if (!currentCoupleCode) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/restaurants/${currentCoupleCode}`);
        const data = await response.json();
        
        if (data.success) {
            restaurants = data.restaurants.map(r => ({
                name: r.name,
                address: r.address,
                lat: parseFloat(r.latitude),
                lng: parseFloat(r.longitude),
                type: r.type,
                rating: r.rating,
                date: r.visit_date,
                memo: r.memo || '',
                photos: r.photos || [],
                id: r.id
            }));
            
            filteredRestaurants = [];
            displayRestaurantsOnMap();
            displayRestaurantsList();
            updateStats();
            generateRecommendations();
        }
    } catch (error) {
        console.error('맛집 데이터 로드 오류:', error);
    }
}

// DB에 맛집 저장
async function saveRestaurantToDB(restaurant) {
    if (!currentCoupleCode) {
        alert('먼저 커플 코드를 설정해주세요!');
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/restaurants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coupleCode: currentCoupleCode,
                ...restaurant
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.restaurant;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('맛집 저장 오류:', error);
        alert('맛집 저장에 실패했습니다: ' + error.message);
        return false;
    }
}

// DB에서 맛집 삭제
async function deleteRestaurantFromDB(restaurantId) {
    if (!currentCoupleCode) return false;
    
    try {
        const response = await fetch(`${API_BASE}/api/restaurants/${restaurantId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coupleCode: currentCoupleCode })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('맛집 삭제 오류:', error);
        return false;
    }
}

// 맛집 추천 시스템
function generateRecommendations() {
    const recommendationContainer = document.getElementById('recommendationContent');
    
    if (restaurants.length < 3) {
        recommendationContainer.innerHTML = `
            <p style="text-align: center; color: #666;">맛집을 더 등록하면 추천을 받을 수 있어요!</p>
            <p style="text-align: center; color: #999; font-size: 0.9rem;">(최소 3개 이상 등록 필요)</p>
        `;
        return;
    }

    // 통계 분석
    const typeStats = {};
    const ratingStats = { total: 0, count: 0 };
    const recentVisits = restaurants.slice(-5);
    
    restaurants.forEach(restaurant => {
        typeStats[restaurant.type] = (typeStats[restaurant.type] || 0) + 1;
        ratingStats.total += restaurant.rating;
        ratingStats.count += 1;
    });
    
    const favoriteType = Object.keys(typeStats).reduce((a, b) => typeStats[a] > typeStats[b] ? a : b);
    const avgRating = (ratingStats.total / ratingStats.count).toFixed(1);
    const highRatedRestaurants = restaurants.filter(r => r.rating >= 4);
    
    recommendationContainer.innerHTML = `
        <div class="recommendation-stats">
            <div class="stat-item">
                <span class="stat-label">선호 음식:</span>
                <span class="stat-value">${favoriteType} (${typeStats[favoriteType]}회)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">평균 평점:</span>
                <span class="stat-value">${avgRating}⭐</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">고평점 맛집:</span>
                <span class="stat-value">${highRatedRestaurants.length}곳</span>
            </div>
        </div>
        
        <div class="recommendation-tips">
            <h4>💡 추천 팁</h4>
            <ul>
                <li>${favoriteType} 종류를 좋아하시는 것 같아요! 새로운 ${favoriteType} 맛집을 찾아보세요.</li>
                ${avgRating >= 4 ? 
                    '<li>평점이 높으신 편이네요! 까다로운 입맛을 만족시킬 특별한 곳을 찾아보세요.</li>' : 
                    '<li>다양한 맛집을 시도해보시는 것 같아요! 새로운 도전을 계속해보세요.</li>'
                }
                ${recentVisits.length >= 3 ? 
                    '<li>최근에 자주 외식하시네요! 건강한 식당도 찾아보세요.</li>' : 
                    '<li>더 많은 맛집을 함께 탐험해보세요! 새로운 추억을 만들어가요.</li>'
                }
            </ul>
        </div>
        
        ${highRatedRestaurants.length > 0 ? `
            <div class="favorite-restaurants">
                <h4>🌟 베스트 맛집</h4>
                <div class="best-restaurants">
                    ${highRatedRestaurants.slice(0, 3).map(restaurant => `
                        <div class="best-restaurant-item">
                            <strong>${restaurant.name}</strong>
                            <span>${'⭐'.repeat(restaurant.rating)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// 하트 파티클 효과
function createHeartParticles() {
    const heartsContainer = document.createElement('div');
    heartsContainer.id = 'hearts-container';
    heartsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
    `;
    document.body.appendChild(heartsContainer);

    setInterval(() => {
        createHeart(heartsContainer);
    }, 3000);
}

function createHeart(container) {
    const heart = document.createElement('div');
    const hearts = ['💕', '💖', '💗', '💝', '💘', '💓'];
    heart.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 20}px;
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: floatUp ${Math.random() * 3 + 4}s linear forwards;
        opacity: 0.7;
    `;
    container.appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 7000);
}

// 별 효과 추가
function addStarryBackground() {
    const starsContainer = document.createElement('div');
    starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    `;
    
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: twinkle ${Math.random() * 4 + 2}s infinite;
        `;
        starsContainer.appendChild(star);
    }
    
    document.body.insertBefore(starsContainer, document.body.firstChild);
}

// 마우스 팔로우 효과
function addMouseFollowEffect() {
    const cursor = document.createElement('div');
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = (e.clientX - 10) + 'px';
        cursor.style.top = (e.clientY - 10) + 'px';
    });

    document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(1.5)';
    });

    document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1)';
    });
}

// CSS 애니메이션 추가
const additionalStyle = document.createElement('style');
additionalStyle.textContent += `
    @keyframes floatUp {
        0% { 
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
        }
        50% {
            opacity: 1;
        }
        100% { 
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
    }
    
    /* 입력 필드에 포커스 시 하트 효과 */
    .form-group input:focus::after,
    .form-group select:focus::after,
    .form-group textarea:focus::after {
        content: '💕';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        animation: heartPulse 1s infinite;
    }
    
    @keyframes heartPulse {
        0%, 100% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.2); }
    }
`;
document.head.appendChild(additionalStyle);

// localStorage 데이터 확인 및 마이그레이션
function checkForLocalStorageData() {
    const oldRestaurants = localStorage.getItem('restaurants');
    const oldAnniversary = localStorage.getItem('anniversaryDate');
    
    if (oldRestaurants) {
        try {
            const parsedRestaurants = JSON.parse(oldRestaurants);
            if (parsedRestaurants.length > 0) {
                showMigrationDialog(parsedRestaurants, oldAnniversary);
            }
        } catch (error) {
            console.error('기존 데이터 파싱 오류:', error);
        }
    }
}

// 마이그레이션 다이얼로그 표시
function showMigrationDialog(oldRestaurants, oldAnniversary) {
    const modal = document.createElement('div');
    modal.className = 'migration-modal';
    modal.innerHTML = `
        <div class="migration-modal-content">
            <h3>💕 기존 데이터 발견!</h3>
            <p>브라우저에 저장된 ${oldRestaurants.length}개의 맛집 데이터가 있습니다.</p>
            <p>커플 코드를 생성하고 이 데이터를 클라우드로 이동할까요?</p>
            <div class="migration-buttons">
                <button onclick="startMigration()" class="migration-btn-yes">💕 네, 이동할게요!</button>
                <button onclick="skipMigration()" class="migration-btn-skip">나중에 할게요</button>
                <button onclick="deleteMigration()" class="migration-btn-delete">기존 데이터 삭제</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // 전역 변수에 저장
    window.migrationData = { restaurants: oldRestaurants, anniversary: oldAnniversary };
}

// 마이그레이션 시작
async function startMigration() {
    closeMigrationModal();
    
    try {
        // 1. 커플 코드 생성
        const response = await fetch(`${API_BASE}/api/couple/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anniversaryDate: window.migrationData.anniversary })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('커플 코드 생성 실패');
        }
        
        currentCoupleCode = data.coupleCode;
        anniversaryDate = window.migrationData.anniversary;
        localStorage.setItem('coupleCode', currentCoupleCode);
        
        // 2. 기존 맛집 데이터 업로드
        const migrationResults = [];
        for (const restaurant of window.migrationData.restaurants) {
            const savedRestaurant = await saveRestaurantToDB(restaurant);
            if (savedRestaurant) {
                migrationResults.push({
                    ...restaurant,
                    id: savedRestaurant.id
                });
            }
        }
        
        // 3. 성공적으로 마이그레이션된 데이터로 교체
        restaurants = migrationResults;
        
        // 4. 기존 localStorage 데이터 정리
        localStorage.removeItem('restaurants');
        
        // 5. UI 업데이트
        updateCoupleDisplay();
        displayRestaurantsOnMap();
        displayRestaurantsList();
        updateStats();
        generateRecommendations();
        
        // 성공 메시지
        showMigrationSuccessMessage(migrationResults.length, currentCoupleCode);
        
    } catch (error) {
        console.error('마이그레이션 오류:', error);
        alert('데이터 마이그레이션에 실패했습니다: ' + error.message);
    }
}

// 마이그레이션 건너뛰기
function skipMigration() {
    closeMigrationModal();
    // 나중에 다시 물어보도록 localStorage는 그대로 유지
}

// 기존 데이터 삭제
function deleteMigration() {
    if (confirm('정말로 기존 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        localStorage.removeItem('restaurants');
        localStorage.removeItem('anniversaryDate');
        closeMigrationModal();
        alert('기존 데이터가 삭제되었습니다.');
    }
}

// 마이그레이션 모달 닫기
function closeMigrationModal() {
    const modal = document.querySelector('.migration-modal');
    if (modal) {
        modal.remove();
    }
}

// 마이그레이션 성공 메시지
function showMigrationSuccessMessage(count, coupleCode) {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 400px;
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="margin-bottom: 0.5rem;">마이그레이션 완료!</h3>
            <p>${count}개의 맛집이 클라우드로 이동되었어요</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 10px;">
                <strong>커플 코드: ${coupleCode}</strong><br>
                상대방과 공유하세요! 💕
            </p>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// 페이지 로드 시 기존 데이터 표시 및 효과 초기화
document.addEventListener('DOMContentLoaded', function() {
    // Google Maps API가 로드되기 전에 리스트만 먼저 표시
    displayRestaurantsList();
    updateStats();
    
    // 사진 미리보기 초기화
    handlePhotoPreview();
    
    // 검색 및 필터 이벤트 리스너
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', filterRestaurants);
    typeFilter.addEventListener('change', filterRestaurants);
    ratingFilter.addEventListener('change', filterRestaurants);
    
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        typeFilter.value = '';
        ratingFilter.value = '';
        filteredRestaurants = [];
        displayRestaurantsList();
        displayRestaurantsOnMap();
        updateStats();
    });
    
    // 데이터 백업/복원 이벤트 리스너
    const exportButton = document.getElementById('exportData');
    const importButton = document.getElementById('importButton');
    const importInput = document.getElementById('importData');
    
    exportButton.addEventListener('click', exportData);
    importButton.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', importData);
    
    // 커플 코드 이벤트 리스너
    const createCoupleCodeBtn = document.getElementById('createCoupleCode');
    const enterCoupleCodeBtn = document.getElementById('enterCoupleCode');
    const setAnniversaryButton = document.getElementById('setAnniversary');
    
    createCoupleCodeBtn.addEventListener('click', createCoupleCode);
    enterCoupleCodeBtn.addEventListener('click', enterCoupleCode);
    setAnniversaryButton.addEventListener('click', setAnniversaryDate);
    
    // 커플 코드 디스플레이 업데이트
    updateCoupleDisplay();
    
    // 커플 코드가 있으면 데이터 로드
    if (currentCoupleCode) {
        loadRestaurantsFromDB();
    } else {
        // 기존 localStorage 데이터 확인 및 마이그레이션 제안
        checkForLocalStorageData();
    }
    
    // 추천 시스템 업데이트
    generateRecommendations();
    
    // 맛집 검색 이벤트 리스너
    const placeSearchBtn = document.getElementById('placeSearchBtn');
    const placeSearchInput = document.getElementById('placeSearchInput');
    
    placeSearchBtn.addEventListener('click', searchPlaces);
    placeSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchPlaces();
        }
    });
    
    // 검색 결과 외부 클릭시 숨기기
    document.addEventListener('click', function(e) {
        const searchResults = document.getElementById('searchResults');
        const searchContainer = document.querySelector('.map-search-container');
        
        if (!searchContainer.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
    
    // 로맨틱 효과들 초기화
    createHeartParticles();
    addStarryBackground();
    addMouseFollowEffect();
    
    // 페이지 로드 애니메이션
    document.body.style.animation = 'pageLoad 1s ease-out';
});

// 페이지 로드 애니메이션
const pageLoadStyle = document.createElement('style');
pageLoadStyle.textContent = `
    @keyframes pageLoad {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(pageLoadStyle);