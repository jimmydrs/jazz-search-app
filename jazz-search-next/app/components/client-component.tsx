'use client'

import { useState, useEffect } from 'react'

export function ClientComponent() {
  const [state, setState] = useState<string | null>(null)

  useEffect(() => {
    // 客戶端邏輯
  }, [])

  return (
    <div>
      {/* 組件內容 */}
    </div>
  )
} 