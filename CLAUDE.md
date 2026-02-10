# CLAUDE.md — Claude Code プロジェクトルール

このファイルは Claude Code がこのリポジトリで作業する際に従うべきルールを定義する。

---

## ナレッジの記録ルール

### 作業後は必ず `docs/knowledge/` に記録する

実装・デバッグ・調査で得られた知見は、作業完了後に必ず `docs/knowledge/` 配下の
Markdown ファイルに書き込むこと。

#### 記録すべき内容

| カテゴリ | 記録すること |
|---|---|
| バグ修正 | 原因・再現条件・解決策・なぜその解決策が正しいか |
| UI/CSS実装 | 実装パターン・ハマりポイント・ブラウザ差異 |
| JS実装 | API の使い方・注意点・パフォーマンス考慮 |
| データ処理 | HTMLパース手法・JSON構造・変換ロジック |
| 外部サービス連携 | URL形式・パラメータ仕様・セキュリティ考慮 |

#### ファイル命名規則

```
docs/knowledge/{トピック名}.md
```

例:
- `css-grid-timetable.md` — CSS Grid のタイムテーブル実装
- `inline-scroll-layout.md` — インラインスクロールレイアウト
- `header-footer-patterns.md` — ヘッダー/フッターのUIパターン
- `fortee-html-structure.md` — fortee.jp の HTML 構造

#### 既存ファイルへの追記

同じトピックの知見は既存ファイルに追記する（ファイルを増やしすぎない）。

### 記録のタイミング

1. 実装タスクが完了したとき
2. バグを修正したとき
3. 調査・リサーチで重要な情報を得たとき

---

## Git ブランチルール

- 開発は `claude/` で始まるブランチで行う
- プッシュは `git push -u origin <branch-name>`
- `main` ブランチへの直接プッシュは禁止

## コーディング規則

- **過剰実装しない**: 要求された変更のみ行う
- **既存コードを尊重**: 動いているコードを不必要にリファクタリングしない
- **セキュリティ**: 外部リンクは `target="_blank" rel="noopener"` を必ず付ける
- **アクセシビリティ**: 装飾 SVG には `aria-hidden="true"`、意味のある SVG には `aria-label` を付ける

## プロジェクト構成

```
public/          — GitHub Pages で配信するフロントエンドファイル
  index.html     — メイン HTML
  style.css      — スタイル
  app.js         — アプリケーションロジック
  timetable.json — タイムテーブルデータ
docs/
  knowledge/     — 実装ノウハウ集（必ず記録すること）
  spec.md        — 技術仕様
  development.md — 開発ガイド
scraper.py       — fortee.jp からのデータ取得スクリプト
generate_json.py — 静的JSONジェネレーター
```
