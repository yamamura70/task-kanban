export type SupabaseEnv = {
  url: string
  publishableKey: string
}

/**
 * Supabase の接続情報を環境変数から取得する。
 * 未設定の場合は例外を投げる。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE

  if (!url || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE を .env.local に設定してください',
    )
  }

  return { url, publishableKey }
}
