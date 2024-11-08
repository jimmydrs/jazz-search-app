import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY
  if (!youtubeApiKey) {
    console.error('YouTube API key is missing')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` + 
      new URLSearchParams({
        part: 'snippet',
        q: `${query} jazz`,
        type: 'video',
        maxResults: '25',
        videoEmbeddable: 'true',
        key: youtubeApiKey,
        videoCategoryId: '10', // Music category
        order: 'relevance'
      }),
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('YouTube API error:', errorData)
      throw new Error('YouTube API request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch YouTube results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch YouTube results' },
      { status: 500 }
    )
  }
} 