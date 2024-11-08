import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 允許這些端點不需要認證
  const publicPaths = [
    '/api/spotify-token',
    '/api/youtube-search'
  ]

  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // 檢查其他 API 路由的認證狀態
  const token = request.cookies.get('spotify_access_token')
  
  if (request.nextUrl.pathname.startsWith('/api/spotify/') && !token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
} 