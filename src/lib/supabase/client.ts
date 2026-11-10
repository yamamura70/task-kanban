import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Client Component 用の Supabase クライアント。
 * NEXT_PUBLIC_ 変数はビルド時に埋め込まれるため、直接参照する。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE ?? '',
  )
}
