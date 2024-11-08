import { SpotifyApi } from '@spotify/web-api-ts-sdk'

let spotifyApi: SpotifyApi | null = null

// 添加環境變數檢查
function checkEnvironmentVariables() {
  const variables = {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
  }

  console.log('Environment variables:', {
    clientId: !!variables.clientId,
    clientSecret: !!variables.clientSecret,
    redirectUri: variables.redirectUri,
  })

  if (!variables.clientId || !variables.clientSecret || !variables.redirectUri) {
    throw new Error('Missing required environment variables')
  }

  return variables
}

export function initializeSpotifyApi() {
  if (!spotifyApi) {
    try {
      const env = checkEnvironmentVariables()
      spotifyApi = SpotifyApi.withUserAuthorization(
        env.clientId,
        env.redirectUri,
        ['user-read-private', 'user-read-email', 'playlist-read-private']
      )
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error)
      throw error
    }
  }
  return spotifyApi
}

export function getSpotifyApi() {
  if (!spotifyApi) {
    return initializeSpotifyApi()
  }
  return spotifyApi
}

export async function setSpotifyAccessToken(token: string) {
  try {
    if (!token) {
      throw new Error('Access token is required')
    }

    // 使用 withAccessToken 創建新的實例
    const newApi = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
      {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      }
    )

    // 測試 API 是否正常工作
    await newApi.currentUser.profile()

    // 如果成功，更新全局實例
    spotifyApi = newApi
    return true
  } catch (error) {
    console.error('Failed to set access token:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to set access token: ${error.message}`)
    }
    throw new Error('Failed to set access token: Unknown error')
  }
}

export async function getAccessToken() {
  try {
    const api = getSpotifyApi()
    if (!api) {
      throw new Error('Spotify API not initialized')
    }

    const token = await api.getAccessToken()
    return token
  } catch (error) {
    console.error('Failed to get access token:', error)
    throw error
  }
}

export async function refreshAccessToken() {
  try {
    const api = getSpotifyApi()
    if (!api) {
      throw new Error('Spotify API not initialized')
    }

    await api.authenticate()
    return true
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    throw error
  }
} 