// app/api/register/route.ts
import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key')
  const body = await req.json()
  const { user_id, app_id, subscription, onesignal_player_id } = body

  if (!authHeader || !process.env.API_SECRET_KEY || authHeader !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!user_id || !app_id || !subscription) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: app, error: appError } = await supabase
    .from('ring_apps')
    .select('id')
    .eq('id', app_id)
    .single()

  if (appError || !app) {
    return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 })
  }

  const { error: upsertError } = await supabase
    .from('ring_users')
    .upsert({
      user_id,
      app_id,
      subscription,
      onesignal_player_id,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,app_id' })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to register user', detail: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
