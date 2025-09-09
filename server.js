const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Supabase 클라이언트 설정
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 커플 코드 생성
const { v4: uuidv4 } = require('uuid');

function generateCoupleCode() {
  return uuidv4().substring(0, 8).toUpperCase();
}

// API 라우트

// 커플 코드 생성
app.post('/api/couple/create', async (req, res) => {
  try {
    const coupleCode = generateCoupleCode();
    const anniversaryDate = req.body.anniversaryDate;
    
    const { data, error } = await supabase
      .from('couples')
      .insert({
        couple_code: coupleCode,
        anniversary_date: anniversaryDate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      coupleCode: coupleCode,
      message: '커플 코드가 생성되었습니다! 💕'
    });
  } catch (error) {
    console.error('커플 코드 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '커플 코드 생성에 실패했습니다.' 
    });
  }
});

// 커플 정보 조회
app.get('/api/couple/:coupleCode', async (req, res) => {
  try {
    const { coupleCode } = req.params;
    
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('couple_code', coupleCode)
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      couple: data 
    });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      message: '커플 코드를 찾을 수 없습니다.' 
    });
  }
});

// 맛집 목록 조회
app.get('/api/restaurants/:coupleCode', async (req, res) => {
  try {
    const { coupleCode } = req.params;
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('couple_code', coupleCode)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true, 
      restaurants: data || [] 
    });
  } catch (error) {
    console.error('맛집 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '맛집 목록을 불러올 수 없습니다.' 
    });
  }
});

// 맛집 등록
app.post('/api/restaurants', async (req, res) => {
  try {
    const restaurantData = req.body;
    
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        couple_code: restaurantData.coupleCode,
        name: restaurantData.name,
        address: restaurantData.address,
        latitude: restaurantData.lat,
        longitude: restaurantData.lng,
        type: restaurantData.type,
        rating: restaurantData.rating,
        visit_date: restaurantData.date,
        memo: restaurantData.memo,
        photos: restaurantData.photos || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      restaurant: data,
      message: '맛집이 성공적으로 등록되었습니다! 💕'
    });
  } catch (error) {
    console.error('맛집 등록 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '맛집 등록에 실패했습니다.' 
    });
  }
});

// 맛집 삭제
app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { coupleCode } = req.body;
    
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
      .eq('couple_code', coupleCode);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: '맛집이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('맛집 삭제 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '맛집 삭제에 실패했습니다.' 
    });
  }
});

// 기본 라우트 - 프론트엔드 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 커플 코드로 접속하는 라우트
app.get('/couple/:coupleCode', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 커플 맛집 지도 서버가 ${PORT}번 포트에서 실행 중입니다!`);
});