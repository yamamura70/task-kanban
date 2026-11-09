import { getSupabaseEnv } from './env'

export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

/**
 * Supabase の Auth ヘルスチェックエンドポイントに publishable キー付きで
 * リクエストし、URL とキーで接続できるかを確認する。
 */
export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  let env
  try {
    env = getSupabaseEnv()
  } catch (error) {
    return { ok: false, message: (error as Error).message }
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      return {
        ok: false,
        message: `${env.url} が HTTP ${response.status} を返しました`,
      }
    }
    return { ok: true, url: env.url }
  } catch (error) {
    return {
      ok: false,
      message: `${env.url} に接続できません: ${(error as Error).message}`,
    }
  }
}
