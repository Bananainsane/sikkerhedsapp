import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const response = await fetch('https://admin.twincurrent.dk/api/heal/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    const data = await response.json()
    return NextResponse.json(data)
  } catch { return NextResponse.json({ ok: false }, { status: 500 }) }
}
