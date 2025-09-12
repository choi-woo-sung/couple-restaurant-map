// Supabase 데이터베이스 설정 스크립트
// Node.js 환경에서 실행하기 위한 스크립트

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yciqltvaqlnxavfwysqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXFsdHZhcWxueGF2Znd5c2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTQ5NDYsImV4cCI6MjA3Mjk5MDk0Nn0.5W5MDiz4YzzzB-IpfiGgsFgexj2W1FTbKu7-sOYKWtw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDatabase() {
    console.log('🚀 Supabase 데이터베이스 설정 시작...');

    try {
        // 1. 연결 테스트
        console.log('📡 연결 테스트 중...');
        const { error: connectionError } = await supabase.from('_supabase_sessions').select('count', { count: 'exact', head: true });
        
        if (connectionError && connectionError.code !== 'PGRST116') {
            throw connectionError;
        }
        console.log('✅ Supabase 연결 성공!');

        // 2. locations 테이블에 테스트 데이터 추가 (테이블이 이미 존재한다고 가정)
        console.log('📊 테스트 데이터 추가 중...');
        
        const testLocations = [
            {
                name: '스타벅스 강남점',
                address: '서울특별시 강남구 테헤란로 152',
                latitude: 37.5012767,
                longitude: 127.0396597,
                category: 'cafe',
                rating: 4,
                visit_date: '2024-01-15',
                memo: '분위기 좋고 Wi-Fi 빨라요 ☕'
            },
            {
                name: '교동짬뽕 홍대점',
                address: '서울특별시 마포구 와우산로 94',
                latitude: 37.5563135,
                longitude: 126.9223574,
                category: 'restaurant',
                rating: 5,
                visit_date: '2024-01-20',
                memo: '짬뽕이 정말 맛있어요! 🍜'
            },
            {
                name: '한강공원 뚝섬',
                address: '서울특별시 광진구 자양동',
                latitude: 37.5306146,
                longitude: 127.0666782,
                category: 'travel',
                rating: 4,
                visit_date: '2024-02-01',
                memo: '산책하기 좋은 곳 🌸'
            }
        ];

        const { data, error } = await supabase
            .from('locations')
            .insert(testLocations)
            .select();

        if (error) {
            console.error('❌ 데이터 추가 실패:', error.message);
            console.log('💡 Supabase 대시보드에서 먼저 locations 테이블을 생성해주세요.');
            return;
        }

        console.log(`✅ ${data.length}개의 테스트 데이터 추가 완료!`);
        console.log('📍 추가된 장소들:');
        data.forEach((location, index) => {
            console.log(`   ${index + 1}. ${location.name} (${location.category})`);
        });

        // 3. 데이터 조회 테스트
        console.log('📋 데이터 조회 테스트 중...');
        const { data: allLocations, error: selectError } = await supabase
            .from('locations')
            .select('*')
            .order('created_at', { ascending: false });

        if (selectError) {
            throw selectError;
        }

        console.log(`📊 총 ${allLocations.length}개의 장소가 데이터베이스에 저장되어 있습니다.`);

        // 4. 통계 조회 테스트
        const stats = {
            totalVisits: allLocations.length,
            averageRating: allLocations.length > 0 ? 
                (allLocations.reduce((sum, loc) => sum + (parseFloat(loc.rating) || 0), 0) / allLocations.length).toFixed(1) : 0,
            categoryCounts: {}
        };

        allLocations.forEach(location => {
            stats.categoryCounts[location.category] = (stats.categoryCounts[location.category] || 0) + 1;
        });

        console.log('📈 통계:');
        console.log(`   총 방문: ${stats.totalVisits}회`);
        console.log(`   평균 평점: ${stats.averageRating}점`);
        console.log('   카테고리별:', stats.categoryCounts);

        console.log('🎉 데이터베이스 설정 완료!');
        
    } catch (error) {
        console.error('💥 설정 실패:', error.message);
        console.error('상세 오류:', error);
    }
}

// 스크립트 실행
setupDatabase();