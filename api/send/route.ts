// app/api/send/route.ts
import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key')
  const body = await req.json()
  const { user_id, app_id, message, url } = body

  if (!authHeader || !process.env.API_SECRET_KEY || authHeader !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!user_id || !app_id || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: user, error: userError } = await supabase
    .from('ring_users')
    .select('onesignal_player_id')
    .eq('user_id', user_id)
    .eq('app_id', app_id)
    .single()

  const { data: app, error: appError } = await supabase
    .from('ring_apps')
    .select('onesignal_app_id')
    .eq('id', app_id)
    .single()

  if (userError || appError || !user || !user.onesignal_player_id || !app?.onesignal_app_id) {
    return NextResponse.json({ error: 'Invalid user or app' }, { status: 400 })
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: app.onesignal_app_id,
      include_player_ids: [user.onesignal_player_id],
      contents: { en: message },
      url
    })
  })

  const resJson = await response.json()

  await supabase.from('ring_logs').insert({
    user_id,
    app_id,
    message,
    url,
    sent_at: new Date().toISOString(),
    response_status: response.status
  })

  return NextResponse.json({ success: true, onesignal: resJson })
}
