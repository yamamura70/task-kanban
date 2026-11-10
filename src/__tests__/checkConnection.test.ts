import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { checkSupabaseConnection } from '@/lib/supabase/checkConnection'

const testUrl = 'https://example.supabase.co'
const testKey = 'sb_publishable_test'

describe('checkSupabaseConnection', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', testUrl)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE', testKey)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  test('ヘルスチェックが200を返すと接続成功になる', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await checkSupabaseConnection()

    expect(result).toEqual({ ok: true, url: testUrl })
    expect(fetchMock).toHaveBeenCalledWith(
      `${testUrl}/auth/v1/health`,
      expect.objectContaining({ headers: { apikey: testKey } }),
    )
  })

  test('キーが不正で401が返ると接続失敗になりステータスを含む', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))

    const result = await checkSupabaseConnection()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('401')
  })

  test('ネットワークエラーが起きると接続失敗になる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')))

    const result = await checkSupabaseConnection()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('fetch failed')
  })

  test('URLが未設定だとリクエストせずに接続失敗になる', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await checkSupabaseConnection()

    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('publishableキーが未設定だとリクエストせずに接続失敗になる', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await checkSupabaseConnection()

    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
