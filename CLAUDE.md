# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**教会メンバーマップシステム** — 教会メンバーの居住地を地図上に可視化し、近隣メンバー同士の交流を促進するツール。

### 実装形式
要件定義書（REQ-2026-001）に基づき、**シングルページHTML**として実装する。サーバー不要でローカルファイルとして動作する。

### 使用ライブラリ・外部サービス
| 種別 | 内容 |
|------|------|
| マップ | Leaflet.js（オープンソース）+ OpenStreetMap タイル |
| ジオコーディング | Nominatim API（OSM提供・無償） |
| データ保存 | ブラウザの LocalStorage |

### 管理するデータ
| 項目 | 必須 | 備考 |
|------|------|------|
| 氏名 | ○ | |
| 住所 | ○ | ジオコーディングに使用 |
| 所属グループ | - | 青年部・壮年部・婦人部 など |
| 役職 | - | 長老・執事・会計 など |
| 写真 | - | URL参照のみ（ファイル実体はCSVに含めない） |

### CSVフォーマット
インポート・エクスポートとも同一形式：
```
氏名,住所,所属グループ,役職,写真URL
山田 太郎,東京都渋谷区神南1-1-1,青年部,執事,https://example.com/photo.jpg
鈴木 花子,大阪府大阪市北区梅田2-2-2,婦人部,,
```

### 画面構成
```
┌─────────────────────────────────────────────────┐
│  ヘッダー（タイトル / CSVインポート / エクスポートボタン）│
├──────────────────┬──────────────────────────────┤
│  メンバーリスト   │       マップ表示エリア         │
│  （サイドバー）   │   （Leaflet.js による地図）    │
│  ・検索ボックス   │   ピン：メンバーの住所位置     │
│  ・メンバー一覧   │   ポップアップ：詳細情報       │
│                  │             ＋ メンバー追加FAB │
└──────────────────┴──────────────────────────────┘
```

### 開発フェーズ
| フェーズ | 内容 | 優先度 |
|---------|------|--------|
| Phase 1 | メンバー情報管理・マップ表示・CSV入出力 | **必須** |
| Phase 2 | 地域グループの手動作成と割り当て機能 | 推奨 |
| Phase 3 | マップ上エリア描画による自動グループ分類 | 将来 |
| Phase 4 | パスワード保護・アクセス制御 | 将来 |
| Phase 5 | 近距離メンバーの自動グループ提案 | 将来 |

### 制約・注意事項
- Nominatim API は連続リクエスト禁止のため、**CSVインポート時は住所ごとに1秒以上の間隔**を設ける
- LocalStorage はブラウザ・端末をまたいで共有されない。複数端末間の共有は CSV エクスポート→インポートで対応
- 写真はURL参照のみ。ファイルアップロード機能は将来検討
- ジオコーディング時に住所文字列が Nominatim（外部サービス）へ送信される点をユーザーに明示する

## ⚠️ 重要: Next.js バージョン警告

このプロジェクトは **Next.js 16.2.6 / React 19.2.4** を使用している。トレーニングデータに存在しないAPIや規約が含まれる可能性があるため、コードを書く前に必ず `node_modules/next/dist/docs/` 内の該当ガイドを参照すること。deprecation noticeも厳守する。

## コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint 実行
```

TypeScriptの型チェック（lint に含まれない）:
```bash
npx tsc --noEmit
```

## アーキテクチャ

### ルーティング
- **App Router** 使用 (`app/` ディレクトリ)
- `app/layout.tsx` — ルートレイアウト。Geist フォント (`--font-geist-sans`, `--font-geist-mono`) を CSS変数として注入
- `app/page.tsx` — ルートページ (`/`)
- `app/globals.css` — グローバルスタイル

### スタイリング
- **Tailwind CSS v4** を使用。`tailwind.config.js` は存在しない
- 設定は `postcss.config.mjs` の `@tailwindcss/postcss` プラグイン経由
- v3 の設定ファイルベースとは異なるため、v4のドキュメントを参照すること

### パスエイリアス
- `@/*` → プロジェクトルート (`./`)

### 主要な依存関係バージョン
| パッケージ | バージョン |
|---|---|
| next | 16.2.6 |
| react / react-dom | 19.2.4 |
| tailwindcss | ^4 |
| typescript | ^5 (strict mode) |

## ESLint
`eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を使用。設定は `eslint.config.mjs` (Flat Config 形式)。
