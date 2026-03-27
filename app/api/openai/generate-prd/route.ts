import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, apiKey } = body as { title: string; description: string; apiKey: string }

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 필요합니다' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: '아이디어 제목이 필요합니다' }, { status: 400 })
    }

    const systemPrompt = `당신은 프로젝트 기획 전문가입니다. 아이디어를 받아 간결한 PRD를 JSON으로 반환하세요.

다음 JSON 형식으로만 응답하세요:
{
  "projectTitle": "프로젝트 제목",
  "background": "배경 및 문제 상황 (1-2문장)",
  "goal": "프로젝트 목표 (1-2문장)",
  "target": "대상 사용자 (1문장)",
  "features": "핵심 기능 목록 (bullet point 형식)",
  "metrics": "성공 지표 (1-2문장)",
  "timeline": "예상 개발 일정 (1-2문장)"
}`

    const userPrompt = `아이디어: ${title}${description ? `\n\n설명: ${description}` : ''}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      if (response.status === 401) {
        return NextResponse.json({ error: 'API 키가 유효하지 않습니다' }, { status: 401 })
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요' }, { status: 429 })
      }
      const errMsg = (errData as { error?: { message?: string } })?.error?.message ?? '알 수 없는 오류가 발생했습니다'
      return NextResponse.json({ error: errMsg }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: '응답을 받지 못했습니다' }, { status: 500 })
    }

    const parsed = JSON.parse(content) as {
      projectTitle: string
      background: string
      goal: string
      target: string
      features: string
      metrics: string
      timeline: string
    }

    return NextResponse.json({
      projectTitle: parsed.projectTitle ?? title,
      prd: {
        background: parsed.background ?? '',
        goal: parsed.goal ?? '',
        target: parsed.target ?? '',
        features: parsed.features ?? '',
        metrics: parsed.metrics ?? '',
        timeline: parsed.timeline ?? '',
      },
    })
  } catch (err) {
    console.error('generate-prd error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
