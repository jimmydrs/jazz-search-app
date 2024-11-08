'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Callback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        console.error('Authorization error:', error)
        router.push(`/?error=${encodeURIComponent(error)}`)
        return
      }

      if (!code) {
        console.error('No code received')
        router.push('/?error=no_code')
        return
      }

      try {
        console.log('Exchanging code for token...')
        const tokenResponse = await fetch('/api/spotify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || 'Failed to get access token')
        }

        const tokenData = await tokenResponse.json()
        
        // 儲存訪問令牌
        localStorage.setItem('spotify_access_token', tokenData.access_token)
        if (tokenData.refresh_token) {
          localStorage.setItem('spotify_refresh_token', tokenData.refresh_token)
        }

        // 重定向回主頁
        router.push('/?auth=success')
      } catch (err) {
        console.error('Token exchange error:', err)
        router.push(`/?error=${encodeURIComponent(err instanceof Error ? err.message : 'token_exchange_failed')}`)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
} 