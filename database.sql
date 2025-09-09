-- 커플 맛집 지도 데이터베이스 스키마

-- 커플 테이블
CREATE TABLE couples (
  id SERIAL PRIMARY KEY,
  couple_code VARCHAR(8) UNIQUE NOT NULL,
  anniversary_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 맛집 테이블
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  couple_code VARCHAR(8) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  visit_date DATE NOT NULL,
  memo TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (couple_code) REFERENCES couples(couple_code) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_restaurants_couple_code ON restaurants(couple_code);
CREATE INDEX idx_restaurants_created_at ON restaurants(created_at);
CREATE INDEX idx_restaurants_rating ON restaurants(rating);
CREATE INDEX idx_restaurants_type ON restaurants(type);

-- 커플 코드 유니크 제약조건 인덱스
CREATE UNIQUE INDEX idx_couples_couple_code ON couples(couple_code);

-- Row Level Security (RLS) 정책 설정
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (커플 코드로 접근)
CREATE POLICY "Public read access for couples" ON couples
  FOR SELECT USING (true);

CREATE POLICY "Public read access for restaurants" ON restaurants
  FOR SELECT USING (true);

-- 공개 쓰기 정책 (인증 없이 데이터 추가 가능)
CREATE POLICY "Public insert access for couples" ON couples
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public insert access for restaurants" ON restaurants
  FOR INSERT WITH CHECK (true);

-- 공개 업데이트/삭제 정책
CREATE POLICY "Public update access for restaurants" ON restaurants
  FOR UPDATE USING (true);

CREATE POLICY "Public delete access for restaurants" ON restaurants
  FOR DELETE USING (true);

-- 샘플 데이터 (테스트용)
INSERT INTO couples (couple_code, anniversary_date) VALUES 
('DEMO2024', '2024-01-14');

INSERT INTO restaurants (couple_code, name, address, latitude, longitude, type, rating, visit_date, memo) VALUES 
('DEMO2024', '테스트 맛집', '서울특별시 강남구 테헤란로 123', 37.5665, 126.9780, '한식', 5, '2024-09-01', '우리가 처음 만난 곳 💕');