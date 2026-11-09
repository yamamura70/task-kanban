# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 重要: Next.js 16 系の最新仕様を前提にする

Next.js 16.4 / React 19.3 を使っています。学習データにある Next.js と API・規約が異なる場合があるので、コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読んでください（`01-app/` が App Router 用）。

`next.config.ts` で次の機能を有効にしています。データ取得やキャッシュを扱う前に関連ガイドを確認してください。

- `cacheComponents: true`: Cache Components モデル。キャッシュは `"use cache"` ディレクティブで行います。旧来の `fetch` キャッシュや `revalidate` の前提で書かないでください。ガイドは `01-app/01-getting-started/08-caching.md` と `09-revalidating.md` です。
- `partialPrefetching: true`: ガイドは `01-app/02-guides/adopting-partial-prefetching.md` です。

## 概要
タスク管理カンバン。タスクの追加・編集・削除・一覧表示と
ステータス管理（Todo / In Progress / Done）が出来る。
Next.js + Supabaseで構築し、Vercelにデプロイする。

## コマンド

```bash
npm run dev                  # 開発サーバー (http://localhost:3000)
npm run build                # 本番ビルド
npm run lint                 # ESLint (eslint-config-next の core-web-vitals + typescript)
npx tsc --noEmit             # 型チェック
npm test                     # Vitest をウォッチモードで実行
npx vitest run               # 全テストを1回だけ実行
npx vitest run src/__tests__/page.test.tsx   # 単一ファイルを実行
npx vitest run -t "見出し"    # テスト名で絞り込んで実行
```

## 構成

- `src/` 配下の App Router 構成です（`src/app/`）。パスエイリアス `@/*` は `./src/*` を指します。
- レイアウトやページの props 型には、Next が生成するグローバル型（例: `LayoutProps<"/">`）を使っています。
- Tailwind CSS v4 は PostCSS ではなく、`next.config.ts` の `turbopack.rules` で `@tailwindcss/turbopack` ローダーを通して読み込んでいます。テーマトークンは `src/app/globals.css` の `@theme inline` で定義しています。

## Supabase

- `@supabase/ssr` と `@supabase/supabase-js` を使っています。
- 環境変数のキー名は `.env.example` に合わせて `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE` です。公式ドキュメントにある `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` や `NEXT_PUBLIC_SUPABASE_ANON_KEY` ではありません。実際の値は `.env.local` に書きます（Git 管理外）。
- クライアントは用途に応じて使い分けます。
  - Server Component / Server Action / Route Handler: `@/lib/supabase/server` の `createClient()`（async。`cookies()` を使います）
  - Client Component: `@/lib/supabase/client` の `createClient()`
- サーバー側で環境変数を読むときは `@/lib/supabase/env` の `getSupabaseEnv()` を使います。未設定の場合は例外を投げます。
- `src/instrumentation.ts` がサーバー起動時に `checkSupabaseConnection()`（`@/lib/supabase/checkConnection`）を実行し、接続に失敗したときだけ `console.error` でログを出します。成功時は何も出力しません。
- 接続確認には Auth のヘルスチェックエンドポイント（`/auth/v1/health`）を使っており、テーブルに依存しません。
- テーブル構造などプロジェクトの情報は Supabase MCP で確認してください。
- テストでは Supabase への通信を外部依存としてモックします。環境変数は `vi.stubEnv`、`fetch` は `vi.stubGlobal` で差し替え、`afterEach` で元に戻します（例: `src/__tests__/checkConnection.test.ts`）。
- スキーマの変更は Supabase MCP の `apply_migration` で行います。変更後は `get_advisors` で警告を確認し、`generate_typescript_types` で `src/lib/supabase/database.types.ts` を再生成してください（手で編集しません）。

### tasks テーブル

- 列: `id`(uuid) / `title`(1〜100文字、空白のみは不可) / `description`(1000文字以内、既定値は空文字) / `status`(`todo` / `in_progress` / `done`) / `created_at` / `updated_at`（トリガーで自動更新）。
- 認証はありません。RLS は有効で、anon と authenticated に全操作を許可するポリシーを設定しています。ログイン機能を追加する場合はポリシーの見直しが必要です。
- 文字数とステータスの制約は DB の check 制約と `src/lib/tasks/validation.ts` の両方にあります。片方を変えるときはもう片方も合わせてください。
- `status` は Postgres の enum ではなく、text 型に check 制約を付けています。そのため生成される型では `string` になります。アプリでは `isTaskStatus()` と `toTask()` で `TaskStatus` 型に絞り込んで使います。
- DB の列名は snake_case、アプリの型（`Task` など）は camelCase です。両者の変換は `toTask()` で行います。DB の行の型をそのままコンポーネントに渡さないでください。

## タスク機能の構成

