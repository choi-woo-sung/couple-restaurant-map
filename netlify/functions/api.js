const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function generateCoupleCode() {
  return uuidv4().substring(0, 8).toUpperCase();
}

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // URL에서 API 경로 추출
    const apiPath = path.replace('/.netlify/functions/api', '');
    
    // 커플 코드 생성
    if (httpMethod === 'POST' && apiPath === '/couple/create') {
      const { anniversaryDate } = JSON.parse(body);
      const coupleCode = generateCoupleCode();
      
      const { data, error } = await supabase
        .from('couples')
        .insert({
          couple_code: coupleCode,
          anniversary_date: anniversaryDate,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, coupleCode, data })
      };
    }

    // 커플 코드 검증
    if (httpMethod === 'POST' && apiPath === '/couple/join') {
      const { coupleCode } = JSON.parse(body);
      
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('couple_code', coupleCode);

      if (error) throw error;

      if (data.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: '커플 코드를 찾을 수 없습니다.' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: data[0] })
      };
    }

    // 맛집 목록 조회
    if (httpMethod === 'GET' && apiPath.startsWith('/restaurants/')) {
      const coupleCode = apiPath.split('/')[2];
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('couple_code', coupleCode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, restaurants: data })
      };
    }

    // 맛집 추가
    if (httpMethod === 'POST' && apiPath.startsWith('/restaurants/')) {
      const coupleCode = apiPath.split('/')[2];
      const restaurantData = JSON.parse(body);
      
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          couple_code: coupleCode,
          ...restaurantData,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data })
      };
    }

    // 맛집 삭제
    if (httpMethod === 'DELETE' && apiPath.includes('/restaurants/')) {
      const pathParts = apiPath.split('/');
      const coupleCode = pathParts[2];
      const restaurantId = pathParts[3];
      
      const { data, error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)
        .eq('couple_code', coupleCode)
        .select();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};