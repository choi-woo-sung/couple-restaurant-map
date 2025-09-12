-- Couple Restaurant Map - Supabase Database Schema
-- 커플 맛집 지도 앱을 위한 데이터베이스 스키마

-- 장소 테이블 생성
CREATE TABLE public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    category VARCHAR(50) NOT NULL CHECK (category IN ('restaurant', 'cafe', 'travel', 'culture', 'etc')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    visit_date DATE NOT NULL,
    memo TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_locations_category ON public.locations(category);
CREATE INDEX idx_locations_visit_date ON public.locations(visit_date);
CREATE INDEX idx_locations_rating ON public.locations(rating);
CREATE INDEX idx_locations_coordinates ON public.locations(latitude, longitude);

-- Row Level Security (RLS) 설정
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON public.locations
    FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Enable insert access for all users" ON public.locations
    FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Enable update access for all users" ON public.locations
    FOR UPDATE USING (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Enable delete access for all users" ON public.locations
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON public.locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 통계 뷰 생성 (성능 최적화)
CREATE VIEW public.location_stats AS
SELECT 
    COUNT(*) as total_visits,
    ROUND(AVG(rating), 1) as average_rating,
    MODE() WITHIN GROUP (ORDER BY category) as favorite_category,
    COUNT(CASE WHEN visit_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as recent_visits
FROM public.locations;

-- 카테고리별 통계 뷰
CREATE VIEW public.category_stats AS
SELECT 
    category,
    COUNT(*) as count,
    ROUND(AVG(rating), 1) as avg_rating,
    COUNT(CASE WHEN visit_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as recent_count
FROM public.locations
GROUP BY category
ORDER BY count DESC;

-- 월별 방문 통계 뷰
CREATE VIEW public.monthly_visits AS
SELECT 
    DATE_TRUNC('month', visit_date) as month,
    COUNT(*) as visit_count,
    ROUND(AVG(rating), 1) as avg_rating
FROM public.locations
GROUP BY DATE_TRUNC('month', visit_date)
ORDER BY month DESC;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO public.locations (name, address, latitude, longitude, category, rating, visit_date, memo) VALUES
('스타벅스 강남점', '서울특별시 강남구 테헤란로 152', 37.5012767, 127.0396597, 'cafe', 4, '2024-01-15', '분위기 좋고 Wi-Fi 빨라요 ☕'),
('교동짬뽕 홍대점', '서울특별시 마포구 와우산로 94', 37.5563135, 126.9223574, 'restaurant', 5, '2024-01-20', '짬뽕이 정말 맛있어요! 🍜'),
('한강공원 뚝섬', '서울특별시 광진구 자양동', 37.5306146, 127.0666782, 'travel', 4, '2024-02-01', '산책하기 좋은 곳 🌸'),
('국립중앙박물관', '서울특별시 용산구 서빙고로 137', 37.5240737, 126.9801063, 'culture', 5, '2024-02-10', '전시가 인상깊었어요 🎨');

-- 실시간 구독을 위한 Publication 설정 (선택사항)
-- CREATE PUBLICATION locations_publication FOR TABLE public.locations;

COMMENT ON TABLE public.locations IS '커플이 방문한 장소들을 저장하는 테이블';
COMMENT ON COLUMN public.locations.id IS '장소 고유 ID';
COMMENT ON COLUMN public.locations.name IS '장소명';
COMMENT ON COLUMN public.locations.address IS '주소';
COMMENT ON COLUMN public.locations.latitude IS '위도';
COMMENT ON COLUMN public.locations.longitude IS '경도';
COMMENT ON COLUMN public.locations.category IS '카테고리 (restaurant, cafe, travel, culture, etc)';
COMMENT ON COLUMN public.locations.rating IS '평점 (1-5)';
COMMENT ON COLUMN public.locations.visit_date IS '방문 날짜';
COMMENT ON COLUMN public.locations.memo IS '추억 메모';
COMMENT ON COLUMN public.locations.photos IS '사진 URL 배열 (JSON)';