- `src/lib/tasks/types.ts`: `Task` 型、`TASK_STATUSES`（列の定義と表示名）、`ActionResult`、DB の行を変換する `toTask()`
- `src/lib/tasks/validation.ts`: `validateTaskInput()`。クライアント（フォーム）とサーバー（Server Actions）の両方で使います。
- `src/app/actions.ts`: Server Actions（`createTask` / `updateTask` / `deleteTask`）。入力を再検証してから書き込み、成功したら `refresh()`（`next/cache`）を呼びます。例外は投げず、`{ ok, data }` か `{ ok: false, error }` を返します。
- `src/app/page.tsx`: 同期コンポーネントです。DB からの読み込みは async の `TaskBoardLoader` で行い、`<Suspense>` で囲んでいます（Cache Components では cookies を使う処理に Suspense が必要です）。
- `src/app/_components/TaskBoard.tsx`: カンバン本体（Client Component）。`useOptimistic` で操作結果をすぐ表示し、成功したら内部の状態を確定、失敗したら表示を元に戻してエラーを出します。`refresh()` で届いた新しい `initialTasks` は内部の状態に反映します。
- 編集は `Modal`（`role="dialog"`）、削除確認は `ConfirmDialog`（`role="alertdialog"`）で表示します。どちらも Esc キーで閉じます。
- `TaskForm` は追加と編集で共通です。`task` を渡すと編集モードになり、ステータスのセレクトが表示されます。入力欄は非制御（`defaultValue`）で、送信時に `validateTaskInput()` で検証します。
- 列の並び順と表示名は `TASK_STATUSES` の定義順で決まります。

### よくある変更の手順

**tasks テーブルに列を追加・変更するとき**
1. Supabase MCP の `apply_migration` でスキーマを変更し、`get_advisors`（security / performance）で警告を確認します。
2. `generate_typescript_types` で `database.types.ts` を再生成します。
3. `types.ts`（`Task`、`toTask()`）と `validation.ts` を更新します。
4. `TaskBoardLoader` の `select()` は列を明示しているので、必要な列を追加します。
5. `actions.ts`、フォーム、カード、テストを更新します。

**ステータスを追加・変更するとき**
- DB の check 制約、`TASK_STATUSES`、関連するテストをまとめて変更してください。

**新しい操作（Server Action）を追加するとき**
- `src/app/actions.ts` に追加します。サーバー側でも入力を検証し、`ActionResult<T>` を返して例外は投げません。成功したら `refresh()` を呼びます。
- エラーメッセージは日本語でユーザー向けに書きます。DB のエラー内容はそのまま返さないでください。
- 画面側では `TaskBoard` の `mutate()` を使います。楽観的に表示する変更と、成功後に確定する変更を `TaskChange` で渡します。

## UI の規約

- 画面の文言は日本語です（ステータスの表示名 `Todo` / `In Progress` / `Done` だけは英語）。
- テストはロールとアクセシブルな名前で要素を探しています。文言、`aria-label`（例: `「タイトル」を編集`）、見出し、ラベルを変えるときはテストも合わせて更新してください。
- 各列は `aria-labelledby` で列名を付けた `section`（ロールは region）です。件数は名前に含めていません。
- エラーメッセージは `role="alert"` で表示します。
- `src/app/_components/` はルートにならないプライベートフォルダです。ページ専用のコンポーネントはここに置きます。

## テスト

- Vitest + React Testing Library + jsdom を使っています。設定は `vitest.config.mts` です。
- `@/*` のエイリアスは Vite 標準の `resolve.tsconfigPaths: true` で解決しています。`vite-tsconfig-paths` プラグインは非推奨なので使いません。
- テストは `src/__tests__/` に置いています。
- 非同期（`async`）の Server Component は Vitest でテストできません。同期コンポーネントだけを単体テストし、非同期のものは E2E テストで確認してください。
- Client Component のテストでは Server Actions（`@/app/actions`）を外部依存としてモックします。Server Actions 自体のテストでは `@/lib/supabase/server` と `next/cache` をモックします。
- ユーザー操作は `@testing-library/user-event` で再現します。
- 解決しない Promise をモックに残さないでください。React は実行中の非同期アクションをまとめて扱うため、後続のテストで楽観的表示が元に戻らなくなります。応答を保留したいときはテストの最後で解決してください（例: `src/__tests__/TaskBoard.test.tsx`）。
- Vitest の `globals` を有効にしていないため、RTL の自動 cleanup は動きません。複数のテストで `render` するファイルでは、`afterEach` で `cleanup()` と `vi.clearAllMocks()` を呼んでください。
- 楽観的表示が元に戻ったことを確かめるときは、`waitFor` や `findBy*` で待ってから検証します。
- Supabase のクエリビルダーは、チェーンしたメソッドが自身を返し、`await` で結果を返す thenable としてモックします（`src/__tests__/actions.test.ts` の `mockSupabase()`）。
- `page.test.tsx` では、async の `TaskBoardLoader` だけを差し替えてページを描画しています。

## 動作確認

- `npm run build` の結果で `/` が `◐ (Partial Prerender)` になっていることを確認します。静的なシェルと、Suspense 内の動的な部分に分かれているという意味です。
- 実際の DB での確認には Supabase MCP の `execute_sql` を使います。RLS の確認は、`begin; set local role anon; ...; rollback;` のようにトランザクション内で anon ロールに切り替えて行い、データを残さないようにします。確認用に入れたデータは必ず削除してください。
- `src/instrumentation.ts` はサーバー起動時にしか実行されません。すでに dev サーバー（ポート 3000）が動いていることがあるので、止めずに別のポート（例: `npx next start -p 3100`）で確認するか、ユーザーに再起動を依頼してください。

## 開発環境の注意

- Windows 環境です。`python` コマンドは Microsoft Store のスタブで、実行しても何もしません。スクリプトが必要なときは Node.js を使ってください。
- `.env.local` の読み取りは `.claude/settings.json` で禁止しています。値を確認する必要があるときは、ユーザーに確認してください。
- 作業は `main` ではなく feature ブランチで行います。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向・逆方向を検討してください
- モック方針: 外部依存のみモック化してください

## 禁止事項
- console.logを本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新使用はContext7 MCPを使って公式ドキュメントを確認してください

