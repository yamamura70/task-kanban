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

## テスト

- Vitest + React Testing Library + jsdom を使っています。設定は `vitest.config.mts` です。
- `@/*` のエイリアスは Vite 標準の `resolve.tsconfigPaths: true` で解決しています。`vite-tsconfig-paths` プラグインは非推奨なので使いません。
- テストは `src/__tests__/` に置いています。
- 非同期（`async`）の Server Component は Vitest でテストできません。同期コンポーネントだけを単体テストし、非同期のものは E2E テストで確認してください。

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

