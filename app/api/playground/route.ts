
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Welcome to the Ring Notify API playground! 🎮'
  })
}
