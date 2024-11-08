import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const tokenEndpoint = 'https://accounts.spotify.com/api/token'
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log('Requesting token with params:', {
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Spotify API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error during token exchange' },
      { status: 500 }
    )
  }
} 