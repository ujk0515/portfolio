import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 클라이언트 IP 주소 가져오기
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
                     || req.headers.get('x-real-ip')
                     || 'unknown'

    console.log('Client IP:', clientIp)

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 오늘 날짜 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0]

    // 오늘 이미 방문했는지 확인
    const { data: existingVisit } = await supabase
      .from('daily_visitors')
      .select('*')
      .eq('visitor_id', clientIp)
      .eq('visit_date', today)
      .single()

    let shouldIncrement = false

    // 첫 방문이면 기록 추가
    if (!existingVisit) {
      const { error: insertError } = await supabase
        .from('daily_visitors')
        .insert({
          visitor_id: clientIp,
          visit_date: today
        })

      if (!insertError) {
        shouldIncrement = true
      }
    }

    // 방문자 수 조회
    const { data: countData } = await supabase
      .from('visitor_count')
      .select('total_count')
      .eq('id', 1)
      .single()

    let totalCount = countData?.total_count || 0

    // 첫 방문이면 카운트 증가
    if (shouldIncrement) {
      totalCount += 1
      await supabase
        .from('visitor_count')
        .update({
          total_count: totalCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalCount,
        clientIp,
        isNewVisitor: shouldIncrement
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})