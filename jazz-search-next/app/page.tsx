'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Music, Youtube } from 'lucide-react'
import { getSpotifyApi, setSpotifyAccessToken } from '@/lib/spotify'

interface SpotifyResult {
  id: string
  name: string
  artist: string
  uri: string
  albumImage: string
  duration: string
  externalUrl: string
}

interface YoutubeResult {
  id: string
  title: string
  channelTitle: string
  url: string
  thumbnail: string
  publishedAt: string
  description: string
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatPublishedDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [spotifyResults, setSpotifyResults] = useState<SpotifyResult[]>([])
  const [youtubeResults, setYoutubeResults] = useState<YoutubeResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const displayError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const authParam = urlParams.get('auth')

    if (errorParam) {
      switch (errorParam) {
        case 'auth_failed':
          displayError('Spotify 認證失敗，請重試')
          break
        case 'no_code':
          displayError('未收到認證碼，請重試')
          break
        case 'token_exchange_failed':
          displayError('取得存取權杖失敗，請重試')
          break
        default:
          displayError(decodeURIComponent(errorParam))
      }
    }

    if (authParam === 'success') {
      setIsAuthenticated(true)
    }
  }, [])

  // 修改 token 設置邏輯
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token')
    if (token) {
      try {
        const success = setSpotifyAccessToken(token)
        setIsAuthenticated(success)
        if (!success) {
          localStorage.removeItem('spotify_access_token')
        }
      } catch (err) {
        console.error('Failed to initialize Spotify:', err)
        localStorage.removeItem('spotify_access_token')
        setIsAuthenticated(false)
      }
    }
  }, [])

  // 檢查登入狀態
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('spotify_access_token')
      setIsAuthenticated(!!token)
    }

    checkAuthStatus()
    // 添加事件監聽器來處理存儲變化
    window.addEventListener('storage', checkAuthStatus)
    return () => window.removeEventListener('storage', checkAuthStatus)
  }, [])

  const handleAuth = async () => {
    if (isAuthenticated) {
      // 處理登出
      try {
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_refresh_token')
        setIsAuthenticated(false)
        setSpotifyResults([])
      } catch (err) {
        console.error('Logout error:', err)
        displayError('登出過程發生錯誤')
      }
    } else {
      // 處理登入
      try {
        setIsLoading(true)
        setError(null)
        
        const authEndpoint = 'https://accounts.spotify.com/authorize'
        const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_URI || '')
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
        
        if (!clientId || !redirectUri) {
          throw new Error('Spotify 認證設定不正確')
        }

        const scopes = [
          'user-read-private',
          'user-read-email',
          'playlist-read-private'
        ]

        const params = new URLSearchParams({
          client_id: clientId,
          response_type: 'code',
          redirect_uri: decodeURIComponent(redirectUri),
          scope: scopes.join(' '),
          show_dialog: 'true'
        })

        window.location.assign(`${authEndpoint}?${params.toString()}`)
      } catch (err) {
        console.error('Authentication error:', err)
        displayError(err instanceof Error ? err.message : '認證過程發生錯誤')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSpotifySearch = async () => {
    if (!isAuthenticated) {
      setError('請先登入 Spotify')
      return
    }

    try {
      const spotifyApi = getSpotifyApi()
      if (!spotifyApi) {
        throw new Error('Spotify API 未初始化')
      }

      const spotifyResponse = await spotifyApi.search(
        searchQuery,
        ['track']
      )

      const spotifyTracks = spotifyResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        uri: track.uri,
        albumImage: track.album.images[0]?.url || '',
        duration: formatDuration(track.duration_ms),
        externalUrl: track.external_urls.spotify
      }))

      setSpotifyResults(spotifyTracks)
    } catch (err) {
      console.error('Spotify search error:', err)
      setError(err instanceof Error ? err.message : 'Spotify 搜尋失敗')
      setSpotifyResults([])
    }
  }

  const handleYouTubeSearch = async () => {
    try {
      const youtubeResponse = await fetch(
        `/api/youtube-search?q=${encodeURIComponent(searchQuery)}`
      )
      
      if (!youtubeResponse.ok) {
        throw new Error('YouTube 搜尋失敗')
      }
      
      const youtubeData = await youtubeResponse.json()
      setYoutubeResults(youtubeData.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: formatPublishedDate(item.snippet.publishedAt),
        description: item.snippet.description
      })))
    } catch (err) {
      console.error('YouTube search error:', err)
      setError(err instanceof Error ? err.message : 'YouTube 搜尋失敗')
      setYoutubeResults([])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('請輸入搜尋關鍵字')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 並行執行搜尋
      const searchPromises = [handleYouTubeSearch()]
      if (isAuthenticated) {
        searchPromises.push(handleSpotifySearch())
      }

      await Promise.all(searchPromises)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : '搜尋過程發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <a 
            href="/"
            className="text-3xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Jazz Search App
          </a>
          <Button 
            onClick={handleAuth} 
            variant={isAuthenticated ? "outline" : "default"}
            disabled={isLoading}
            className={isAuthenticated ? "bg-red-500 hover:bg-red-600 text-white" : ""}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isAuthenticated ? (
              'Logout'
            ) : (
              'Login with Spotify'
            )}
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative animate-fade-in">
              <span className="block sm:inline">{error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setError(null)}
              >
                <span className="sr-only">關閉</span>
                <svg
                  className="fill-current h-6 w-6 text-red-500"
                  role="button"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Search for jazz music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={!isAuthenticated || isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          <Tabs defaultValue="spotify" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="spotify">Spotify</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>
            <TabsContent value="spotify">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Spotify Results</CardTitle>
                  <CardDescription>Jazz tracks found on Spotify</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {spotifyResults.length === 0 ? (
                    <p className="p-6 text-gray-500">No results found</p>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {spotifyResults.map((result) => (
                        <a
                          key={result.id}
                          href={result.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-24 h-24 mr-4">
                            <img
                              src={result.albumImage}
                              alt={`${result.name} album cover`}
                              className="w-full h-full object-cover rounded-md shadow-sm"
                            />
                          </div>
                          <div className="flex-grow min-w-0 mr-4">
                            <h3 className="text-base font-semibold truncate mb-1">{result.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{result.artist}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Duration: {result.duration}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <Music className="h-5 w-5 text-green-500" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="youtube">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>YouTube Results</CardTitle>
                  <CardDescription>Jazz videos found on YouTube</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {youtubeResults.length === 0 ? (
                    <p className="p-6 text-gray-500">No results found</p>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {youtubeResults.map((result) => (
                        <a
                          key={result.id}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-24 h-24 mr-4">
                            <img
                              src={result.thumbnail}
                              alt={result.title}
                              className="w-full h-full object-cover rounded-md shadow-sm"
                            />
                          </div>
                          <div className="flex-grow min-w-0 mr-4">
                            <h3 className="text-base font-semibold truncate mb-1">{result.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{result.channelTitle}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Published: {result.publishedAt}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            © 2024 Jazz Search App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 